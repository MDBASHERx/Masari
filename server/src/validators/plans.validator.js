import { z } from "zod";

export const createPlanSchema = z
    .object({
        attemptId: z.uuid(),
    })
    .strict();
