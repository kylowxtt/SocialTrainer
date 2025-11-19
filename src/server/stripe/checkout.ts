import type Stripe from "stripe";
import { stripe, SUPPORTED_CURRENCIES } from "./client";
import { db } from "~/server/db";

/**
 * Calculate revenue split between platform and coach.
 * @param priceCents - Total price in cents
 * @param platformFeeBps - Platform fee in basis points (e.g., 2000 = 20%)
 * @returns Object with platformFeeCents and coachAmountCents
 */
export function calculateRevenueSplit(
  priceCents: number,
  platformFeeBps: number,
): { platformFeeCents: number; coachAmountCents: number } {
  // Validate platformFeeBps is between 0 and 10000 (0% to 100%)
  if (platformFeeBps < 0 || platformFeeBps > 10000) {
    throw new Error(
      `Invalid platformFeeBps: ${platformFeeBps}. Must be between 0 and 10000 (0% to 100%).`,
    );
  }
  const platformFeeCents = Math.round((priceCents * platformFeeBps) / 10000);
  const coachAmountCents = priceCents - platformFeeCents;
  return { platformFeeCents, coachAmountCents };
}

/**
 * Ensure a user has a Stripe customer ID, creating one if needed.
 */
export async function ensureStripeCustomer(
  userId: string,
  email: string | null,
  name: string | null,
): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // Create Stripe customer
  const customer = await stripe.customers.create({
    email: email ?? undefined,
    name: name ?? undefined,
    metadata: {
      userId,
    },
  });

  // Save to database
  await db.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

/**
 * Create a Checkout session for coach onboarding (subscription).
 */
export async function createCoachOnboardingCheckoutSession(
  planId: string,
  coachProfileId: string,
  userId: string,
  userEmail: string | null,
  userName: string | null,
  baseUrl: string,
): Promise<Stripe.Checkout.Session> {
  const plan = await db.coachPlan.findUnique({
    where: { id: planId },
  });

  if (!plan || !plan.isActive) {
    throw new Error("Plan not found or inactive");
  }

  const stripeCustomerId = await ensureStripeCustomer(
    userId,
    userEmail,
    userName,
  );

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: [
      {
        price: plan.stripePriceId,
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/coach/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/coach/billing`,
    metadata: {
      coachProfileId,
      planId,
    },
  });

  return session;
}

/**
 * Create a Checkout session for client purchasing a coach's product/program.
 * Uses Stripe Connect with application fee and transfer.
 */
export async function createProductCheckoutSession(
  productId: string,
  userId: string,
  userEmail: string | null,
  userName: string | null,
  leadId: string | null,
  baseUrl: string,
): Promise<Stripe.Checkout.Session> {
  // Load product with coach profile
  const product = await db.product.findUnique({
    where: { id: productId },
    include: {
      coach: true,
    },
  });

  if (!product || !product.isActive) {
    throw new Error("Product not found or inactive");
  }

  if (!product.stripePriceId) {
    throw new Error("Product does not have a Stripe price ID");
  }

  const coachProfile = product.coach;

  if (!coachProfile.stripeAccountId) {
    throw new Error("Coach has not set up payouts");
  }

  // Validate currency
  const normalizedCurrency = product.currency.toLowerCase();
  if (!SUPPORTED_CURRENCIES.includes(normalizedCurrency as any)) {
    throw new Error(
      `Unsupported currency: ${product.currency}. Supported currencies: ${SUPPORTED_CURRENCIES.join(", ")}`,
    );
  }

  // Verify coach Connect account is ready
  // Fetch account to check charges_enabled and payouts_enabled
  try {
    const account = await stripe.accounts.retrieve(coachProfile.stripeAccountId);
    if (!account.charges_enabled) {
      throw new Error("Coach Stripe account does not have charges enabled");
    }
    if (!account.payouts_enabled) {
      throw new Error("Coach Stripe account does not have payouts enabled");
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("does not have")) {
      throw error;
    }
    throw new Error(
      `Failed to verify coach Stripe account: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  // Get or create client profile
  let clientProfile = await db.clientProfile.findUnique({
    where: { userId },
  });

  if (!clientProfile) {
    // Create client profile from user data
    clientProfile = await db.clientProfile.create({
      data: {
        userId,
        name: userName ?? "Client",
        email: userEmail ?? "",
      },
    });
  }

  // Calculate revenue split
  const platformFeeBps =
    product.platformFeeBps ?? coachProfile.platformFeeBps;
  const { platformFeeCents, coachAmountCents } = calculateRevenueSplit(
    product.priceCents,
    platformFeeBps,
  );

  // Create order record
  const order = await db.order.create({
    data: {
      coachId: coachProfile.id,
      productId: product.id,
      clientId: clientProfile.id,
      leadId: leadId ?? null,
      amountCents: product.priceCents,
      currency: normalizedCurrency,
      status: "PENDING_PAYMENT",
      platformFeeCents,
      coachAmountCents,
      isSubscription: product.type === "RECURRING",
    },
  });

  // Ensure Stripe customer exists
  const stripeCustomerId = await ensureStripeCustomer(
    userId,
    userEmail,
    userName,
  );

  // Create Checkout session with Connect
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: product.type === "RECURRING" ? "subscription" : "payment",
    customer: stripeCustomerId,
    line_items: [
      {
        price: product.stripePriceId,
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/purchase/success?orderId=${order.id}`,
    cancel_url: `${baseUrl}/purchase/cancel?orderId=${order.id}`,
    metadata: {
      orderId: order.id,
      productId: product.id,
      coachProfileId: coachProfile.id,
      clientProfileId: clientProfile.id,
    },
  };

  // Add Connect-specific parameters for revenue split
  if (product.type === "RECURRING") {
    // For subscriptions, use subscription_data with application_fee_percent
    // Note: application_fee_percent is a number (e.g., 20.0 for 20%)
    sessionParams.subscription_data = {
      application_fee_percent: platformFeeBps / 100,
      transfer_data: {
        destination: coachProfile.stripeAccountId,
      },
      // Add metadata so invoice.payment_succeeded can find the order for renewals
      metadata: {
        orderId: order.id,
        productId: product.id,
        coachProfileId: coachProfile.id,
        clientProfileId: clientProfile.id,
      },
    };
  } else {
    // For one-time payments, use payment_intent_data
    sessionParams.payment_intent_data = {
      application_fee_amount: platformFeeCents,
      transfer_data: {
        destination: coachProfile.stripeAccountId,
      },
      // Add orderId to metadata so payment_intent.payment_failed can find the order
      metadata: {
        orderId: order.id,
        productId: product.id,
        coachProfileId: coachProfile.id,
        clientProfileId: clientProfile.id,
      },
    };
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  // Update order with session ID
  await db.order.update({
    where: { id: order.id },
    data: { stripeCheckoutSessionId: session.id },
  });

  return session;
}

