import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { userRouter } from "./routers/user";
import { coachRouter } from "./routers/coaches";
import { leadsRouter } from "./routers/leads";
import { productsRouter } from "./routers/products";
import { enrollmentsRouter } from "./routers/enrollments";
import { coachingRelationshipsRouter } from "./routers/coaching-relationships";
import { stripeRouter } from "./routers/stripe";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  coaches: coachRouter,
  leads: leadsRouter,
  products: productsRouter,
  enrollments: enrollmentsRouter,
  coachingRelationships: coachingRelationshipsRouter,
  stripe: stripeRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
