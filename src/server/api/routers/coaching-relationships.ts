// Coaching Relationships router - handles 1:1 coaching relationships

import { createTRPCRouter, protectedProcedure, coachProcedure, clientProcedure } from "../trpc";
import { db } from "../../db";
import { z } from "zod";
import type { Prisma } from "../../../../generated/prisma";
import { TRPCError } from "@trpc/server";
import { sessionService } from "../../services/session-service";
import { sessionConfigurationsSchema } from "../schemas/session-configuration";

export const coachingRelationshipsRouter = createTRPCRouter({
    // Coach: Create a new 1:1 coaching relationship (from lead or directly)
    createCoachingRelationship: coachProcedure.input(z.object({
        clientId: z.string(),
        intakeSubmission: z.record(z.string(), z.any()).optional(),
        intakeSchemaId: z.string().optional(),
        intakeSchemaVersion: z.number().int().positive().optional(),
        leadId: z.string().optional(), // Optional link to originating lead
        // Array of session configurations (one-off or recurring)
        sessions: sessionConfigurationsSchema,
    })).mutation(async ({ ctx, input }) => {
        // Get coach profile
        const coachProfile = await db.coachProfile.findUnique({
            where: { userId: ctx.session.user.id },
        });
        if (!coachProfile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found" });
        }

        // Verify client exists
        const client = await db.clientProfile.findUnique({
            where: { id: input.clientId },
        });
        if (!client) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Client profile not found" });
        }

        // Check if relationship already exists
        const existing = await db.coachingRelationship.findUnique({
            where: {
                coachId_clientId: {
                    coachId: coachProfile.id,
                    clientId: input.clientId,
                },
            },
        });
        if (existing) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Coaching relationship already exists" });
        }

        // If leadId is provided, verify it belongs to this coach
        if (input.leadId) {
            const lead = await db.lead.findUnique({
                where: { id: input.leadId },
            });
            if (!lead || lead.coachId !== coachProfile.id) {
                throw new TRPCError({ code: "FORBIDDEN", message: "Lead does not belong to this coach" });
            }
        }

        // Use a transaction to ensure atomicity: if session creation or lead update fails,
        // the coaching relationship creation will be rolled back
        const result = await db.$transaction(async (tx) => {
            const coachingRelationship = await tx.coachingRelationship.create({
                data: {
                    coachId: coachProfile.id,
                    clientId: input.clientId,
                    intakeSubmission: input.intakeSubmission as Prisma.InputJsonValue ?? null,
                    intakeSchemaId: input.intakeSchemaId ?? null,
                    intakeSchemaVersion: input.intakeSchemaVersion ?? null,
                },
            });

            // Link lead to coaching relationship if provided
            if (input.leadId) {
                await tx.lead.update({
                    where: { id: input.leadId },
                    data: {
                        coachingRelationshipId: coachingRelationship.id,
                        status: "CONVERTED",
                    },
                });
            }

            // Create sessions if provided - pass transaction client to ensure atomicity
            let sessionResults = null;
            if (input.sessions && input.sessions.length > 0) {
                sessionResults = await sessionService.createSessionsFromConfigurations(
                    input.sessions.map(s => ({
                        ...s,
                        recurrence: s.recurrence,
                    })),
                    {
                        coachId: coachProfile.id,
                        coachingRelationshipId: coachingRelationship.id,
                        clientProfileId: input.clientId,
                        leadId: input.leadId,
                    },
                    tx
                );
            }

            return { coachingRelationship, sessions: sessionResults };
        });

        return { ...result.coachingRelationship, sessions: result.sessions };
    }),

    // Coach: Get all their 1:1 coaching relationships
    getCoachingRelationships: coachProcedure.query(async ({ ctx }) => {
        const coachProfile = await db.coachProfile.findUnique({
            where: { userId: ctx.session.user.id },
        });
        if (!coachProfile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found" });
        }

        const relationships = await db.coachingRelationship.findMany({
            where: { coachId: coachProfile.id },
            include: {
                client: true,
                originLead: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return relationships;
    }),

    // Coach or Client: Get a specific coaching relationship
    getCoachingRelationship: protectedProcedure.input(z.object({
        id: z.string(),
    })).query(async ({ ctx, input }) => {
        const relationship = await db.coachingRelationship.findUnique({
            where: { id: input.id },
            include: {
                coach: {
                    include: {
                        user: true,
                    },
                },
                client: {
                    include: {
                        user: true,
                    },
                },
                originLead: true,
            },
        });

        if (!relationship) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Coaching relationship not found" });
        }

        // Verify access - coach or client can view
        const coachProfile = await db.coachProfile.findUnique({
            where: { userId: ctx.session.user.id },
        });
        const clientProfile = await db.clientProfile.findUnique({
            where: { userId: ctx.session.user.id },
        });

        const isCoach = coachProfile?.id === relationship.coachId;
        const isClient = clientProfile?.id === relationship.clientId;

        if (!isCoach && !isClient) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only view your own coaching relationships" });
        }

        return relationship;
    }),

    // Coach: Update coaching relationship status
    updateCoachingRelationshipStatus: coachProcedure.input(z.object({
        id: z.string(),
        status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED", "PAUSED"]),
        endDate: z.date().optional(),
    })).mutation(async ({ ctx, input }) => {
        const relationship = await db.coachingRelationship.findUnique({
            where: { id: input.id },
            include: {
                coach: true,
            },
        });

        if (!relationship) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Coaching relationship not found" });
        }

        // Verify ownership
        if (relationship.coach.userId !== ctx.session.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only update your own coaching relationships" });
        }

        const updated = await db.coachingRelationship.update({
            where: { id: input.id },
            data: {
                status: input.status,
                endDate: input.endDate ?? (input.status === "COMPLETED" || input.status === "CANCELLED" ? new Date() : null),
            },
        });

        return updated;
    }),

    // Coach: Update intake form data for a coaching relationship
    updateIntakeData: coachProcedure.input(z.object({
        id: z.string(),
        intakeSubmission: z.record(z.string(), z.any()).optional(),
        intakeSchemaId: z.string().optional(),
        intakeSchemaVersion: z.number().int().positive().optional(),
    })).mutation(async ({ ctx, input }) => {
        const relationship = await db.coachingRelationship.findUnique({
            where: { id: input.id },
            include: {
                coach: true,
            },
        });

        if (!relationship) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Coaching relationship not found" });
        }

        // Verify ownership
        if (relationship.coach.userId !== ctx.session.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only update your own coaching relationships" });
        }

        const updated = await db.coachingRelationship.update({
            where: { id: input.id },
            data: {
                intakeSubmission: input.intakeSubmission as Prisma.InputJsonValue ?? relationship.intakeSubmission,
                intakeSchemaId: input.intakeSchemaId ?? relationship.intakeSchemaId,
                intakeSchemaVersion: input.intakeSchemaVersion ?? relationship.intakeSchemaVersion,
            },
        });

        return updated;
    }),

    // Client: Get their own coaching relationships
    getMyCoachingRelationships: clientProcedure.query(async ({ ctx }) => {
        const clientProfile = await db.clientProfile.findUnique({
            where: { userId: ctx.session.user.id },
        });
        if (!clientProfile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Client profile not found" });
        }

        const relationships = await db.coachingRelationship.findMany({
            where: { clientId: clientProfile.id },
            include: {
                coach: {
                    include: {
                        user: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return relationships;
    }),
});

export type CoachingRelationshipsRouter = typeof coachingRelationshipsRouter;

