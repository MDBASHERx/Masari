import createUserClient from "../utils/createUserClient.js";
import { updateProfileSchema } from "../validators/profile.validator.js";

const profileFields = "id, full_name, grade_level, goal, daily_minutes, created_at, updated_at";

export const getProfile = async (req, res, next) => {
    try {
        const supabase = createUserClient(req.accessToken);

        const { data, error } = await supabase
            .from("profiles")
            .select(profileFields)
            .eq("id", req.user.id)
            .maybeSingle();

        if (error) 
        {
            return next(error);
        }

        if (!data) 
        {
            return res.status(404).json({
                success: false,
                code: "PROFILE_NOT_FOUND",
                message: "Profile not found",
            });
        }

        res.set("Cache-Control", "no-store");

        return res.status(200).json({
            success: true,
            profile: data,
        });
    } catch (error) {
        return next(error);
    }
};

export const updateProfile = async (req, res, next) => {
    const result = updateProfileSchema.safeParse(req.body);

    if (!result.success) 
    {
        return res.status(400).json({
            success: false,
            code: "VALIDATION_ERROR",
            message: "Invalid profile data",
            issues: result.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        });
    }

    try {
        const supabase = createUserClient(req.accessToken);

        const { data, error } = await supabase
            .from("profiles")
            .update(result.data)
            .eq("id", req.user.id)
            .select(profileFields)
            .maybeSingle();

        if (error) 
        {
            return next(error);
        }

        if (!data) 
        {
            return res.status(404).json({
                success: false,
                code: "PROFILE_NOT_FOUND",
                message: "Profile not found",
            });
        }

        res.set("Cache-Control", "no-store");

        return res.status(200).json({
            success: true,
            profile: data,
        });
    } catch (error) {
        return next(error);
    }
};