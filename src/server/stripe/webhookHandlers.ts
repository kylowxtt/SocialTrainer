import type Stripe from "stripe";
import { db } from "~/server/db";

type SubscriptionWithLegacyPeriodFields = Stripe.Subscription & {
  current_period_end?: number | null;
};

type InvoiceWithLegacySubscriptionField = Stripe.Invoice & {
  subscription?: string | Stripe.Subscription | null;
};

const getSubscriptionCurrentPeriodEnd = (
  subscription: Stripe.Subscription,
): Date | null => {
  const periodEndSeconds = (
    subscription as SubscriptionWithLegacyPeriodFields
  ).current_period_end;
  return periodEndSeconds ? new Date(periodEndSeconds * 1000) : null;
};

const getSubscriptionIdFromInvoice = (invoice: Stripe.Invoice): string | null => {
  const parentSubscription = invoice.parent?.subscription_details?.subscription;
  if (typeof parentSubscription === "string") {
    return parentSubscription;
  }
  if (parentSubscription) {
    return parentSubscription.id;
  }

  const legacySubscription = (
    invoice as InvoiceWithLegacySubscriptionField
  ).subscription;
  if (typeof legacySubscription === "string") {
    return legacySubscription;
  }
  if (legacySubscription) {
    return legacySubscription.id;
  }

  return null;
};

/**
 * Handle checkout.session.completed event
 */
export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const metadata = session.metadata;

  // Handle coach onboarding subscription
  if (session.mode === "subscription" && metadata?.planId && metadata?.coachProfileId) {
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;

    if (!subscriptionId || !session.customer) {
      throw new Error("Missing subscription or customer in session");
    }

    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer.id;

    // Fetch the subscription to get accurate current_period_end
    const stripe = (await import("./client")).stripe;
    const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
    if ("deleted" in subscriptionResponse && subscriptionResponse.deleted) {
      throw new Error(`Subscription ${subscriptionId} has been deleted`);
    }
    const subscription = subscriptionResponse as Stripe.Subscription;
    const currentPeriodEnd = getSubscriptionCurrentPeriodEnd(subscription);

    // Upsert coach subscription
    await db.coachSubscription.upsert({
      where: { coachId: metadata.coachProfileId },
      create: {
        coachId: metadata.coachProfileId,
        planId: metadata.planId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        status: "ACTIVE",
        currentPeriodEnd,
      },
      update: {
        stripeSubscriptionId: subscriptionId,
        status: "ACTIVE",
        currentPeriodEnd,
      },
    });

    return;
  }

  // Handle client product purchase
  if (metadata?.orderId) {
    const order = await db.order.findUnique({
      where: { id: metadata.orderId },
    });

    if (!order) {
      throw new Error(`Order not found: ${metadata.orderId}`);
    }

    // Avoid duplicate processing
    if (order.status === "PAID") {
      return;
    }

    // Verify payment status before marking as PAID
    // For async payment methods, the session can complete before payment succeeds
    if (session.payment_status !== "paid") {
      // Don't mark as PAID yet - wait for payment_intent.succeeded or invoice.paid
      // But we can still update the payment intent/invoice IDs for tracking
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;

      const invoiceId =
        typeof session.invoice === "string"
          ? session.invoice
          : session.invoice?.id;

      await db.order.update({
        where: { id: order.id },
        data: {
          stripePaymentIntentId: paymentIntentId ?? null,
          stripeInvoiceId: invoiceId ?? null,
        },
      });
      return;
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    const invoiceId =
      typeof session.invoice === "string"
        ? session.invoice
        : session.invoice?.id;

    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;

    // Update order status
    await db.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        stripePaymentIntentId: paymentIntentId ?? null,
        stripeInvoiceId: invoiceId ?? null,
        stripeSubscriptionId: subscriptionId ?? null,
        fulfilledAt: new Date(),
      },
    });

    // Create enrollment or coaching relationship based on product type
    const product = await db.product.findUnique({
      where: { id: order.productId },
      include: {
        program: true,
      },
    });

    if (!product) {
      return;
    }

    // If product is linked to a program, create enrollment
    if (product.program) {
      await db.enrollment.upsert({
        where: {
          clientId_programId: {
            clientId: order.clientId!,
            programId: product.program.id,
          },
        },
        create: {
          clientId: order.clientId!,
          programId: product.program.id,
          status: "ACTIVE",
        },
        update: {
          status: "ACTIVE",
        },
      });
    }

    // If product type is ONE_OFF and it's a 1:1 coaching product, create coaching relationship
    // Note: This assumes 1:1 products are ONE_OFF. Adjust logic as needed.
    if (product.type === "ONE_OFF" && order.clientId && order.coachId) {
      // Check if relationship already exists
      const existingRelationship = await db.coachingRelationship.findUnique({
        where: {
          coachId_clientId: {
            coachId: order.coachId,
            clientId: order.clientId,
          },
        },
      });

      if (!existingRelationship) {
        await db.coachingRelationship.create({
          data: {
            coachId: order.coachId,
            clientId: order.clientId,
            status: "ACTIVE",
            ...(order.leadId && {
              originLead: {
                connect: { id: order.leadId },
              },
            }),
          },
        });

        // Update lead status if linked
        if (order.leadId) {
          await db.lead.update({
            where: { id: order.leadId },
            data: { status: "CONVERTED" },
          });
        }
      }
    }
  }
}

