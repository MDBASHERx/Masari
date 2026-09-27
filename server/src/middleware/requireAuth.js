const requireAuth = async (req, res, next) => {
    const authorization = req.get("Authorization") || "";
    const match = authorization.match(/^Bearer\s+(\S+)$/i);

    if (!match) 
    {
        return res.status(401).json({
            success: false,
            code: "UNAUTHORIZED",
            message: "A valid access token is required",
        });
    }

    const supabase = req.app.locals.supabase;

    if (!supabase) 
    {
        return res.status(503).json({
            success: false,
            code: "AUTH_UNAVAILABLE",
            message: "Authentication service is unavailable",
        });
    }

    try {
        const { data, error } = await supabase.auth.getUser(match[1]);

        if (error) 
        {
            const invalidToken = [400, 401, 403].includes(error.status);

            return res.status(invalidToken ? 401 : 503).json({
                success: false,
                code: invalidToken ? "UNAUTHORIZED" : "AUTH_UNAVAILABLE",
                message: invalidToken
                    ? "Invalid or expired access token"
                    : "Authentication service is unavailable",
            });
        }

        if (!data.user) 
        {
            return res.status(401).json({
                success: false,
                code: "UNAUTHORIZED",
                message: "Invalid or expired access token",
            });
        }

        req.user = data.user;
        req.accessToken = match[1];

        return next();
    } catch (error) {
        return next(error);
    }
};

export default requireAuth;