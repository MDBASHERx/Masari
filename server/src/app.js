import cors from "cors";
import express from "express";
import helmet from "helmet";

import attemptsRoutes from "./routes/attempts.routes.js";
import careerPathsRoutes from "./routes/careerPaths.routes.js";
import meRoutes from "./routes/me.routes.js";
import plansRoutes from "./routes/plans.routes.js";
import progressRoutes from "./routes/progress.routes.js";
import tasksRoutes from "./routes/tasks.routes.js";

const app = express();
app.use(helmet());

app.use(
    cors({
        origin: process.env.CLIENT_URL,
    }),
);

app.use(express.json({ limit: "100kb" }));

// Server health check
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "My Coach API is running",
    });
});

app.use("/api/me", meRoutes);
app.use("/api/attempts", attemptsRoutes);
app.use("/api/plans", plansRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/career-paths", careerPathsRoutes);

// Add feature routes above this middleware
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API route not found",
    });
});

// Error handler
app.use((error, req, res, next) => {
    if (res.headersSent) 
    {
        return next(error);
    }

    if (error.type === "entity.parse.failed") 
    {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON body",
        });
    }

    if (error.type === "entity.too.large") 
    {
        return res.status(413).json({
            success: false,
            message: "Request body is too large",
        });
    }

  console.error("Server error:", error.message);

    return res.status(500).json({
        success: false,
        message: "Internal server error",
    });
});

export default app;