import type {
    Prisma,
    SessionStatus as SessionStatusEnum,
    SessionType as SessionTypeEnum,
    RecurrenceFrequency,
} from "../../../generated/prisma";
import { SessionStatus, SessionType } from "../../../generated/prisma";
import { db } from "../db";
import { createRRuleFromSeries, generateRRuleString } from "../utils/rrule-converter";

type SessionParticipantsInput = Prisma.SessionParticipantCreateManySessionInput[];

type SessionSourceRefs = {
    programId?: string;
    productId?: string;
    orderId?: string;
    leadId?: string;
    clientProfileId?: string;
    coachingRelationshipId?: string;
    enrollmentId?: string;
    cohortId?: string;
};

type BaseSessionInput = {
    coachId: string;
    title: string;
    startsAt: Date;
    endsAt?: Date;
    timeZone?: string;
    description?: string;
    type?: SessionTypeEnum;
    status?: SessionStatusEnum;
    location?: string;
    videoConferenceLink?: string;
    metadata?: Prisma.InputJsonValue;
    coachNotes?: string;
};

type CreateSessionInput = BaseSessionInput &
    SessionSourceRefs & {
        participants?: SessionParticipantsInput;
    };

type PrismaClientLike = Omit<Prisma.TransactionClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

async function createSession(
    input: CreateSessionInput,
    tx?: PrismaClientLike
) {
    const { participants, ...sessionData } = input;

    const execute = async (client: PrismaClientLike) => {
        const session = await client.schedulingSession.create({
            data: {
                ...sessionData,
            },
        });

        if (participants?.length) {
            await client.sessionParticipant.createMany({
                data: participants.map((participant) => ({
                    ...participant,
                    sessionId: session.id,
                })),
            });
        }

        return session;
    };

    if (tx) {
        return execute(tx);
    }

    return await db.$transaction(async (transactionClient) => {
        return execute(transactionClient);
    });
}

async function cancelSession(id: string, coachId: string) {
    const session = await db.schedulingSession.findUnique({
        where: { id },
        include: { coach: true },
    });
    if (!session) {
        throw new Error("Session not found");
    }
    if (session.coachId !== coachId) {
        throw new Error("You are not authorized to cancel this session");
    }
    return await db.schedulingSession.update({
        where: { id },
        data: { status: SessionStatus.CANCELED },
    });
}

type CreateRecurringSessionInput = BaseSessionInput &
    SessionSourceRefs & {
        recurrenceSeriesId: string;
    };


type CreateProgramSessionInput = BaseSessionInput &
    SessionSourceRefs & {
        programId: string;
    };

async function createProgramSession(input: CreateProgramSessionInput) {
    return await createSession({
        ...input,
    });
}

type CreateCoachingCallInput = BaseSessionInput &
    SessionSourceRefs & {
        coachingRelationshipId: string;
        clientProfileId?: string;
    };

async function createCoachingCall(input: CreateCoachingCallInput) {
    return await createSession({
        ...input,
    });
}

type CreateCohortEventInput = BaseSessionInput &
    SessionSourceRefs & {
        programId: string;
    };

async function createCohortEvent(input: CreateCohortEventInput) {
    return await createSession({
        ...input,
        type: input.type ?? SessionType.COHORT_EVENT,
    });
}

// Unified session configuration - can be one-off or recurring
export type SessionConfiguration = {
    // Base session data
    title: string;
    description?: string;
    type?: SessionTypeEnum;
    startsAt: Date;
    endsAt?: Date;
    timeZone?: string;
    location?: string;
    videoConferenceLink?: string;
    metadata?: Prisma.InputJsonValue;
    coachNotes?: string;
    participants?: SessionParticipantsInput;
    
    // Recurrence rules (if provided, creates RecurrenceSeries)
    // Can provide either rruleString directly or structured fields (which will be converted to rruleString)
    recurrence?: {
        rruleString?: string; // Direct rrule string
        // OR structured fields (converted to rruleString):
        frequency?: RecurrenceFrequency;
        interval?: number; // default 1
        weekdayMask?: number; // bitmask for days of week
        dayOfMonth?: number;
        monthOfYear?: number;
        endsAt?: Date; // when recurrence ends
        maxOccurrences?: number; // max number of sessions to generate
    };
};

