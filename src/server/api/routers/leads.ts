// Leads router

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { db } from "../../db";
import { z } from "zod";
import type { Prisma } from "../../../../generated/prisma";
import { TRPCError } from "@trpc/server";

export const leadsRouter = createTRPCRouter({
	// Core contact info is captured as explicit columns on Lead.
	// Additional coach-defined intake answers are stored as JSON custom fields.
	createLeadForCoach: publicProcedure.input(z.object({
		name: z.string(),
		email: z.string().email(),
		phone: z.string().optional(),
		coachId: z.string(),
		intakeSchemaId: z.string().min(1).optional(),
		intakeSchemaVersion: z.number().int().positive().optional(),
		customFields: z.record(z.string(), z.any()).optional(),
	})).mutation(async ({ input }) => {
        const existingLead = await db.lead.findFirst({
            where: { 
                email: input.email,
                coachId: input.coachId,
            },
            include: {
                coach: true,
                clientProfile: true,
            },
        });
        if (existingLead) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Lead already exists for this coach" });
        }
		const leadData: Prisma.LeadUncheckedCreateInput = {
			name: input.name,
			email: input.email,
			phone: input.phone ?? null,
			coachId: input.coachId,
			intakeSubmission: (input.customFields ?? null) as Prisma.InputJsonValue,
			intakeSchemaId: input.intakeSchemaId ?? null,
			intakeSchemaVersion: input.intakeSchemaVersion ?? null,
		};

        const lead = await db.lead.create({
            data: leadData,
        });
        return lead;
    }),
	getLeads: protectedProcedure.query(async ({ ctx }) => {
        const leads = await db.lead.findMany({
            where: { coachId: ctx.session.user.id },
        });
        return leads;
    }),
    getLead: protectedProcedure.input(z.object({
        id: z.string(),
	})).query(async ({ input }) => {
        const lead = await db.lead.findUnique({
            where: { id: input.id },
        });
        return lead;
    }),

    deleteLead: protectedProcedure.input(z.object({
        id: z.string(),
	})).mutation(async ({ input }) => {
        const lead = await db.lead.delete({
            where: { id: input.id },
        });
        return lead;
    }),
    updateLeadStatus: protectedProcedure.input(z.object({
        id: z.string(),
        status: z.enum(["PENDING", "REVIEWED", "ACCEPTED", "REJECTED", "CONVERTED"]),
	})).mutation(async ({ input }) => {
        const lead = await db.lead.update({
            where: { id: input.id },
            data: { status: input.status },
        });
        return lead;
    }),
    convertLeadToClientProfile: protectedProcedure.input(z.object({
        id: z.string(),
	})).mutation(async ({ input }) => {
        const lead = await db.lead.update({
            where: { id: input.id },
            data: { status: "CONVERTED" },
        });
        const user = await db.user.create({
            data: {
                email: lead.email,
                name: lead.name,
            },  
        });

		const customFields = (lead.intakeSubmission ?? {}) as unknown as Record<string, unknown>;

		const clientProfile = await db.clientProfile.create({
			data: {
				userId: user.id,
				name: lead.name,
				email: lead.email,
				phone: lead.phone ?? undefined,
				customFields: customFields as unknown as Prisma.InputJsonValue,
			},
		});
		return clientProfile;
    }),



});

export type LeadsRouter = typeof leadsRouter;   