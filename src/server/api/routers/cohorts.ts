// Cohort router - handles cohort related operations 

import { createTRPCRouter, protectedProcedure, coachProcedure } from "../trpc";
import { db } from "../../db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { CohortStatus } from "generated/prisma";
import { sessionService } from "../../services/session-service";
import { sessionConfigurationsSchema } from "../schemas/session-configuration";

export const cohortsRouter = createTRPCRouter({
    createCohort: coachProcedure.input(z.object({
        name: z.string(),
        description: z.string(),
        programId: z.string(),
        slug: z.string(),
        intakeOpensAt: z.date(),
        intakeClosesAt: z.date(),
        startsAt: z.date(),
        endsAt: z.date(),
        status: z.nativeEnum(CohortStatus),
        metadata: z.record(z.string(), z.any()).optional(),
        // Array of session configurations (one-off or recurring)
        sessions: sessionConfigurationsSchema,
    })).mutation(async ({ ctx, input }) => {
        const coachProfile = await db.coachProfile.findUnique({
            where: { userId: ctx.session.user.id },     
        });
        if (!coachProfile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found" });
        }
        const program = await db.program.findUnique({
            where: { id: input.programId, coachId: coachProfile.id },
            include: { product: true },
        }); 
        if (!program) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Program not found" });
        }
        
        // Use a transaction to ensure atomicity: if session creation fails,
        // the cohort creation will be rolled back
        const result = await db.$transaction(async (tx) => {
            const cohort = await tx.cohort.create({
                data: {
                    name: input.name,
                    description: input.description,
                    programId: input.programId,
                    slug: input.slug,
                    intakeOpensAt: input.intakeOpensAt,
                    intakeClosesAt: input.intakeClosesAt,
                    startsAt: input.startsAt,
                    endsAt: input.endsAt,
                    status: input.status,
                    metadata: input.metadata,
                    coachId: coachProfile.id,
                },
            });
            
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
                        programId: program.id,
                        productId: program.productId ?? undefined,
                        cohortId: cohort.id,
                    },
                    tx
                );
            }
            
            return { cohort, sessions: sessionResults };
        });
        
        return result;
    }),
    getCohort: coachProcedure.input(z.object({
        id: z.string(),
    })).query(async ({ ctx, input }) => {
        const coachProfile = await db.coachProfile.findUnique({
            where: { userId: ctx.session.user.id },
        });
        if (!coachProfile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found" });
        }
        const cohort = await db.cohort.findUnique({
            where: { id: input.id, coachId: ctx.session.user.id },
        });
        if (!cohort) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Cohort not found" });
        }
        return cohort;
    }),
    updateCohort: coachProcedure.input(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        programId: z.string(),
        slug: z.string(),
        intakeOpensAt: z.date(),
        intakeClosesAt: z.date(),
        startsAt: z.date(),
        endsAt: z.date(),
        status: z.nativeEnum(CohortStatus),
        metadata: z.record(z.string(), z.any()).optional(),
    })).mutation(async ({ ctx, input }) => {
        const coachProfile = await db.coachProfile.findUnique({
            where: { userId: ctx.session.user.id },
        });
        if (!coachProfile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found" });
        }
        const cohort = await db.cohort.update({
            where: { id: input.id, coachId: ctx.session.user.id },
            data: input,
        });
        if (!cohort) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Cohort not found" });
        }
        return cohort;
    }),
    cancelCohort: coachProcedure.input(z.object({
        id: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const coachProfile = await db.coachProfile.findUnique({
            where: { userId: ctx.session.user.id },
        });
        if (!coachProfile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found" });
        }
        const cohort = await db.cohort.update({
            where: { id: input.id, coachId: ctx.session.user.id },
            data: { status: CohortStatus.CANCELLED },
        });
        if (!cohort) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Cohort not found" });
        }
        return cohort; 
    }),
    getCohortsForProgram: coachProcedure.input(z.object({
        programId: z.string(),
    })).query(async ({ ctx, input }) => {
        const coachProfile = await db.coachProfile.findUnique({
            where: { userId: ctx.session.user.id },
        });
        if (!coachProfile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found" });
        }
        const cohorts = await db.cohort.findMany({
            where: { programId: input.programId, coachId: ctx.session.user.id },
            include: {
                program: true,
            },
        });
        return cohorts;
    }),
    completeCohort: coachProcedure.input(z.object({
        id: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const coachProfile = await db.coachProfile.findUnique({
            where: { userId: ctx.session.user.id },
        });
        if (!coachProfile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found" });
        }
        const cohort = await db.cohort.update({
            where: { id: input.id, coachId: ctx.session.user.id },
            data: { status: CohortStatus.COMPLETED },
        });
        if (!cohort) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Cohort not found" });
        }
        return cohort;
    }),
    getCohortEnrollments: coachProcedure.input(z.object({
        id: z.string(),
    })).query(async ({ ctx, input }) => {
        const coachProfile = await db.coachProfile.findUnique({
            where: { userId: ctx.session.user.id },
        });
        if (!coachProfile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found" });
        }
        // Verify the cohort belongs to this coach
        const cohort = await db.cohort.findUnique({
            where: { id: input.id, coachId: coachProfile.id },
        });
        if (!cohort) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Cohort not found" });
        }
        const enrollments = await db.enrollment.findMany({
            where: { cohortId: input.id },
            include: {
                client: true,
                cohort: {
                    include: {
                        program: true,
                    },
                },
            },
        });
        return enrollments;
    }),
});