import dotenv from "dotenv";
import { validateEnv } from "./utils/validateEnv.js";

dotenv.config();

const startServer = async () => {
    validateEnv();

    const { default: app } = await import("./app.js");
    const { default: eventHandler } = await import(
        "./handlers/eventHandler.js"
    );

    await eventHandler(app);
};

startServer().catch((error) => {
    console.error("[STARTUP ERROR]", error.message);
    process.exit(1);
});