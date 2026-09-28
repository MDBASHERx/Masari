import { LearningError } from "../services/learning/errors.js";

// 4xx LearningErrors are safe to show; everything else goes to the generic 500 handler
const handleLearningError = (error, res, next) => {
    if (error instanceof LearningError && error.status < 500) {
        return res.status(error.status).json({
            success: false,
            code: error.code,
            message: error.message,
        });
    }
    return next(error);
};

export const sendValidationError = (res, message, zodError) =>
    res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message,
        ...(zodError && {
            issues: zodError.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        }),
    });

export default handleLearningError;
