import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
    CheckInCadenceType,
    CheckInEntryType,
    CheckInInstanceStatus,
    CheckInReviewStatus,
    CheckInSubmissionStatus,
} from "../../../../generated/prisma";
import { createTRPCRouter, coachProcedure, clientProcedure, protectedProcedure } from "../trpc";
import { db } from "../../db";
import { checkInService } from "../../services/checkins";

const cadenceRuleSchema = z.object({
    rruleString: z.string().optional(),
    frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
    interval: z.number().int().min(1).optional(),
    weekdays: z.array(z.union([z.string(), z.number()])).optional(),
    dayOfMonth: z.number().int().min(1).max(31).optional(),
    monthOfYear: z.number().int().min(1).max(12).optional(),
    endsAt: z.string().datetime().optional(),
    maxOccurrences: z.number().int().min(1).optional(),
    anchorDate: z.string().datetime().optional(),
});

const formSchema = z.union([z.record(z.any()), z.array(z.any())]);

const templateBaseSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    entryType: z.nativeEnum(CheckInEntryType).default(CheckInEntryType.PROGRAM),
    programId: z.string().optional(),
    coachingRelationshipId: z.string().optional(),
    schemaVersion: z.number().int().min(1).default(1),
    formSchema,
    cadenceType: z.nativeEnum(CheckInCadenceType),
    cadenceRule: cadenceRuleSchema.optional(),
    cadenceRrule: z.string().optional(),
    cadenceTimeZone: z.string().optional(),
    referencedHabitIds: z.array(z.string()).default([]),
    defaultPriority: z.boolean().optional(),
    metadata: z.record(z.any()).optional(),
});

const submissionPayloadSchema = z.union([z.record(z.any()), z.array(z.any())]);

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

async function ensureHabitScopeOwnership(
    coachId: string,
    habitIds: string[],
    entryType: CheckInEntryType,
    programId?: string | null,
    coachingRelationshipId?: string | null
) {
    if (!habitIds.length) return;
    const habits = await db.habitDefinition.findMany({
        where: { id: { in: habitIds }, coachId },
        select: { id: true, programId: true, coachingRelationshipId: true },
    });
    if (habits.length !== habitIds.length) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: "One or more habits could not be found for this coach",
        });
    }

    if (entryType === CheckInEntryType.PROGRAM) {
        const invalid = habits.find((habit) => habit.programId !== programId);
        if (invalid) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Habits referenced by a program template must belong to the same program",
            });
        }
    }

    if (entryType === CheckInEntryType.ONE_ON_ONE) {
        const invalid = habits.find(
            (habit) => habit.coachingRelationshipId !== coachingRelationshipId
        );
        if (invalid) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Habits referenced by a 1:1 template must belong to that relationship",
            });
        }
    }
}

type ClientEditableSubmissionStatus = Extract<
    CheckInSubmissionStatus,
    "DRAFT" | "SUBMITTED"
>;

const isClientEditableStatus = (
    status: CheckInSubmissionStatus
): status is ClientEditableSubmissionStatus => {
    return status === "DRAFT" || status === "SUBMITTED";
};

async function buildHabitSnapshot(habitIds: string[], clientId: string, days = 7) {
    if (!habitIds.length) {
        return [];
    }
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));

    const [habits, logs] = await Promise.all([
        db.habitDefinition.findMany({
            where: { id: { in: habitIds } },
        }),
        db.habitLog.findMany({
            where: {
                habitId: { in: habitIds },
                clientId,
                logDate: { gte: since },
            },
            orderBy: { logDate: "desc" },
        }),
    ]);

    return habits.map((habit) => ({
        habit,
        recentLogs: logs.filter((log) => log.habitId === habit.id),
    }));
}

async function resolveInstanceForSubmission(options: {
    templateId: string;
    clientId: string;
    coachId: string;
    programId?: string | null;
    coachingRelationshipId?: string | null;
    instanceId?: string;
    entryType: CheckInEntryType;
}) {
    if (options.instanceId) {
        const instance = await db.checkInInstance.findUnique({
            where: { id: options.instanceId },
        });
        if (!instance || instance.clientId !== options.clientId) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid check-in instance" });
        }
        return instance;
    }

    const existing = await db.checkInInstance.findFirst({
        where: {
            templateId: options.templateId,
            clientId: options.clientId,
        },
        orderBy: { dueDate: "asc" },
    });

    if (existing) {
        return existing;
    }

    if (options.entryType === CheckInEntryType.ADHOC) {
        return db.checkInInstance.create({
            data: {
                templateId: options.templateId,
                coachId: options.coachId,
                clientId: options.clientId,
                programId: options.programId ?? null,
                coachingRelationshipId: options.coachingRelationshipId ?? null,
                dueDate: new Date(),
                status: CheckInInstanceStatus.DUE,
            },
        });
    }

    return null;
}

