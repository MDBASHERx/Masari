import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { fakeClient } from "./fakeSupabase.js";

const clients = vi.hoisted(() => ({ user: null }));
vi.mock("../src/utils/createUserClient.js", () => ({ default: () => clients.user }));

vi.mock("../src/middleware/requireAuth.js", () => ({
    default: (req, res, next) => {
        if (req.get("Authorization") !== "Bearer good") {
            return res.status(401).json({ success: false, code: "UNAUTHORIZED" });
        }
        req.user = { id: "u1" };
        req.accessToken = "good";
        return next();
    },
}));

const { summarizeProgress } = await import("../src/services/progress.service.js");
const { default: app } = await import("../src/app.js");

const SKILLS = [
    { id: "fractions", name: "الكسور", position: 1 },
    { id: "equations", name: "المعادلات", position: 2 },
];
const item = (skillId, isCorrect) => ({ is_correct: isCorrect, questions: { skill_id: skillId } });

// Newest first
const ATTEMPTS = [
    { id: "p2", type: "practice", skill_id: "equations", score: 100, submitted_at: "2026-09-28T12:00:00Z",
        attempt_items: [item("equations", true), item("equations", true)] },
    { id: "p1", type: "practice", skill_id: "equations", score: 0, submitted_at: "2026-09-28T11:00:00Z",
        attempt_items: [item("equations", false), item("equations", false)] },
    { id: "d2", type: "diagnostic", skill_id: null, score: 75, submitted_at: "2026-09-28T10:00:00Z",
        attempt_items: [item("fractions", true), item("fractions", true), item("equations", true), item("equations", false)] },
    { id: "d1", type: "diagnostic", skill_id: null, score: 0, submitted_at: "2026-09-27T10:00:00Z",
        attempt_items: [item("fractions", false), item("equations", false)] },
];

describe("summarizeProgress", () => {
    it("uses the latest diagnostic and all practice", () => {
        const progress = summarizeProgress({
            skills: SKILLS,
            attempts: ATTEMPTS,
            plan: { plan_tasks: [{ status: "done" }, { status: "todo" }, { status: "in_progress" }] },
        });

        expect(progress.latestDiagnostic).toEqual({ attemptId: "d2", score: 75, submittedAt: "2026-09-28T10:00:00Z" });
        expect(progress.skills).toEqual([
            {
                skillId: "fractions", name: "الكسور", diagnosticPercent: 100,
                practice: { correct: 0, total: 0, percent: null, attempts: 0, lastPracticedAt: null },
            },
            {
                skillId: "equations", name: "المعادلات", diagnosticPercent: 50,
                practice: { correct: 2, total: 4, percent: 50, attempts: 2, lastPracticedAt: "2026-09-28T12:00:00Z" },
            },
        ]);
        expect(progress.plan).toEqual({ totalTasks: 3, doneTasks: 1 });
        expect(progress.recentAttempts.map((a) => a.id)).toEqual(["p2", "p1", "d2", "d1"]);
        expect(progress.recentAttempts[0].skillName).toBe("المعادلات");
    });

    it("works for a new student", () => {
        const progress = summarizeProgress({ skills: SKILLS, attempts: [], plan: null });

        expect(progress.latestDiagnostic).toBeNull();
        expect(progress.plan).toBeNull();
        expect(progress.recentAttempts).toEqual([]);
        expect(progress.skills.every((s) => s.diagnosticPercent === null && s.practice.total === 0)).toBe(true);
    });
});

describe("GET /api/progress", () => {
    let server;
    let url;

    beforeAll(async () => {
        server = app.listen(0);
        await new Promise((resolve) => server.once("listening", resolve));
        url = `http://127.0.0.1:${server.address().port}/api/progress`;
    });
    afterAll(() => server.close());

    it("requires a session", async () => {
        expect((await fetch(url)).status).toBe(401);
    });

    it("returns progress from the student's own saved attempts", async () => {
        clients.user = fakeClient({
            tables: {
                skills: SKILLS,
                attempts: ATTEMPTS.map((a) => ({ ...a, user_id: "u1", status: "submitted" })),
                learning_plans: [],
            },
        });

        const res = await fetch(url, { headers: { Authorization: "Bearer good" } });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.progress.latestDiagnostic.attemptId).toBe("d2");
        expect(body.progress.skills[1].practice.attempts).toBe(2);
    });
});
