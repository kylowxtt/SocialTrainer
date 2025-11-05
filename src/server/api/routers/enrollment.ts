import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const enrollmentRouter = createTRPCRouter({
  // Get client's enrollments
  getMyEnrollments: protectedProcedure.query(async ({ ctx }) => {
    // Get or create client profile
    let clientProfile = await ctx.db.clientProfile.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!clientProfile) {
      clientProfile = await ctx.db.clientProfile.create({
        data: {
          userId: ctx.session.user.id,
          goals: [],
        },
      });
    }

    return ctx.db.enrollment.findMany({
      where: { clientId: clientProfile.id },
      include: {
        program: {
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
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Get enrollments for a coach's program
  getProgramEnrollments: protectedProcedure
    .input(z.object({ programId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify coach owns the program
      const coachProfile = await ctx.db.coachProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!coachProfile) {
        throw new Error("Not authorized");
      }

      const program = await ctx.db.program.findUnique({
        where: { id: input.programId },
      });

      if (!program || program.coachId !== coachProfile.id) {
        throw new Error("Not authorized");
      }

      return ctx.db.enrollment.findMany({
        where: { programId: input.programId },
        include: {
          client: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Enroll in a program
  enroll: protectedProcedure
    .input(z.object({ programId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get or create client profile
      let clientProfile = await ctx.db.clientProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!clientProfile) {
        await ctx.db.user.update({
          where: { id: ctx.session.user.id },
          data: { role: "CLIENT" },
        });

        clientProfile = await ctx.db.clientProfile.create({
          data: {
            userId: ctx.session.user.id,
            goals: [],
          },
        });
      }

      // Check if already enrolled
      const existing = await ctx.db.enrollment.findUnique({
        where: {
          clientId_programId: {
            clientId: clientProfile.id,
            programId: input.programId,
          },
        },
      });

      if (existing) {
        throw new Error("Already enrolled in this program");
      }

      // Check if program has space
      const program = await ctx.db.program.findUnique({
        where: { id: input.programId },
        include: {
          _count: {
            select: {
              enrollments: {
                where: { status: "ACTIVE" },
              },
            },
          },
        },
      });

      if (!program) {
        throw new Error("Program not found");
      }

      if (
        program.maxClients &&
        program._count.enrollments >= program.maxClients
      ) {
        throw new Error("Program is full");
      }

      return ctx.db.enrollment.create({
        data: {
          clientId: clientProfile.id,
          programId: input.programId,
        },
      });
    }),

  // Cancel enrollment
  cancel: protectedProcedure
    .input(z.object({ enrollmentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const clientProfile = await ctx.db.clientProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!clientProfile) {
        throw new Error("Not authorized");
      }

      const enrollment = await ctx.db.enrollment.findUnique({
        where: { id: input.enrollmentId },
      });

      if (!enrollment || enrollment.clientId !== clientProfile.id) {
        throw new Error("Not authorized");
      }

      return ctx.db.enrollment.update({
        where: { id: input.enrollmentId },
        data: {
          status: "CANCELLED",
          endDate: new Date(),
        },
      });
    }),
});
