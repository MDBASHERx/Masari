import createUserClient from "../utils/createUserClient.js";

const RECENT_LIMIT = 10;
const ATTEMPTS_LIMIT = 200;

/**
 * Progress derived ONLY from saved, graded attempts (FR12).
 * School marks are separate (grades API); finishing a task or a chat is not mastery.
 */
export async function getProgress({ userId, accessToken }) {
    const supabase = createUserClient(accessToken);

    const [skills, attempts, plan] = await Promise.all([
        supabase.from("skills").select("id, name, position").order("position"),
        supabase
            .from("attempts")
            .select("id, type, skill_id, score, submitted_at, attempt_items ( is_correct, questions ( skill_id ) )")
            .eq("user_id", userId)
            .eq("status", "submitted")
            .order("submitted_at", { ascending: false })
            .limit(ATTEMPTS_LIMIT),
        supabase
            .from("learning_plans")
            .select("id, plan_tasks ( status )")
            .eq("user_id", userId)
            .eq("is_current", true)
            .maybeSingle(),
    ]);

    for (const result of [skills, attempts, plan]) {
        if (result.error) throw result.error;
    }

    return summarizeProgress({ skills: skills.data, attempts: attempts.data, plan: plan.data });
}

/** Pure part of getProgress. `attempts` must be newest first. */
export function summarizeProgress({ skills, attempts, plan }) {
    const latestDiagnostic = attempts.find((a) => a.type === "diagnostic") ?? null;
    const diagnosticBySkill = countBySkill(latestDiagnostic?.attempt_items ?? []);

    const practice = attempts.filter((a) => a.type === "practice");
    const practiceBySkill = countBySkill(practice.flatMap((a) => a.attempt_items));

    const lastPracticedAt = new Map();
    for (const attempt of practice) {
        if (!lastPracticedAt.has(attempt.skill_id)) lastPracticedAt.set(attempt.skill_id, attempt.submitted_at);
    }

    const tasks = plan?.plan_tasks ?? [];
    const nameOf = new Map(skills.map((s) => [s.id, s.name]));

    return {
        skills: skills.map((skill) => {
            const diagnostic = diagnosticBySkill.get(skill.id);
            const practiced = practiceBySkill.get(skill.id);
            return {
                skillId: skill.id,
                name: skill.name,
                diagnosticPercent: diagnostic ? percent(diagnostic) : null,
                practice: {
                    correct: practiced?.correct ?? 0,
                    total: practiced?.total ?? 0,
                    percent: practiced ? percent(practiced) : null,
                    attempts: practice.filter((a) => a.skill_id === skill.id).length,
                    lastPracticedAt: lastPracticedAt.get(skill.id) ?? null,
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
        recentAttempts: attempts.slice(0, RECENT_LIMIT).map((a) => ({
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
