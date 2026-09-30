import { rateLimit } from "express-rate-limit";

const chatRateLimit = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,

    standardHeaders: "draft-8",
    legacyHeaders: false,

    // requireAuth must run before this middleware.
    keyGenerator: (req) => req.user.id,

    handler: (req, res) => {
        const retryAfterSeconds = Math.max(
            1,
            Number(res.getHeader("Retry-After")) || 60,
        );

        return res.status(429).json({
            success: false,
            code: "CHAT_RATE_LIMITED",
            message: "Too many messages. Please try again shortly.",
            retryAfterSeconds,
        });
    },
});

export default chatRateLimit;