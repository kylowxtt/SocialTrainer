// Handles the enrollments and related data

import { createTRPCRouter, protectedProcedure, publicProcedure, coachProcedure, clientProcedure } from "../trpc";
import { db } from "../../db";
import { z } from "zod";
import type { Prisma } from "../../../../generated/prisma";
import { TRPCError } from "@trpc/server";

export const enrollmentsRouter = createTRPCRouter({
    // Coach: Get all enrollments for their programs
    getEnrollments: coachProcedure.query(async ({ ctx }) => {
        const enrollments = await db.enrollment.findMany({
            where: { program: { coachId: ctx.session.user.id } },
        });
        return enrollments;
    }),
    // Client: Get their own enrollment by ID
    getEnrollment: clientProcedure.input(z.object({
        id: z.string(),
    })).query(async ({ ctx, input }) => {
        const enrollment = await db.enrollment.findUnique({
            where: { id: input.id },
            include: { client: true },
        });
        if (!enrollment) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Enrollment not found" });
        }
        // Verify ownership - client can only view their own enrollments
        if (enrollment.client.userId !== ctx.session.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only view your own enrollments" });
        }
        return enrollment;
    }),
    // Client: Get all enrollments for a specific client (must be their own)
    getEnrollmentsForClient: clientProcedure.input(z.object({
        clientId: z.string(),
    })).query(async ({ ctx, input }) => {
        // Verify the clientId belongs to the authenticated user
        const clientProfile = await db.clientProfile.findUnique({
            where: { id: input.clientId },
        });
        if (!clientProfile || clientProfile.userId !== ctx.session.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only view your own enrollments" });
        }
        const enrollments = await db.enrollment.findMany({
            where: { clientId: input.clientId },
            include: {
                program: true,
            },
        });
        return enrollments;
    }),
    // Coach: Get all enrollments for their programs with full details
    getEnrollmentsForCoach: coachProcedure.query(async ({ ctx }) => {
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