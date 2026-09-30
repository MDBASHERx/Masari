import { createMockProvider } from "./mockProvider.js";
import { createGeminiProvider } from "./geminiProvider.js";

export function getProvider(
    name = process.env.LLM_PROVIDER || "mock",
) {
    switch (name) {
        case "mock":
            return createMockProvider();

        case "gemini":
            return createGeminiProvider();

        default:
            throw new Error(`Unknown LLM_PROVIDER "${name}"`);
    }
}