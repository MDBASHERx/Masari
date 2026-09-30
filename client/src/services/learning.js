import API from "../api/axios.js";

// Set VITE_USE_MOCK_LEARNING=true in client/.env to work on the screens
// before the learning API is available. Mock data is labelled in the UI.
export const USE_MOCK_LEARNING = import.meta.env.VITE_USE_MOCK_LEARNING === "true";

const loadMock = () => import("./learning.mock.js");

// Starts a diagnostic, or resumes the open one
export const startDiagnostic = async () => {
    if (USE_MOCK_LEARNING) return (await loadMock()).startDiagnostic();

    const { data } = await API.post("/attempts", { type: "diagnostic" });

    return data.attempt;
};

// requestId must stay the same when retrying the same submission
export const submitAttempt = async (attemptId, answers, requestId) => {
    if (USE_MOCK_LEARNING) return (await loadMock()).submitAttempt(attemptId, answers);

    const { data } = await API.post(`/attempts/${attemptId}/submit`, { answers, requestId });

    return data.attempt;
};

export const createPlan = async (attemptId) => {
    if (USE_MOCK_LEARNING) return (await loadMock()).createPlan(attemptId);

    const { data } = await API.post("/plans", { attemptId });

    return data.plan;
};

// Guided practice on one skill (3 questions), or resumes the open one
export const startPractice = async (skillId) => {
    if (USE_MOCK_LEARNING) return (await loadMock()).startPractice(skillId);

    const { data } = await API.post("/attempts", { type: "practice", skillId });

    return data.attempt;
};

// The current plan, or null when the student has no plan yet
export const getCurrentPlan = async (signal) => {
    if (USE_MOCK_LEARNING) return (await loadMock()).getCurrentPlan();

    try {
        const { data } = await API.get("/plans/current", { signal });
        return data.plan;
    } catch (error) {
        if (error.response?.data?.code === "PLAN_NOT_FOUND") return null;
        throw error;
    }
};

export const addSuggestedTask = async (planId, task) => {
    const { data } = await API.post(`/plans/${planId}/tasks`, task);
    return data.task;
};

// Students can change the status only: "todo" | "in_progress" | "done"
export const updateTaskStatus = async (taskId, status) => {
    if (USE_MOCK_LEARNING) return (await loadMock()).updateTaskStatus(taskId, status);

    const { data } = await API.patch(`/tasks/${taskId}`, { status });

    return data.task;
};

// Maps an API error to a key in locale.learningErrors
export const learningErrorKey = (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;

    if (status === 401) return "sessionExpired";
    if (code === "ALREADY_SUBMITTED") return "alreadySubmitted";
    if (code === "PROFILE_NOT_FOUND") return "profileMissing";
    if (status === 400) return "invalidData";
    if (!error.response) return "network";

    return "generic";
};
