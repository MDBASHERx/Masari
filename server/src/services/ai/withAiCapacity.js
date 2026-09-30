import { LearningError } from "../learning/errors.js";

const maxConcurrent = Number(
    process.env.AI_MAX_CONCURRENT ?? 2,
);

if (
    !Number.isInteger(maxConcurrent) ||
    maxConcurrent < 1 ||
    maxConcurrent > 20
) {
    throw new Error(
        "AI_MAX_CONCURRENT must be an integer between 1 and 20",
    );
}

let activeRequests = 0;

export const withAiCapacity = async (run) => {
    if (activeRequests >= maxConcurrent) {
        throw new LearningError(
            "AI_BUSY",
            "The tutor is busy. Please try again shortly.",
            503,
        );
    }

    activeRequests += 1;

    try {
        return await run();
    } finally {
        activeRequests -= 1;
    }
};