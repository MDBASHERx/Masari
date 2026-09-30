import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const saveMessage = vi.hoisted(() => vi.fn((req, res) => res.json({ success: true })));
vi.mock("../src/controllers/conversations.controller.js", () => ({
    createConversation: vi.fn(), listConversations: vi.fn(), listMessages: vi.fn(), saveUserMessage: saveMessage,
}));
vi.mock("../src/middleware/requireAuth.js", () => ({
    default: (req, res, next) => {
        const id = req.get("Authorization");
        if (!id) return res.status(401).json({ success: false });
        req.user = { id };
        next();
    },
}));
const { default: app } = await import("../src/app.js");
let server;
let url;
beforeAll(async () => {
    server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    url = `http://127.0.0.1:${server.address().port}/api/conversations/11111111-1111-4111-8111-111111111111/messages`;
});
afterAll(() => new Promise((resolve) => server.close(resolve)));
const send = (user) => fetch(url, {
    method: "POST", headers: { "Content-Type": "application/json", ...(user && { Authorization: user }) },
    body: JSON.stringify({ content: "A test question", requestId: "22222222-2222-4222-8222-222222222222" }),
});
describe("chat request limits", () => {
    it("rejects unauthenticated requests before reaching the controller", async () => {
        expect((await send()).status).toBe(401);
        expect(saveMessage).not.toHaveBeenCalled();
    });
    it("blocks the eleventh request and keeps different students independent", async () => {
        for (let i = 0; i < 10; i++) expect((await send("student-a")).status).toBe(200);
        const blocked = await send("student-a");
        expect(blocked.status).toBe(429);
        expect(await blocked.json()).toMatchObject({ code: "CHAT_RATE_LIMITED" });
        expect(Number(blocked.headers.get("Retry-After"))).toBeGreaterThan(0);
        expect(saveMessage).toHaveBeenCalledTimes(10);
        expect((await send("student-b")).status).toBe(200);
    });
    it("does not expose the removed demo endpoint", async () => {
        const response = await fetch(url.replace("/messages", "/demo-reply"), {
            method: "POST", headers: { Authorization: "student-b" },
        });
        expect(response.status).toBe(404);
    });
});
