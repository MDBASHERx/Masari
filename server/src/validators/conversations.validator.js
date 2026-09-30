import { z } from "zod";

export const createConversationSchema = z.object({
    title: z.string().trim().min(1).max(100).default("محادثة جديدة"),
    mode: z.enum(["tutor", "mentor"]).default("tutor"),
}).strict();

export const conversationParamsSchema = z.object({
    id: z.string().uuid(),
});

export const messageSchema = z.object({
    content: z.string().trim().min(1).max(2000),
    requestId: z.string().uuid(),
}).strict();

export const paginationSchema = z.object({
    offset: z.coerce.number().int().min(0).max(100000).default(0),
    limit: z.coerce.number().int().min(1).max(100).default(30),
});
