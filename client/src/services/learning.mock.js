// Fake learning API for UI work only. These are NOT the real questions,
// and the real answer keys never reach the browser.

const wait = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

const QUESTIONS = [
    { id: "mock-frac-1", skillId: "fractions", prompt: "ما ناتج 1/3 + 1/6 ؟", options: ["2/9", "1/2", "1/9", "2/6"], key: 1 },
    { id: "mock-frac-2", skillId: "fractions", prompt: "ما ناتج 2/5 × 10 ؟", options: ["4", "20", "1/25", "5/2"], key: 0 },
    { id: "mock-eq-1", skillId: "equations", prompt: "حُلّ المعادلة: 2x + 4 = 10", options: ["7", "6", "3", "14"], key: 2 },
    { id: "mock-eq-2", skillId: "equations", prompt: "حُلّ المعادلة: 3(x − 1) = 9", options: ["4", "2", "10/3", "12"], key: 0 },
    { id: "mock-pct-1", skillId: "percentages", prompt: "ما هو 10% من 250 ؟", options: ["2.5", "10", "25", "250"], key: 2 },
    { id: "mock-pct-2", skillId: "percentages", prompt: "بعد خصم 50% أصبح السعر 30. كم كان السعر الأصلي؟", options: ["45", "60", "15", "80"], key: 1 },
];

const toAttempt = (status, answers = null) => {
    const questions = QUESTIONS.map((q, index) => {
        const base = { id: q.id, skillId: q.skillId, prompt: q.prompt, options: q.options, position: index + 1 };
        if (!answers) return base;

        const selectedOption = answers.find((a) => a.questionId === q.id)?.selectedOption ?? null;
        return { ...base, selectedOption, isCorrect: selectedOption === q.key };
    });

    const skills = answers
        ? ["fractions", "equations", "percentages"].map((skillId) => {
            const items = questions.filter((q) => q.skillId === skillId);
            const correct = items.filter((q) => q.isCorrect).length;
            return { skillId, correct, total: items.length, percent: Math.round((correct / items.length) * 100) };
        })
        : null;

    const correct = questions.filter((q) => q.isCorrect).length;

    return {
        id: "mock-attempt",
        type: "diagnostic",
        skillId: null,
        status,
        score: answers ? Math.round((correct / questions.length) * 10000) / 100 : null,
        createdAt: new Date().toISOString(),
        submittedAt: answers ? new Date().toISOString() : null,
        questions,
        skills,
    };
};

export const startDiagnostic = async () => {
    await wait();
    return toAttempt("in_progress");
};

export const submitAttempt = async (attemptId, answers) => {
    await wait(700);
    return toAttempt("submitted", answers);
};

export const createPlan = async () => {
    await wait();
    return { id: "mock-plan", version: 1, tasks: [] };
};
