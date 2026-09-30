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

const { summarizeProgress, getProgress, RECENT_LIMIT } = await import("../src/services/progress.service.js");
const { default: app } = await import("../src/app.js");

const SKILLS = [
    { id: "fractions", name: "الكسور", position: 1 },
    { id: "equations", name: "المعادلات", position: 2 },
];
const item = (skillId, isCorrect) => ({ is_correct: isCorrect, questions: { skill_id: skillId } });

const DIAGNOSTIC = {
    id: "d2", type: "diagnostic", skill_id: null, score: 75, submitted_at: "2026-09-28T10:00:00Z",
    attempt_items: [item("fractions", true), item("fractions", true), item("equations", true), item("equations", false)],
};

// practice_summary() rows as PostgREST returns them (bigint counts can arrive as strings)
const SUMMARY = [
    { skill_id: "equations", attempts: 2, correct: "2", total: "4", last_practiced_at: "2026-09-28T12:00:00Z" },
];

// 250 practice attempts, newest first
const MANY_PRACTICE = Array.from({ length: 250 }, (_, i) => ({
    id: `p${i}`, user_id: "u1", type: "practice", skill_id: "equations", status: "submitted", score: 100,
    submitted_at: new Date(Date.UTC(2026, 8, 29, 0, 0, 250 - i)).toISOString(),
}));

describe("summarizeProgress", () => {
    it("uses the latest diagnostic and the complete practice totals", () => {
        const progress = summarizeProgress({
            skills: SKILLS,
            latestDiagnostic: DIAGNOSTIC,
            practiceSummary: SUMMARY,
            recentAttempts: [],
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
    });

    it("works for a new student", () => {
        const progress = summarizeProgress({
            skills: SKILLS, latestDiagnostic: null, practiceSummary: [], recentAttempts: [], plan: null,
        });

        expect(progress.latestDiagnostic).toBeNull();
        expect(progress.plan).toBeNull();
        expect(progress.recentAttempts).toEqual([]);
        expect(progress.skills.every((s) => s.diagnosticPercent === null && s.practice.total === 0)).toBe(true);
    });

    it("keeps the recent list at its own limit", () => {
        const progress = summarizeProgress({
            skills: SKILLS, latestDiagnostic: null, practiceSummary: [], recentAttempts: MANY_PRACTICE, plan: null,
        });
        expect(progress.recentAttempts).toHaveLength(RECENT_LIMIT);
        expect(progress.recentAttempts[0].id).toBe("p0");
    });
});

describe("getProgress after many practice attempts", () => {
    it("still finds the diagnostic and reports complete totals", async () => {
        clients.user = fakeClient({
            tables: {
                skills: SKILLS,
                // 250 newer practice attempts AND an older diagnostic
                attempts: [...MANY_PRACTICE, { ...DIAGNOSTIC, user_id: "u1", status: "submitted" }],
                learning_plans: [],
            },
            rpc: {
                // What the database aggregates over ALL practice attempts
                practice_summary: async () => ({
                    data: [{ skill_id: "equations", attempts: 250, correct: 200, total: 250, last_practiced_at: MANY_PRACTICE[0].submitted_at }],
                    error: null,
                }),
            },
        });

        const progress = await getProgress({ userId: "u1", accessToken: "t" });

        expect(progress.latestDiagnostic.attemptId).toBe("d2");
        expect(progress.skills[1].diagnosticPercent).toBe(50);
        expect(progress.skills[1].practice).toMatchObject({ attempts: 250, correct: 200, total: 250, percent: 80 });
        expect(progress.recentAttempts).toHaveLength(RECENT_LIMIT);
        expect(clients.user.rpc.mock.calls[0][0]).toBe("practice_summary");
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

    it("returns progress in the same response shape", async () => {
        clients.user = fakeClient({
            tables: {
                skills: SKILLS,
                attempts: [{ ...DIAGNOSTIC, user_id: "u1", status: "submitted" }],
                learning_plans: [],
            },
            rpc: { practice_summary: async () => ({ data: SUMMARY, error: null }) },
        });

        const res = await fetch(url, { headers: { Authorization: "Bearer good" } });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(Object.keys(body.progress).sort()).toEqual(["latestDiagnostic", "plan", "recentAttempts", "skills"]);
        expect(body.progress.latestDiagnostic.attemptId).toBe("d2");
        expect(body.progress.skills[1].practice.attempts).toBe(2);
    });
});
