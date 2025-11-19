import Stripe from "stripe";
import { env } from "~/env";

/**
 * Shared Stripe client instance configured with API version and currency defaults.
 * Uses the latest stable API version for compatibility.
 */
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  // Omit apiVersion to use the latest stable version, or set to a valid version from your Stripe Dashboard
  typescript: true,
});

/**
 * Supported currencies for the platform.
 * Starting with USD to keep fee calculations simple.
 */
export const SUPPORTED_CURRENCIES = ["usd"] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

