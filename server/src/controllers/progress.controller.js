import handleLearningError from "../utils/handleLearningError.js";
import * as progressService from "../services/progress.service.js";

// GET /api/progress
export const getProgress = async (req, res, next) => {
    try {
        const progress = await progressService.getProgress({
            userId: req.user.id,
            accessToken: req.accessToken,
        });

        res.set("Cache-Control", "no-store");
        return res.status(200).json({ success: true, progress });
    } catch (error) {
        return handleLearningError(error, res, next);
    }
};
