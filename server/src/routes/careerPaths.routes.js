import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import { getCareerPaths } from "../controllers/careerPaths.controller.js";

const router = Router();

// Protect all routes in this router
router.use(requireAuth);

router.get("/", getCareerPaths);

export default router;
