import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

const exerciseSchema = z.object({
  name: z.string(),
  sets: z.number(),
  reps: z.string(), // Can be "10" or "8-12" or "AMRAP"
  weight: z.string().optional(),
  notes: z.string().optional(),
});

export const workoutRouter = createTRPCRouter({
  // Get workouts for a program
  getProgramWorkouts: protectedProcedure
    .input(z.object({ programId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.workout.findMany({
        where: { programId: input.programId },
        orderBy: [{ weekNumber: "asc" }, { dayNumber: "asc" }],
      });
    }),

  // Create a workout (coach only)
  create: protectedProcedure
    .input(
      z.object({
        programId: z.string(),
        name: z.string().min(1),
        description: z.string().optional(),
        weekNumber: z.number().min(1),
        dayNumber: z.number().min(1).max(7),
        exercises: z.array(exerciseSchema),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify coach owns the program
      const coachProfile = await ctx.db.coachProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!coachProfile) {
        throw new Error("Coach profile not found");
      }

      const program = await ctx.db.program.findUnique({
        where: { id: input.programId },
      });

      if (!program || program.coachId !== coachProfile.id) {
        throw new Error("Program not found or access denied");
      }

      return ctx.db.workout.create({
        data: {
          name: input.name,
          description: input.description,
          programId: input.programId,
          weekNumber: input.weekNumber,
          dayNumber: input.dayNumber,
          exercises: input.exercises,
        },
      });
    }),

  // Update a workout (coach only)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        weekNumber: z.number().min(1).optional(),
        dayNumber: z.number().min(1).max(7).optional(),
        exercises: z.array(exerciseSchema).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Verify coach owns the program
      const workout = await ctx.db.workout.findUnique({
        where: { id },
        include: { program: true },
      });

      if (!workout) {
        throw new Error("Workout not found");
      }

      const coachProfile = await ctx.db.coachProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!coachProfile || workout.program.coachId !== coachProfile.id) {
        throw new Error("Coach profile not found or access denied");
      }

      return ctx.db.workout.update({
        where: { id },
        data: updateData,
      });
    }),

  // Delete a workout (coach only)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify coach owns the program
      const workout = await ctx.db.workout.findUnique({
        where: { id: input.id },
        include: { program: true },
      });

      if (!workout) {
        throw new Error("Workout not found");
      }

      const coachProfile = await ctx.db.coachProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!coachProfile || workout.program.coachId !== coachProfile.id) {
        throw new Error("Coach profile not found or access denied");
      }

      return ctx.db.workout.delete({
        where: { id: input.id },
      });
    }),

  // Log a workout (client)
  logWorkout: protectedProcedure
    .input(
      z.object({
        workoutId: z.string(),
        completed: z.boolean(),
        notes: z.string().optional(),
        performance: z.array(exerciseSchema).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get or create client profile
      let clientProfile = await ctx.db.clientProfile.findUnique({
        where: { userId: ctx.session.user.id },
      });

      clientProfile ??= await ctx.db.clientProfile.create({
        data: {
          userId: ctx.session.user.id,
          goals: [],
        },
      });

      return ctx.db.workoutLog.create({
        data: {
          clientId: clientProfile.id,
          workoutId: input.workoutId,
          completed: input.completed,
          notes: input.notes,
          performance: input.performance,
        },
      });
    }),

  // Get workout logs for a client
  getMyLogs: protectedProcedure.query(async ({ ctx }) => {
    const clientProfile = await ctx.db.clientProfile.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!clientProfile) {
      return [];
    }

    return ctx.db.workoutLog.findMany({
      where: { clientId: clientProfile.id },
      include: {
        workout: true,
      },
      orderBy: { date: "desc" },
      take: 50,
    });
  }),
});