// Create a recurrence series and materialize the first session
async function createRecurrenceSeries(
    input: BaseSessionInput & SessionSourceRefs & {
        recurrence: {
            rruleString?: string;
            frequency?: RecurrenceFrequency;
            interval?: number;
            weekdayMask?: number;
            dayOfMonth?: number;
            monthOfYear?: number;
            endsAt?: Date;
            maxOccurrences?: number;
        };
        participants?: SessionParticipantsInput;
    },
    tx?: PrismaClientLike
) {
    const { recurrence, participants, ...sessionData } = input;
    
    // Generate rrule string - use provided rruleString or convert from structured fields
    let rruleString: string;
    if (recurrence.rruleString) {
        rruleString = recurrence.rruleString;
    } else if (recurrence.frequency) {
        rruleString = generateRRuleString({
            frequency: recurrence.frequency,
            interval: recurrence.interval,
            weekdayMask: recurrence.weekdayMask,
            dayOfMonth: recurrence.dayOfMonth,
            monthOfYear: recurrence.monthOfYear,
            startsAt: sessionData.startsAt,
            endsAt: recurrence.endsAt,
            maxOccurrences: recurrence.maxOccurrences,
            timeZone: sessionData.timeZone,
        });
    } else {
        throw new Error("Recurrence must provide either rruleString or frequency");
    }
    
    const execute = async (client: PrismaClientLike) => {
        // Create the recurrence series
        const series = await client.recurrenceSeries.create({
            data: {
                coachId: sessionData.coachId,
                programId: sessionData.programId,
                productId: sessionData.productId,
                coachingRelationshipId: sessionData.coachingRelationshipId,
                cohortId: sessionData.cohortId ?? null,
                title: sessionData.title,
                description: sessionData.description,
                timeZone: sessionData.timeZone ?? "UTC",
                startsAt: sessionData.startsAt,
                rruleString: rruleString,
            },
        });
        
        // Materialize the first session from the series
        const firstSession = await client.schedulingSession.create({
            data: {
                ...sessionData,
                recurrenceSeriesId: series.id,
            },
        });
        
        // Add participants if provided
        if (participants?.length) {
            await client.sessionParticipant.createMany({
                data: participants.map((participant) => ({
                    ...participant,
                    sessionId: firstSession.id,
                })),
            });
        }
        
        return { series, firstSession };
    };

    if (tx) {
        return execute(tx);
    }

    return await db.$transaction(async (transactionClient) => {
        return execute(transactionClient);
    });
}

// Create multiple sessions from configurations (one-off or recurring)
async function createSessionsFromConfigurations(
    configurations: SessionConfiguration[],
    sourceRefs: SessionSourceRefs & { coachId: string },
    tx?: PrismaClientLike
) {
    const execute = async (client: PrismaClientLike) => {
        const createdSessions: any[] = [];
        const createdSeries: any[] = [];
        
        for (const config of configurations) {
            const sessionData: CreateSessionInput = {
                ...sourceRefs,
                title: config.title,
                description: config.description,
                type: config.type,
                startsAt: config.startsAt,
                endsAt: config.endsAt,
                timeZone: config.timeZone,
                location: config.location,
                videoConferenceLink: config.videoConferenceLink,
                metadata: config.metadata,
                coachNotes: config.coachNotes,
                participants: config.participants,
            };
            
            if (config.recurrence) {
                // Create recurring session via RecurrenceSeries
                const { series, firstSession } = await createRecurrenceSeries({
                    ...sessionData,
                    recurrence: config.recurrence,
                    participants: config.participants,
                }, client);
                createdSeries.push(series);
                createdSessions.push(firstSession);
            } else {
                // Create one-off session
                const session = await createSession(sessionData, client);
                createdSessions.push(session);
            }
        }
        
        return { sessions: createdSessions, series: createdSeries };
    };

    if (tx) {
        return execute(tx);
    }

    return await db.$transaction(async (transactionClient) => {
        return execute(transactionClient);
    });
}

