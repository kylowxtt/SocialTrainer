import { RRule, Frequency } from "rrule";
import type { Options } from "rrule";
import type { RecurrenceFrequency } from "../../../generated/prisma";

/**
 * Maps RecurrenceFrequency enum to rrule Frequency constants
 */
function mapFrequencyToRRule(frequency: RecurrenceFrequency): Frequency {
    switch (frequency) {
        case "DAILY":
            return RRule.DAILY;
        case "WEEKLY":
            return RRule.WEEKLY;
        case "MONTHLY":
            return RRule.MONTHLY;
        case "YEARLY":
            return RRule.YEARLY;
        default:
            throw new Error(`Unknown frequency: ${frequency}`);
    }
}

/**
 * Converts weekday bitmask to rrule byweekday array
 * Bitmask: 1=Sunday, 2=Monday, 4=Tuesday, 8=Wednesday, 16=Thursday, 32=Friday, 64=Saturday
 */
function weekdayMaskToByWeekday(weekdayMask: number | null | undefined): number[] | undefined {
    if (!weekdayMask) return undefined;
    
    const weekdays: number[] = [];
    // rrule uses 0=Monday, 1=Tuesday, ..., 6=Sunday
    // Our bitmask uses: 1=Sunday, 2=Monday, 4=Tuesday, 8=Wednesday, 16=Thursday, 32=Friday, 64=Saturday
    const mapping: Record<number, number> = {
        1: 6,   // Sunday -> 6
        2: 0,   // Monday -> 0
        4: 1,   // Tuesday -> 1
        8: 2,   // Wednesday -> 2
        16: 3,  // Thursday -> 3
        32: 4,  // Friday -> 4
        64: 5,  // Saturday -> 5
    };
    
    for (const [bit, rruleDay] of Object.entries(mapping)) {
        const bitValue = Number.parseInt(bit, 10);
        if (weekdayMask & bitValue) {
            weekdays.push(rruleDay);
        }
    }
    
    return weekdays.length > 0 ? weekdays : undefined;
}

/**
 * Converts structured recurrence fields to rrule string
 * This is a convenience function for API endpoints that accept structured input
 */
export function generateRRuleString(params: {
    frequency: RecurrenceFrequency;
    interval?: number | null;
    weekdayMask?: number | null;
    dayOfMonth?: number | null;
    monthOfYear?: number | null;
    startsAt: Date;
    endsAt?: Date | null;
    maxOccurrences?: number | null;
    timeZone?: string;
}): string {
    const options: Partial<Options> = {
        freq: mapFrequencyToRRule(params.frequency),
        interval: params.interval ?? 1,
        dtstart: params.startsAt,
    };
    
    // Add byweekday if weekdayMask is provided
    const byweekday = weekdayMaskToByWeekday(params.weekdayMask);
    if (byweekday) {
        options.byweekday = byweekday;
    }
    
    // Add bymonthday if dayOfMonth is provided
    if (params.dayOfMonth) {
        options.bymonthday = params.dayOfMonth;
    }
    
    // Add bymonth if monthOfYear is provided
    if (params.monthOfYear) {
        options.bymonth = params.monthOfYear;
    }
    
    // Add until if endsAt is provided
    if (params.endsAt) {
        options.until = params.endsAt;
    }
    
    // Add count if maxOccurrences is provided
    if (params.maxOccurrences) {
        options.count = params.maxOccurrences;
    }
    
    const rrule = new RRule(options);
    return rrule.toString();
}

/**
 * Creates an RRule object from a RecurrenceSeries rruleString
 */
export function createRRuleFromSeries(series: {
    rruleString: string;
    startsAt: Date;
}): RRule {
    return RRule.fromString(series.rruleString);
}

