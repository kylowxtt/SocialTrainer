// This router will be the basis for all session related operations, the focus being to get coaches the information they need to manage their entire coaching businesss

import { createTRPCRouter, protectedProcedure, publicProcedure, coachProcedure } from "../trpc";
import { db } from "../../db";
import { z } from "zod";
import { SessionType } from "../../../../generated/prisma";
import { TRPCError } from "@trpc/server";
import { sessionService } from "../../services/session-service";

export const sessionsRouter = createTRPCRouter({
    // Coach: Get all sessions for their coaching business
    getSessions: coachProcedure.query(async ({ ctx }) => {
        // Get coach profile to verify ownership
        const coachProfile = await db.coachProfile.findUnique({
            where: { userId: ctx.session.user.id },
        });
        if (!coachProfile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found" });
        }
        const sessions = await db.schedulingSession.findMany({
            where: { coachId: coachProfile.id },
        });
        return sessions;
    }),
    getSession: coachProcedure.input(z.object({
        id: z.string(),
    })).query(async ({ ctx, input }) => {
        // Get coach profile to verify ownership
        const coachProfile = await db.coachProfile.findUnique({
            where: { userId: ctx.session.user.id },
        });
        if (!coachProfile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found" });
        }
        const session = await db.schedulingSession.findUnique({
            where: { id: input.id, coachId: coachProfile.id },
        });
        if (!session) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
        }
        return session;
    }),
    // If coachs wish to manually add a session 
    createSession: coachProcedure.input(z.object({
        title: z.string(),
        description: z.string(),
        type: z.nativeEnum(SessionType),
        startsAt: z.date(),
        endsAt: z.date(),
        timeZone: z.string(),
        location: z.string(),
        videoConferenceLink: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const coachProfile = await db.coachProfile.findUnique({
            where: { userId: ctx.session.user.id },
        });
        if (!coachProfile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found" });
        }
        const session = await sessionService.createSession({
            ...input,
            coachId: coachProfile.id,
        });
        return session;
    }),
    cancelSession: coachProcedure.input(z.object({
        id: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const coachProfile = await db.coachProfile.findUnique({
            where: { userId: ctx.session.user.id },
        });
        if (!coachProfile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found" });
        }
        const session = await sessionService.cancelSession(input.id, coachProfile.id);
        if (!session) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
        }
        return session;
    }),
    updateSession: coachProcedure.input(z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        type: z.nativeEnum(SessionType),
        startsAt: z.date(),
        endsAt: z.date(),
        timeZone: z.string(),
        location: z.string(),
        videoConferenceLink: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const coachProfile = await db.coachProfile.findUnique({
            where: { userId: ctx.session.user.id },
        });
        if (!coachProfile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found" });
        }
        const session = await db.schedulingSession.update({
            where: { id: input.id, coachId: coachProfile.id },
            data: input,
        });
        if (!session) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
        }
        return session;
    }),
});