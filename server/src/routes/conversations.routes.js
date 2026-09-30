import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import { createConversation, listConversations, listMessages, saveUserMessage } from "../controllers/conversations.controller.js";
import { createConversationSchema, conversationParamsSchema, messageSchema, paginationSchema, demoReplySchema } from "../validators/conversations.validator.js";
import { createDemoReply } from "../controllers/demoReply.controller.js";
import chatRateLimit from "../middleware/chatRateLimit.js";

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
router.post("/:id/messages", chatRateLimit, validate(conversationParamsSchema, "params"), validate(messageSchema, "body"), saveUserMessage);
router.post("/:id/demo-reply", (req, res, next) => {
    const demoEnabled = process.env.NODE_ENV === "development" && process.env.CHAT_DEMO_ENABLED === "true";

        if (!demoEnabled)
        {
            return res.status(404).json({
                success: false,
                message: "API route not found",
            });
        }

        return next();
    },
    validate(conversationParamsSchema, "params"),
    validate(demoReplySchema, "body"),
    createDemoReply,
);

export default router;