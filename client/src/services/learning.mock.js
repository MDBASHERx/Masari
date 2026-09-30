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
    if (attemptId === "mock-practice") return submitPracticeAttempt(answers);

    await wait(700);
    return toAttempt("submitted", answers);
};

// ---------- Plan (kept in memory for this browser tab) ----------

let mockPlan = null;

export const createPlan = async (attemptId) => {
    await wait();

    // Same idea as the real plan builder: weak prerequisite first, with reasons
    mockPlan = {
        id: "mock-plan",
        version: 1,
        sourceAttemptId: attemptId,
        isCurrent: true,
        createdAt: new Date().toISOString(),
        tasks: [
            {
                id: "mock-task-1", skillId: "fractions", skillName: "الكسور", title: "تدريب على الكسور",
                minutes: 10, status: "todo", position: 1, source: "plan",
                reason: "الكسور متطلب سابق للمعادلات، لذلك نبدأ به",
            },
            {
                id: "mock-task-2", skillId: "equations", skillName: "المعادلات", title: "مراجعة أساسيات المعادلات مع المعلم",
                minutes: 20, status: "todo", position: 2, source: "plan",
                reason: "نتيجتك في المعادلات كانت 0%",
            },
        ],
    };
    mockPlan.totalMinutes = mockPlan.tasks.reduce((sum, task) => sum + task.minutes, 0);

    return mockPlan;
};

export const getCurrentPlan = async () => {
    await wait();
    return mockPlan;
};

export const updateTaskStatus = async (taskId, status) => {
    await wait(250);
    const task = mockPlan?.tasks.find((t) => t.id === taskId);
    if (!task) throw Object.assign(new Error("Task not found"), { response: { status: 404, data: {} } });

    task.status = status;
    return { ...task };
};

// ---------- Practice ----------

const PRACTICE = {
    fractions: [
        { id: "mock-frac-p1", prompt: "ما ناتج 3/4 − 1/2 ؟", options: ["1/4", "2/2", "1/2", "2/4"], key: 0 },
        { id: "mock-frac-p2", prompt: "ما ناتج 2/3 × 3/5 ؟", options: ["5/8", "2/5", "6/8", "3/5"], key: 1 },
        { id: "mock-frac-p3", prompt: "أيّ كسر يساوي 3/5 ؟", options: ["5/3", "9/10", "6/10", "3/10"], key: 2 },
    ],
    equations: [
        { id: "mock-eq-p1", prompt: "حُلّ المعادلة: x − 4 = 9", options: ["5", "13", "-5", "36"], key: 1 },
        { id: "mock-eq-p2", prompt: "حُلّ المعادلة: 5x = 35", options: ["7", "30", "40", "175"], key: 0 },
        { id: "mock-eq-p3", prompt: "حُلّ المعادلة: 2(x + 3) = 14", options: ["11", "8", "7/2", "4"], key: 3 },
    ],
    percentages: [
        { id: "mock-pct-p1", prompt: "ما هو 20% من 150 ؟", options: ["20", "30", "130", "75"], key: 1 },
        { id: "mock-pct-p2", prompt: "اكتب 0.4 على شكل نسبة مئوية", options: ["4%", "0.4%", "40%", "400%"], key: 2 },
        { id: "mock-pct-p3", prompt: "سعر 80 وعليه خصم 25%. كم السعر بعد الخصم؟", options: ["60", "55", "20", "105"], key: 0 },
    ],
};

let practiceSkill = null;

const toPractice = (skillId, status, answers = null) => {
    const questions = PRACTICE[skillId].map((q, index) => {
        const base = { id: q.id, skillId, prompt: q.prompt, options: q.options, position: index + 1 };
        if (!answers) return base;
        const selectedOption = answers.find((a) => a.questionId === q.id)?.selectedOption ?? null;
        return { ...base, selectedOption, isCorrect: selectedOption === q.key };
    });
    const correct = questions.filter((q) => q.isCorrect).length;

    return {
        id: "mock-practice",
        type: "practice",
        skillId,
        status,
        score: answers ? Math.round((correct / questions.length) * 10000) / 100 : null,
        createdAt: new Date().toISOString(),
        submittedAt: answers ? new Date().toISOString() : null,
        questions,
        skills: answers
            ? [{ skillId, correct, total: questions.length, percent: Math.round((correct / questions.length) * 100) }]
            : null,
    };
};

export const startPractice = async (skillId) => {
    await wait();
    practiceSkill = skillId;
    return toPractice(skillId, "in_progress");
};

export const submitPracticeAttempt = async (answers) => {
    await wait(700);
    return toPractice(practiceSkill, "submitted", answers);
};
