import { db } from "~/server/db";

/**
 * Check if a coach has an active subscription.
 * Returns true if the coach has a subscription with ACTIVE status.
 */
export async function hasActiveSubscription(
  coachProfileId: string,
): Promise<boolean> {
  const subscription = await db.coachSubscription.findUnique({
    where: { coachId: coachProfileId },
  });

  return subscription?.status === "ACTIVE";
}

/**
 * Get coach subscription status.
 * Returns the subscription or null if not found.
 */
export async function getCoachSubscription(coachProfileId: string) {
  return await db.coachSubscription.findUnique({
    where: { coachId: coachProfileId },
    include: {
      plan: true,
    },
  });
}


