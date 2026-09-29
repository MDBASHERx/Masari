import { LearningError } from "../learning/errors.js";
import { buildSystemPrompt, buildUntrustedContext } from "./prompts.js";
import { getProvider } from "./providers/index.js";
import { suggestedTaskSchema, tutorReplySchema } from "./tutorReply.schema.js";

export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_HISTORY_MESSAGES = 10;
const MAX_HISTORY_MESSAGE_LENGTH = 1000;
const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Generate one tutor/mentor reply. Called by the message API (Basher).
 *
 * @param {object} input
 * @param {"tutor"|"mentor"} input.mode
 * @param {object} input.learner   from buildLearnerContext()
 * @param {{role: "user"|"assistant", content: string}[]} input.history  earlier messages, oldest first
 * @param {string} input.message   the student's new message (untrusted)
 * @param {object} [input.provider]  for tests; defaults to LLM_PROVIDER
 * @param {number} [input.timeoutMs]
 *
 * @returns {Promise<{
 *   reply: string,
 *   suggestedTask: {title: string, skillId: string, minutes: number}|null,
 *   isDemo: boolean
 * }>}
 * @throws {LearningError} 400 VALIDATION_ERROR, 504 AI_TIMEOUT, 502 AI_PROVIDER_ERROR / AI_BAD_OUTPUT
 */
export async function generateTutorReply({
    mode,
    learner,
    history = [],
    message,
    provider = getProvider(),
    timeoutMs = Number(process.env.AI_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS,
}) {
    if (mode !== "tutor" && mode !== "mentor") {
        throw new LearningError("VALIDATION_ERROR", "mode must be tutor or mentor");
    }
    if (typeof message !== "string" || message.trim().length === 0) {
        throw new LearningError("VALIDATION_ERROR", "Message is empty");
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
        throw new LearningError("VALIDATION_ERROR", `Message is longer than ${MAX_MESSAGE_LENGTH} characters`);
    }

    // Trusted instructions and untrusted data travel separately
    const system = buildSystemPrompt({ mode, learner });
    const context = buildUntrustedContext(learner);
    const messages = [...boundHistory(history), { role: "user", content: message.trim() }];

    const raw = await callWithTimeout(
        (signal) => provider.generate({ system, context, messages, mode, learner, signal }),
        timeoutMs,
    );

    const parsed = tutorReplySchema.safeParse(parseJson(raw));
    if (!parsed.success) {
        throw new LearningError("AI_BAD_OUTPUT", "The tutor could not answer right now. Please try again.", 502);
    }

    return {
        reply: parsed.data.reply,
        suggestedTask: cleanSuggestedTask(parsed.data.suggestedTask, learner),
        isDemo: Boolean(provider.isDemo),
    };
}

// Last N messages only, each shortened, only user/assistant roles
function boundHistory(history) {
    return history
        .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .slice(-MAX_HISTORY_MESSAGES)
        .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_HISTORY_MESSAGE_LENGTH) }));
}

async function callWithTimeout(run, timeoutMs) {
    const controller = new AbortController();
    let timer;

    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => {
            controller.abort();
            reject(new LearningError("AI_TIMEOUT", "The tutor took too long to answer. Please try again.", 504));
        }, timeoutMs);
    });

    try {
        return await Promise.race([run(controller.signal), timeout]);
    } catch (error) {
        if (error instanceof LearningError) throw error;
        // Never pass provider details (keys, URLs, raw errors) to the client
        const wrapped = new LearningError("AI_PROVIDER_ERROR", "The tutor is not available right now. Please try again.", 502);
        wrapped.cause = error;
        throw wrapped;
    } finally {
        clearTimeout(timer);
    }
}

// Models sometimes wrap JSON in ```json fences
function parseJson(raw) {
    if (typeof raw !== "string") return null;
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    try {
        return JSON.parse(cleaned);
    } catch {
        return null;
    }
}

// A bad or invented task is dropped; the reply is still useful without it
function cleanSuggestedTask(task, learner) {
    if (task === null || task === undefined) return null;

    const parsed = suggestedTaskSchema.safeParse(task);
    if (!parsed.success) return null;

    const knownSkill = learner.availableSkills.some((s) => s.id === parsed.data.skillId);
    if (!knownSkill) return null;

    return { ...parsed.data, minutes: Math.min(parsed.data.minutes, learner.dailyMinutes) };
}

/**
 * For real provider adapters: returns the chat messages with the untrusted
 * context attached to the LATEST user turn as its own content part, before
 * the student's text. Never put `context` in the system prompt.
 *
 * @returns {{role: "user"|"assistant", content: string | {type: "text", text: string}[]}[]}
 */
export function toChatMessages({ context, messages }) {
    if (!context) return messages;

    const last = messages.at(-1);
    return [
        ...messages.slice(0, -1),
        {
            role: last.role,
            content: [
                { type: "text", text: context },
                { type: "text", text: last.content },
            ],
        },
    ];
}
