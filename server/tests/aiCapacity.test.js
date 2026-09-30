import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
describe("AI capacity", () => {
    it("rejects excess concurrency and releases the slot after success or failure", async () => {
        vi.stubEnv("AI_MAX_CONCURRENT", "1");
        vi.resetModules();
        const { withAiCapacity } = await import("../src/services/ai/withAiCapacity.js");
        let finish;
        const first = withAiCapacity(() => new Promise((resolve) => { finish = resolve; }));
        const excess = vi.fn();
        await expect(withAiCapacity(excess)).rejects.toMatchObject({ code: "AI_BUSY", status: 503 });
        expect(excess).not.toHaveBeenCalled();
        finish("done");
        await expect(first).resolves.toBe("done");
        await expect(withAiCapacity(() => { throw new Error("failed"); })).rejects.toThrow("failed");
        await expect(withAiCapacity(async () => "available")).resolves.toBe("available");
    });
});
