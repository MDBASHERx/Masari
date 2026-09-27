import { describe, expect, it } from "vitest";
import { gradeAttempt } from "../src/services/learning/grading.js";
import { buildPlan } from "../src/services/learning/planBuilder.js";

// Same data as supabase/seed.sql
const SKILLS = [
    { id: "fractions", name: "الكسور", prerequisiteId: null, position: 1 },
    { id: "equations", name: "المعادلات", prerequisiteId: "fractions", position: 2 },
    { id: "percentages", name: "النسب المئوية", prerequisiteId: "fractions", position: 3 },
];

const ASSIGNED = [
    { questionId: "frac-1", skillId: "fractions" },
    { questionId: "frac-2", skillId: "fractions" },
    { questionId: "eq-1", skillId: "equations" },
    { questionId: "eq-2", skillId: "equations" },
    { questionId: "pct-1", skillId: "percentages" },
    { questionId: "pct-2", skillId: "percentages" },
];

const KEYS = [
    { questionId: "frac-1", correctOption: 0 },
    { questionId: "frac-2", correctOption: 1 },
    { questionId: "eq-1", correctOption: 0 },
    { questionId: "eq-2", correctOption: 1 },
    { questionId: "pct-1", correctOption: 1 },
    { questionId: "pct-2", correctOption: 2 },
];

const allCorrect = () => KEYS.map((k) => ({ questionId: k.questionId, selectedOption: k.correctOption }));

describe("gradeAttempt", () => {
    it("gives 100 when every answer is correct", () => {
        const result = gradeAttempt({ assigned: ASSIGNED, answers: allCorrect(), keys: KEYS });
        expect(result.score).toBe(100);
        expect(result.skills.every((s) => s.percent === 100)).toBe(true);
    });

    it("produces the same deterministic result for known answers", () => {
        const answers = allCorrect().map((a) =>
            a.questionId.startsWith("eq") ? { ...a, selectedOption: 3 } : a,
        );
        const result = gradeAttempt({ assigned: ASSIGNED, answers, keys: KEYS });

        expect(result.score).toBe(66.67);
        expect(result.skills.find((s) => s.skillId === "equations")).toEqual({
            skillId: "equations", correct: 0, total: 2, percent: 0,
        });
        expect(gradeAttempt({ assigned: ASSIGNED, answers, keys: KEYS })).toEqual(result);
    });

    it("counts unanswered questions as incorrect", () => {
        const answers = allCorrect().filter((a) => a.questionId !== "pct-2");
        const result = gradeAttempt({ assigned: ASSIGNED, answers, keys: KEYS });
        const item = result.items.find((i) => i.questionId === "pct-2");
        expect(item).toEqual({ questionId: "pct-2", selectedOption: null, isCorrect: false });
    });

    it("ignores a score or isCorrect sent by the client", () => {
        const answers = [{ questionId: "frac-1", selectedOption: 3, isCorrect: true, score: 100 }];
        const result = gradeAttempt({ assigned: ASSIGNED, answers, keys: KEYS });
        expect(result.items[0].isCorrect).toBe(false);
        expect(result.score).toBe(0);
    });

    it("rejects an answer to a question that was not assigned", () => {
        const answers = [{ questionId: "eq-4", selectedOption: 0 }];
        expect(() => gradeAttempt({ assigned: ASSIGNED, answers, keys: KEYS }))
            .toThrow(/not part of this attempt/);
    });

    it("rejects duplicate answers and invalid options", () => {
        const dup = [{ questionId: "frac-1", selectedOption: 0 }, { questionId: "frac-1", selectedOption: 1 }];
        expect(() => gradeAttempt({ assigned: ASSIGNED, answers: dup, keys: KEYS })).toThrow(/Duplicate/);

        const bad = [{ questionId: "frac-1", selectedOption: "0" }];
        expect(() => gradeAttempt({ assigned: ASSIGNED, answers: bad, keys: KEYS })).toThrow(/Invalid option/);
    });

    it("fails loudly when an answer key is missing", () => {
        const keys = KEYS.filter((k) => k.questionId !== "eq-2");
        expect(() => gradeAttempt({ assigned: ASSIGNED, answers: allCorrect(), keys }))
            .toThrow(/Missing answer key/);
    });
});

describe("buildPlan", () => {
    it("puts a weak prerequisite before the skill that depends on it", () => {
        const plan = buildPlan({
            skillResults: [
                { skillId: "fractions", percent: 50 },
                { skillId: "equations", percent: 0 },
                { skillId: "percentages", percent: 100 },
            ],
            skills: SKILLS,
            dailyMinutes: 20,
        });

        expect(plan.map((t) => t.skillId)).toEqual(["fractions", "equations"]);
        expect(plan[0].reason).toMatch(/متطلب سابق/);
        expect(plan.map((t) => t.position)).toEqual([1, 2]);
    });

    it("changes priorities when the errors change", () => {
        const skillsOnly = (results) =>
            buildPlan({ skillResults: results, skills: SKILLS, dailyMinutes: 30 }).map((t) => t.skillId);

        const weakInEquations = skillsOnly([
            { skillId: "fractions", percent: 100 },
            { skillId: "equations", percent: 0 },
            { skillId: "percentages", percent: 50 },
        ]);
        const weakInPercentages = skillsOnly([
            { skillId: "fractions", percent: 100 },
            { skillId: "equations", percent: 50 },
            { skillId: "percentages", percent: 0 },
        ]);

        expect(weakInEquations).toEqual(["equations", "percentages"]);
        expect(weakInPercentages).toEqual(["percentages", "equations"]);
    });

    it("never gives a task longer than the student's daily time", () => {
        const plan = buildPlan({
            skillResults: [{ skillId: "fractions", percent: 0 }],
            skills: SKILLS,
            dailyMinutes: 10,
        });
        expect(plan[0].minutes).toBe(10);
    });

    it("adds one challenge task when every skill is mastered", () => {
        const plan = buildPlan({
            skillResults: SKILLS.map((s) => ({ skillId: s.id, percent: 100 })),
            skills: SKILLS,
            dailyMinutes: 20,
        });
        expect(plan).toHaveLength(1);
        expect(plan[0].title).toMatch(/تحدٍّ/);
    });

    it("rejects invalid daily minutes and unknown skills", () => {
        const results = [{ skillId: "fractions", percent: 0 }];
        expect(() => buildPlan({ skillResults: results, skills: SKILLS, dailyMinutes: 0 })).toThrow(/dailyMinutes/);
        expect(() => buildPlan({ skillResults: [{ skillId: "chemistry", percent: 0 }], skills: SKILLS, dailyMinutes: 20 }))
            .toThrow(/Unknown skill/);
    });
});
