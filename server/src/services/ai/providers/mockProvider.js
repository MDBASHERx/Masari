// Demo provider used until the team picks a real one (LLM_PROVIDER=mock).
// Replies are fixed, mathematically checked, and ALWAYS labelled as demo.

const TUTOR_REPLIES = {
    fractions: {
        reply: "[رد تجريبي] لجمع كسرين بمقامين مختلفين، نوحّد المقام أولاً. مثال: 1/2 + 1/3. المقام المشترك 6، إذن 3/6 + 2/6 = 5/6. تلميح لك: جرّب 1/4 + 1/6، ما أصغر عدد يقبل القسمة على 4 و 6؟",
        task: { title: "تدريب على توحيد المقامات", skillId: "fractions", minutes: 10 },
    },
    equations: {
        reply: "[رد تجريبي] لحل معادلة مثل 2x + 3 = 11، نعزل x خطوة بخطوة: نطرح 3 من الطرفين فنحصل على 2x = 8، ثم نقسم على 2 فنحصل على x = 4. تلميح لك: في 3x − 5 = 10، ما أول عملية تقوم بها؟",
        task: { title: "تدريب على حل المعادلات الخطية", skillId: "equations", minutes: 10 },
    },
    percentages: {
        reply: "[رد تجريبي] النسبة المئوية تعني \"من كل 100\". لحساب 20% من 50: نضرب 50 × 20 ÷ 100 = 10. تلميح لك: إذا كان الخصم 20%، فكم بالمئة من السعر ستدفع؟",
        task: { title: "تدريب على النسب المئوية", skillId: "percentages", minutes: 10 },
    },
};

const GENERAL_TUTOR_REPLY =
    "[رد تجريبي] أنا هنا لمساعدتك في الكسور والمعادلات والنسب المئوية. اختر واحدة منها وأخبرني ما الذي يصعب عليك، وسأشرحها لك خطوة بخطوة.";

const MENTOR_REPLY =
    "[رد تجريبي] لنقسّم وقتك اليومي: ابدأ بـ 10 دقائق لمراجعة المهارة الأضعف في خطتك، ثم 5 دقائق لسؤال تدريبي واحد. إذا كان لديك وقت إضافي، جرّب نشاطاً قصيراً من صفحة المسارات المهنية لتكتشف ما يثير اهتمامك.";

export function createMockProvider() {
    return {
        name: "mock",
        isDemo: true,

        async generate({ mode, learner }) {
            if (mode === "mentor") {
                return JSON.stringify({ reply: MENTOR_REPLY, suggestedTask: null });
            }

            const skillId = learner.currentSkill?.id ?? learner.nextTask?.skillId;
            const canned = TUTOR_REPLIES[skillId];

            return JSON.stringify(
                canned
                    ? { reply: canned.reply, suggestedTask: canned.task }
                    : { reply: GENERAL_TUTOR_REPLY, suggestedTask: null },
            );
        },
    };
}
