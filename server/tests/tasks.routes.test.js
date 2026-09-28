import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { LearningError } from "../src/services/learning/errors.js";

const service = vi.hoisted(() => ({
    addSuggestedTask: vi.fn(),
    updateTaskStatus: vi.fn(),
    MAX_TASKS_PER_PLAN: 20,
}));
vi.mock("../src/services/tasks.service.js", () => service);

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

const PLAN_ID = "bbbbbbbb-0000-4000-8000-000000000001";
const TASK_ID = "cccccccc-0000-4000-8000-000000000001";
const SUGGESTION = { title: "Practice equations", skillId: "equations", minutes: 10, requestId: "request-0001" };

let server;
let baseUrl;

beforeAll(async () => {
    server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}/api`;
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

describe("POST /api/plans/:id/tasks", () => {
    it("returns 201 for a new task and 200 for a retry", async () => {
        service.addSuggestedTask.mockResolvedValueOnce({ task: { id: TASK_ID }, created: true });
        expect((await call(`/plans/${PLAN_ID}/tasks`, { method: "POST", body: SUGGESTION })).status).toBe(201);

        service.addSuggestedTask.mockResolvedValueOnce({ task: { id: TASK_ID }, created: false });
        expect((await call(`/plans/${PLAN_ID}/tasks`, { method: "POST", body: SUGGESTION })).status).toBe(200);
    });

    it("validates the suggestion before calling the service", async () => {
        const bad = [
            { ...SUGGESTION, minutes: 500 },
            { ...SUGGESTION, minutes: 2 },
            { ...SUGGESTION, title: "" },
            { ...SUGGESTION, requestId: undefined },
            { ...SUGGESTION, position: 1 },
        ];
        for (const body of bad) {
            const res = await call(`/plans/${PLAN_ID}/tasks`, { method: "POST", body });
            expect(res.status).toBe(400);
        }
        expect((await call("/plans/not-a-uuid/tasks", { method: "POST", body: SUGGESTION })).status).toBe(400);
        expect(service.addSuggestedTask).not.toHaveBeenCalled();
    });

    it("requires a session and maps learning errors", async () => {
        expect((await call(`/plans/${PLAN_ID}/tasks`, { method: "POST", body: SUGGESTION, token: null })).status)
            .toBe(401);

        service.addSuggestedTask.mockRejectedValueOnce(new LearningError("PLAN_NOT_CURRENT", "x", 409));
        expect((await call(`/plans/${PLAN_ID}/tasks`, { method: "POST", body: SUGGESTION })).status).toBe(409);
    });
});

describe("PATCH /api/tasks/:id", () => {
    it("updates the status", async () => {
        service.updateTaskStatus.mockResolvedValueOnce({ id: TASK_ID, status: "done" });
        const res = await call(`/tasks/${TASK_ID}`, { method: "PATCH", body: { status: "done" } });

        expect(res.status).toBe(200);
        expect(service.updateTaskStatus.mock.calls[0][0]).toMatchObject({ taskId: TASK_ID, status: "done" });
    });

    it("rejects other fields and unknown statuses", async () => {
        for (const body of [{ status: "finished" }, { status: "done", minutes: 5 }, {}]) {
            expect((await call(`/tasks/${TASK_ID}`, { method: "PATCH", body })).status).toBe(400);
        }
        expect(service.updateTaskStatus).not.toHaveBeenCalled();
    });

    it("returns 404 for a task the student cannot see", async () => {
        service.updateTaskStatus.mockRejectedValueOnce(new LearningError("TASK_NOT_FOUND", "Task not found", 404));
        expect((await call(`/tasks/${TASK_ID}`, { method: "PATCH", body: { status: "done" } })).status).toBe(404);
    });
});

describe("GET /api/career-paths", () => {
    it("requires a session", async () => {
        expect((await call("/career-paths", { token: null })).status).toBe(401);
    });

    it("returns the curated paths with a reason list and an activity each", async () => {
        const res = await call("/career-paths");

        expect(res.status).toBe(200);
        expect(res.body.careerPaths.disclaimer).toBeTruthy();
        expect(res.body.careerPaths.paths.map((p) => p.id)).toEqual(["engineering", "computer-science"]);
        for (const path of res.body.careerPaths.paths) {
            expect(path.whyItMightFit.length).toBeGreaterThan(0);
            expect(path.activity.steps.length).toBeGreaterThan(0);
        }
    });
});
