import handleLearningError, { sendValidationError } from "../utils/handleLearningError.js";
import * as attemptsService from "../services/attempts.service.js";
import {
    attemptIdSchema,
    startAttemptSchema,
    submitAttemptSchema,
} from "../validators/attempts.validator.js";

export const startAttempt = async (req, res, next) => {
    const body = startAttemptSchema.safeParse(req.body ?? {});
    if (!body.success) return sendValidationError(res, "Invalid attempt data", body.error);

    try {
        const input = { userId: req.user.id, accessToken: req.accessToken };
        const { attempt, resumed } = body.data.type === "practice"
            ? await attemptsService.startPractice({ ...input, skillId: body.data.skillId })
            : await attemptsService.startDiagnostic(input);

        res.set("Cache-Control", "no-store");
        return res.status(resumed ? 200 : 201).json({ success: true, resumed, attempt });
    } catch (error) {
        return handleLearningError(error, res, next);
    }
};

export const getAttempt = async (req, res, next) => {
    const id = attemptIdSchema.safeParse(req.params.id);
    if (!id.success) return sendValidationError(res, "Invalid attempt id");

    try {
        const attempt = await attemptsService.getAttempt({
            accessToken: req.accessToken,
            attemptId: id.data,
        });

        res.set("Cache-Control", "no-store");
        return res.status(200).json({ success: true, attempt });
    } catch (error) {
        return handleLearningError(error, res, next);
    }
};

export const submitAttempt = async (req, res, next) => {
    const id = attemptIdSchema.safeParse(req.params.id);
    if (!id.success) return sendValidationError(res, "Invalid attempt id");

    const body = submitAttemptSchema.safeParse(req.body);
    if (!body.success) return sendValidationError(res, "Invalid submission", body.error);

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
        return handleLearningError(error, res, next);
    }
};
