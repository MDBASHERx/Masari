import { z } from "zod";

export const attemptIdSchema = z.uuid();

export const startAttemptSchema = z.discriminatedUnion("type", [
    z.object({ type: z.literal("diagnostic") }).strict(),
    z.object({ type: z.literal("practice"), skillId: z.string().trim().min(1).max(50) }).strict(),
]);

// Answer entries are validated in detail by gradeAttempt()
export const submitAttemptSchema = z
    .object({
        answers: z.array(z.unknown()).max(100),
        requestId: z.string().trim().min(8).max(100),
    })
    .strict();
