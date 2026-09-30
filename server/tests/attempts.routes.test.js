import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { LearningError } from "../src/services/learning/errors.js";

const service = vi.hoisted(() => ({
    startDiagnostic: vi.fn(),
    startPractice: vi.fn(),
    getAttempt: vi.fn(),
    submitAttempt: vi.fn(),
}));
vi.mock("../src/services/attempts.service.js", () => service);

// Fake auth: "Bearer good" is a valid session
vi.mock("../src/middleware/requireAuth.js", () => ({
    default: (req, res, next) => {
        if (req.get("Authorization") !== "Bearer good") {
            return res.status(401).json({ success: false, code: "UNAUTHORIZED" });
        }
        req.user = { id: "11111111-1111-1111-1111-111111111111" };
        req.accessToken = "good";
        return next();
    },
}));

const { default: app } = await import("../src/app.js");

const ATTEMPT_ID = "aaaaaaaa-0000-4000-8000-000000000001";
let server;
let baseUrl;

beforeAll(async () => {
    server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}/api/attempts`;
});
afterAll(() => server.close());
beforeEach(() => vi.clearAllMocks());

const call = (path, { method = "GET", body, token = "good" } = {}) =>
    fetch(`${baseUrl}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    }).then(async (res) => ({ status: res.status, body: await res.json() }));

describe("attempts routes", () => {
    it("requires a session", async () => {
        const res = await call("", { method: "POST", body: { type: "diagnostic" }, token: null });
        expect(res.status).toBe(401);
        expect(service.startDiagnostic).not.toHaveBeenCalled();
    });

    it("returns 201 for a new diagnostic and 200 when resuming", async () => {
        service.startDiagnostic.mockResolvedValueOnce({ attempt: { id: ATTEMPT_ID }, resumed: false });
        expect((await call("", { method: "POST", body: { type: "diagnostic" } })).status).toBe(201);

        service.startDiagnostic.mockResolvedValueOnce({ attempt: { id: ATTEMPT_ID }, resumed: true });
        const resumed = await call("", { method: "POST", body: { type: "diagnostic" } });
        expect(resumed.status).toBe(200);
        expect(resumed.body.resumed).toBe(true);
    });

    it("starts practice on a skill", async () => {
        service.startPractice.mockResolvedValueOnce({ attempt: { id: ATTEMPT_ID }, resumed: false });
        const res = await call("", { method: "POST", body: { type: "practice", skillId: "equations" } });

        expect(res.status).toBe(201);
        expect(service.startPractice.mock.calls[0][0]).toMatchObject({ skillId: "equations" });
        expect(service.startDiagnostic).not.toHaveBeenCalled();
    });

    it("requires a skill for practice and none for diagnostics", async () => {
        expect((await call("", { method: "POST", body: { type: "practice" } })).status).toBe(400);
        expect((await call("", { method: "POST", body: { type: "diagnostic", skillId: "equations" } })).status).toBe(400);
        expect((await call("", { method: "POST", body: { type: "exam" } })).status).toBe(400);
    });

    it("rejects unknown attempt types and extra fields", async () => {
        const res = await call("", { method: "POST", body: { type: "diagnostic", userId: "x" } });
        expect(res.status).toBe(400);
        expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("rejects an invalid attempt id without calling the service", async () => {
        const res = await call("/not-a-uuid");
        expect(res.status).toBe(400);
        expect(service.getAttempt).not.toHaveBeenCalled();
    });

    it("rejects a submission that sends its own score", async () => {
        const res = await call(`/${ATTEMPT_ID}/submit`, {
            method: "POST",
            body: { answers: [], requestId: "request-0001", score: 100 },
        });
        expect(res.status).toBe(400);
        expect(service.submitAttempt).not.toHaveBeenCalled();
    });

    it("passes the verified user id, not one from the body", async () => {
        service.submitAttempt.mockResolvedValueOnce({ id: ATTEMPT_ID, status: "submitted" });
        await call(`/${ATTEMPT_ID}/submit`, {
            method: "POST",
            body: { answers: [], requestId: "request-0001" },
        });
        expect(service.submitAttempt.mock.calls[0][0].userId).toBe("11111111-1111-1111-1111-111111111111");
    });

    it("maps learning errors to their status code", async () => {
        service.getAttempt.mockRejectedValueOnce(new LearningError("ATTEMPT_NOT_FOUND", "Attempt not found", 404));
        const notFound = await call(`/${ATTEMPT_ID}`);
        expect(notFound).toEqual({
            status: 404,
            body: { success: false, code: "ATTEMPT_NOT_FOUND", message: "Attempt not found" },
        });

        service.submitAttempt.mockRejectedValueOnce(new LearningError("ALREADY_SUBMITTED", "done", 409));
        const conflict = await call(`/${ATTEMPT_ID}/submit`, {
            method: "POST",
            body: { answers: [], requestId: "request-0002" },
        });
        expect(conflict.status).toBe(409);
    });

    it("hides internal error details", async () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        service.getAttempt.mockRejectedValueOnce(new Error("relation secret_table does not exist"));
        const res = await call(`/${ATTEMPT_ID}`);
        expect(res.status).toBe(500);
        expect(JSON.stringify(res.body)).not.toContain("secret_table");
    });
});
