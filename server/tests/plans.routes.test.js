import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { LearningError } from "../src/services/learning/errors.js";

const service = vi.hoisted(() => ({
    createPlanFromAttempt: vi.fn(),
    getCurrentPlan: vi.fn(),
}));
vi.mock("../src/services/plans.service.js", () => service);

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
    baseUrl = `http://127.0.0.1:${server.address().port}/api/plans`;
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

describe("plans routes", () => {
    it("requires a session", async () => {
        expect((await call("/current", { token: null })).status).toBe(401);
        expect(service.getCurrentPlan).not.toHaveBeenCalled();
    });

    it("returns 201 for a new plan and 200 for an existing one", async () => {
        service.createPlanFromAttempt.mockResolvedValueOnce({ plan: { id: "p" }, created: true });
        expect((await call("", { method: "POST", body: { attemptId: ATTEMPT_ID } })).status).toBe(201);

        service.createPlanFromAttempt.mockResolvedValueOnce({ plan: { id: "p" }, created: false });
        expect((await call("", { method: "POST", body: { attemptId: ATTEMPT_ID } })).status).toBe(200);
    });

    it("rejects a bad attempt id and extra fields", async () => {
        const badId = await call("", { method: "POST", body: { attemptId: "123" } });
        expect(badId.status).toBe(400);

        const extra = await call("", { method: "POST", body: { attemptId: ATTEMPT_ID, userId: "x" } });
        expect(extra.status).toBe(400);
        expect(service.createPlanFromAttempt).not.toHaveBeenCalled();
    });

    it("passes the verified user id to the service", async () => {
        service.createPlanFromAttempt.mockResolvedValueOnce({ plan: {}, created: true });
        await call("", { method: "POST", body: { attemptId: ATTEMPT_ID } });
        expect(service.createPlanFromAttempt.mock.calls[0][0].userId).toBe("11111111-1111-1111-1111-111111111111");
    });

    it("maps learning errors", async () => {
        service.getCurrentPlan.mockRejectedValueOnce(new LearningError("PLAN_NOT_FOUND", "No learning plan yet", 404));
        expect(await call("/current")).toEqual({
            status: 404,
            body: { success: false, code: "PLAN_NOT_FOUND", message: "No learning plan yet" },
        });

        service.createPlanFromAttempt.mockRejectedValueOnce(new LearningError("ATTEMPT_NOT_SUBMITTED", "x", 409));
        expect((await call("", { method: "POST", body: { attemptId: ATTEMPT_ID } })).status).toBe(409);
    });
});
