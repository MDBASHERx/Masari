import { readFileSync } from "node:fs";

// Curated static content, read once at startup
const careerPaths = JSON.parse(
    readFileSync(new URL("../data/career-paths.json", import.meta.url), "utf8"),
);

// GET /api/career-paths
export const getCareerPaths = (req, res) => {
    res.set("Cache-Control", "private, max-age=300");
    return res.status(200).json({ success: true, careerPaths });
};
