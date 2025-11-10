// Products router - based per coach and will tie in heavily with the Stripe API

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { db } from "../../db";
import { z } from "zod";
import type { Prisma, ProductType } from "../../../../generated/prisma";

export const productsRouter = createTRPCRouter({
    getProducts: protectedProcedure.query(async ({ ctx }) => {
        const products = await db.product.findMany({
            where: { coachId: ctx.session.user.id },
        });
        return products;
    }),
    getProduct: protectedProcedure.input(z.object({
        id: z.string(),
    })).query(async ({ ctx, input }) => {
        const product = await db.product.findUnique({
            where: { id: input.id, coachId: ctx.session.user.id },
        });
        return product;
    }),
    createProduct: protectedProcedure.input(z.object({
        name: z.string(),
        description: z.string(),
        price: z.number(),
        currency: z.string(),
        type: z.enum(["ONE_OFF", "RECURRING"]),
    })).mutation(async ({ ctx, input }) => {
        const product = await db.product.create({
            data: {
                coach: { connect: { userId: ctx.session.user.id } },
                name: input.name,
                description: input.description,
                priceCents: input.price,
                currency: input.currency,
                type: input.type as ProductType,
            } satisfies Prisma.ProductCreateInput,
        });
        return product;
    }),
    updateProduct: protectedProcedure.input(z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        price: z.number().optional(),
        currency: z.string().optional(),
        type: z.enum(["ONE_OFF", "RECURRING"]).optional(),
    })).mutation(async ({ ctx, input }) => {
        const product = await db.product.update({
            where: { id: input.id, coachId: ctx.session.user.id },
            data: input,
        });
        return product;
    }),
    deleteProduct: protectedProcedure.input(z.object({
        id: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const product = await db.product.delete({
            where: { id: input.id, coachId: ctx.session.user.id },
        });
        return product;
    }),
});
