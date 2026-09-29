import createAdminClient from "../utils/createAdminClient.js";
import createUserClient from "../utils/createUserClient.js";
import { LearningError } from "./learning/errors.js";
import { gradeAttempt } from "./learning/grading.js";

export const QUESTIONS_PER_SKILL = 2;
export const PRACTICE_QUESTIONS = 3;

const ATTEMPT_SELECT = `
    id, type, skill_id, status, score, created_at, submitted_at,
    attempt_items ( question_id, position, selected_option, is_correct,
        questions ( skill_id, prompt, options ) )`;

// ---------- Start ----------

/**
 * Start a diagnostic, or resume the student's open one.
 * @returns {Promise<{attempt: object, resumed: boolean}>}
 */
export async function startDiagnostic({ userId, accessToken }) {
    const admin = createAdminClient();

    const open = await findOpenAttemptId(admin, userId, "diagnostic");
    if (open) {
        return { attempt: await getAttempt({ accessToken, attemptId: open }), resumed: true };
    }

    const questionIds = await pickDiagnosticQuestions(createUserClient(accessToken));

    const { data: attemptId, error } = await admin.rpc("start_attempt", {
        p_user_id: userId,
        p_type: "diagnostic",
        p_skill_id: null,
        p_question_ids: questionIds,
    });

    if (error) {
        // Two "start" clicks at the same time: the database kept only one
        if (error.code === "23505") {
            const existing = await findOpenAttemptId(admin, userId, "diagnostic");
            if (existing) {
                return { attempt: await getAttempt({ accessToken, attemptId: existing }), resumed: true };
            }
        }
        throw error;
    }

    return { attempt: await getAttempt({ accessToken, attemptId }), resumed: false };
}

async function findOpenAttemptId(admin, userId, type, skillId = null) {
    let query = admin
        .from("attempts")
        .select("id")
        .eq("user_id", userId)
        .eq("type", type)
        .eq("status", "in_progress");

    if (type === "practice") query = query.eq("skill_id", skillId);

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data?.id ?? null;
}

// First QUESTIONS_PER_SKILL active questions of each skill, easiest first
async function pickDiagnosticQuestions(supabase) {
    const [skillsResult, questionsResult] = await Promise.all([
        supabase.from("skills").select("id, position").order("position"),
        supabase.from("questions").select("id, skill_id, difficulty").eq("is_active", true)
            .order("difficulty").order("id"),
    ]);

    if (skillsResult.error) throw skillsResult.error;
    if (questionsResult.error) throw questionsResult.error;

    const questionIds = skillsResult.data.flatMap((skill) =>
        questionsResult.data
            .filter((q) => q.skill_id === skill.id)
            .slice(0, QUESTIONS_PER_SKILL)
            .map((q) => q.id),
    );

    if (questionIds.length === 0) {
        throw new LearningError("INTERNAL_ERROR", "No active questions available", 500);
    }
    return questionIds;
}

/**
 * Start guided practice on one skill, or resume the open one for that skill.
 * Questions the student has seen least come first.
 * @returns {Promise<{attempt: object, resumed: boolean}>}
 */
export async function startPractice({ userId, accessToken, skillId }) {
    const admin = createAdminClient();

    const open = await findOpenAttemptId(admin, userId, "practice", skillId);
    if (open) {
        return { attempt: await getAttempt({ accessToken, attemptId: open }), resumed: true };
    }

    const questionIds = await pickPracticeQuestions(createUserClient(accessToken), skillId);

    const { data: attemptId, error } = await admin.rpc("start_attempt", {
        p_user_id: userId,
        p_type: "practice",
        p_skill_id: skillId,
        p_question_ids: questionIds,
    });

    if (error) {
        if (error.code === "23505") {
            const existing = await findOpenAttemptId(admin, userId, "practice", skillId);
            if (existing) {
                return { attempt: await getAttempt({ accessToken, attemptId: existing }), resumed: true };
            }
        }
        throw error;
    }

    return { attempt: await getAttempt({ accessToken, attemptId }), resumed: false };
}

async function pickPracticeQuestions(supabase, skillId) {
    const [skillResult, questionsResult, seenResult] = await Promise.all([
        supabase.from("skills").select("id").eq("id", skillId).maybeSingle(),
        supabase.from("questions").select("id, difficulty").eq("skill_id", skillId).eq("is_active", true)
            .order("difficulty").order("id"),
        // RLS returns only this student's items
        supabase.from("attempt_items").select("question_id").limit(1000),
    ]);

    for (const result of [skillResult, questionsResult, seenResult]) {
        if (result.error) throw result.error;
    }
    if (!skillResult.data) {
        throw new LearningError("VALIDATION_ERROR", `Unknown skill ${skillId}`, 400);
    }

    const timesSeen = new Map();
    for (const { question_id: id } of seenResult.data) {
        timesSeen.set(id, (timesSeen.get(id) ?? 0) + 1);
    }

    const questionIds = [...questionsResult.data]
        .sort((a, b) =>
            (timesSeen.get(a.id) ?? 0) - (timesSeen.get(b.id) ?? 0)
            || a.difficulty - b.difficulty
            || a.id.localeCompare(b.id))
        .slice(0, PRACTICE_QUESTIONS)
        .map((q) => q.id);

    if (questionIds.length === 0) {
        throw new LearningError("INTERNAL_ERROR", `No active questions for ${skillId}`, 500);
    }
    return questionIds;
}

