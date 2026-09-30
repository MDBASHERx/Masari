import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import { createPlan, getCurrentPlan } from "../controllers/plans.controller.js";
import { addTask } from "../controllers/tasks.controller.js";

const router = Router();

// Protect all routes in this router
router.use(requireAuth);

router.post("/", createPlan);
router.get("/current", getCurrentPlan);
router.post("/:id/tasks", addTask);

export default router;
