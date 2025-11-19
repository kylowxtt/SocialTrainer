import { stripe } from "./client";
import type { ProductType } from "../../../generated/prisma";

/**
 * Sync a product with Stripe - creates/updates Stripe Product and Price.
 * Returns the Stripe product and price IDs.
 */
export async function syncProductToStripe(
  productId: string,
  name: string,
  description: string | null,
  priceCents: number,
  currency: string,
  type: ProductType,
  existingStripeProductId?: string | null,
  existingStripePriceId?: string | null,
): Promise<{ stripeProductId: string; stripePriceId: string }> {
  let stripeProductId = existingStripeProductId ?? null;
  let stripePriceId = existingStripePriceId ?? null;

  // Create or update Stripe product
  if (!stripeProductId) {
    const stripeProduct = await stripe.products.create({
      name,
      description: description ?? undefined,
      metadata: {
        productId,
      },
    });
    stripeProductId = stripeProduct.id;
  } else {
    // Update existing product
    await stripe.products.update(stripeProductId, {
      name,
      description: description ?? undefined,
    });
  }

  // Check if we need to create a new price (if price changed or doesn't exist)
  if (!stripePriceId) {
    // Create new price
    const priceParams: {
      unit_amount: number;
      currency: string;
      product: string;
      recurring?: { interval: "month" | "year" };
    } = {
      unit_amount: priceCents,
      currency: currency.toLowerCase(),
      product: stripeProductId,
    };

    if (type === "RECURRING") {
      priceParams.recurring = { interval: "month" };
    }

    const stripePrice = await stripe.prices.create(priceParams);
    stripePriceId = stripePrice.id;
  } else {
    // Check if price amount changed (Stripe prices are immutable, so we need a new one)
    const existingPrice = await stripe.prices.retrieve(stripePriceId);
    const existingAmount = existingPrice.unit_amount ?? 0;

    if (existingAmount !== priceCents || existingPrice.currency !== currency.toLowerCase()) {
      // Price changed, create new price
      const priceParams: {
        unit_amount: number;
        currency: string;
        product: string;
        recurring?: { interval: "month" | "year" };
      } = {
        unit_amount: priceCents,
        currency: currency.toLowerCase(),
        product: stripeProductId,
      };

      if (type === "RECURRING") {
        priceParams.recurring = { interval: "month" };
      }

      const stripePrice = await stripe.prices.create(priceParams);
      stripePriceId = stripePrice.id;
    }
  }

  return { stripeProductId, stripePriceId };
}

