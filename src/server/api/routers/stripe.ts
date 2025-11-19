import { createTRPCRouter, protectedProcedure, coachProcedure, publicProcedure } from "../trpc";
import { db } from "~/server/db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { stripe } from "~/server/stripe/client";
import {
  createCoachOnboardingCheckoutSession,
  createProductCheckoutSession,
} from "~/server/stripe/checkout";

export const stripeRouter = createTRPCRouter({
  // Get available coach plans
  getCoachPlans: publicProcedure.query(async () => {
    const plans = await db.coachPlan.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });
    return plans;
  }),

  // Get coach's current subscription
  getCoachSubscription: coachProcedure.query(async ({ ctx }) => {
    const coachProfile = await db.coachProfile.findUnique({
      where: { userId: ctx.session.user.id },
      include: {
        subscriptions: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!coachProfile) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Coach profile not found",
      });
    }

    return coachProfile.subscriptions[0] ?? null;
  }),

  // Create Checkout session for coach onboarding
  createCoachOnboardingCheckoutSession: coachProcedure
    .input(
      z.object({
        planId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const coachProfile = await db.coachProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!coachProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Coach profile not found",
        });
      }

      // Get base URL from headers or use default
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

      const session = await createCoachOnboardingCheckoutSession(
        input.planId,
        coachProfile.id,
        ctx.session.user.id,
        ctx.session.user.email ?? null,
        ctx.session.user.name ?? null,
        baseUrl,
      );

      return { url: session.url };
    }),

  // Create Connect onboarding link for coaches
  createConnectOnboardingLink: coachProcedure.mutation(async ({ ctx }) => {
    const coachProfile = await db.coachProfile.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!coachProfile) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Coach profile not found",
      });
    }

    let stripeAccountId = coachProfile.stripeAccountId;

    // Create Connect account if it doesn't exist
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: ctx.session.user.email ?? undefined,
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
        business_type: "individual",
        metadata: {
          coachProfileId: coachProfile.id,
        },
      });

      stripeAccountId = account.id;

      // Save account ID to database
      await db.coachProfile.update({
        where: { id: coachProfile.id },
        data: { stripeAccountId: account.id },
      });
    }

    // Generate onboarding link
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${baseUrl}/coach/settings/payouts?refresh=true`,
      return_url: `${baseUrl}/coach/settings/payouts?success=true`,
      type: "account_onboarding",
    });

    return { url: accountLink.url };
  }),

  // Create Checkout session for client purchasing a product
  createProductCheckoutSession: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        leadId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

      const session = await createProductCheckoutSession(
        input.productId,
        ctx.session.user.id,
        ctx.session.user.email ?? null,
        ctx.session.user.name ?? null,
        input.leadId ?? null,
        baseUrl,
      );

      return { url: session.url };
    }),

  // Get order details (for success page)
  getOrder: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await db.order.findUnique({
        where: { id: input.orderId },
        include: {
          product: {
            include: {
              program: true,
            },
          },
          coach: {
            include: {
              user: true,
            },
          },
          client: true,
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      // Verify access - client or coach can view
      const isClient = order.client?.userId === ctx.session.user.id;
      const isCoach = order.coach.userId === ctx.session.user.id;

      if (!isClient && !isCoach) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only view your own orders",
        });
      }

      return order;
    }),
});

