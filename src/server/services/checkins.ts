import { RRule, type Options, type Weekday } from "rrule";
import type { Prisma, CheckInTemplate } from "../../../generated/prisma";
import {
    CheckInCadenceType,
    CheckInEntryType,
    CheckInInstanceStatus,
    EnrollmentStatus,
    type RecurrenceFrequency,
} from "../../../generated/prisma";
import { db } from "../db";

type CadenceRuleConfig = {
    rruleString?: string;
    frequency?: RecurrenceFrequency | null;
    interval?: number | null;
    weekdays?: Array<string | number> | null;
    dayOfMonth?: number | null;
    monthOfYear?: number | null;
    endsAt?: string | Date | null;
    maxOccurrences?: number | null;
    anchorDate?: string | Date | null;
};

type ClientScope = {
    clientId: string;
    programId?: string | null;
    enrollmentId?: string | null;
    coachingRelationshipId?: string | null;
};

type OccurrenceOptions = {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
};

type MaterializeOptions = {
    templateId: string;
    upToDate?: Date;
    limit?: number;
    clientIds?: string[];
};

const DEFAULT_CADENCE_LIMIT = 12;
const WEEKDAY_TOKENS: Record<string, Weekday> = {
    SU: RRule.SU,
    MO: RRule.MO,
    TU: RRule.TU,
    WE: RRule.WE,
    TH: RRule.TH,
    FR: RRule.FR,
    SA: RRule.SA,
};

function normalizeDate(input?: string | Date | null): Date | undefined {
    if (!input) return undefined;
    return input instanceof Date ? input : new Date(input);
}

function mapCadenceToFrequency(
    cadenceType: CheckInCadenceType,
    fallback?: RecurrenceFrequency | null
): Options["freq"] {
    switch (cadenceType) {
        case CheckInCadenceType.DAILY:
            return RRule.DAILY;
        case CheckInCadenceType.WEEKLY:
            return RRule.WEEKLY;
        case CheckInCadenceType.MONTHLY:
            return RRule.MONTHLY;
        case CheckInCadenceType.CUSTOM:
        default:
            return fallback
                ? mapRecurrenceFrequency(fallback)
                : RRule.WEEKLY;
    }
}

function mapRecurrenceFrequency(freq: RecurrenceFrequency): Options["freq"] {
    switch (freq) {
        case "DAILY":
            return RRule.DAILY;
        case "WEEKLY":
            return RRule.WEEKLY;
        case "MONTHLY":
            return RRule.MONTHLY;
        case "YEARLY":
            return RRule.YEARLY;
        default:
            return RRule.WEEKLY;
    }
}

function toWeekday(token: string | number): Weekday | undefined {
    if (typeof token === "string") {
        return WEEKDAY_TOKENS[token.toUpperCase()];
    }
    const map = [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA];
    return map[token];
}

function buildRRuleFromTemplate(
    template: Pick<
        CheckInTemplate,
        "cadenceType" | "cadenceRule" | "cadenceRrule" | "createdAt"
    >,
    anchor: Date
): RRule {
    if (template.cadenceRrule) {
        return RRule.fromString(template.cadenceRrule);
    }

    const rule = (template.cadenceRule as CadenceRuleConfig | null) ?? undefined;
    if (rule?.rruleString) {
        return RRule.fromString(rule.rruleString);
    }

    const dtstart = normalizeDate(rule?.anchorDate) ?? anchor;
    const options: Partial<Options> = {
        freq: mapCadenceToFrequency(template.cadenceType, rule?.frequency ?? undefined),
        interval: rule?.interval ?? 1,
        dtstart,
    };

    const weekdays = rule?.weekdays
        ?.map(toWeekday)
        .filter((weekday): weekday is Weekday => Boolean(weekday));
    if (weekdays?.length) {
        options.byweekday = weekdays;
    }

    if (rule?.dayOfMonth) {
        options.bymonthday = rule.dayOfMonth;
    }
    if (rule?.monthOfYear) {
        options.bymonth = rule.monthOfYear;
    }
    if (rule?.maxOccurrences) {
        options.count = rule.maxOccurrences;
    }
    if (rule?.endsAt) {
        options.until = normalizeDate(rule.endsAt);
    }

    return new RRule(options as Options);
}

function calculateNextOccurrences(
    template: Pick<
        CheckInTemplate,
        "cadenceType" | "cadenceRule" | "cadenceRrule" | "createdAt"
    >,
    options: OccurrenceOptions = {}
): Date[] {
    const start = options.startDate ?? new Date();
    const normalizedStart = new Date(start);
    normalizedStart.setMilliseconds(0);

    const rrule = buildRRuleFromTemplate(template, normalizedStart);
    const limit = options.limit ?? DEFAULT_CADENCE_LIMIT;

    if (options.endDate) {
        const end = new Date(options.endDate);
        end.setMilliseconds(0);
        return rrule
            .between(normalizedStart, end, true)
            .filter((date) => date.getTime() > normalizedStart.getTime())
            .slice(0, limit);
    }

    const occurrences: Date[] = [];
    rrule.all((date) => {
        if (date.getTime() <= normalizedStart.getTime()) {
            return true;
        }
        occurrences.push(date);
        return occurrences.length < limit;
    });
    return occurrences;
}

