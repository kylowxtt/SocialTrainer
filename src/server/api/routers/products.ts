// Products router - based per coach and will tie in heavily with the Stripe API

import { createTRPCRouter, protectedProcedure, publicProcedure, coachProcedure } from "../trpc";
import { db } from "../../db";
import { z } from "zod";
import type { Prisma, ProductType } from "../../../../generated/prisma";
import { TRPCError } from "@trpc/server";

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
        currency: z.string(),
        type: z.enum(["ONE_OFF", "RECURRING"]),
    })).mutation(async ({ ctx, input }) => {
        // Get coach profile to verify ownership
        const coachProfile = await db.coachProfile.findUnique({
            where: { userId: ctx.session.user.id },
        });
        if (!coachProfile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found" });
        }
        const product = await db.product.create({
            data: {
                coachId: coachProfile.id,
                name: input.name,
                description: input.description,
                priceCents: input.price,
                currency: input.currency,
                type: input.type as ProductType,
            },
        });
        return product;
    }),
    updateProduct: coachProcedure.input(z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        price: z.number().optional(),
        currency: z.string().optional(),
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
        const updatedProduct = await db.product.update({
            where: { id },
            data: updateData,
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
