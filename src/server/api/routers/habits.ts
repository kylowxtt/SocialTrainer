import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
    HabitDataType,
    HabitLogStatus,
    EnrollmentStatus,
    CoachingRelationshipStatus,
} from "../../../../generated/prisma";
import { createTRPCRouter, coachProcedure, clientProcedure, protectedProcedure } from "../trpc";
import { db } from "../../db";

const habitDefinitionSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    dataType: z.nativeEnum(HabitDataType).default(HabitDataType.BOOLEAN),
    targetNumber: z.number().optional(),
    unitLabel: z.string().optional(),
    programId: z.string().optional(),
    coachingRelationshipId: z.string().optional(),
    clientId: z.string().optional(),
    referencedTemplateIds: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional(),
});

const scopedHabitSchema = habitDefinitionSchema.refine(
    (data) => data.programId || data.coachingRelationshipId || data.clientId,
    {
        message: "Habits must be scoped to a program, client, or relationship",
        path: ["programId"],
    }
);

const updateHabitSchema = habitDefinitionSchema
    .partial()
    .extend({
        id: z.string(),
        referencedTemplateIds: z.array(z.string()).optional(),
    })
    .refine(
        (data) => {
            // If any scope fields are provided, at least one must be set
            const hasScopeFields = data.programId !== undefined || 
                                  data.coachingRelationshipId !== undefined || 
                                  data.clientId !== undefined;
            if (hasScopeFields) {
                return data.programId || data.coachingRelationshipId || data.clientId;
            }
            // If no scope fields are provided, that's fine for updates
            return true;
        },
        {
            message: "Habits must be scoped to a program, client, or relationship",
            path: ["programId"],
        }
    );

const habitLogPayload = z.union([z.string(), z.number(), z.boolean(), z.record(z.any()), z.array(z.any())]);

function normalizeDateOnly(value?: string | Date) {
    const date = value ? new Date(value) : new Date();
    date.setHours(0, 0, 0, 0);
    return date;
}

async function requireCoachProfile(userId: string) {
    const coach = await db.coachProfile.findUnique({
        where: { userId },
        select: { id: true },
    });
    if (!coach) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Coach profile required" });
    }
    return coach;
}

async function requireClientProfile(userId: string) {
    const client = await db.clientProfile.findUnique({
        where: { userId },
        select: { id: true },
    });
    if (!client) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Client profile required" });
    }
    return client;
}

async function getClientScopes(clientId: string) {
    const [relationships, enrollments] = await Promise.all([
        db.coachingRelationship.findMany({
            where: {
                clientId,
                status: CoachingRelationshipStatus.ACTIVE,
            },
            select: { id: true },
        }),
        db.enrollment.findMany({
            where: {
                clientId,
                status: EnrollmentStatus.ACTIVE,
            },
            select: {
                id: true,
                cohort: {
                    select: { programId: true },
                },
            },
        }),
    ]);
    return {
        relationshipIds: relationships.map((rel) => rel.id),
        programIds: enrollments
            .map((enrollment) => enrollment.cohort?.programId)
            .filter((programId): programId is string => Boolean(programId)),
    };
}

function ensureClientAccessToHabit(
    habit: { clientId: string | null; coachingRelationshipId: string | null; programId: string | null },
    clientId: string,
    scopes: { relationshipIds: string[]; programIds: string[] }
) {
    if (habit.clientId === clientId) return true;
    if (habit.coachingRelationshipId && scopes.relationshipIds.includes(habit.coachingRelationshipId)) return true;
    if (habit.programId && scopes.programIds.includes(habit.programId)) return true;
    return false;
}

