import { createMockProvider } from "./mockProvider.js";

/**
 * Pick the AI provider from LLM_PROVIDER.
 *
 * A provider is an object: { name, isDemo, generate({ system, messages, mode, learner, signal }) => Promise<string> }
 * `generate` returns the model's raw text; validation happens in generateTutorReply.
 *
 * To add a real provider: create providers/<name>Provider.js that calls the API
 * with LLM_API_KEY and LLM_MODEL, passes `signal` to fetch, and add a case below.
 */
export function getProvider(name = process.env.LLM_PROVIDER || "mock") {
    switch (name) {
        case "mock":
            return createMockProvider();
        default:
            throw new Error(`Unknown LLM_PROVIDER "${name}"`);
    }
}
