// This will handle the router for all programs related operations 

import { createTRPCRouter, protectedProcedure, publicProcedure, coachProcedure } from "../trpc";
import { db } from "../../db";
import { z } from "zod";
import type { Prisma, ProductType } from "../../../../generated/prisma";
import { TRPCError } from "@trpc/server";

export const programsRouter = createTRPCRouter({
    getPrograms: coachProcedure.query(async ({ ctx }) => {
        const programs = await db.program.findMany({
            where: { coachId: ctx.session.user.id },
        });
        return programs;
    }),
    getProgram: coachProcedure.input(z.object({
        id: z.string(),
    })).query(async ({ ctx, input }) => {
        const program = await db.program.findUnique({
            where: { id: input.id },
            include: { coach: true },
        });
        if (!program) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Program not found" });
        }
        if (program.coach.userId !== ctx.session.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only view your own programs" });
        }
        return program;
    }),
    createProgram: coachProcedure.input(z.object({
        name: z.string(),
        description: z.string(),
        price: z.number(),
        maxClients: z.number().optional(),
        currency: z.string().default("USD"),
    })).mutation(async ({ ctx, input }) => {    
        const coachProfile = await db.coachProfile.findUnique({
            where: { userId: ctx.session.user.id },
        });
        if (!coachProfile) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Coach profile not found" });
        }
        
        // Create Program, Product, and Blueprint in a transaction
        const { program, product, blueprint } = await db.$transaction(async (tx) => {
            // Create the product first
            const product = await tx.product.create({
                data: {
                    coachId: coachProfile.id,
                    name: input.name,
                    description: input.description,
                    priceCents: Math.round(input.price * 100), // Convert to cents
                    currency: input.currency,
                    type: "RECURRING" as ProductType,
                    isActive: true,
                },
            });
            
            // Create the program with the productId already set
            const program = await tx.program.create({
                data: {
                    name: input.name,
                    description: input.description,
                    price: input.price,
                    maxClients: input.maxClients,
                    isActive: true,
                    coachId: coachProfile.id,
                    productId: product.id,
                },
            });
            
            // Create an empty blueprint for the program
            const blueprint = await tx.blueprint.create({
                data: {
                    programId: program.id,
                },
            });
            
            return { program, product, blueprint };
        });
        
        return { program, product, blueprint };
    }),
    updateProgram: coachProcedure.input(z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        price: z.number().optional(),
        maxClients: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
        const program = await db.program.findUnique({
            where: { id: input.id },
            include: { coach: true },
        });
        if (!program) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Program not found" });
        }
        if (program.coach.userId !== ctx.session.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only update your own programs" });
        }
        const updatedProgram = await db.program.update({ 
            where: { id: input.id },
            data: input,
        });
        return updatedProgram;
    }),
    archiveProgram: coachProcedure.input(z.object({
        id: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const program = await db.program.findUnique({
            where: { id: input.id },
            include: { coach: true, product: true },
        });
        if (!program) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Program not found" });
        }
        if (program.coach.userId !== ctx.session.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only archive your own programs" });
        }
        
        // Archive both program and its associated product in a transaction
        const result = await db.$transaction(async (tx) => {
            const archivedProgram = await tx.program.update({
                where: { id: input.id },
                data: { isActive: false },
            });
            
            // Also archive the associated product if it exists
            if (program.productId) {
                await tx.product.update({
                    where: { id: program.productId },
                    data: { isActive: false },
                });
            }
            
            return archivedProgram;
        });
        
        return result;
    }),

    unarchiveProgram: coachProcedure.input(z.object({
        id: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const program = await db.program.findUnique({
            where: { id: input.id },
            include: { coach: true, product: true },
        });
        if (!program) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Program not found" });
        }
        if (program.coach.userId !== ctx.session.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only unarchive your own programs" });
        }
        
        // Unarchive both program and its associated product in a transaction
        const result = await db.$transaction(async (tx) => {
            const unarchivedProgram = await tx.program.update({
                where: { id: input.id },
                data: { isActive: true },
            });
            
            // Also unarchive the associated product if it exists
            if (program.productId) {
                await tx.product.update({
                    where: { id: program.productId },
                    data: { isActive: true },
                });
            }
            
            return unarchivedProgram;
        });
        
        return result;
    }),

    // Blueprint operations
    getBlueprint: coachProcedure.input(z.object({
        programId: z.string(),
    })).query(async ({ ctx, input }) => {
        // Verify program ownership
        const program = await db.program.findUnique({
            where: { id: input.programId },
            include: { coach: true },
        });
        if (!program) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Program not found" });
        }
        if (program.coach.userId !== ctx.session.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only view blueprints for your own programs" });
        }

        const blueprint = await db.blueprint.findUnique({
            where: { programId: input.programId },
            include: {
                weeks: {
                    where: { isActive: true },
                    include: {
                        days: {
                            where: { isActive: true },
                            include: {
                                workouts: {
                                    where: { isActive: true },
                                    orderBy: { order: "asc" },
                                },
                            },
                            orderBy: { order: "asc" },
                        },
                    },
                    orderBy: { order: "asc" },
                },
            },
        });

        if (!blueprint) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Blueprint not found" });
        }

        return blueprint;
    }),

    createWeek: coachProcedure.input(z.object({
        blueprintId: z.string(),
        name: z.string(),
        description: z.string().optional(),
        notes: z.string().optional(),
        order: z.number(),
        metadata: z.record(z.any()).optional(),
    })).mutation(async ({ ctx, input }) => {
        // Verify blueprint ownership through program
        const blueprint = await db.blueprint.findUnique({
            where: { id: input.blueprintId },
            include: {
                program: {
                    include: { coach: true },
                },
            },
        });
        if (!blueprint) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Blueprint not found" });
        }
        if (blueprint.program.coach.userId !== ctx.session.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only modify blueprints for your own programs" });
        }

        const week = await db.week.create({
            data: {
                blueprintId: input.blueprintId,
                name: input.name,
                description: input.description,
                notes: input.notes,
                order: input.order,
                metadata: input.metadata,
            },
        });

        return week;
    }),

    updateWeek: coachProcedure.input(z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        notes: z.string().optional(),
        order: z.number().optional(),
        metadata: z.record(z.any()).optional(),
    })).mutation(async ({ ctx, input }) => {
        const { id, ...updateData } = input;

        const updatedWeek = await db.$transaction(async (tx) => {
            // Verify week ownership through blueprint -> program
            const week = await tx.week.findUnique({
                where: { id },
                include: {
                    blueprint: {
                        include: {
                            program: {
                                include: { coach: true },
                            },
                        },
                    },
                },
            });
            if (!week) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Week not found" });
            }
            if (week.blueprint.program.coach.userId !== ctx.session.user.id) {
                throw new TRPCError({ code: "FORBIDDEN", message: "You can only modify weeks in your own programs" });
            }

            const updated = await tx.week.update({
                where: { id },
                data: updateData,
            });

            return updated;
        });

        return updatedWeek;
    }),

    deleteWeek: coachProcedure.input(z.object({
        id: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const result = await db.$transaction(async (tx) => {
            // Verify week ownership through blueprint -> program
            const week = await tx.week.findUnique({
                where: { id: input.id },
                include: {
                    blueprint: {
                        include: {
                            program: {
                                include: { coach: true },
                            },
                        },
                    },
                },
            });
            if (!week) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Week not found" });
            }
            if (week.blueprint.program.coach.userId !== ctx.session.user.id) {
                throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete weeks in your own programs" });
            }

            // Soft delete: set isActive to false
            const deletedWeek = await tx.week.update({
                where: { id: input.id },
                data: { isActive: false },
            });

            return deletedWeek;
        });

        return { success: true, week: result };
    }),

    createDay: coachProcedure.input(z.object({
        weekId: z.string(),
        name: z.string(),
        description: z.string().optional(),
        notes: z.string().optional(),
        order: z.number(),
        isRestDay: z.boolean().optional().default(false),
        metadata: z.record(z.any()).optional(),
    })).mutation(async ({ ctx, input }) => {
        // Verify week ownership through blueprint -> program
        const week = await db.week.findUnique({
            where: { id: input.weekId },
            include: {
                blueprint: {
                    include: {
                        program: {
                            include: { coach: true },
                        },
                    },
                },
            },
        });
        if (!week) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Week not found" });
        }
        if (week.blueprint.program.coach.userId !== ctx.session.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only modify days in your own programs" });
        }

        const day = await db.day.create({
            data: {
                weekId: input.weekId,
                name: input.name,
                description: input.description,
                notes: input.notes,
                order: input.order,
                isRestDay: input.isRestDay,
                metadata: input.metadata,
            },
        });

        return day;
    }),

    updateDay: coachProcedure.input(z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        notes: z.string().optional(),
        order: z.number().optional(),
        isRestDay: z.boolean().optional(),
        metadata: z.record(z.any()).optional(),
    })).mutation(async ({ ctx, input }) => {
        const { id, ...updateData } = input;

        // Verify day ownership through week -> blueprint -> program
        const day = await db.day.findUnique({
            where: { id },
            include: {
                week: {
                    include: {
                        blueprint: {
                            include: {
                                program: {
                                    include: { coach: true },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!day) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Day not found" });
        }
        if (day.week.blueprint.program.coach.userId !== ctx.session.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only modify days in your own programs" });
        }

        const updatedDay = await db.day.update({
            where: { id },
            data: updateData,
        });

        return updatedDay;
    }),

    deleteDay: coachProcedure.input(z.object({
        id: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const result = await db.$transaction(async (tx) => {
            // Verify day ownership through week -> blueprint -> program
            const day = await tx.day.findUnique({
                where: { id: input.id },
                include: {
                    week: {
                        include: {
                            blueprint: {
                                include: {
                                    program: {
                                        include: { coach: true },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            if (!day) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Day not found" });
            }
            if (day.week.blueprint.program.coach.userId !== ctx.session.user.id) {
                throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete days in your own programs" });
            }

            // Soft delete: set isActive to false
            const deletedDay = await tx.day.update({
                where: { id: input.id },
                data: { isActive: false },
            });

            return deletedDay;
        });

        return { success: true, day: result };
    }),

    createWorkout: coachProcedure.input(z.object({
        dayId: z.string(),
        exerciseName: z.string(),
        reps: z.string(),
        sets: z.number(),
        rir: z.number().optional(),
        rpe: z.number().optional(),
        order: z.number(),
    })).mutation(async ({ ctx, input }) => {
        // Verify day ownership through week -> blueprint -> program
        const day = await db.day.findUnique({
            where: { id: input.dayId },
            include: {
                week: {
                    include: {
                        blueprint: {
                            include: {
                                program: {
                                    include: { coach: true },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!day) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Day not found" });
        }
        if (day.week.blueprint.program.coach.userId !== ctx.session.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only modify workouts in your own programs" });
        }

        const workout = await db.workout.create({
            data: {
                dayId: input.dayId,
                exerciseName: input.exerciseName,
                reps: input.reps,
                sets: input.sets,
                rir: input.rir,
                rpe: input.rpe,
                order: input.order,
            },
        });

        return workout;
    }),

    updateWorkout: coachProcedure.input(z.object({
        id: z.string(),
        exerciseName: z.string().optional(),
        reps: z.string().optional(),
        sets: z.number().optional(),
        rir: z.number().optional(),
        rpe: z.number().optional(),
        order: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
        const { id, ...updateData } = input;

        // Verify workout ownership through day -> week -> blueprint -> program
        const workout = await db.workout.findUnique({
            where: { id },
            include: {
                day: {
                    include: {
                        week: {
                            include: {
                                blueprint: {
                                    include: {
                                        program: {
                                            include: { coach: true },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!workout) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Workout not found" });
        }
        if (workout.day.week.blueprint.program.coach.userId !== ctx.session.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You can only modify workouts in your own programs" });
        }

        const updatedWorkout = await db.workout.update({
            where: { id },
            data: updateData,
        });

        return updatedWorkout;
    }),

    deleteWorkout: coachProcedure.input(z.object({
        id: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const result = await db.$transaction(async (tx) => {
            // Verify workout ownership through day -> week -> blueprint -> program
            const workout = await tx.workout.findUnique({
                where: { id: input.id },
                include: {
                    day: {
                        include: {
                            week: {
                                include: {
                                    blueprint: {
                                        include: {
                                            program: {
                                                include: { coach: true },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            if (!workout) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Workout not found" });
            }
            if (workout.day.week.blueprint.program.coach.userId !== ctx.session.user.id) {
                throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete workouts in your own programs" });
            }

            // Soft delete: set isActive to false
            const deletedWorkout = await tx.workout.update({
                where: { id: input.id },
                data: { isActive: false },
            });

            return deletedWorkout;
        });

        return { success: true, workout: result };
    }),
}); 

export type ProgramsRouter = typeof programsRouter;