/**
 * Handle invoice.payment_succeeded event (for subscriptions)
 */
export async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
): Promise<void> {
  const subscriptionId = getSubscriptionIdFromInvoice(invoice);

  if (!subscriptionId) {
    return;
  }

  // Update coach subscription (for coach onboarding subscriptions)
  const coachSubscription = await db.coachSubscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (coachSubscription) {
    await db.coachSubscription.update({
      where: { id: coachSubscription.id },
      data: {
        status: "ACTIVE",
        currentPeriodEnd: invoice.period_end
          ? new Date(invoice.period_end * 1000)
          : null,
      },
    });
    return; // This is a coach subscription, not a product subscription
  }

  // Handle recurring product purchases - create renewal orders
  // Check if this invoice is for a product subscription
  const stripe = (await import("./client")).stripe;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Get metadata from subscription (set during checkout)
  const subscriptionMetadata = subscription.metadata;
  if (!subscriptionMetadata?.productId || !subscriptionMetadata?.orderId) {
    // Not a product subscription, or missing metadata
    return;
  }

  // Find the original order to get product and client details
  const originalOrder = await db.order.findUnique({
    where: { id: subscriptionMetadata.orderId },
    include: {
      product: {
        include: {
          coach: true,
        },
      },
    },
  });

  if (!originalOrder || originalOrder.product.type !== "RECURRING") {
    return;
  }

  // Check if this is the initial payment (invoice.billing_reason === "subscription_create")
  // or a renewal (invoice.billing_reason === "subscription_cycle")
  if (invoice.billing_reason === "subscription_create") {
    // Initial payment - order should already be created from checkout.session.completed
    // Just ensure it's marked as PAID if it wasn't already
    if (originalOrder.status !== "PAID") {
      await db.order.update({
        where: { id: originalOrder.id },
        data: {
          status: "PAID",
          stripeInvoiceId: invoice.id,
          stripeSubscriptionId: subscriptionId,
          fulfilledAt: new Date(),
        },
      });
    }
    return;
  }

  // This is a renewal - create a new order
  // Calculate revenue split using the same logic as the original order
  const platformFeeBps =
    originalOrder.product.platformFeeBps ??
    originalOrder.product.coach.platformFeeBps;
  const { platformFeeCents, coachAmountCents } = await import(
    "./checkout"
  ).then((m) =>
    m.calculateRevenueSplit(originalOrder.amountCents, platformFeeBps),
  );

  // Create renewal order
  await db.order.create({
    data: {
      coachId: originalOrder.coachId,
      productId: originalOrder.productId,
      clientId: originalOrder.clientId,
      leadId: originalOrder.leadId,
      amountCents: originalOrder.amountCents,
      currency: originalOrder.currency,
      status: "PAID",
      stripeInvoiceId: invoice.id,
      stripeSubscriptionId: subscriptionId,
      platformFeeCents,
      coachAmountCents,
      isSubscription: true,
      fulfilledAt: new Date(),
    },
  });
}

/**
 * Handle payment_intent.succeeded event
 * Marks orders as PAID when payment actually succeeds (for async payment methods)
 */
