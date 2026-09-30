import createAdminClient from "../utils/createAdminClient.js";
import createUserClient from "../utils/createUserClient.js";
import { LearningError } from "./learning/errors.js";
import { formatTask } from "./plans.service.js";

const TASK_SELECT = "id, skill_id, title, minutes, status, position, reason, source, skills ( name )";

/**
 * Accept a task suggested in chat. Same requestId twice => same task.
 * @returns {Promise<{task: object, created: boolean}>}
 */
export async function addSuggestedTask({ userId, accessToken, planId, title, skillId, minutes, requestId }) {
    const supabase = createUserClient(accessToken);

    // Read through RLS: 404 if the plan is not the student's
    const { data: plan, error: planError } = await supabase
        .from("learning_plans")
        .select("id, is_current")
        .eq("id", planId)
        .maybeSingle();

    if (planError) throw planError;
    if (!plan) throw new LearningError("PLAN_NOT_FOUND", "Plan not found", 404);
    if (!plan.is_current) {
        throw new LearningError("PLAN_NOT_CURRENT", "Tasks can only be added to the current plan", 409);
    }

    // The AI may suggest a skill that does not exist: never trust it
    const { data: skill, error: skillError } = await supabase
        .from("skills")
        .select("id")
        .eq("id", skillId)
        .maybeSingle();

    if (skillError) throw skillError;
    if (!skill) throw new LearningError("VALIDATION_ERROR", `Unknown skill ${skillId}`, 400);

    const { data, error } = await createAdminClient().rpc("add_plan_task", {
        p_user_id: userId,
        p_plan_id: planId,
        p_skill_id: skillId,
        p_title: title,
        p_minutes: minutes,
        p_request_id: requestId,
    });
    if (error) throw error;

    // The task limit is enforced inside add_plan_task, under the per-student
    // lock, so concurrent requests cannot go over it (migration 20260929160000)
    if (data.planFull) {
        throw new LearningError("PLAN_FULL", `A plan can have at most ${data.maxTasks} tasks`, 409);
    }

    return {
        task: await getTask({ accessToken, taskId: data.taskId }),
        created: data.created,
    };
}

/** Change a task's status. RLS and column grants allow only the owner and only `status`. */
export async function updateTaskStatus({ accessToken, taskId, status }) {
    const { data, error } = await createUserClient(accessToken)
        .from("plan_tasks")
        .update({ status })
        .eq("id", taskId)
        .select(TASK_SELECT)
        .maybeSingle();

    if (error) throw error;
    if (!data) throw new LearningError("TASK_NOT_FOUND", "Task not found", 404);

    return formatTask(data);
}

async function getTask({ accessToken, taskId }) {
    const { data, error } = await createUserClient(accessToken)
        .from("plan_tasks")
        .select(TASK_SELECT)
        .eq("id", taskId)
        .maybeSingle();

    if (error) throw error;
    if (!data) throw new LearningError("TASK_NOT_FOUND", "Task not found", 404);

    return formatTask(data);
}
