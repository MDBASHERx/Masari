import createUserClient from "../../utils/createUserClient.js";
import { buildLearnerContext, generateTutorReply } from "../ai/index.js";
import { saveAssistantReply } from "./saveAssistantReply.js";

const messageFields = "id, role, content, request_id, suggested_task, created_at";

// Share concurrent retries inside this server process.
const pendingReplies = new Map();

export const ensureAssistantReply = async ({ userId, accessToken, conversation, userMessage }) => {
    const supabase = createUserClient(accessToken);

    const findReply = async () => {
        const { data, error } = await supabase
            .from("messages")
            .select(messageFields)
            .eq("conversation_id", conversation.id)
            .eq("request_id", userMessage.request_id)
            .eq("role", "assistant")
            .maybeSingle();

        if (error) 
        {
            throw error;
        }

        return data;
    };

    const existing = await findReply();

    if (existing) 
    {
        return {
            created: false,
            message: existing,
            // Old messages do not store provider metadata.
            isDemo: null,
        };
    }

    const key =
        `${userId}:${conversation.id}:${userMessage.request_id}`;

    if (pendingReplies.has(key)) 
    {
        const result = await pendingReplies.get(key);

        return {
            ...result,
            created: false,
        };
    }

    const generateAndSave = async () => {
        // Recheck before calling the provider.
        const saved = await findReply();

        if (saved) 
        {
            return {
                created: false,
                message: saved,
                isDemo: null,
            };
        }

        // Include only messages before the original student message.
        const { data: history, error: historyError } = await supabase
            .from("messages")
            .select("role, content")
            .eq("conversation_id", conversation.id)
            .or(
                `created_at.lt.${userMessage.created_at},` +
                `and(created_at.eq.${userMessage.created_at},` +
                `id.lt.${userMessage.id})`,
            )
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
            .limit(10);

        if (historyError) 
        {
            throw historyError;
        }

        const learner = await buildLearnerContext({
            userId,
            accessToken,
        });

        const result = await generateTutorReply({
            mode: conversation.mode,
            learner,
            history: [...history].reverse(),
            message: userMessage.content,
        });

        const reply = await saveAssistantReply({
            userId,
            accessToken,
            conversationId: conversation.id,
            requestId: userMessage.request_id,
            content: result.reply,
            suggestedTask: result.suggestedTask,
        });

        return {
            ...reply,
            isDemo: reply.created ? result.isDemo : null,
        };
    };

    const pending = generateAndSave();
    pendingReplies.set(key, pending);

    try {
        return await pending;
    } finally {
        pendingReplies.delete(key);
    }
};