export async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
): Promise<void> {
  // Try to find order by payment_intent metadata first
  let orderId: string | undefined;
  if (paymentIntent.metadata?.orderId) {
    orderId = paymentIntent.metadata.orderId;
  }

  let order = null;
  if (orderId) {
    order = await db.order.findUnique({
      where: { id: orderId },
    });
  }

  // Fallback: try to find by stripePaymentIntentId
  if (!order && paymentIntent.id) {
    order = await db.order.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
    });
  }

  if (order && order.status === "PENDING_PAYMENT") {
    await db.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        stripePaymentIntentId: paymentIntent.id,
        fulfilledAt: new Date(),
      },
    });

    // Create enrollment or coaching relationship (same logic as checkout.session.completed)
    const product = await db.product.findUnique({
      where: { id: order.productId },
      include: {
        program: true,
      },
    });

    if (!product) {
      return;
    }

    // If product is linked to a program, create enrollment
    if (product.program) {
      await db.enrollment.upsert({
        where: {
          clientId_programId: {
            clientId: order.clientId!,
            programId: product.program.id,
          },
        },
        create: {
          clientId: order.clientId!,
          programId: product.program.id,
          status: "ACTIVE",
        },
        update: {
          status: "ACTIVE",
        },
      });
    }

    // If product type is ONE_OFF and it's a 1:1 coaching product, create coaching relationship
    if (product.type === "ONE_OFF" && order.clientId && order.coachId) {
      const existingRelationship = await db.coachingRelationship.findUnique({
        where: {
          coachId_clientId: {
            coachId: order.coachId,
            clientId: order.clientId,
          },
        },
      });

      if (!existingRelationship) {
        await db.coachingRelationship.create({
          data: {
            coachId: order.coachId,
            clientId: order.clientId,
            status: "ACTIVE",
            ...(order.leadId && {
              originLead: {
                connect: { id: order.leadId },
              },
            }),
          },
        });

        // Update lead status if linked
        if (order.leadId) {
          await db.lead.update({
            where: { id: order.leadId },
            data: { status: "CONVERTED" },
          });
        }
      }
    }
  }
}

/**
 * Handle customer.subscription.updated event
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
): Promise<void> {
  const dbSubscription = await db.coachSubscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!dbSubscription) {
    return;
  }

  // Map Stripe status to our enum
  const statusMap: Record<string, "ACTIVE" | "PAST_DUE" | "CANCELED" | "UNPAID" | "INCOMPLETE" | "INCOMPLETE_EXPIRED" | "TRIALING"> = {
    active: "ACTIVE",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    unpaid: "UNPAID",
    incomplete: "INCOMPLETE",
    incomplete_expired: "INCOMPLETE_EXPIRED",
    trialing: "TRIALING",
  };

  await db.coachSubscription.update({
    where: { id: dbSubscription.id },
    data: {
      status: statusMap[subscription.status] ?? "INCOMPLETE",
      currentPeriodEnd: getSubscriptionCurrentPeriodEnd(subscription),
    },
  });
}

/**
 * Handle customer.subscription.deleted event
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
): Promise<void> {
  const dbSubscription = await db.coachSubscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!dbSubscription) {
    return;
  }

  await db.coachSubscription.update({
    where: { id: dbSubscription.id },
    data: {
      status: "CANCELED",
    },
  });
}

/**
 * Handle payment_intent.payment_failed event
 */
export async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent,
): Promise<void> {
  // Try to find order by payment_intent metadata first (set during checkout creation)
  let orderId: string | undefined;
  if (paymentIntent.metadata?.orderId) {
    orderId = paymentIntent.metadata.orderId;
  }

  let order = null;
  if (orderId) {
    order = await db.order.findUnique({
      where: { id: orderId },
    });
  }

  // Fallback: try to find by stripePaymentIntentId (for orders that completed checkout)
  if (!order && paymentIntent.id) {
    order = await db.order.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
    });
  }

  if (order && order.status === "PENDING_PAYMENT") {
    await db.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELED",
      },
    });
  }
}

/**
 * Handle account.updated event (for Connect accounts)
 */
export async function handleAccountUpdated(
  account: Stripe.Account,
): Promise<void> {
  // Update coach profile with account status if needed
  // This could be used to track charges_enabled, payouts_enabled, etc.
  const coachProfile = await db.coachProfile.findFirst({
    where: { stripeAccountId: account.id },
  });

  if (coachProfile) {
    // Optionally store account status in metadata or a separate field
    // For now, we'll just ensure the account ID is set
  }
}

