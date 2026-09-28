import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import { createPlan, getCurrentPlan } from "../controllers/plans.controller.js";

const router = Router();

// Protect all routes in this router
router.use(requireAuth);

router.post("/", createPlan);
router.get("/current", getCurrentPlan);

export default router;
