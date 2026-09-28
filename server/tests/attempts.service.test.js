import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeClient } from "./fakeSupabase.js";

const clients = vi.hoisted(() => ({ admin: null, user: null }));
vi.mock("../src/utils/createAdminClient.js", () => ({ default: () => clients.admin }));
vi.mock("../src/utils/createUserClient.js", () => ({ default: () => clients.user }));

const { startDiagnostic, submitAttempt, formatAttempt } = await import("../src/services/attempts.service.js");

const STUDENT_A = "11111111-1111-1111-1111-111111111111";
const STUDENT_B = "22222222-2222-2222-2222-222222222222";
const ATTEMPT_ID = "aaaaaaaa-0000-4000-8000-000000000001";

const OPTIONS = ["a", "b", "c", "d"];
const item = (questionId, skillId, position, extra = {}) => ({
    question_id: questionId,
    position,
    selected_option: null,
    is_correct: null,
    questions: { skill_id: skillId, prompt: `prompt ${questionId}`, options: OPTIONS },
    ...extra,
});

const openAttempt = (overrides = {}) => ({
    id: ATTEMPT_ID,
    user_id: STUDENT_A,
    type: "diagnostic",
    status: "in_progress",
    score: null,
    submit_request_id: null,
    created_at: "2026-09-28T10:00:00Z",
    submitted_at: null,
    attempt_items: [item("frac-1", "fractions", 1), item("eq-1", "equations", 2)],
    ...overrides,
});

const KEYS = [
    { question_id: "frac-1", correct_option: 0 },
    { question_id: "eq-1", correct_option: 1 },
];

const answersAllCorrect = [
    { questionId: "frac-1", selectedOption: 0 },
    { questionId: "eq-1", selectedOption: 1 },
];

describe("submitAttempt", () => {
    let attempt;

    beforeEach(() => {
        attempt = openAttempt();
        clients.admin = fakeClient({
            tables: { attempts: [attempt] },
            rpc: {
                get_answer_keys: async () => ({ data: KEYS, error: null }),
                save_attempt_result: async (args) => {
                    // Simulate the database function
                    attempt.status = "submitted";
                    attempt.score = args.p_score;
                    attempt.submit_request_id = args.p_request_id;
                    for (const saved of args.p_items) {
                        const row = attempt.attempt_items.find((i) => i.question_id === saved.questionId);
                        row.selected_option = saved.selectedOption;
                        row.is_correct = saved.isCorrect;
                    }
                    return { data: true, error: null };
                },
            },
        });
        clients.user = fakeClient({ tables: { attempts: [attempt] } });
    });

    it("grades with server data and saves the result once", async () => {
        const result = await submitAttempt({
            userId: STUDENT_A, accessToken: "t", attemptId: ATTEMPT_ID,
            answers: answersAllCorrect, requestId: "request-0001",
        });

        expect(result.status).toBe("submitted");
        expect(result.score).toBe(100);
        expect(result.skills).toEqual([
            { skillId: "fractions", correct: 1, total: 1, percent: 100 },
            { skillId: "equations", correct: 1, total: 1, percent: 100 },
        ]);

        const save = clients.admin.rpc.mock.calls.find(([name]) => name === "save_attempt_result")[1];
        expect(save.p_user_id).toBe(STUDENT_A);
        expect(save.p_score).toBe(100);
    });

    it("returns 404 and touches nothing when the attempt belongs to someone else", async () => {
        await expect(submitAttempt({
            userId: STUDENT_B, accessToken: "t", attemptId: ATTEMPT_ID,
            answers: answersAllCorrect, requestId: "request-0001",
        })).rejects.toMatchObject({ status: 404, code: "ATTEMPT_NOT_FOUND" });

        expect(clients.admin.rpc).not.toHaveBeenCalled();
    });

    it("returns the saved result when the same request is retried", async () => {
        const args = { userId: STUDENT_A, accessToken: "t", attemptId: ATTEMPT_ID, requestId: "request-0001" };
        await submitAttempt({ ...args, answers: answersAllCorrect });

        clients.admin.rpc.mockClear();
        const retry = await submitAttempt({ ...args, answers: [] });

        expect(retry.score).toBe(100);
        expect(clients.admin.rpc).not.toHaveBeenCalled();
    });

    it("returns 409 for a second submission with a different request id", async () => {
        const args = { userId: STUDENT_A, accessToken: "t", attemptId: ATTEMPT_ID, answers: answersAllCorrect };
        await submitAttempt({ ...args, requestId: "request-0001" });

        await expect(submitAttempt({ ...args, requestId: "request-0002" }))
            .rejects.toMatchObject({ status: 409, code: "ALREADY_SUBMITTED" });
    });

    it("returns 409 when another request wins the race to save", async () => {
        clients.admin = fakeClient({
            tables: { attempts: [attempt] },
            rpc: {
                get_answer_keys: async () => ({ data: KEYS, error: null }),
                save_attempt_result: async () => {
                    attempt.status = "submitted";
                    attempt.submit_request_id = "other-request";
                    return { data: false, error: null };
                },
            },
        });

        await expect(submitAttempt({
            userId: STUDENT_A, accessToken: "t", attemptId: ATTEMPT_ID,
            answers: answersAllCorrect, requestId: "request-0001",
        })).rejects.toMatchObject({ status: 409 });
    });

    it("rejects an out-of-range option before saving anything", async () => {
        await expect(submitAttempt({
            userId: STUDENT_A, accessToken: "t", attemptId: ATTEMPT_ID,
            answers: [{ questionId: "frac-1", selectedOption: 999 }], requestId: "request-0001",
        })).rejects.toMatchObject({ status: 400 });

        const names = clients.admin.rpc.mock.calls.map(([name]) => name);
        expect(names).not.toContain("save_attempt_result");
    });
});

