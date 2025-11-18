// This will handle the router for all programs related operations 

import { createTRPCRouter, protectedProcedure, publicProcedure, coachProcedure } from "../trpc";
import { db } from "../../db";
import { z } from "zod";
import type { Prisma } from "../../../../generated/prisma";
import { TRPCError } from "@trpc/server";

export const programsRouter = createTRPCRouter({
    getPrograms: coachProcedure.query(async ({ ctx }) => {
        const programs = await db.program.findMany({
            where: { coachId: ctx.session.user.id },
        });
        return programs;
    }),
    getProgram: coachProcedure.input(z.object({
        id: z.string(),
    })).query(async ({ ctx, input }) => {
        const program = await db.program.findUnique({
            where: { id: input.id },
            include: { coach: true },
        });
        if (!program) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Program not found" });
        }
        if (program.coach.userId !== ctx.session.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only view your own programs" });
        }
        return program;
    }),
    createProgram: coachProcedure.input(z.object({
        name: z.string(),
        description: z.string(),
        price: z.number(),
        duration: z.number(),
        maxClients: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {    
        const coachProfile = await db.coachProfile.findUnique({
            where: { userId: ctx.session.user.id },
        });
        if (!coachProfile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found" });
        }
        const program = await db.program.create({
            data: {
                name: input.name,
                description: input.description,
                price: input.price,
                duration: input.duration,
                maxClients: input.maxClients,
                isActive: true,
                coachId: coachProfile.id,
            },
        });
        return program;
    }),
    updateProgram: coachProcedure.input(z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        price: z.number().optional(),
        duration: z.number().optional(),
        maxClients: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
        const program = await db.program.findUnique({
            where: { id: input.id },
            include: { coach: true },
        });
        if (!program) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Program not found" });
        }
        if (program.coach.userId !== ctx.session.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only update your own programs" });
        }
        const updatedProgram = await db.program.update({ 
            where: { id: input.id },
            data: input,
        });
        return updatedProgram;
    }),
    deleteProgram: coachProcedure.input(z.object({
        id: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const program = await db.program.findUnique({
            where: { id: input.id },
            include: { coach: true },
        });
        if (!program) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Program not found" });
        }
        if (program.coach.userId !== ctx.session.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own programs" });
        }
        const deletedProgram = await db.program.delete({
            where: { id: input.id },
        });
        return deletedProgram;
    }),
}); 

export type ProgramsRouter = typeof programsRouter;