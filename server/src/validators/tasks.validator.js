import { z } from "zod";

export const idSchema = z.uuid();

// Same shape as the AI's suggestedTask, plus a requestId for safe retries
export const addTaskSchema = z
    .object({
        title: z.string().trim().min(1).max(120),
        skillId: z.string().trim().min(1).max(50),
        minutes: z.number().int().min(5).max(120),
        requestId: z.string().trim().min(8).max(100),
    })
    .strict();

// Students may change the status only
export const updateTaskSchema = z
    .object({
        status: z.enum(["todo", "in_progress", "done"]),
    })
    .strict();
