import handleLearningError, { sendValidationError } from "../utils/handleLearningError.js";
import * as plansService from "../services/plans.service.js";
import { createPlanSchema } from "../validators/plans.validator.js";

export const createPlan = async (req, res, next) => {
    const body = createPlanSchema.safeParse(req.body ?? {});
    if (!body.success) {
        return sendValidationError(res, "Invalid plan data", body.error);
    }

    try {
        const { plan, created } = await plansService.createPlanFromAttempt({
            userId: req.user.id,
            accessToken: req.accessToken,
            attemptId: body.data.attemptId,
        });

        res.set("Cache-Control", "no-store");
        return res.status(created ? 201 : 200).json({ success: true, created, plan });
    } catch (error) {
        return handleLearningError(error, res, next);
    }
};

export const getCurrentPlan = async (req, res, next) => {
    try {
        const plan = await plansService.getCurrentPlan({
            userId: req.user.id,
            accessToken: req.accessToken,
        });

        res.set("Cache-Control", "no-store");
        return res.status(200).json({ success: true, plan });
    } catch (error) {
        return handleLearningError(error, res, next);
    }
};
