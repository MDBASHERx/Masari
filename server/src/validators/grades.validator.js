import { z } from "zod";

const dateSchema = z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .refine((value) => {
        const date = new Date(`${value}T00:00:00.000Z`);

        return (
            !Number.isNaN(date.getTime()) &&
            date.toISOString().slice(0, 10) === value
        );
    }, "Invalid date");

export const createGradeSchema = z.object({
    subject: z.string().trim().min(1).max(80),
    title: z.string().trim().min(1).max(120),

    score: z.number()
        .min(0)
        .max(100)
        .refine(
            (value) =>
                Math.abs(value * 100 - Math.round(value * 100)) < 1e-8,
            "Use at most two decimal places",
        )
        .transform((value) => Math.round(value * 100) / 100),

    assessedOn: dateSchema,
    notes: z.string().trim().max(500).default(""),
    requestId: z.string().uuid(),
}).strict();

export const gradesQuerySchema = z.object({
    offset: z.coerce.number().int().min(0).max(100000).default(0),
    limit: z.coerce.number().int().min(1).max(100).default(20),
}).strict();

export const gradeParamsSchema = z.object({
    id: z.string().uuid(),
}).strict();

export const updateGradeSchema = createGradeSchema
    .omit({ requestId: true })
    .refine(
        (data) => Object.keys(data).length > 0,
        "Grade data is required",
    );