// Materialize future sessions from a recurrence series (for cron job or manual trigger)
async function materializeSessionsFromSeries(
    seriesId: string,
    upToDate?: Date
) {
    const series = await db.recurrenceSeries.findUnique({
        where: { id: seriesId },
        include: { schedulingSessions: true },
    });
    
    if (!series) {
        throw new Error("Recurrence series not found");
    }
    
    // Calculate next occurrences based on recurrence rules using rrule
    const nextOccurrences = calculateNextOccurrences(
        series,
        upToDate ?? new Date()
    );
    
    if (nextOccurrences.length === 0) {
        return [];
    }
    
    // Get existing session dates to avoid duplicates
    const existingDates = new Set(
        series.schedulingSessions.map(s => 
            s.startsAt.toISOString().split('T')[0] // Date part only for comparison
        )
    );
    
    // Filter out dates that already have sessions
    const newOccurrences = nextOccurrences.filter(occurrence => {
        const dateStr = occurrence.toISOString().split('T')[0];
        return !existingDates.has(dateStr);
    });
    
    if (newOccurrences.length === 0) {
        return [];
    }
    
    // Calculate duration for each session (use endsAt if available, otherwise estimate)
    const baseDuration = series.schedulingSessions[0]?.endsAt 
        ? new Date(series.schedulingSessions[0].endsAt).getTime() - 
          new Date(series.schedulingSessions[0].startsAt).getTime()
        : 60 * 60 * 1000; // Default 1 hour
    
    const sessions = await db.$transaction(async (tx) => {
        return Promise.all(
            newOccurrences.map((occurrence) => {
                const endsAt = new Date(occurrence.getTime() + baseDuration);
                return tx.schedulingSession.create({
                    data: {
                        coachId: series.coachId,
                        programId: series.programId,
                        productId: series.productId,
                        coachingRelationshipId: series.coachingRelationshipId,
                        title: series.title,
                        description: series.description,
                        type: SessionType.OTHER,
                        startsAt: occurrence,
                        endsAt: endsAt,
                        timeZone: series.timeZone,
                        recurrenceSeriesId: series.id,
                    },
                });
            })
        );
    });
    
    return sessions;
}

// Helper function to calculate next occurrences using rrule
function calculateNextOccurrences(
    series: {
        rruleString: string | null;
        startsAt: Date;
        schedulingSessions: { startsAt: Date }[];
    },
    upToDate: Date
): Date[] {
    if (!series.rruleString) {
        throw new Error("Recurrence series must have rruleString");
    }
    // Find the last materialized session date, or use series start date
    const lastSessionDate = series.schedulingSessions.length > 0
        ? new Date(Math.max(...series.schedulingSessions.map(s => s.startsAt.getTime())))
        : series.startsAt;
    
    // Start generating from the day after the last session
    const startDate = new Date(lastSessionDate);
    startDate.setDate(startDate.getDate() + 1);
    startDate.setHours(0, 0, 0, 0);
    
    // Determine the end date for generation
    const endDate = upToDate;
    
    // If startDate is already past endDate, return empty
    if (startDate > endDate) {
        return [];
    }
    
    // Create RRule from series rruleString
    const rrule = createRRuleFromSeries({
        rruleString: series.rruleString,
        startsAt: series.startsAt,
    });
    
    // Generate occurrences between startDate and endDate
    // Use between() to get occurrences in the range
    const occurrences = rrule.between(startDate, endDate, true);
    
    return occurrences;
}

export const sessionService = {
    createSession,
    createProgramSession,
    createCoachingCall,
    createCohortEvent,
    cancelSession,
    createRecurrenceSeries,
    createSessionsFromConfigurations,
    materializeSessionsFromSeries,
};

