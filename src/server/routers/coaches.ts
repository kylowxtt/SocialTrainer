// Coach route 

import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../api/trpc";
import { db } from "../db";

export const coachRouter = createTRPCRouter({
    getCoachProfile: protectedProcedure.query(async ({ ctx }) => {
        const coachProfile = await db.coachProfile.findUnique({
            where: { userId: ctx.session.user.id },
        });
        return coachProfile;
    }),

    createCoachProfile: protectedProcedure.input(z.object({
        bio: z.string(),
        specialties: z.array(z.string()),
        socialMediaLinks: z.object({
            instagram: z.string().optional(),
            tiktok: z.string().optional(),
            youtube: z.string().optional(),
        }),
        intakeFormSchema: z.object({}).catchall(z.any()).optional(),
    })).mutation(async ({ ctx, input }) => {
        const coachProfile = await db.coachProfile.create({
            data: {
                userId: ctx.session.user.id,
                bio: input.bio,
                specialties: input.specialties,
                socialMediaLinks: input.socialMediaLinks,
                intakeFormSchema: input.intakeFormSchema,
            },
        });
        return coachProfile;
    }),

    updateCoachProfile: protectedProcedure.input(z.object({
        bio: z.string().optional(),
        specialties: z.array(z.string()).optional(),
        socialMediaLinks: z.object({
            instagram: z.string().optional(),
            tiktok: z.string().optional(),
            youtube: z.string().optional(),
        }).optional(),
        intakeFormSchema: z.object({}).catchall(z.any()).optional(),
    })).mutation(async ({ ctx, input }) => {
        const coachProfile = await db.coachProfile.update({
            where: { userId: ctx.session.user.id },
            data: input,
        });
        return coachProfile;
    }),
});

export type CoachRouter = typeof coachRouter;
