import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";

import { createConversation, listConversations, listMessages, saveUserMessage } from "../controllers/conversations.controller.js";

import { createConversationSchema, conversationParamsSchema, messageSchema, paginationSchema } from "../validators/conversations.validator.js";

const router = Router();

const validate = (schema, source) => {
    return (req, res, next) => {
        const result = schema.safeParse(req[source]);

        if (!result.success) 
        {
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
};

router.use(requireAuth);

router.post("/", validate(createConversationSchema, "body"), createConversation);
router.get("/", validate(paginationSchema, "query"), listConversations);
router.get("/:id/messages", validate(conversationParamsSchema, "params"), validate(paginationSchema, "query"), listMessages);
router.post("/:id/messages", validate(conversationParamsSchema, "params"), validate(messageSchema, "body"), saveUserMessage);

export default router;