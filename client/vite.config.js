import process from "node:process";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ command, mode }) => {
    if (command === "build") {
        const env = { ...loadEnv(mode, process.cwd(), "VITE_"), ...process.env };
        for (const key of ["VITE_API_URL", "VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"]) {
            if (!env[key]?.trim()) throw new Error(`${key} is required to build the frontend`);
        }
        for (const key of ["VITE_API_URL", "VITE_SUPABASE_URL"]) {
            let url;
            try { url = new URL(env[key]); }
            catch { throw new Error(`${key} must be an absolute HTTP(S) URL`); }
            if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
                throw new Error(`${key} must be an HTTP(S) URL without credentials`);
            }
        }
        if (env.VITE_SUPABASE_PUBLISHABLE_KEY.startsWith("sb_secret_")) {
            throw new Error("Use a publishable Supabase key in the frontend, never a secret key");
        }
    }
    return { plugins: [react()] };
});
