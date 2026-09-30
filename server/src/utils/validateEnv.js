const requireValue = (name) => {
    const value = process.env[name]?.trim();

    if (!value) {
        throw new Error(`${name} is required`);
    }

    process.env[name] = value;
    return value;
};

const validateUrl = (name, { httpsOnly = false, originOnly = false } = {}) => {
    const value = requireValue(name);

    let url;

    try {
        url = new URL(value);
    } catch {
        throw new Error(`${name} must be a valid URL`);
    }

    if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password
    ) {
        throw new Error(`${name} must be an HTTP(S) URL without credentials`);
    }

    if (httpsOnly && url.protocol !== "https:") {
        throw new Error(`${name} must use HTTPS`);
    }

    if (originOnly && value !== url.origin) {
        throw new Error(
            `${name} must contain only the origin, without a path or trailing slash`,
        );
    }
};

const validateInteger = (name, fallback, min, max) => {
    const raw = process.env[name]?.trim() || String(fallback);
    const value = Number(raw);

    if (
        !Number.isInteger(value) ||
        value < min ||
        value > max
    ) {
        throw new Error(`${name} must be an integer between ${min} and ${max}`);
    }

    process.env[name] = String(value);
};

export const validateEnv = () => {
    const environment = process.env.NODE_ENV?.trim() || "development";

    if (!["development", "test", "production"].includes(environment)) {
        throw new Error("NODE_ENV must be development, test, or production");
    }

    process.env.NODE_ENV = environment;

    const production = environment === "production";

    validateInteger("PORT", 5000, 1, 65535);
    validateInteger("AI_TIMEOUT_MS", 30000, 1000, 45000);
    validateInteger("AI_MAX_CONCURRENT", 2, 1, 20);

    validateUrl("SUPABASE_URL", { httpsOnly: production });
    validateUrl("CLIENT_URL", {
        httpsOnly: production,
        originOnly: true,
    });

    requireValue("SUPABASE_PUBLISHABLE_KEY");
    requireValue("SUPABASE_SERVER_KEY");

    const provider = process.env.LLM_PROVIDER?.trim() || "mock";
    process.env.LLM_PROVIDER = provider;

    if (!["mock", "gemini"].includes(provider)) {
        throw new Error("LLM_PROVIDER must be mock or gemini");
    }

    if (provider === "gemini") {
        requireValue("LLM_API_KEY");
        requireValue("LLM_MODEL");
    }

    const demoEnabled = process.env.CHAT_DEMO_ENABLED?.trim() || "false";

    if (!["true", "false"].includes(demoEnabled)) {
        throw new Error("CHAT_DEMO_ENABLED must be true or false");
    }

    process.env.CHAT_DEMO_ENABLED = demoEnabled;

    if (production && provider === "mock") {
        throw new Error("Production requires a real AI provider");
    }

    if (production && demoEnabled === "true") {
        throw new Error("CHAT_DEMO_ENABLED must be false in production");
    }
};