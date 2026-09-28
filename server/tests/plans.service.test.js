import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeClient } from "./fakeSupabase.js";

const clients = vi.hoisted(() => ({ admin: null, user: null }));
vi.mock("../src/utils/createAdminClient.js", () => ({ default: () => clients.admin }));
vi.mock("../src/utils/createUserClient.js", () => ({ default: () => clients.user }));

const { createPlanFromAttempt, getCurrentPlan } = await import("../src/services/plans.service.js");

const STUDENT_A = "11111111-1111-1111-1111-111111111111";
const ATTEMPT_ID = "aaaaaaaa-0000-4000-8000-000000000001";
const PLAN_ID = "bbbbbbbb-0000-4000-8000-000000000001";

const SKILLS = [
    { id: "fractions", name: "الكسور", prerequisite_id: null, position: 1 },
    { id: "equations", name: "المعادلات", prerequisite_id: "fractions", position: 2 },
    { id: "percentages", name: "النسب المئوية", prerequisite_id: "fractions", position: 3 },
];

const answered = (questionId, skillId, position, isCorrect) => ({
    question_id: questionId,
    position,
    selected_option: 0,
    is_correct: isCorrect,
    questions: { skill_id: skillId, prompt: "p", options: ["a", "b", "c", "d"] },
});

// Fractions 1/2, equations 0/2, percentages 2/2
const submittedAttempt = (overrides = {}) => ({
    id: ATTEMPT_ID,
    type: "diagnostic",
    status: "submitted",
    score: 50,
    created_at: "2026-09-28T10:00:00Z",
    submitted_at: "2026-09-28T10:05:00Z",
    attempt_items: [
        answered("frac-1", "fractions", 1, true),
        answered("frac-2", "fractions", 2, false),
        answered("eq-1", "equations", 3, false),
        answered("eq-2", "equations", 4, false),
        answered("pct-1", "percentages", 5, true),
        answered("pct-2", "percentages", 6, true),
    ],
    ...overrides,
});

const savedPlan = (tasks) => ({
    id: PLAN_ID,
    user_id: STUDENT_A,
    is_current: true,
    version: 1,
    source_attempt_id: ATTEMPT_ID,
    created_at: "2026-09-28T10:06:00Z",
    plan_tasks: tasks.map((t, i) => ({
        id: `task-${i}`,
        skill_id: t.skillId,
        title: t.title,
        minutes: t.minutes,
        status: "todo",
        position: t.position,
        reason: t.reason,
        source: "plan",
        skills: { name: SKILLS.find((s) => s.id === t.skillId).name },
    })),
});

describe("createPlanFromAttempt", () => {
    let plans;

    beforeEach(() => {
        plans = [];
        clients.admin = fakeClient({
            rpc: {
                create_plan: async (args) => {
                    const existing = plans.find((p) => p.source_attempt_id === args.p_attempt_id);
                    if (existing) return { data: { planId: existing.id, created: false }, error: null };
                    plans.push(savedPlan(args.p_tasks));
                    return { data: { planId: PLAN_ID, created: true }, error: null };
                },
            },
        });
        clients.user = fakeClient({
            tables: {
                attempts: [submittedAttempt()],
                profiles: [{ id: STUDENT_A, daily_minutes: 15 }],
                skills: SKILLS,
                learning_plans: plans,
            },
        });
    });

    it("builds the plan from the diagnostic and the student's daily minutes", async () => {
        const { plan, created } = await createPlanFromAttempt({
            userId: STUDENT_A, accessToken: "t", attemptId: ATTEMPT_ID,
        });

        expect(created).toBe(true);
        // Fractions (50%) is a weak prerequisite of equations (0%), so it comes first
        expect(plan.tasks.map((t) => t.skillId)).toEqual(["fractions", "equations"]);
        expect(plan.tasks[0].reason).toMatch(/متطلب سابق/);
        expect(plan.tasks.every((t) => t.minutes <= 15)).toBe(true);
        expect(plan.tasks[0].skillName).toBe("الكسور");

        const args = clients.admin.rpc.mock.calls[0][1];
        expect(args.p_user_id).toBe(STUDENT_A);
        expect(args.p_attempt_id).toBe(ATTEMPT_ID);
    });

    it("returns the existing plan when called twice for the same attempt", async () => {
        const input = { userId: STUDENT_A, accessToken: "t", attemptId: ATTEMPT_ID };
        await createPlanFromAttempt(input);
        const second = await createPlanFromAttempt(input);

        expect(second.created).toBe(false);
        expect(plans).toHaveLength(1);
    });

    it("refuses an attempt that is not submitted yet", async () => {
        clients.user = fakeClient({
            tables: { attempts: [submittedAttempt({ status: "in_progress", score: null })] },
        });

        await expect(createPlanFromAttempt({ userId: STUDENT_A, accessToken: "t", attemptId: ATTEMPT_ID }))
            .rejects.toMatchObject({ status: 409, code: "ATTEMPT_NOT_SUBMITTED" });
        expect(clients.admin.rpc).not.toHaveBeenCalled();
    });

    it("returns 404 for an attempt the student cannot see", async () => {
        clients.user = fakeClient({ tables: { attempts: [] } }); // RLS hides it

        await expect(createPlanFromAttempt({ userId: STUDENT_A, accessToken: "t", attemptId: ATTEMPT_ID }))
            .rejects.toMatchObject({ status: 404, code: "ATTEMPT_NOT_FOUND" });
        expect(clients.admin.rpc).not.toHaveBeenCalled();
    });

    it("returns 404 when the student has no profile", async () => {
        clients.user = fakeClient({
            tables: { attempts: [submittedAttempt()], profiles: [], skills: SKILLS },
        });

        await expect(createPlanFromAttempt({ userId: STUDENT_A, accessToken: "t", attemptId: ATTEMPT_ID }))
            .rejects.toMatchObject({ status: 404, code: "PROFILE_NOT_FOUND" });
    });
});

describe("getCurrentPlan", () => {
    it("returns 404 when there is no plan yet", async () => {
        clients.user = fakeClient({ tables: { learning_plans: [] } });

        await expect(getCurrentPlan({ userId: STUDENT_A, accessToken: "t" }))
            .rejects.toMatchObject({ status: 404, code: "PLAN_NOT_FOUND" });
    });

    it("returns tasks in order with the total time", async () => {
        const plan = savedPlan([
            { skillId: "equations", title: "b", minutes: 10, position: 2, reason: "r2" },
            { skillId: "fractions", title: "a", minutes: 15, position: 1, reason: "r1" },
        ]);
        clients.user = fakeClient({ tables: { learning_plans: [plan] } });

        const result = await getCurrentPlan({ userId: STUDENT_A, accessToken: "t" });

        expect(result.tasks.map((t) => t.position)).toEqual([1, 2]);
        expect(result.totalMinutes).toBe(25);
    });
});
