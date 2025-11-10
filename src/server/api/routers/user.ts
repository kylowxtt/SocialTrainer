import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { db } from "../../db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const userRouter = createTRPCRouter({
    getUserProfile: protectedProcedure.query(async ({ ctx }) => {
        const userProfile = await db.user.findUnique({
            where: { id: ctx.session.user.id },
        });
        return userProfile;
    }),

    becomeCoach: protectedProcedure.input(z.object({
        bio: z.string(),
        specialties: z.array(z.string()),
        socialMediaLinks: z.object({
            instagram: z.string().optional(),
            tiktok: z.string().optional(),
            youtube: z.string().optional(),
        }),
    })).mutation(async ({ ctx, input }) => {
        const user = await db.user.findUnique({
            where: { id: ctx.session.user.id },
        });
        if (!user) {
            throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }
        await db.user.update({
            where: { id: ctx.session.user.id },
            data: { role: "COACH" },
        });
        const coachProfile = await db.coachProfile.create({
            data: {
                userId: ctx.session.user.id,
                bio: input.bio,
                specialties: input.specialties,
                socialMediaLinks: input.socialMediaLinks,
            },
        });
        return coachProfile;
    }),

    becomeClient: protectedProcedure.input(z.object({
        // We collect client information and coach-defined customFields (flexible structure)
        contactInfo: z.object({
            name: z.string(),
            email: z.string().email(),
            phone: z.string().optional(),
        }),
        customFields: z.record(z.string(), z.any()).optional(), // dynamic fields defined by coach
    })).mutation(async ({ ctx, input }) => {
        const user = await db.user.findUnique({
            where: { id: ctx.session.user.id },
        });
        if (!user) {
            throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }
        await db.user.update({
            where: { id: ctx.session.user.id },
            data: { role: "CLIENT" },
        });
        const clientProfile = await db.clientProfile.create({
            data: {
                userId: ctx.session.user.id,
                name: input.contactInfo.name,
                email: input.contactInfo.email,
                phone: input.contactInfo.phone,
                customFields: input.customFields,   
            },
        });
        return clientProfile;
    }),

});

export type UserRouter = typeof userRouter;