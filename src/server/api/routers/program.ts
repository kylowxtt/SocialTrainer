import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const programRouter = createTRPCRouter({
  // Get all active programs (public)
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.program.findMany({
      where: { isActive: true },
      include: {
        coach: {
          include: {
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Get program by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.program.findUnique({
        where: { id: input.id },
        include: {
          coach: {
            include: {
              user: {
                select: {
                  name: true,
                  image: true,
                },
              },
            },
          },
          workouts: {
            orderBy: [{ weekNumber: "asc" }, { dayNumber: "asc" }],
          },
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
      });
    }),

  // Get programs created by coach (protected)
  getMyPrograms: protectedProcedure.query(async ({ ctx }) => {
    const coachProfile = await ctx.db.coachProfile.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!coachProfile) {
      return [];
    }

    return ctx.db.program.findMany({
      where: { coachId: coachProfile.id },
      include: {
        _count: {
          select: {
            enrollments: true,
            workouts: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Create a program (protected, coach only)
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        price: z.number().min(0),
        duration: z.number().min(1),
        maxClients: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get or create coach profile
      let coachProfile = await ctx.db.coachProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!coachProfile) {
        // Update user role to COACH and create profile
        await ctx.db.user.update({
          where: { id: ctx.session.user.id },
          data: { role: "COACH" },
        });

        coachProfile = await ctx.db.coachProfile.create({
          data: {
            userId: ctx.session.user.id,
          },
        });
      }

      return ctx.db.program.create({
        data: {
          name: input.name,
          description: input.description,
          price: input.price,
          duration: input.duration,
          maxClients: input.maxClients,
          coachId: coachProfile.id,
        },
      });
    }),

  // Update a program (protected, coach only)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        price: z.number().min(0).optional(),
        duration: z.number().min(1).optional(),
        maxClients: z.number().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Verify ownership
      const coachProfile = await ctx.db.coachProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!coachProfile) {
        throw new Error("Not authorized");
      }

      const program = await ctx.db.program.findUnique({
        where: { id },
      });

      if (!program || program.coachId !== coachProfile.id) {
        throw new Error("Not authorized");
      }

      return ctx.db.program.update({
        where: { id },
        data: updateData,
      });
    }),

  // Delete a program (protected, coach only)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const coachProfile = await ctx.db.coachProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!coachProfile) {
        throw new Error("Not authorized");
      }

      const program = await ctx.db.program.findUnique({
        where: { id: input.id },
      });

      if (!program || program.coachId !== coachProfile.id) {
        throw new Error("Not authorized");
      }

      return ctx.db.program.delete({
        where: { id: input.id },
      });
    }),
});