export const checkInsRouter = createTRPCRouter({
    listTemplates: coachProcedure.query(async ({ ctx }) => {
        const coach = await requireCoachProfile(ctx.session.user.id);
        return db.checkInTemplate.findMany({
            where: { coachId: coach.id },
            orderBy: { updatedAt: "desc" },
        });
    }),

    getTemplate: coachProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const coach = await requireCoachProfile(ctx.session.user.id);
            const template = await db.checkInTemplate.findUnique({
                where: { id: input.id },
            });
            if (!template || template.coachId !== coach.id) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
            }
            return template;
        }),

    createTemplate: coachProcedure
        .input(templateBaseSchema)
        .mutation(async ({ ctx, input }) => {
            const coach = await requireCoachProfile(ctx.session.user.id);
            if (input.entryType === CheckInEntryType.PROGRAM && !input.programId) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Program templates require a programId",
                });
            }
            if (input.entryType === CheckInEntryType.ONE_ON_ONE && !input.coachingRelationshipId) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "1:1 templates require a coachingRelationshipId",
                });
            }
            await ensureHabitScopeOwnership(
                coach.id,
                input.referencedHabitIds ?? [],
                input.entryType,
                input.programId,
                input.coachingRelationshipId
            );

            return db.checkInTemplate.create({
                data: {
                    coachId: coach.id,
                    ...input,
                    referencedHabitIds: input.referencedHabitIds ?? [],
                    defaultPriority:
                        input.defaultPriority ??
                        input.entryType === CheckInEntryType.ONE_ON_ONE,
                },
            });
        }),

    updateTemplate: coachProcedure
        .input(
            templateBaseSchema.partial().extend({
                id: z.string(),
                referencedHabitIds: z.array(z.string()).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const coach = await requireCoachProfile(ctx.session.user.id);
            const template = await db.checkInTemplate.findUnique({
                where: { id: input.id },
            });
            if (!template || template.coachId !== coach.id) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
            }

            if (input.referencedHabitIds) {
                await ensureHabitScopeOwnership(
                    coach.id,
                    input.referencedHabitIds,
                    template.entryType,
                    input.programId ?? template.programId,
                    input.coachingRelationshipId ?? template.coachingRelationshipId
                );
            }

            const { id, ...data } = input;
            return db.checkInTemplate.update({
                where: { id: input.id },
                data,
            });
        }),

    archiveTemplate: coachProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const coach = await requireCoachProfile(ctx.session.user.id);
            const template = await db.checkInTemplate.findUnique({
                where: { id: input.id },
            });
            if (!template || template.coachId !== coach.id) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
            }
            return db.checkInTemplate.update({
                where: { id: input.id },
                data: { isActive: false },
            });
        }),

    previewCadence: coachProcedure
        .input(z.object({ templateId: z.string(), limit: z.number().min(1).max(50).optional() }))
        .query(async ({ ctx, input }) => {
            const coach = await requireCoachProfile(ctx.session.user.id);
            const template = await db.checkInTemplate.findUnique({
                where: { id: input.templateId },
                select: { coachId: true },
            });
            if (!template || template.coachId !== coach.id) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
            }
            return checkInService.previewTemplateCadence(input.templateId, input.limit ?? 10);
        }),

    listCoachQueue: coachProcedure
        .input(
            z.object({
                status: z.nativeEnum(CheckInSubmissionStatus).optional(),
                priorityOnly: z.boolean().optional(),
                limit: z.number().int().min(1).max(100).optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const coach = await requireCoachProfile(ctx.session.user.id);
            return db.checkInSubmission.findMany({
                where: {
                    coachId: coach.id,
                    ...(input.status ? { status: input.status } : {}),
                    ...(input.priorityOnly ? { isPriority: true } : {}),
                },
                include: {
                    template: true,
                    client: { select: { id: true, name: true, email: true } },
                },
                orderBy: [
                    { isPriority: "desc" },
                    { submittedAt: "asc" },
                    { createdAt: "asc" },
                ],
                take: input.limit ?? 50,
            });
        }),

    reviewSubmission: coachProcedure
        .input(
            z.object({
                submissionId: z.string(),
                decision: z.enum(["APPROVE", "REQUEST_CHANGES"]),
                message: z.string().optional(),
                replyPayload: z.record(z.any()).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const coach = await requireCoachProfile(ctx.session.user.id);
            const submission = await db.checkInSubmission.findUnique({
                where: { id: input.submissionId },
                include: { template: true },
            });
            if (!submission || submission.coachId !== coach.id) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Submission not found" });
            }

            const status =
                input.decision === "APPROVE"
                    ? CheckInSubmissionStatus.APPROVED
                    : CheckInSubmissionStatus.CHANGES_REQUESTED;

            const review = await db.checkInReview.create({
                data: {
                    submissionId: submission.id,
                    reviewerId: coach.id,
                    status:
                        input.decision === "APPROVE"
                            ? CheckInReviewStatus.APPROVED
                            : CheckInReviewStatus.CHANGES_REQUESTED,
                    message: input.message,
                    replyPayload: input.replyPayload,
                },
            });

            const updated = await db.checkInSubmission.update({
                where: { id: submission.id },
                data: {
                    status,
                    reviewedAt: new Date(),
                },
            });

            if (submission.instanceId && input.decision === "APPROVE") {
                await checkInService.markInstanceSatisfied(submission.instanceId);
            }

            return { submission: updated, review };
        }),

    setSubmissionPriority: coachProcedure
        .input(z.object({ submissionId: z.string(), isPriority: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const coach = await requireCoachProfile(ctx.session.user.id);
            const submission = await db.checkInSubmission.findUnique({
                where: { id: input.submissionId },
            });
            if (!submission || submission.coachId !== coach.id) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Submission not found" });
            }
            return db.checkInSubmission.update({
                where: { id: input.submissionId },
                data: { isPriority: input.isPriority },
            });
        }),

    getSubmissionDetail: protectedProcedure
        .input(z.object({ submissionId: z.string(), habitDays: z.number().int().min(1).max(30).optional() }))
        .query(async ({ ctx, input }) => {
            const submission = await db.checkInSubmission.findUnique({
                where: { id: input.submissionId },
                include: {
                    template: true,
                    reviews: true,
                    client: { select: { id: true, name: true } },
                },
            });
            if (!submission) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Submission not found" });
            }

            const userId = ctx.session.user.id;
            const [coach, client] = await Promise.all([
                db.coachProfile.findUnique({ where: { userId }, select: { id: true } }),
                db.clientProfile.findUnique({ where: { userId }, select: { id: true } }),
            ]);

            const isCoach = coach && coach.id === submission.coachId;
            const isClient = client && client.id === submission.clientId;
            if (!isCoach && !isClient) {
                throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
            }

            const habitSnapshot = await buildHabitSnapshot(
                submission.template.referencedHabitIds ?? [],
                submission.clientId,
                input.habitDays ?? 7
            );

            return {
                submission,
                habitSnapshot,
            };
        }),

    listClientCheckIns: clientProcedure.query(async ({ ctx }) => {
        const client = await requireClientProfile(ctx.session.user.id);
        return db.checkInInstance.findMany({
            where: {
                clientId: client.id,
                status: {
                    in: [
                        CheckInInstanceStatus.SCHEDULED,
                        CheckInInstanceStatus.DUE,
                        CheckInInstanceStatus.OVERDUE,
                    ],
                },
            },
            include: {
                template: true,
                submissions: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
            orderBy: { dueDate: "asc" },
        });
    }),

    submitCheckIn: clientProcedure
        .input(
            z.object({
                templateId: z.string(),
                instanceId: z.string().optional(),
                submissionId: z.string().optional(),
                status: z.nativeEnum(CheckInSubmissionStatus).default(CheckInSubmissionStatus.SUBMITTED),
                payload: submissionPayloadSchema,
                metadata: z.record(z.any()).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            if (!isClientEditableStatus(input.status)) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Clients can only create drafts or submitted entries",
                });
            }

            const client = await requireClientProfile(ctx.session.user.id);
            const template = await db.checkInTemplate.findUnique({
                where: { id: input.templateId },
            });
            if (!template) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
            }

            const instance = await resolveInstanceForSubmission({
                templateId: template.id,
                clientId: client.id,
                coachId: template.coachId,
                programId: template.programId,
                coachingRelationshipId: template.coachingRelationshipId,
                instanceId: input.instanceId,
                entryType: template.entryType,
            });

            const habitSnapshot = await buildHabitSnapshot(
                template.referencedHabitIds ?? [],
                client.id
            );

            const baseData = {
                templateId: template.id,
                instanceId: instance?.id ?? null,
                coachId: template.coachId,
                clientId: client.id,
                entryType: template.entryType,
                schemaVersion: template.schemaVersion,
                payload: input.payload,
                status: input.status,
                isPriority:
                    template.entryType === CheckInEntryType.ONE_ON_ONE ||
                    template.defaultPriority ||
                    false,
                metadata: input.metadata,
                habitContext: habitSnapshot,
                submittedAt: input.status === CheckInSubmissionStatus.SUBMITTED ? new Date() : null,
            };

            let submission;
            if (input.submissionId) {
                const existing = await db.checkInSubmission.findUnique({
                    where: { id: input.submissionId },
                });
                if (!existing || existing.clientId !== client.id) {
                    throw new TRPCError({ code: "NOT_FOUND", message: "Submission not found" });
                }
                submission = await db.checkInSubmission.update({
                    where: { id: input.submissionId },
                    data: baseData,
                });
            } else {
                submission = await db.checkInSubmission.create({
                    data: baseData,
                });
            }

            if (submission.instanceId && input.status === CheckInSubmissionStatus.SUBMITTED) {
                await checkInService.markInstanceSatisfied(submission.instanceId);
            }

            return submission;
        }),
});

