import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validateEnv } from "../src/utils/validateEnv.js";
beforeEach(() => {
    for (const [key, value] of Object.entries({
        NODE_ENV: "production", PORT: "5000", AI_TIMEOUT_MS: "30000", AI_MAX_CONCURRENT: "2",
        SUPABASE_URL: "https://example.supabase.co", SUPABASE_PUBLISHABLE_KEY: "test-public",
        SUPABASE_SERVER_KEY: "test-server", CLIENT_URL: "https://masari.example",
        LLM_PROVIDER: "gemini", LLM_API_KEY: "test-provider", LLM_MODEL: "test-model", CHAT_DEMO_ENABLED: "false",
    })) vi.stubEnv(key, value);
});
afterEach(() => vi.unstubAllEnvs());
describe("production configuration", () => {
    it("accepts complete production configuration", () => expect(validateEnv).not.toThrow());
    it.each([
        ["LLM_PROVIDER", "mock"], ["CHAT_DEMO_ENABLED", "true"],
        ["CLIENT_URL", "http://masari.example"], ["CLIENT_URL", "https://masari.example/chat"],
        ["SUPABASE_SERVER_KEY", ""], ["LLM_API_KEY", ""], ["AI_MAX_CONCURRENT", "0"],
    ])("rejects invalid %s configuration", (key, value) => {
        vi.stubEnv(key, value);
        expect(validateEnv).toThrow();
    });
});
