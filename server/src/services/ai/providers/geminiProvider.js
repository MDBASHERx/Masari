import { LearningError } from "../../learning/errors.js";
import { toChatMessages } from "../generateTutorReply.js";

const replySchema = {
    type: "object",
    properties: {
        reply: {
            type: "string",
            description:
                "A helpful Arabic tutor reply. Maximum 2000 characters.",
        },
        suggestedTask: {
            anyOf: [
                {
                    type: "object",
                    properties: {
                        title: {
                            type: "string",
                            description: "Task title, maximum 120 characters.",
                        },
                        skillId: {
                            type: "string",
                            description:
                                "An existing skill ID from the learner context.",
                        },
                        minutes: {
                            type: "integer",
                            minimum: 5,
                            maximum: 120,
                        },
                    },
                    required: ["title", "skillId", "minutes"],
                    additionalProperties: false,
                },
                {
                    type: "null",
                },
            ],
        },
    },
    required: ["reply", "suggestedTask"],
    additionalProperties: false,
};

export const createGeminiProvider = () => ({
    name: "gemini",
    isDemo: false,

    async generate({ system, context, messages, signal }) {
        const apiKey = process.env.LLM_API_KEY?.trim();
        const model = process.env.LLM_MODEL?.trim();

        if (!apiKey || !model) {
            throw new LearningError(
                "AI_CONFIGURATION_ERROR",
                "The tutor service is not configured.",
                503,
            );
        }

        const contents = toChatMessages({ context, messages }).map(
            ({ role, content }) => ({
                role: role === "assistant" ? "model" : "user",
                parts: typeof content === "string"
                    ? [{ text: content }]
                    : content.map((part) => ({ text: part.text })),
            }),
        );

        const url =
            "https://generativelanguage.googleapis.com/v1beta/models/" +
            `${encodeURIComponent(model)}:generateContent`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey,
            },
            signal,
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: system }],
                },
                contents,
                generationConfig: {
                    maxOutputTokens: 4096,
                    responseMimeType: "application/json",
                    responseJsonSchema: replySchema,
                },
            }),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);

            console.error("[Gemini] Request rejected:", {
                httpStatus: response.status,
                status: errorBody?.error?.status,
            });

            if (response.status === 429) {
                throw new LearningError(
                    "AI_RATE_LIMITED",
                    "The tutor is busy. Please try again shortly.",
                    503,
                );
            }

            throw new LearningError(
                "AI_PROVIDER_ERROR",
                "The tutor is not available right now. Please try again.",
                502,
            );
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];

        if (
            data.promptFeedback?.blockReason ||
            !candidate ||
            candidate.finishReason !== "STOP"
        ) {
            throw new LearningError(
                "AI_BAD_OUTPUT",
                "The tutor could not complete this reply. Please try again.",
                502,
            );
        }

        const text = (candidate.content?.parts ?? [])
            .filter(
                (part) =>
                    part.thought !== true &&
                    typeof part.text === "string",
            )
            .map((part) => part.text)
            .join("")
            .trim();

        if (!text) {
            throw new LearningError(
                "AI_BAD_OUTPUT",
                "The tutor returned an empty reply. Please try again.",
                502,
            );
        }

        // The existing AI service validates the JSON and suggested task.
        return text;
    },
});
