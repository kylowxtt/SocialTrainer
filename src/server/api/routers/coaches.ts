import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { db } from "../../db";
import type { Prisma } from "../../../../generated/prisma";

const intakeFormSchemaInput = z.object({
    schemaId: z.string().min(1),
    version: z.number().int().positive(),
}).passthrough();

export const coachRouter = createTRPCRouter({
    getCoachProfile: protectedProcedure.query(async ({ ctx }) => {
        const coachProfile = await db.coachProfile.findUnique({
            where: { userId: ctx.session.user.id },
        });
        return coachProfile;
    }),
    getCoachProfileBySlug: publicProcedure.input(z.object({
        slug: z.string(),
    })).query(async ({ input }) => {
        const coachProfile = await db.coachProfile.findUnique({
            where: { publicSlug: input.slug },
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
        intakeFormSchema: intakeFormSchemaInput.optional(),
    })).mutation(async ({ ctx, input }) => {
        const { intakeFormSchema, ...profileData } = input;

        const data: Prisma.CoachProfileUncheckedCreateInput = {
            userId: ctx.session.user.id,
            bio: profileData.bio,
            specialties: profileData.specialties,
            socialMediaLinks: profileData.socialMediaLinks as Prisma.InputJsonValue,
            intakeFormSchema: (intakeFormSchema ?? null) as Prisma.InputJsonValue,
            intakeFormSchemaId: intakeFormSchema?.schemaId ?? null,
            intakeFormSchemaVersion: intakeFormSchema?.version ?? null,
        };

        const coachProfile = await db.coachProfile.create({
            data,
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
    })).mutation(async ({ ctx, input }) => {
        const coachProfile = await db.coachProfile.update({
            where: { userId: ctx.session.user.id },
            data: input as Prisma.CoachProfileUncheckedUpdateInput,
        });
        return coachProfile;
    }),
    getIntakeFormSchema: protectedProcedure.query(async ({ ctx }) => {
        const coachProfile = await db.coachProfile.findFirst({
            where: { userId: ctx.session.user.id },
            orderBy: [{ intakeFormSchemaVersion: "desc" }],
            select: { intakeFormSchema: true },
        });
        return coachProfile?.intakeFormSchema as Prisma.InputJsonValue;
    }),
    publishIntakeFormSchema: protectedProcedure.input(z.object({
        schema: intakeFormSchemaInput,
    })).mutation(async ({ ctx, input }) => {
        const coachProfile = await db.coachProfile.update({
            where: { userId: ctx.session.user.id },
            data: { intakeFormSchema: input.schema as Prisma.InputJsonValue },
        });
        return coachProfile;
    }),    
});

export type CoachRouter = typeof coachRouter;