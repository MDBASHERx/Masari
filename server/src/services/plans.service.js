import createAdminClient from "../utils/createAdminClient.js";
import createUserClient from "../utils/createUserClient.js";
import { getAttempt } from "./attempts.service.js";
import { LearningError } from "./learning/errors.js";
import { buildPlan } from "./learning/planBuilder.js";

const PLAN_SELECT = `
    id, version, source_attempt_id, created_at,
    plan_tasks ( id, skill_id, title, minutes, status, position, reason, source,
        skills ( name ) )`;

/**
 * Build and save a plan from a submitted diagnostic.
 * Calling it again for the same attempt returns the existing plan.
 * @returns {Promise<{plan: object, created: boolean}>}
 */
export async function createPlanFromAttempt({ userId, accessToken, attemptId }) {
    // Read through RLS: 404 if the attempt is not the student's
    const attempt = await getAttempt({ accessToken, attemptId });

    if (attempt.type !== "diagnostic" || attempt.status !== "submitted") {
        throw new LearningError("ATTEMPT_NOT_SUBMITTED", "Submit the diagnostic before creating a plan", 409);
    }

    const supabase = createUserClient(accessToken);
    const [profileResult, skillsResult] = await Promise.all([
        supabase.from("profiles").select("daily_minutes").eq("id", userId).maybeSingle(),
        supabase.from("skills").select("id, name, prerequisite_id, position").order("position"),
    ]);

    if (profileResult.error) throw profileResult.error;
    if (skillsResult.error) throw skillsResult.error;
    if (!profileResult.data) {
        throw new LearningError("PROFILE_NOT_FOUND", "Profile not found", 404);
    }

    const tasks = buildPlan({
        skillResults: attempt.skills.map(({ skillId, percent }) => ({ skillId, percent })),
        skills: skillsResult.data.map((s) => ({
            id: s.id,
            name: s.name,
            prerequisiteId: s.prerequisite_id,
            position: s.position,
        })),
        dailyMinutes: profileResult.data.daily_minutes,
    });

    // The database function re-checks ownership and saves plan + tasks together
    const { data, error } = await createAdminClient().rpc("create_plan", {
        p_user_id: userId,
        p_attempt_id: attemptId,
        p_tasks: tasks,
    });
    if (error) throw error;

    return {
        plan: await getCurrentPlan({ userId, accessToken }),
        created: data.created,
    };
}

/** The student's current plan, read through RLS. */
export async function getCurrentPlan({ userId, accessToken }) {
    const { data, error } = await createUserClient(accessToken)
        .from("learning_plans")
        .select(PLAN_SELECT)
        .eq("user_id", userId)
        .eq("is_current", true)
        .maybeSingle();

    if (error) throw error;
    if (!data) throw new LearningError("PLAN_NOT_FOUND", "No learning plan yet", 404);

    return formatPlan(data);
}

export function formatTask(task) {
    return {
        id: task.id,
        skillId: task.skill_id,
        skillName: task.skills?.name ?? null,
        title: task.title,
        minutes: task.minutes,
        status: task.status,
        position: task.position,
        reason: task.reason,
        source: task.source,
    };
}

export function formatPlan(row) {
    const tasks = [...row.plan_tasks]
        .sort((a, b) => a.position - b.position)
        .map(formatTask);

    return {
        id: row.id,
        version: row.version,
        sourceAttemptId: row.source_attempt_id,
        createdAt: row.created_at,
        totalMinutes: tasks.reduce((sum, task) => sum + task.minutes, 0),
        tasks,
    };
}
