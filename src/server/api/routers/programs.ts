// This will handle the router for all programs related operations 

import { createTRPCRouter, protectedProcedure, publicProcedure, coachProcedure } from "../trpc";
import { db } from "../../db";
import { z } from "zod";
import type { Prisma, ProductType } from "../../../../generated/prisma";
import { TRPCError } from "@trpc/server";
import { syncProductToStripe } from "../../stripe/sync";
import { SUPPORTED_CURRENCIES } from "../../stripe/client";

export const programsRouter = createTRPCRouter({
    getPrograms: coachProcedure.query(async ({ ctx }) => {
        const coachProfile = await db.coachProfile.findUnique({
            where: { userId: ctx.session.user.id },
        });
        if (!coachProfile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found" });
        }
        const programs = await db.program.findMany({
            where: { coachId: coachProfile.id },
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
        currency: z.string().refine(
            (val) => SUPPORTED_CURRENCIES.includes(val.toLowerCase() as any),
            { message: `Unsupported currency. Supported currencies: ${SUPPORTED_CURRENCIES.join(", ")}` }
        ).default("USD"),
    })).mutation(async ({ ctx, input }) => {    
        const coachProfile = await db.coachProfile.findUnique({
            where: { userId: ctx.session.user.id },
        });
        if (!coachProfile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found" });
        }
        
        // Create both Program and Product in a transaction
        const result = await db.$transaction(async (tx) => {
            // Create the product first
            const product = await tx.product.create({
                data: {
                    coachId: coachProfile.id,
                    name: input.name,
                    description: input.description,
                    priceCents: Math.round(input.price * 100), // Convert to cents
                    currency: input.currency,
                    type: "RECURRING" as ProductType,
                    isActive: true,
                },
            });
            
            // Sync product with Stripe
            const { stripeProductId, stripePriceId } = await syncProductToStripe(
                product.id,
                product.name,
                product.description,
                product.priceCents,
                product.currency,
                product.type,
            );
            
            // Update product with Stripe IDs
            const updatedProduct = await tx.product.update({
                where: { id: product.id },
                data: {
                    stripeProductId,
                    stripePriceId,
                },
            });
            
            // Create the program with the productId already set
            const program = await tx.program.create({
                data: {
                    name: input.name,
                    description: input.description,
                    price: input.price,
                    duration: input.duration,
                    maxClients: input.maxClients,
                    isActive: true,
                    coachId: coachProfile.id,
                    productId: updatedProduct.id,
                },
            });
            
            return { program, product: updatedProduct };
        });
        
        return result;
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
            include: { coach: true, product: true },
        });
        if (!program) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Program not found" });
        }
        if (program.coach.userId !== ctx.session.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only update your own programs" });
        }
        
        // Update program
        const updatedProgram = await db.program.update({ 
            where: { id: input.id },
            data: {
                name: input.name,
                description: input.description,
                price: input.price,
                duration: input.duration,
                maxClients: input.maxClients,
            },
        });
        
        // Update associated product if name, description, or price changed
        if (program.productId && program.product && (input.name !== undefined || input.description !== undefined || input.price !== undefined)) {
            const productUpdateData: {
                name?: string;
                description?: string;
                priceCents?: number;
                stripeProductId?: string;
                stripePriceId?: string;
            } = {};
            
            if (input.name !== undefined) productUpdateData.name = input.name;
            if (input.description !== undefined) productUpdateData.description = input.description;
            if (input.price !== undefined) productUpdateData.priceCents = Math.round(input.price * 100);
            
            const finalName = input.name ?? program.name;
            const finalDescription = input.description ?? program.description;
            const finalPriceCents = input.price !== undefined ? Math.round(input.price * 100) : program.product.priceCents;
            
            // Sync with Stripe
            const { stripeProductId, stripePriceId } = await syncProductToStripe(
                program.product.id,
                finalName,
                finalDescription,
                finalPriceCents,
                program.product.currency,
                program.product.type,
                program.product.stripeProductId,
                program.product.stripePriceId,
            );
            
            productUpdateData.stripeProductId = stripeProductId;
            productUpdateData.stripePriceId = stripePriceId;
            
            await db.product.update({
                where: { id: program.product.id },
                data: productUpdateData,
            });
        }
        
        return updatedProgram;
    }),
    archiveProgram: coachProcedure.input(z.object({
        id: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const program = await db.program.findUnique({
            where: { id: input.id },
            include: { coach: true, product: true },
        });
        if (!program) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Program not found" });
        }
        if (program.coach.userId !== ctx.session.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only archive your own programs" });
        }
        
        // Archive both program and its associated product in a transaction
        const result = await db.$transaction(async (tx) => {
            const archivedProgram = await tx.program.update({
                where: { id: input.id },
                data: { isActive: false },
            });
            
            // Also archive the associated product if it exists
            if (program.productId) {
                await tx.product.update({
                    where: { id: program.productId },
                    data: { isActive: false },
                });
            }
            
            return archivedProgram;
        });
        
        return result;
    }),

    unarchiveProgram: coachProcedure.input(z.object({
        id: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const program = await db.program.findUnique({
            where: { id: input.id },
            include: { coach: true, product: true },
        });
        if (!program) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Program not found" });
        }
        if (program.coach.userId !== ctx.session.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only unarchive your own programs" });
        }
        
        // Unarchive both program and its associated product in a transaction
        const result = await db.$transaction(async (tx) => {
            const unarchivedProgram = await tx.program.update({
                where: { id: input.id },
                data: { isActive: true },
            });
            
            // Also unarchive the associated product if it exists
            if (program.productId) {
                await tx.product.update({
                    where: { id: program.productId },
                    data: { isActive: true },
                });
            }
            
            return unarchivedProgram;
        });
        
        return result;
    }),
}); 

export type ProgramsRouter = typeof programsRouter;