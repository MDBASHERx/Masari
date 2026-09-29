import { createMockProvider } from "./mockProvider.js";

/**
 * Pick the AI provider from LLM_PROVIDER.
 *
 * A provider is an object: { name, isDemo, generate({ system, context, messages, mode, learner, signal }) => Promise<string> }
 * `generate` returns the model's raw text; validation happens in generateTutorReply.
 *
 * To add a real provider: create providers/<name>Provider.js that calls the API
 * with LLM_API_KEY and LLM_MODEL, passes `signal` to fetch, and add a case below.
 * - `system` is trusted: send it as the system prompt.
 * - `context` is UNTRUSTED student data (or null): never add it to the system
 *   prompt. Use toChatMessages({ context, messages }) from generateTutorReply.js
 *   to send it as a separate part of the latest user turn.
 */
export function getProvider(name = process.env.LLM_PROVIDER || "mock") {
    switch (name) {
        case "mock":
            return createMockProvider();
        default:
            throw new Error(`Unknown LLM_PROVIDER "${name}"`);
    }
}