// ---------- Read ----------

/** Read an attempt through RLS: only the owner can see it. */
export async function getAttempt({ accessToken, attemptId }) {
    const { data, error } = await createUserClient(accessToken)
        .from("attempts")
        .select(ATTEMPT_SELECT)
        .eq("id", attemptId)
        .maybeSingle();

    if (error) throw error;
    if (!data) throw new LearningError("ATTEMPT_NOT_FOUND", "Attempt not found", 404);

    return formatAttempt(data);
}

export function formatAttempt(row) {
    const submitted = row.status === "submitted";
    const items = [...row.attempt_items].sort((a, b) => a.position - b.position);

    return {
        id: row.id,
        type: row.type,
        skillId: row.skill_id ?? null,
        status: row.status,
        score: row.score === null ? null : Number(row.score),
        createdAt: row.created_at,
        submittedAt: row.submitted_at,
        // Never includes the correct option
        questions: items.map((item) => ({
            id: item.question_id,
            skillId: item.questions.skill_id,
            prompt: item.questions.prompt,
            options: item.questions.options,
            position: item.position,
            ...(submitted && { selectedOption: item.selected_option, isCorrect: item.is_correct }),
        })),
        skills: submitted ? summarizeSkills(items) : null,
    };
}

function summarizeSkills(items) {
    const totals = new Map();
    for (const item of items) {
        const t = totals.get(item.questions.skill_id) ?? { correct: 0, total: 0 };
        t.total += 1;
        if (item.is_correct) t.correct += 1;
        totals.set(item.questions.skill_id, t);
    }
    return [...totals.entries()].map(([skillId, t]) => ({
        skillId,
        correct: t.correct,
        total: t.total,
        percent: Math.round((t.correct / t.total) * 10000) / 100,
    }));
}

// ---------- Submit ----------

/**
 * Grade and save an attempt once. Retrying with the same requestId
 * returns the saved result; a different requestId gets 409.
 */
export async function submitAttempt({ userId, accessToken, attemptId, answers, requestId }) {
    const admin = createAdminClient();

    // Admin client bypasses RLS, so ownership is checked HERE with user_id
    const attempt = await loadOwnedAttempt(admin, attemptId, userId);

    if (attempt.status !== "in_progress") {
        return alreadySubmitted({ attempt, accessToken, requestId });
    }

    const assigned = attempt.attempt_items.map((item) => ({
        questionId: item.question_id,
        skillId: item.questions.skill_id,
        optionCount: item.questions.options.length,
    }));

    const { data: keyRows, error: keyError } = await admin.rpc("get_answer_keys", {
        p_question_ids: assigned.map((a) => a.questionId),
    });
    if (keyError) throw keyError;

    const result = gradeAttempt({
        assigned,
        answers,
        keys: keyRows.map((k) => ({ questionId: k.question_id, correctOption: k.correct_option })),
    });

    const { data: saved, error: saveError } = await admin.rpc("save_attempt_result", {
        p_attempt_id: attemptId,
        p_user_id: userId,
        p_request_id: requestId,
        p_score: result.score,
        p_items: result.items,
    });
    if (saveError) throw saveError;

    if (!saved) {
        // Another request submitted it between our read and our write
        const latest = await loadOwnedAttempt(admin, attemptId, userId);
        return alreadySubmitted({ attempt: latest, accessToken, requestId });
    }

    return getAttempt({ accessToken, attemptId });
}

async function loadOwnedAttempt(admin, attemptId, userId) {
    const { data, error } = await admin
        .from("attempts")
        .select("id, status, submit_request_id, attempt_items ( question_id, questions ( skill_id, options ) )")
        .eq("id", attemptId)
        .eq("user_id", userId)
        .maybeSingle();

    if (error) throw error;
    if (!data) throw new LearningError("ATTEMPT_NOT_FOUND", "Attempt not found", 404);
    return data;
}

async function alreadySubmitted({ attempt, accessToken, requestId }) {
    if (attempt.submit_request_id === requestId) {
        return getAttempt({ accessToken, attemptId: attempt.id }); // safe retry
    }
    throw new LearningError("ALREADY_SUBMITTED", "This attempt was already submitted", 409);
}
