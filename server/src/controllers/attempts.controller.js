import { LearningError } from "../services/learning/errors.js";
import * as attemptsService from "../services/attempts.service.js";
import {
    attemptIdSchema,
    startAttemptSchema,
    submitAttemptSchema,
} from "../validators/attempts.validator.js";

const validationError = (res, message, zodError) =>
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

// 4xx LearningErrors are safe to show; everything else goes to the generic 500 handler
const handleError = (error, res, next) => {
    if (error instanceof LearningError && error.status < 500) {
        return res.status(error.status).json({
            success: false,
            code: error.code,
            message: error.message,
        });
    }
    return next(error);
};

export const startAttempt = async (req, res, next) => {
    const body = startAttemptSchema.safeParse(req.body ?? {});
    if (!body.success) return validationError(res, "Invalid attempt data", body.error);

    try {
        const { attempt, resumed } = await attemptsService.startDiagnostic({
            userId: req.user.id,
            accessToken: req.accessToken,
        });

        res.set("Cache-Control", "no-store");
        return res.status(resumed ? 200 : 201).json({ success: true, resumed, attempt });
    } catch (error) {
        return handleError(error, res, next);
    }
};

export const getAttempt = async (req, res, next) => {
    const id = attemptIdSchema.safeParse(req.params.id);
    if (!id.success) return validationError(res, "Invalid attempt id");

    try {
        const attempt = await attemptsService.getAttempt({
            accessToken: req.accessToken,
            attemptId: id.data,
        });

        res.set("Cache-Control", "no-store");
        return res.status(200).json({ success: true, attempt });
    } catch (error) {
        return handleError(error, res, next);
    }
};

export const submitAttempt = async (req, res, next) => {
    const id = attemptIdSchema.safeParse(req.params.id);
    if (!id.success) return validationError(res, "Invalid attempt id");

    const body = submitAttemptSchema.safeParse(req.body);
    if (!body.success) return validationError(res, "Invalid submission", body.error);

    try {
        const attempt = await attemptsService.submitAttempt({
            userId: req.user.id,
            accessToken: req.accessToken,
            attemptId: id.data,
            answers: body.data.answers,
            requestId: body.data.requestId,
        });

        res.set("Cache-Control", "no-store");
        return res.status(200).json({ success: true, attempt });
    } catch (error) {
        return handleError(error, res, next);
    }
};
