// Recurrence Series router - handles recurrence series related operations

import { createTRPCRouter, protectedProcedure, coachProcedure } from "../trpc";
import { db } from "../../db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sessionService } from "../../services/session-service";
import { createRRuleFromSeries } from "../../utils/rrule-converter";

export const recurrenceSeriesRouter = createTRPCRouter({
    // Coach: Get a specific recurrence series
    getSeries: coachProcedure.input(z.object({
        id: z.string(),
    })).query(async ({ ctx, input }) => {
        const coachProfile = await db.coachProfile.findUnique({
            where: { userId: ctx.session.user.id },
        });
        if (!coachProfile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found" });
        }

        const series = await db.recurrenceSeries.findUnique({
            where: { id: input.id },
            include: {
                schedulingSessions: {
                    orderBy: { startsAt: "asc" },
                },
            },
        });

        if (!series) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Recurrence series not found" });
        }

        if (series.coachId !== coachProfile.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only view your own recurrence series" });
        }

        return {
            ...series,
            materializedSessionCount: series.schedulingSessions.length,
        };
    }),

    // Coach: Get all recurrence series for the coach
    getSeriesList: coachProcedure.query(async ({ ctx }) => {
        const coachProfile = await db.coachProfile.findUnique({
            where: { userId: ctx.session.user.id },
        });
        if (!coachProfile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found" });
        }

        const series = await db.recurrenceSeries.findMany({
            where: { coachId: coachProfile.id },
            include: {
                _count: {
                    select: { schedulingSessions: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return series.map(s => ({
            ...s,
            materializedSessionCount: s._count.schedulingSessions,
        }));
    }),

    // Coach: Manually trigger session generation for a series
    materializeSessions: coachProcedure.input(z.object({
        seriesId: z.string(),
        upToDate: z.date().optional(),
    })).mutation(async ({ ctx, input }) => {
        const coachProfile = await db.coachProfile.findUnique({
            where: { userId: ctx.session.user.id },
        });
        if (!coachProfile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found" });
        }

        const series = await db.recurrenceSeries.findUnique({
            where: { id: input.seriesId },
        });

        if (!series) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Recurrence series not found" });
        }

        if (series.coachId !== coachProfile.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only materialize sessions for your own series" });
        }

        const sessions = await sessionService.materializeSessionsFromSeries(
            input.seriesId,
            input.upToDate
        );

        return { sessions, count: sessions.length };
    }),

    // Coach: Preview next N occurrences without materializing
    previewOccurrences: coachProcedure.input(z.object({
        seriesId: z.string(),
        count: z.number().int().positive().max(100).default(10),
    })).query(async ({ ctx, input }) => {
        const coachProfile = await db.coachProfile.findUnique({
            where: { userId: ctx.session.user.id },
        });
        if (!coachProfile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found" });
        }

        const series = await db.recurrenceSeries.findUnique({
            where: { id: input.seriesId },
            include: { schedulingSessions: true },
        });

        if (!series) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Recurrence series not found" });
        }

        if (series.coachId !== coachProfile.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only preview occurrences for your own series" });
        }

        if (!series.rruleString) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Recurrence series must have rruleString" });
        }
        const rrule = createRRuleFromSeries({
            rruleString: series.rruleString,
            startsAt: series.startsAt,
        });
        
        // Get the last materialized session or use series start
        const lastSession = series.schedulingSessions.length > 0
            ? series.schedulingSessions[series.schedulingSessions.length - 1]
            : null;
        
        const startDate = lastSession 
            ? new Date(lastSession.startsAt.getTime() + 24 * 60 * 60 * 1000) // Next day
            : series.startsAt;

        // Generate preview occurrences
        const occurrences = rrule.between(startDate, new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), true);
        
        return occurrences.slice(0, input.count);
    }),

    // Coach: Update recurrence series (affects only future sessions)
    updateSeries: coachProcedure.input(z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        rruleString: z.string().optional(),
        timeZone: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
        const coachProfile = await db.coachProfile.findUnique({
            where: { userId: ctx.session.user.id },
        });
        if (!coachProfile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found" });
        }

        const series = await db.recurrenceSeries.findUnique({
            where: { id: input.id },
            include: { schedulingSessions: true },
        });

        if (!series) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Recurrence series not found" });
        }

        if (series.coachId !== coachProfile.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only update your own recurrence series" });
        }

        // Update the series
        const updatedSeries = await db.recurrenceSeries.update({
            where: { id: input.id },
            data: {
                title: input.title,
                description: input.description,
                rruleString: input.rruleString,
                timeZone: input.timeZone,
            },
        });

        // Delete future materialized sessions if rruleString changed
        if (input.rruleString !== undefined && input.rruleString !== series.rruleString) {
            const now = new Date();
            await db.schedulingSession.deleteMany({
                where: {
                    recurrenceSeriesId: input.id,
                    startsAt: { gt: now },
                },
            });
        }

        return updatedSeries;
    }),

    // Coach: Delete a recurrence series
    deleteSeries: coachProcedure.input(z.object({
        id: z.string(),
        deleteFutureSessions: z.boolean().default(false),
    })).mutation(async ({ ctx, input }) => {
        const coachProfile = await db.coachProfile.findUnique({
            where: { userId: ctx.session.user.id },
        });
        if (!coachProfile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found" });
        }

        const series = await db.recurrenceSeries.findUnique({
            where: { id: input.id },
        });

        if (!series) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Recurrence series not found" });
        }

        if (series.coachId !== coachProfile.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own recurrence series" });
        }

        return await db.$transaction(async (tx) => {
            // Optionally delete future sessions
            if (input.deleteFutureSessions) {
                const now = new Date();
                await tx.schedulingSession.deleteMany({
                    where: {
                        recurrenceSeriesId: input.id,
                        startsAt: { gt: now },
                    },
                });
            }

            // Delete the series (cascade will handle related sessions if needed)
            await tx.recurrenceSeries.delete({
                where: { id: input.id },
            });

            return { success: true };
        });
    }),
});

export type RecurrenceSeriesRouter = typeof recurrenceSeriesRouter;