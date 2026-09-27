import { LearningError } from "./errors.js";

export const MASTERY_THRESHOLD = 75; // percent at or above = no practice needed
const WEAK_THRESHOLD = 50;           // below = start with basics (longer task)

/**
 * Build an ordered learning plan from skill results. Pure function.
 *
 * Ordering rules:
 *  1. Only skills below MASTERY_THRESHOLD get tasks.
 *  2. A weak prerequisite always comes before the skill that depends on it.
 *  3. Otherwise, the lowest result comes first; ties use the skill position.
 *  4. Task length depends on the gap, and never exceeds the daily minutes.
 *  If every skill is mastered, one short challenge task is added.
 *
 * @param {object} input
 * @param {{skillId: string, percent: number}[]} input.skillResults  from gradeAttempt().skills
 * @param {{id: string, name: string, prerequisiteId: string|null, position: number}[]} input.skills
 * @param {number} input.dailyMinutes  from the student's profile
 *
 * @returns {{skillId: string, title: string, minutes: number, position: number, reason: string}[]}
 */
export function buildPlan({ skillResults, skills, dailyMinutes }) {
    if (!Number.isInteger(dailyMinutes) || dailyMinutes < 5 || dailyMinutes > 240) {
        throw new LearningError("VALIDATION_ERROR", "dailyMinutes must be an integer between 5 and 240");
    }
    if (!Array.isArray(skillResults) || skillResults.length === 0) {
        throw new LearningError("VALIDATION_ERROR", "No skill results to build a plan from");
    }

    const skillById = new Map(skills.map((s) => [s.id, s]));
    const percentBySkill = new Map(skillResults.map((r) => [r.skillId, r.percent]));

    for (const { skillId } of skillResults) {
        if (!skillById.has(skillId)) {
            throw new LearningError("VALIDATION_ERROR", `Unknown skill ${skillId}`);
        }
    }

    const isWeak = (id) => percentBySkill.has(id) && percentBySkill.get(id) < MASTERY_THRESHOLD;

    // Weak skills, lowest result first, then by curriculum position
    const weak = skillResults
        .filter((r) => isWeak(r.skillId))
        .sort((a, b) => a.percent - b.percent || skillById.get(a.skillId).position - skillById.get(b.skillId).position)
        .map((r) => r.skillId);

    // Nobody is perfect forever: keep one short challenge task
    if (weak.length === 0) {
        const lowest = [...skillResults].sort((a, b) => a.percent - b.percent)[0];
        const skill = skillById.get(lowest.skillId);
        return [{
            skillId: skill.id,
            title: `تحدٍّ متقدم في ${skill.name}`,
            minutes: Math.min(10, dailyMinutes),
            position: 1,
            reason: "أتقنت كل المهارات في التشخيص، فهذا تحدٍّ للمحافظة على مستواك",
        }];
    }

    // Place weak prerequisites before their dependents
    const ordered = [];
    const reasonFor = new Map();
    const visit = (id, dependentId) => {
        if (ordered.includes(id)) return;
        const prereq = skillById.get(id).prerequisiteId;
        if (prereq && isWeak(prereq)) visit(prereq, id);
        if (dependentId && !reasonFor.has(id)) {
            reasonFor.set(id, `${skillById.get(id).name} متطلب سابق لـ${skillById.get(dependentId).name}، لذلك نبدأ به`);
        }
        ordered.push(id);
    };
    for (const id of weak) visit(id, null);

    return ordered.map((id, index) => {
        const skill = skillById.get(id);
        const percent = percentBySkill.get(id);
        const needsBasics = percent < WEAK_THRESHOLD;

        return {
            skillId: id,
            title: needsBasics ? `مراجعة أساسيات ${skill.name} مع المعلم` : `تدريب على ${skill.name}`,
            minutes: Math.min(needsBasics ? 20 : 10, dailyMinutes),
            position: index + 1,
            reason: reasonFor.get(id) ?? `نتيجتك في ${skill.name} كانت ${percent}%`,
        };
    });
}
