import { LearningError } from "./errors.js";

/**
 * Grade an attempt. Pure function: no database, no network.
 *
 * @param {object} input
 * @param {{questionId: string, skillId: string}[]} input.assigned
 *        Questions the SERVER assigned to this attempt (from attempt_items).
 * @param {{questionId: string, selectedOption: number|null}[]} input.answers
 *        What the student sent. Any other fields (score, isCorrect...) are ignored.
 * @param {{questionId: string, correctOption: number}[]} input.keys
 *        Answer keys (from get_answer_keys, server only).
 *
 * @returns {{
 *   score: number,
 *   items: {questionId: string, selectedOption: number|null, isCorrect: boolean}[],
 *   skills: {skillId: string, correct: number, total: number, percent: number}[]
 * }}
 */
export function gradeAttempt({ assigned, answers, keys }) {
    if (!Array.isArray(assigned) || assigned.length === 0) {
        throw new LearningError("VALIDATION_ERROR", "Attempt has no assigned questions");
    }
    if (!Array.isArray(answers)) {
        throw new LearningError("VALIDATION_ERROR", "Answers must be an array");
    }

    const keyByQuestion = new Map(keys.map((k) => [k.questionId, k.correctOption]));
    const assignedIds = new Set(assigned.map((a) => a.questionId));

    // Validate answers: only assigned questions, no duplicates, integer options
    const answerByQuestion = new Map();
    for (const answer of answers) {
        if (!assignedIds.has(answer.questionId)) {
            throw new LearningError("VALIDATION_ERROR", `Question ${answer.questionId} is not part of this attempt`);
        }
        if (answerByQuestion.has(answer.questionId)) {
            throw new LearningError("VALIDATION_ERROR", `Duplicate answer for ${answer.questionId}`);
        }
        const option = answer.selectedOption;
        if (option !== null && (!Number.isInteger(option) || option < 0)) {
            throw new LearningError("VALIDATION_ERROR", `Invalid option for ${answer.questionId}`);
        }
        answerByQuestion.set(answer.questionId, option);
    }

    const items = [];
    const skillTotals = new Map();

    for (const { questionId, skillId } of assigned) {
        if (!keyByQuestion.has(questionId)) {
            // Server-side data problem, not the student's fault
            throw new LearningError("INTERNAL_ERROR", `Missing answer key for ${questionId}`, 500);
        }

        const selectedOption = answerByQuestion.get(questionId) ?? null; // unanswered = null
        const isCorrect = selectedOption !== null && selectedOption === keyByQuestion.get(questionId);
        items.push({ questionId, selectedOption, isCorrect });

        const totals = skillTotals.get(skillId) ?? { correct: 0, total: 0 };
        totals.total += 1;
        if (isCorrect) totals.correct += 1;
        skillTotals.set(skillId, totals);
    }

    const correctCount = items.filter((i) => i.isCorrect).length;

    const skills = [...skillTotals.entries()].map(([skillId, t]) => ({
        skillId,
        correct: t.correct,
        total: t.total,
        percent: toPercent(t.correct, t.total),
    }));

    return {
        score: toPercent(correctCount, items.length),
        items,
        skills,
    };
}

function toPercent(part, whole) {
    return Math.round((part / whole) * 10000) / 100; // 2 decimals
}
