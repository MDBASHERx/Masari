import { z } from "zod";

export const MAX_REPLY_LENGTH = 2000;

// What the model must return. Anything else is rejected or cleaned up.
export const suggestedTaskSchema = z.object({
    title: z.string().trim().min(1).max(120),
    skillId: z.string().trim().min(1).max(50),
    minutes: z.number().int().min(5).max(120),
});

export const tutorReplySchema = z.object({
    reply: z.string().trim().min(1).max(MAX_REPLY_LENGTH),
    suggestedTask: z.unknown().optional(), // validated separately so a bad task never loses a good reply
});
