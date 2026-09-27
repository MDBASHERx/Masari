import { LearningError } from "./errors.js";

/**
 * Grade an attempt. Pure function: no database, no network.
 *
 * @param {object} input
 * @param {{questionId: string, skillId: string, optionCount: number}[]} input.assigned
 *        Questions the SERVER assigned to this attempt. `optionCount` comes from
 *        trusted question data (jsonb_array_length(questions.options)), never from the client.
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
    throw new LearningError(
      "INTERNAL_ERROR",
      "Attempt has no assigned questions",
      500,
    );
  }
  if (!Array.isArray(answers)) {
    throw new LearningError("VALIDATION_ERROR", "Answers must be an array");
  }

  // ---- Trusted server data (a problem here is our bug => 500) ----
  const assignedById = new Map();
  for (const q of assigned) {
    if (
      !q ||
      typeof q.questionId !== "string" ||
      typeof q.skillId !== "string"
    ) {
      throw new LearningError(
        "INTERNAL_ERROR",
        "Invalid assigned question",
        500,
      );
    }
    if (!Number.isInteger(q.optionCount) || q.optionCount < 2) {
      throw new LearningError(
        "INTERNAL_ERROR",
        `Invalid option count for ${q.questionId}`,
        500,
      );
    }
    assignedById.set(q.questionId, q);
  }

  const keyByQuestion = new Map(
    keys.map((k) => [k.questionId, k.correctOption]),
  );

  // ---- Client data (a problem here is the student's input => 400) ----
  const answerByQuestion = new Map();
  answers.forEach((answer, index) => {
    if (
      answer === null ||
      typeof answer !== "object" ||
      Array.isArray(answer)
    ) {
      throw new LearningError(
        "VALIDATION_ERROR",
        `Answer at index ${index} must be an object`,
      );
    }
    if (
      typeof answer.questionId !== "string" ||
      answer.questionId.length === 0
    ) {
      throw new LearningError(
        "VALIDATION_ERROR",
        `Answer at index ${index} has an invalid questionId`,
      );
    }
    if (!Object.hasOwn(answer, "selectedOption")) {
      throw new LearningError(
        "VALIDATION_ERROR",
        `Answer at index ${index} is missing selectedOption (use null if unanswered)`,
      );
    }

    const question = assignedById.get(answer.questionId);
    if (!question) {
      throw new LearningError(
        "VALIDATION_ERROR",
        `Question ${answer.questionId} is not part of this attempt`,
      );
    }
    if (answerByQuestion.has(answer.questionId)) {
      throw new LearningError(
        "VALIDATION_ERROR",
        `Duplicate answer for ${answer.questionId}`,
      );
    }

    const option = answer.selectedOption;
    if (option !== null) {
      if (!Number.isInteger(option)) {
        throw new LearningError(
          "VALIDATION_ERROR",
          `Invalid option for ${answer.questionId}`,
        );
      }
      if (option < 0 || option >= question.optionCount) {
        throw new LearningError(
          "VALIDATION_ERROR",
          `Option ${option} is out of range for ${answer.questionId}`,
        );
      }
    }
    answerByQuestion.set(answer.questionId, option);
  });

  // ---- Grading ----
  const items = [];
  const skillTotals = new Map();

  for (const { questionId, skillId, optionCount } of assigned) {
    const correctOption = keyByQuestion.get(questionId);
    if (
      !Number.isInteger(correctOption) ||
      correctOption < 0 ||
      correctOption >= optionCount
    ) {
      throw new LearningError(
        "INTERNAL_ERROR",
        `Missing or invalid answer key for ${questionId}`,
        500,
      );
    }

    const selectedOption = answerByQuestion.get(questionId) ?? null; // unanswered = null
    const isCorrect =
      selectedOption !== null && selectedOption === correctOption;
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