describe("startDiagnostic", () => {
    const SKILLS = [
        { id: "fractions", position: 1 },
        { id: "equations", position: 2 },
    ];
    const QUESTIONS = ["frac-1", "frac-2", "frac-3", "eq-1", "eq-2", "eq-3"].map((id) => ({
        id, skill_id: id.startsWith("frac") ? "fractions" : "equations", difficulty: 1, is_active: true,
    }));

    it("creates a new diagnostic with 2 questions per skill, in skill order", async () => {
        const created = openAttempt();
        clients.admin = fakeClient({
            tables: { attempts: [] },
            rpc: { start_attempt: async () => ({ data: ATTEMPT_ID, error: null }) },
        });
        clients.user = fakeClient({ tables: { skills: SKILLS, questions: QUESTIONS, attempts: [created] } });

        const { attempt, resumed } = await startDiagnostic({ userId: STUDENT_A, accessToken: "t" });

        expect(resumed).toBe(false);
        expect(attempt.id).toBe(ATTEMPT_ID);
        const args = clients.admin.rpc.mock.calls[0][1];
        expect(args.p_question_ids).toEqual(["frac-1", "frac-2", "eq-1", "eq-2"]);
        expect(args.p_user_id).toBe(STUDENT_A);
    });

    it("resumes the open diagnostic instead of creating another", async () => {
        const open = openAttempt();
        clients.admin = fakeClient({ tables: { attempts: [open] } });
        clients.user = fakeClient({ tables: { attempts: [open] } });

        const { resumed } = await startDiagnostic({ userId: STUDENT_A, accessToken: "t" });

        expect(resumed).toBe(true);
        expect(clients.admin.rpc).not.toHaveBeenCalled();
    });
});

describe("formatAttempt", () => {
    it("hides results before submission and never exposes the correct option", () => {
        const formatted = formatAttempt(openAttempt());

        expect(formatted.skills).toBeNull();
        for (const question of formatted.questions) {
            expect(question).not.toHaveProperty("isCorrect");
            expect(question).not.toHaveProperty("correctOption");
        }
    });
});
