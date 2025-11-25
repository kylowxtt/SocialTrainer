import { db } from "../db";
import { sessionService } from "./session-service";

/**
 * Configuration for materialization buffer
 * Default: materialize sessions 60 days in advance
 */
const MATERIALIZATION_BUFFER_DAYS = 60;

/**
 * Materialize all active recurrence series up to the buffer period
 * This should be called periodically (e.g., daily via cron job)
 */
export async function materializeAllActiveSeries(bufferDays: number = MATERIALIZATION_BUFFER_DAYS) {
    const bufferDate = new Date();
    bufferDate.setDate(bufferDate.getDate() + bufferDays);
    
    // Find all recurrence series that need materialization
    // Note: rruleString contains the end date information, so we'll let rrule handle filtering
    const activeSeries = await db.recurrenceSeries.findMany({
        where: {
            // Series that have started (or will start soon)
            startsAt: { lte: bufferDate },
        },
        include: {
            schedulingSessions: {
                orderBy: { startsAt: "desc" },
                take: 1, // Only need the last session
            },
        },
    });
    
    const results = {
        processed: 0,
        materialized: 0,
        errors: [] as Array<{ seriesId: string; error: string }>,
    };
    
    for (const series of activeSeries) {
        try {
            // Check if we need to materialize more sessions
            const lastSession = series.schedulingSessions[0];
            const lastSessionDate = lastSession 
                ? new Date(lastSession.startsAt)
                : new Date(series.startsAt);
            
            // Calculate if we need to materialize (last session is before buffer period)
            const daysUntilBuffer = Math.ceil(
                (bufferDate.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            
            // Only materialize if we're within the buffer period
            if (daysUntilBuffer > 0) {
                const sessions = await sessionService.materializeSessionsFromSeries(
                    series.id,
                    bufferDate
                );
                
                results.materialized += sessions.length;
            }
            
            results.processed++;
        } catch (error) {
            results.errors.push({
                seriesId: series.id,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    
    return results;
}

/**
 * Materialize sessions for a specific series up to the buffer period
 */
export async function materializeSeriesUpToBuffer(
    seriesId: string,
    bufferDays: number = MATERIALIZATION_BUFFER_DAYS
) {
    const bufferDate = new Date();
    bufferDate.setDate(bufferDate.getDate() + bufferDays);
    
    const sessions = await sessionService.materializeSessionsFromSeries(
        seriesId,
        bufferDate
    );
    
    return {
        seriesId,
        materialized: sessions.length,
        sessions,
    };
}

export const recurrenceJobService = {
    materializeAllActiveSeries,
    materializeSeriesUpToBuffer,
};

