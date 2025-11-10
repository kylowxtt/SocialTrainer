// Handles the enrollments and related data

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { db } from "../../db";
import { z } from "zod";
import type { Prisma } from "../../../../generated/prisma";

export const enrollmentsRouter = createTRPCRouter({
    getEnrollments: protectedProcedure.query(async ({ ctx }) => {
        const enrollments = await db.enrollment.findMany({
            where: { program: { coachId: ctx.session.user.id } },
        });
        return enrollments;
    }),
    getEnrollment: protectedProcedure.input(z.object({
        id: z.string(),
    })).query(async ({ ctx, input }) => {
        const enrollment = await db.enrollment.findUnique({
            where: { id: input.id, clientId: ctx.session.user.id },
        });
        return enrollment;
    }),
    getEnrollmentsForClient: protectedProcedure.input(z.object({
        clientId: z.string(),
    })).query(async ({ ctx, input }) => {
        const enrollments = await db.enrollment.findMany({
            where: { clientId: input.clientId },
            include: {
                program: true,
            },
        });
        return enrollments;
    }),
    getEnrollmentsForCoach: protectedProcedure.query(async ({ ctx }) => {
        const enrollments = await db.enrollment.findMany({
            where: { program: { coachId: ctx.session.user.id } },
            include: {
                program: true,
                client: true,
            },
        });
        return enrollments;
    }),
});