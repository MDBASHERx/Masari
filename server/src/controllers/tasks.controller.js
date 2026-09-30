import handleLearningError, { sendValidationError } from "../utils/handleLearningError.js";
import * as tasksService from "../services/tasks.service.js";
import { addTaskSchema, idSchema, updateTaskSchema } from "../validators/tasks.validator.js";

// POST /api/plans/:id/tasks — accept a task suggested in chat
export const addTask = async (req, res, next) => {
    const planId = idSchema.safeParse(req.params.id);
    if (!planId.success) return sendValidationError(res, "Invalid plan id");

    const body = addTaskSchema.safeParse(req.body ?? {});
    if (!body.success) return sendValidationError(res, "Invalid task data", body.error);

    try {
        const { task, created } = await tasksService.addSuggestedTask({
            userId: req.user.id,
            accessToken: req.accessToken,
            planId: planId.data,
            ...body.data,
        });

        res.set("Cache-Control", "no-store");
        return res.status(created ? 201 : 200).json({ success: true, created, task });
    } catch (error) {
        return handleLearningError(error, res, next);
    }
};

// PATCH /api/tasks/:id — change status only
export const updateTask = async (req, res, next) => {
    const taskId = idSchema.safeParse(req.params.id);
    if (!taskId.success) return sendValidationError(res, "Invalid task id");

    const body = updateTaskSchema.safeParse(req.body ?? {});
    if (!body.success) return sendValidationError(res, "Invalid task data", body.error);

    try {
        const task = await tasksService.updateTaskStatus({
            accessToken: req.accessToken,
            taskId: taskId.data,
            status: body.data.status,
        });

        res.set("Cache-Control", "no-store");
        return res.status(200).json({ success: true, task });
    } catch (error) {
        return handleLearningError(error, res, next);
    }
};
