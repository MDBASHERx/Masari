import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import { getAttempt, startAttempt, submitAttempt } from "../controllers/attempts.controller.js";

const router = Router();

// Protect all routes in this router
router.use(requireAuth);

router.post("/", startAttempt);
router.get("/:id", getAttempt);
router.post("/:id/submit", submitAttempt);

export default router;
