import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import { updateTask } from "../controllers/tasks.controller.js";

const router = Router();

// Protect all routes in this router
router.use(requireAuth);

router.patch("/:id", updateTask);

export default router;
