// Leads router

import { createTRPCRouter, protectedProcedure, publicProcedure, coachProcedure } from "../trpc";
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
	getLeads: coachProcedure.query(async ({ ctx }) => {
        // Get coach profile to verify ownership
        const coachProfile = await db.coachProfile.findUnique({
            where: { userId: ctx.session.user.id },
        });
        if (!coachProfile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found" });
        }
        const leads = await db.lead.findMany({
            where: { coachId: coachProfile.id },
        });
        return leads;
    }),
    getLead: coachProcedure.input(z.object({
        id: z.string(),
	})).query(async ({ ctx, input }) => {
        const lead = await db.lead.findUnique({
            where: { id: input.id },
            include: { coach: true },
        });
        if (!lead) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
        }
        // Verify ownership - coach can only view their own leads
        if (lead.coach.userId !== ctx.session.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only view your own leads" });
        }
        return lead;
    }),

    deleteLead: coachProcedure.input(z.object({
        id: z.string(),
	})).mutation(async ({ ctx, input }) => {
        const lead = await db.lead.findUnique({
            where: { id: input.id },
            include: { coach: true },
        });
        if (!lead) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
        }
        // Verify ownership
        if (lead.coach.userId !== ctx.session.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own leads" });
        }
        const deletedLead = await db.lead.delete({
            where: { id: input.id },
        });
        return deletedLead;
    }),
    updateLeadStatus: coachProcedure.input(z.object({
        id: z.string(),
        status: z.enum(["PENDING", "REVIEWED", "ACCEPTED", "REJECTED", "CONVERTED"]),
	})).mutation(async ({ ctx, input }) => {
        const lead = await db.lead.findUnique({
            where: { id: input.id },
            include: { coach: true },
        });
        if (!lead) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
        }
        // Verify ownership
        if (lead.coach.userId !== ctx.session.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only update your own leads" });
        }
        const updatedLead = await db.lead.update({
            where: { id: input.id },
            data: { status: input.status },
        });
        return updatedLead;
    }),
    convertLeadToClientProfile: coachProcedure.input(z.object({
        id: z.string(),
	})).mutation(async ({ ctx, input }) => {
        const lead = await db.lead.findUnique({
            where: { id: input.id },
            include: { coach: true },
        });
        if (!lead) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
        }
        // Verify ownership
        if (lead.coach.userId !== ctx.session.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only convert your own leads" });
        }
        const updatedLead = await db.lead.update({
            where: { id: input.id },
            data: { status: "CONVERTED" },
        });
        const user = await db.user.create({
            data: {
                email: lead.email,
                name: lead.name,
            },  
        });

		const customFields = (updatedLead.intakeSubmission ?? {}) as unknown as Record<string, unknown>;

		const clientProfile = await db.clientProfile.create({
			data: {
				userId: user.id,
				name: updatedLead.name,
				email: updatedLead.email,
				phone: updatedLead.phone ?? undefined,
				customFields: customFields as unknown as Prisma.InputJsonValue,
			},
		});
		return clientProfile;
    }),



});

export type LeadsRouter = typeof leadsRouter;   