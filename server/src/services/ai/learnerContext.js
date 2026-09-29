import createUserClient from "../../utils/createUserClient.js";

/**
 * Collect the small amount of learner data the AI needs. Everything is read
 * through RLS with the student's own token. The student's name is NOT included.
 *
 * @returns {Promise<{
 *   gradeLevel: number|null, goal: string, dailyMinutes: number,
 *   currentSkill: {id: string, name: string}|null,
 *   skillResults: {skillId: string, name: string, percent: number}[],
 *   nextTask: {title: string, skillId: string}|null,
 *   availableSkills: {id: string, name: string}[]
 * }>}
 */
export async function buildLearnerContext({ userId, accessToken, skillId = null }) {
    const supabase = createUserClient(accessToken);

    const [profile, skills, attempt, plan] = await Promise.all([
        supabase.from("profiles").select("grade_level, goal, daily_minutes").eq("id", userId).maybeSingle(),
        supabase.from("skills").select("id, name, position").order("position"),
        supabase
            .from("attempts")
            .select("id, attempt_items ( is_correct, questions ( skill_id ) )")
            .eq("user_id", userId)
            .eq("type", "diagnostic")
            .eq("status", "submitted")
            .order("submitted_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        supabase
            .from("learning_plans")
            .select("id, plan_tasks ( title, skill_id, status, position )")
            .eq("user_id", userId)
            .eq("is_current", true)
            .maybeSingle(),
    ]);

    for (const result of [profile, skills, attempt, plan]) {
        if (result.error) throw result.error;
    }

    return summarizeLearner({
        profile: profile.data,
        skills: skills.data,
        attempt: attempt.data,
        plan: plan.data,
        skillId,
    });
}

/** Pure part of buildLearnerContext, kept separate so it is easy to test. */
export function summarizeLearner({ profile, skills, attempt, plan, skillId }) {
    const nameOf = new Map(skills.map((s) => [s.id, s.name]));

    const totals = new Map();
    for (const item of attempt?.attempt_items ?? []) {
        const id = item.questions.skill_id;
        const t = totals.get(id) ?? { correct: 0, total: 0 };
        t.total += 1;
        if (item.is_correct) t.correct += 1;
        totals.set(id, t);
    }

    const nextTask = [...(plan?.plan_tasks ?? [])]
        .filter((task) => task.status !== "done")
        .sort((a, b) => a.position - b.position)[0];

    return {
        gradeLevel: profile?.grade_level ?? null,
        goal: (profile?.goal ?? "").slice(0, 200),
        dailyMinutes: profile?.daily_minutes ?? 30,
        currentSkill: skillId && nameOf.has(skillId) ? { id: skillId, name: nameOf.get(skillId) } : null,
        skillResults: [...totals.entries()].map(([id, t]) => ({
            skillId: id,
            name: nameOf.get(id) ?? id,
            percent: Math.round((t.correct / t.total) * 100),
        })),
        nextTask: nextTask ? { title: nextTask.title, skillId: nextTask.skill_id } : null,
        availableSkills: skills.map((s) => ({ id: s.id, name: s.name })),
    };
}