export const habitsRouter = createTRPCRouter({
    listCoachHabits: coachProcedure
        .input(
            z
                .object({
                    programId: z.string().optional(),
                    coachingRelationshipId: z.string().optional(),
                    clientId: z.string().optional(),
                })
                .optional()
        )
        .query(async ({ ctx, input }) => {
            const coach = await requireCoachProfile(ctx.session.user.id);
            return db.habitDefinition.findMany({
                where: {
                    coachId: coach.id,
                    ...(input?.programId ? { programId: input.programId } : {}),
                    ...(input?.coachingRelationshipId
                        ? { coachingRelationshipId: input.coachingRelationshipId }
                        : {}),
                    ...(input?.clientId ? { clientId: input.clientId } : {}),
                },
                orderBy: { updatedAt: "desc" },
            });
        }),

    createHabit: coachProcedure
        .input(scopedHabitSchema)
        .mutation(async ({ ctx, input }) => {
            const coach = await requireCoachProfile(ctx.session.user.id);
            return db.habitDefinition.create({
                data: {
                    coachId: coach.id,
                    ...input,
                    referencedTemplateIds: input.referencedTemplateIds ?? [],
                },
            });
        }),

    updateHabit: coachProcedure
        .input(updateHabitSchema)
        .mutation(async ({ ctx, input }) => {
            const coach = await requireCoachProfile(ctx.session.user.id);
            const habit = await db.habitDefinition.findUnique({
                where: { id: input.id },
            });
            if (!habit || habit.coachId !== coach.id) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Habit not found" });
            }
            const { id, ...data } = input;
            return db.habitDefinition.update({
                where: { id },
                data,
            });
        }),

    archiveHabit: coachProcedure
        .input(z.object({ id: z.string(), isActive: z.boolean().default(false) }))
        .mutation(async ({ ctx, input }) => {
            const coach = await requireCoachProfile(ctx.session.user.id);
            const habit = await db.habitDefinition.findUnique({
                where: { id: input.id },
            });
            if (!habit || habit.coachId !== coach.id) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Habit not found" });
            }
            return db.habitDefinition.update({
                where: { id: input.id },
                data: { isActive: input.isActive },
            });
        }),

    clientHabits: clientProcedure.query(async ({ ctx }) => {
        const client = await requireClientProfile(ctx.session.user.id);
        const scopes = await getClientScopes(client.id);
        return db.habitDefinition.findMany({
            where: {
                isActive: true,
                OR: [
                    { clientId: client.id },
                    { coachingRelationshipId: { in: scopes.relationshipIds } },
                    { programId: { in: scopes.programIds } },
                ],
            },
            orderBy: { updatedAt: "desc" },
        });
    }),

    logHabit: clientProcedure
        .input(
            z.object({
                habitId: z.string(),
                logDate: z.string().datetime().optional(),
                isCompleted: z.boolean().optional(),
                status: z.nativeEnum(HabitLogStatus).optional(),
                value: habitLogPayload.optional(),
                notes: z.string().optional(),
                metadata: z.record(z.any()).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const client = await requireClientProfile(ctx.session.user.id);
            const habit = await db.habitDefinition.findUnique({
                where: { id: input.habitId },
                select: {
                    id: true,
                    coachId: true,
                    programId: true,
                    coachingRelationshipId: true,
                    clientId: true,
                    isActive: true,
                },
            });
            if (!habit || !habit.isActive) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Habit not found" });
            }

            const scopes = await getClientScopes(client.id);
            if (!ensureClientAccessToHabit(habit, client.id, scopes)) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You cannot log this habit",
                });
            }

            const logDate = normalizeDateOnly(input.logDate);
            const status =
                input.status ??
                (input.isCompleted ? HabitLogStatus.COMPLETED : HabitLogStatus.PENDING);

            return db.habitLog.upsert({
                where: {
                    habitId_clientId_logDate: {
                        habitId: habit.id,
                        clientId: client.id,
                        logDate,
                    },
                },
                update: {
                    status,
                    value: input.value,
                    notes: input.notes,
                    metadata: input.metadata,
                },
                create: {
                    habitId: habit.id,
                    clientId: client.id,
                    logDate,
                    status,
                    value: input.value,
                    notes: input.notes,
                    metadata: input.metadata,
                },
            });
        }),

    habitGrid: protectedProcedure
        .input(
            z.object({
                habitId: z.string(),
                startDate: z.string().datetime(),
                endDate: z.string().datetime(),
            })
        )
        .query(async ({ ctx, input }) => {
            const habit = await db.habitDefinition.findUnique({
                where: { id: input.habitId },
            });
            if (!habit) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Habit not found" });
            }

            const userId = ctx.session.user.id;
            const [coach, client] = await Promise.all([
                db.coachProfile.findUnique({ where: { userId }, select: { id: true } }),
                db.clientProfile.findUnique({ where: { userId }, select: { id: true } }),
            ]);

            if (coach?.id === habit.coachId) {
                // coach has access
            } else if (client?.id) {
                const scopes = await getClientScopes(client.id);
                if (!ensureClientAccessToHabit(habit, client.id, scopes)) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: "You cannot view this habit",
                    });
                }
            } else {
                throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
            }

            const logs = await db.habitLog.findMany({
                where: {
                    habitId: habit.id,
                    logDate: {
                        gte: new Date(input.startDate),
                        lte: new Date(input.endDate),
                    },
                },
                orderBy: { logDate: "asc" },
            });

            return { habit, logs };
        }),
});


