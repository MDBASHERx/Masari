import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import { getProfile, updateProfile } from "../controllers/profile.controller.js";

const router = Router();

// Protect all routes in this router
router.use(requireAuth);

router.get("/", (req, res) => {
    res.set("Cache-Control", "no-store");

    res.status(200).json({
        success: true,
        user: {
            id: req.user.id,
            email: req.user.email,
        },
    });
});

router.get("/profile", getProfile);
router.patch("/profile", updateProfile);

export default router;