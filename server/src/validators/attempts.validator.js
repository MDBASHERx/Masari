import { z } from "zod";

export const attemptIdSchema = z.uuid();

// Only diagnostics for now; practice attempts come in a later PR
export const startAttemptSchema = z
    .object({
        type: z.literal("diagnostic"),
    })
    .strict();

// Answer entries are validated in detail by gradeAttempt()
export const submitAttemptSchema = z
    .object({
        answers: z.array(z.unknown()).max(100),
        requestId: z.string().trim().min(8).max(100),
    })
    .strict();
