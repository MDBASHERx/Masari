import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import createUserClient from "../../utils/createUserClient.js";

const replySchema = z.object({
    conversationId: z.string().uuid(),
    requestId: z.string().uuid(),
    content: z.string().trim().min(1).max(2000),
    suggestedTask: z.object({
        title: z.string().trim().min(1).max(120),
        skillId: z.string().trim().min(1).max(80),
        minutes: z.number().int().min(5).max(120),
    }).strict().nullable().default(null),
}).strict();

const fields = "id, role, content, request_id, suggested_task, created_at";

const createChatAdminClient = () => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVER_KEY;

    if (!url || !key)
    {
        throw new Error("Chat server configuration is missing");
    }

    return createClient(url, key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
    });
};

// Call only from trusted server code with a verified user identity.
export const saveAssistantReply = async ({ userId, accessToken, ...input}) => {
    const parsed = replySchema.safeParse(input);

    if (!parsed.success)
    {
        throw new Error("Invalid assistant reply");
    }

    const {
        conversationId,
        requestId,
        content,
        suggestedTask,
    } = parsed.data;

    // Check ownership through the student's token and RLS.
    const userClient = createUserClient(accessToken);

    const { data: conversation, error: conversationError } =
        await userClient
            .from("conversations")
            .select("id")
            .eq("id", conversationId)
            .eq("user_id", userId)
            .maybeSingle();

    if (conversationError)
    {
        throw conversationError;
    }

    if (!conversation)
    {
        throw new Error("Conversation not found");
    }

    // Every assistant reply must reference a saved student message.
    const { data: userMessage, error: userMessageError } =
        await userClient
            .from("messages")
            .select("id")
            .eq("conversation_id", conversationId)
            .eq("request_id", requestId)
            .eq("role", "user")
            .maybeSingle();

    if (userMessageError)
    {
        throw userMessageError;
    }

    if (!userMessage)
    {
        throw new Error("Original student message not found");
    }

    const admin = createChatAdminClient();

    const findExistingReply = async () => {
        const { data, error } = await admin
            .from("messages")
            .select(fields)
            .eq("conversation_id", conversationId)
            .eq("request_id", requestId)
            .eq("role", "assistant")
            .maybeSingle();

        if (error)
        {
            throw error;
        }

        return data;
    };

    const existing = await findExistingReply();

    if (existing)
    {
        return { created: false, message: existing };
    }

    if (suggestedTask)
    {
        const { data: skill, error: skillError } = await admin
            .from("skills")
            .select("id")
            .eq("id", suggestedTask.skillId)
            .maybeSingle();

        if (skillError)
        {
            throw skillError;
        }

        if (!skill)
        {
            throw new Error("Suggested task references an unknown skill");
        }
    }

    const { data, error } = await admin
        .from("messages")
        .insert({
            conversation_id: conversationId,
            role: "assistant",
            content,
            request_id: requestId,
            suggested_task: suggestedTask,
        })
        .select(fields)
        .single();

    // Another request may have saved the reply concurrently.
    if (error?.code === "23505")
    {
        const saved = await findExistingReply();

        if (saved)
        {
            return { created: false, message: saved };
        }
    }

    if (error)
    {
        throw error;
    }

    return { created: true, message: data };
};