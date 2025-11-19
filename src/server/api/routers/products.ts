// Products router - based per coach and will tie in heavily with the Stripe API

import { createTRPCRouter, protectedProcedure, publicProcedure, coachProcedure } from "../trpc";
import { db } from "../../db";
import { z } from "zod";
import type { Prisma, ProductType } from "../../../../generated/prisma";
import { TRPCError } from "@trpc/server";
import { syncProductToStripe } from "../../stripe/sync";
import { SUPPORTED_CURRENCIES } from "../../stripe/client";

export const productsRouter = createTRPCRouter({
    getProducts: coachProcedure.query(async ({ ctx }) => {
        // Get coach profile to verify ownership
        const coachProfile = await db.coachProfile.findUnique({
            where: { userId: ctx.session.user.id },
        });
        if (!coachProfile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found" });
        }
        const products = await db.product.findMany({
            where: { coachId: coachProfile.id },
        });
        return products;
    }),
    getProductsByCoachSlug: publicProcedure.input(z.object({
        slug: z.string(),
    })).query(async ({ input }) => {
        const products = await db.product.findMany({
            where: { coach: { publicSlug: input.slug }, isActive: true },
        });
        return products;
    }),
    getProduct: coachProcedure.input(z.object({
        id: z.string(),
    })).query(async ({ ctx, input }) => {
        const product = await db.product.findUnique({
            where: { id: input.id },
            include: { coach: true },
        });
        if (!product) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        }
        // Verify ownership
        if (product.coach.userId !== ctx.session.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only view your own products" });
        }
        return product;
    }),
    createProduct: coachProcedure.input(z.object({
        name: z.string(),
        description: z.string(),
        price: z.number(),
        currency: z.string().refine(
            (val) => SUPPORTED_CURRENCIES.includes(val.toLowerCase() as any),
            { message: `Unsupported currency. Supported currencies: ${SUPPORTED_CURRENCIES.join(", ")}` }
        ),
        type: z.enum(["ONE_OFF", "RECURRING"]),
    })).mutation(async ({ ctx, input }) => {
        // Get coach profile to verify ownership
        const coachProfile = await db.coachProfile.findUnique({
            where: { userId: ctx.session.user.id },
        });
        if (!coachProfile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found" });
        }
        
        // Convert price to cents
        const priceCents = Math.round(input.price * 100);
        
        // Create product and sync with Stripe in a transaction
        const product = await db.$transaction(async (tx) => {
            // First create the product record
            const product = await tx.product.create({
                data: {
                    coachId: coachProfile.id,
                    name: input.name,
                    description: input.description,
                    priceCents,
                    currency: input.currency,
                    type: input.type as ProductType,
                },
            });
            
            // Sync with Stripe
            const { stripeProductId, stripePriceId } = await syncProductToStripe(
                product.id,
                product.name,
                product.description,
                product.priceCents,
                product.currency,
                product.type,
            );
            
            // Update product with Stripe IDs
            return await tx.product.update({
                where: { id: product.id },
                data: {
                    stripeProductId,
                    stripePriceId,
                },
            });
        });
        
        return product;
    }),
    updateProduct: coachProcedure.input(z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        price: z.number().optional(),
        currency: z.string().refine(
            (val) => !val || SUPPORTED_CURRENCIES.includes(val.toLowerCase() as any),
            { message: `Unsupported currency. Supported currencies: ${SUPPORTED_CURRENCIES.join(", ")}` }
        ).optional(),
        type: z.enum(["ONE_OFF", "RECURRING"]).optional(),
    })).mutation(async ({ ctx, input }) => {
        const { id, ...updateData } = input;
        const product = await db.product.findUnique({
            where: { id },
            include: { coach: true },
        });
        if (!product) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        }
        // Verify ownership
        if (product.coach.userId !== ctx.session.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only update your own products" });
        }
        
        // Prepare update data
        const dbUpdateData: {
            name?: string;
            description?: string;
            priceCents?: number;
            currency?: string;
            type?: ProductType;
            stripeProductId?: string;
            stripePriceId?: string;
        } = {};
        
        if (updateData.name !== undefined) dbUpdateData.name = updateData.name;
        if (updateData.description !== undefined) dbUpdateData.description = updateData.description;
        if (updateData.currency !== undefined) dbUpdateData.currency = updateData.currency;
        if (updateData.type !== undefined) dbUpdateData.type = updateData.type as ProductType;
        if (updateData.price !== undefined) dbUpdateData.priceCents = Math.round(updateData.price * 100);
        
        // Determine final values for Stripe sync
        const finalName = updateData.name ?? product.name;
        const finalDescription = updateData.description ?? product.description;
        const finalPriceCents = updateData.price !== undefined ? Math.round(updateData.price * 100) : product.priceCents;
        const finalCurrency = updateData.currency ?? product.currency;
        const finalType = (updateData.type as ProductType | undefined) ?? product.type;
        
        // Sync with Stripe if price, currency, or type changed
        const needsStripeSync = 
            updateData.price !== undefined ||
            updateData.currency !== undefined ||
            updateData.type !== undefined ||
            updateData.name !== undefined ||
            updateData.description !== undefined;
        
        if (needsStripeSync) {
            const { stripeProductId, stripePriceId } = await syncProductToStripe(
                product.id,
                finalName,
                finalDescription,
                finalPriceCents,
                finalCurrency,
                finalType,
                product.stripeProductId,
                product.stripePriceId,
            );
            dbUpdateData.stripeProductId = stripeProductId;
            dbUpdateData.stripePriceId = stripePriceId;
        }
        
        const updatedProduct = await db.product.update({
            where: { id },
            data: dbUpdateData,
        });
        return updatedProduct;
    }),
    deleteProduct: coachProcedure.input(z.object({
        id: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const product = await db.product.findUnique({
            where: { id: input.id },
            include: { coach: true },
        });
        if (!product) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        }
        // Verify ownership
        if (product.coach.userId !== ctx.session.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own products" });
        }
        const deletedProduct = await db.product.delete({
            where: { id: input.id },
        });
        return deletedProduct;
    }),
    archiveProduct: coachProcedure.input(z.object({
        id: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const product = await db.product.findUnique({
            where: { id: input.id },
            include: { coach: true },
        });
        if (!product) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        }
        // Verify ownership
        if (product.coach.userId !== ctx.session.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only archive your own products" });
        }
        const archivedProduct = await db.product.update({
            where: { id: input.id },
            data: { isActive: false },
        });
        return archivedProduct;
    }),

    unarchiveProduct: coachProcedure.input(z.object({
        id: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const product = await db.product.findUnique({
            where: { id: input.id },
            include: { coach: true },
        });
        if (!product) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        }
        // Verify ownership
        if (product.coach.userId !== ctx.session.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only unarchive your own products" });
        }
        const unarchivedProduct = await db.product.update({
            where: { id: input.id },
            data: { isActive: true },
        });
        return unarchivedProduct;
    }),
});