async function resolveClientScopes(
    template: CheckInTemplate,
    clientIds?: string[]
): Promise<ClientScope[]> {
    switch (template.entryType) {
        case CheckInEntryType.PROGRAM: {
            if (!template.programId) {
                return [];
            }
            const enrollments = await db.enrollment.findMany({
                where: {
                    status: EnrollmentStatus.ACTIVE,
                    cohort: { programId: template.programId },
                    ...(clientIds ? { clientId: { in: clientIds } } : {}),
                },
                select: {
                    id: true,
                    clientId: true,
                },
            });
            return enrollments.map((enrollment) => ({
                clientId: enrollment.clientId,
                programId: template.programId,
                enrollmentId: enrollment.id,
            }));
        }
        case CheckInEntryType.ONE_ON_ONE: {
            if (!template.coachingRelationshipId) {
                return [];
            }
            const relationship = await db.coachingRelationship.findUnique({
                where: { id: template.coachingRelationshipId },
                select: { clientId: true },
            });
            if (!relationship?.clientId) {
                return [];
            }
            if (clientIds && !clientIds.includes(relationship.clientId)) {
                return [];
            }
            return [
                {
                    clientId: relationship.clientId,
                    programId: template.programId,
                    coachingRelationshipId: template.coachingRelationshipId,
                },
            ];
        }
        case CheckInEntryType.ADHOC:
        default: {
            if (!clientIds?.length) {
                return [];
            }
            return clientIds.map((clientId) => ({
                clientId,
                programId: template.programId,
                coachingRelationshipId: template.coachingRelationshipId,
            }));
        }
    }
}

export async function materializeTemplateInstances({
    templateId,
    upToDate,
    limit = DEFAULT_CADENCE_LIMIT,
    clientIds,
}: MaterializeOptions) {
    const template = await db.checkInTemplate.findUnique({
        where: { id: templateId },
    });
    if (!template || !template.isActive) {
        return { created: 0, occurrences: [] as Date[] };
    }

    const scopes = await resolveClientScopes(template, clientIds);
    if (!scopes.length) {
        return { created: 0, occurrences: [] as Date[] };
    }

    const lastInstance = await db.checkInInstance.findFirst({
        where: {
            templateId,
            ...(clientIds ? { clientId: { in: clientIds } } : {}),
        },
        orderBy: { dueDate: "desc" },
        select: { dueDate: true },
    });
    const startDate = lastInstance?.dueDate ?? new Date();

    const occurrences = calculateNextOccurrences(template, {
        startDate,
        endDate: upToDate,
        limit,
    });

    if (!occurrences.length) {
        return { created: 0, occurrences };
    }

    const payload: Prisma.CheckInInstanceCreateManyInput[] = [];
    for (const scope of scopes) {
        for (const dueDate of occurrences) {
            payload.push({
                templateId: template.id,
                coachId: template.coachId,
                clientId: scope.clientId,
                programId: scope.programId ?? template.programId ?? null,
                coachingRelationshipId:
                    scope.coachingRelationshipId ??
                    template.coachingRelationshipId ??
                    null,
                enrollmentId: scope.enrollmentId ?? null,
                dueDate,
                status: CheckInInstanceStatus.SCHEDULED,
                metadata: template.metadata as Prisma.InputJsonValue,
            });
        }
    }

    if (!payload.length) {
        return { created: 0, occurrences };
    }

    const created = await db.checkInInstance.createMany({
        data: payload,
        skipDuplicates: true,
    });

    return {
        created: created.count ?? 0,
        occurrences,
    };
}

export async function previewTemplateCadence(templateId: string, limit = DEFAULT_CADENCE_LIMIT) {
    const template = await db.checkInTemplate.findUnique({
        where: { id: templateId },
    });
    if (!template) {
        return [];
    }
    return calculateNextOccurrences(template, { limit });
}

export async function markInstanceSatisfied(instanceId: string) {
    const now = new Date();
    return db.checkInInstance.update({
        where: { id: instanceId },
        data: {
            status: CheckInInstanceStatus.COMPLETED,
            submittedAt: now,
            closedAt: now,
        },
    });
}

async function openDueInstances(referenceDate: Date) {
    return db.checkInInstance.updateMany({
        where: {
            status: CheckInInstanceStatus.SCHEDULED,
            dueDate: { lte: referenceDate },
        },
        data: {
            status: CheckInInstanceStatus.DUE,
            openAt: new Date(),
        },
    });
}

async function markOverdueInstances(referenceDate: Date) {
    return db.checkInInstance.updateMany({
        where: {
            status: { in: [CheckInInstanceStatus.SCHEDULED, CheckInInstanceStatus.DUE] },
            dueDate: { lt: referenceDate },
            submittedAt: null,
        },
        data: {
            status: CheckInInstanceStatus.OVERDUE,
        },
    });
}

export async function sweepInstanceStatuses(referenceDate = new Date()) {
    const normalized = new Date(referenceDate);
    normalized.setHours(23, 59, 59, 999);
    const [opened, overdue] = await Promise.all([
        openDueInstances(normalized),
        markOverdueInstances(normalized),
    ]);
    return {
        opened: opened.count ?? 0,
        overdue: overdue.count ?? 0,
    };
}

export const checkInService = {
    materializeTemplateInstances,
    previewTemplateCadence,
    markInstanceSatisfied,
    sweepInstanceStatuses,
};

