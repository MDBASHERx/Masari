import { z } from "zod";

export const updateProfileSchema = z
    .object({
        full_name: z.string().trim().min(1).max(100).optional(),
        grade_level: z.number().int().min(1).max(12).nullable().optional(),
        goal: z.string().trim().max(500).optional(),
        daily_minutes: z.number().int().min(5).max(240).optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one profile field is required",
    });