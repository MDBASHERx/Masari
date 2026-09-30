import createUserClient from "../utils/createUserClient.js";

export const RECENT_LIMIT = 10;

/**
 * Progress derived ONLY from saved, graded attempts (FR12).
 * School marks are separate (grades API); finishing a task or a chat is not mastery.
 *
 * Each part is its own query, so no part can push another out of a limit:
 * - the latest diagnostic, whatever came after it
 * - complete practice totals, aggregated by the database (practice_summary)
 * - the most recent attempts, limited to RECENT_LIMIT
 */
export async function getProgress({ userId, accessToken }) {
    const supabase = createUserClient(accessToken);

    const [skills, latestDiagnostic, practiceSummary, recentAttempts, plan] = await Promise.all([
        supabase.from("skills").select("id, name, position").order("position"),
        supabase
            .from("attempts")
            .select("id, score, submitted_at, attempt_items ( is_correct, questions ( skill_id ) )")
            .eq("user_id", userId)
            .eq("type", "diagnostic")
            .eq("status", "submitted")
            .order("submitted_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        supabase.rpc("practice_summary"),
        supabase
            .from("attempts")
            .select("id, type, skill_id, score, submitted_at")
            .eq("user_id", userId)
            .eq("status", "submitted")
            .order("submitted_at", { ascending: false })
            .limit(RECENT_LIMIT),
        supabase
            .from("learning_plans")
            .select("id, plan_tasks ( status )")
            .eq("user_id", userId)
            .eq("is_current", true)
            .maybeSingle(),
    ]);

    for (const result of [skills, latestDiagnostic, practiceSummary, recentAttempts, plan]) {
        if (result.error) throw result.error;
    }

    return summarizeProgress({
        skills: skills.data,
        latestDiagnostic: latestDiagnostic.data,
        practiceSummary: practiceSummary.data,
        recentAttempts: recentAttempts.data,
        plan: plan.data,
    });
}

/**
 * Pure part of getProgress.
 * @param {object} input
 * @param {object[]} input.skills
 * @param {object|null} input.latestDiagnostic  with attempt_items
 * @param {{skill_id: string, attempts: number, correct: number, total: number, last_practiced_at: string}[]} input.practiceSummary
 * @param {object[]} input.recentAttempts  newest first
 * @param {object|null} input.plan
 */
export function summarizeProgress({ skills, latestDiagnostic, practiceSummary, recentAttempts, plan }) {
    const diagnosticBySkill = countBySkill(latestDiagnostic?.attempt_items ?? []);
    const practiceBySkill = new Map(practiceSummary.map((row) => [row.skill_id, row]));

    const tasks = plan?.plan_tasks ?? [];
    const nameOf = new Map(skills.map((s) => [s.id, s.name]));

    return {
        skills: skills.map((skill) => {
            const diagnostic = diagnosticBySkill.get(skill.id);
            const practiced = practiceBySkill.get(skill.id);
            const correct = Number(practiced?.correct ?? 0);
            const total = Number(practiced?.total ?? 0);

            return {
                skillId: skill.id,
                name: skill.name,
                diagnosticPercent: diagnostic ? percent(diagnostic) : null,
                practice: {
                    correct,
                    total,
                    percent: total > 0 ? percent({ correct, total }) : null,
                    attempts: Number(practiced?.attempts ?? 0),
                    lastPracticedAt: practiced?.last_practiced_at ?? null,
                },
            };
        }),
        latestDiagnostic: latestDiagnostic && {
            attemptId: latestDiagnostic.id,
            score: Number(latestDiagnostic.score),
            submittedAt: latestDiagnostic.submitted_at,
        },
        plan: plan && {
            totalTasks: tasks.length,
            doneTasks: tasks.filter((t) => t.status === "done").length,
        },
        recentAttempts: recentAttempts.slice(0, RECENT_LIMIT).map((a) => ({
            id: a.id,
            type: a.type,
            skillId: a.skill_id,
            skillName: a.skill_id ? nameOf.get(a.skill_id) ?? null : null,
            score: Number(a.score),
            submittedAt: a.submitted_at,
        })),
    };
}

function countBySkill(items) {
    const totals = new Map();
    for (const item of items) {
        const id = item.questions.skill_id;
        const t = totals.get(id) ?? { correct: 0, total: 0 };
        t.total += 1;
        if (item.is_correct) t.correct += 1;
        totals.set(id, t);
    }
    return totals;
}

function percent({ correct, total }) {
    return Math.round((correct / total) * 10000) / 100;
}
