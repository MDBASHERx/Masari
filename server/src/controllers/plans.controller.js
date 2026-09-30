import { LearningError } from "../services/learning/errors.js";
import * as plansService from "../services/plans.service.js";
import { createPlanSchema } from "../validators/plans.validator.js";

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

export const createPlan = async (req, res, next) => {
    const body = createPlanSchema.safeParse(req.body ?? {});
    if (!body.success) {
        return res.status(400).json({
            success: false,
            code: "VALIDATION_ERROR",
            message: "Invalid plan data",
            issues: body.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        });
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
        return handleError(error, res, next);
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
        return handleError(error, res, next);
    }
};
