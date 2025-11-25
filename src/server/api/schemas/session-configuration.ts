import { z } from "zod";
import { SessionType, RecurrenceFrequency } from "../../../../generated/prisma";

/**
 * Shared Zod schema for session configuration that matches SessionConfiguration type
 * from session-service.ts. This ensures consistency across all routers that accept
 * session configurations.
 */
export const sessionConfigurationSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    type: z.nativeEnum(SessionType).optional(),
    startsAt: z.date(),
    endsAt: z.date().optional(),
    timeZone: z.string().optional(),
    location: z.string().optional(),
    videoConferenceLink: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    coachNotes: z.string().optional(),
    // Optional recurrence rules - can provide either rruleString directly or structured fields
    recurrence: z.object({
        rruleString: z.string().optional(), // Direct rrule string
        // OR structured fields (converted to rruleString):
        frequency: z.nativeEnum(RecurrenceFrequency).optional(),
        interval: z.number().int().positive().optional(),
        weekdayMask: z.number().int().optional(),
        dayOfMonth: z.number().int().optional(),
        monthOfYear: z.number().int().optional(),
        endsAt: z.date().optional(), // when recurrence ends
        maxOccurrences: z.number().int().positive().optional(),
    }).optional(),
});

/**
 * Schema for an array of session configurations (optional)
 */
export const sessionConfigurationsSchema = z.array(sessionConfigurationSchema).optional();

