import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";

import {
    createGrade,
    listGrades,
    updateGrade,
} from "../controllers/grades.controller.js";

import {
    createGradeSchema,
    gradesQuerySchema,
    gradeParamsSchema,
    updateGradeSchema,
} from "../validators/grades.validator.js";

const router = Router();

const validate = (schema, source) => (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
        return res.status(400).json({
            success: false,
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            issues: result.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        });
    }

    req.validated ??= {};
    req.validated[source] = result.data;

    return next();
};

router.use(requireAuth);

router.get(
    "/",
    validate(gradesQuerySchema, "query"),
    listGrades,
);

router.post(
    "/",
    validate(createGradeSchema, "body"),
    createGrade,
);

router.patch(
    "/:id",
    validate(gradeParamsSchema, "params"),
    validate(updateGradeSchema, "body"),
    updateGrade,
);

export default router;