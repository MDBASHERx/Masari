// Arabic strings for the learning screens (assessment, plan, progress).
// Kept in their own file to avoid merge conflicts in ar.js.
const learning = {
    skills: {
        fractions: "الكسور",
        equations: "المعادلات",
        percentages: "النسب المئوية",
    },

    assessment: {
        title: "اكتشف نقطة البداية",
        description: "أسئلة قصيرة تساعدنا نعرف أي مهارة تحتاج تدريبًا أكثر، لنبني لك خطة تناسبك.",
        factQuestions: "6 أسئلة في الكسور والمعادلات والنسب المئوية",
        factTime: "حوالي 5 دقائق",
        factNoMarks: "ليس امتحانًا ولا يؤثر على علاماتك المدرسية",
        start: "ابدأ التشخيص",
        starting: "جارٍ التحضير…",
        mockMode: "وضع تجريبي: هذه البيانات ليست من الخادم.",

        questionOf: (number, total) => `السؤال ${number} من ${total}`,
        progressLabel: "تقدّمك في التشخيص",
        previous: "السابق",
        next: "التالي",
        submit: "إنهاء وعرض النتيجة",
        submitting: "جارٍ التصحيح…",
        unansweredWarning: (count) =>
            count === 1
                ? "بقي سؤال واحد بلا إجابة، وسيُحسب خطأ."
                : `بقي ${count} أسئلة بلا إجابة، وستُحسب خطأ.`,

        resultTitle: "نتيجتك",
        overallScore: "النتيجة الكلية: ",
        strong: "متمكّن",
        needsPractice: "يحتاج تدريبًا",
        skillScore: (correct, total) => `${correct} من ${total} صحيحة`,
        resultNote: "هذه النتيجة تساعدنا في ترتيب خطتك فقط، وهي منفصلة عن علاماتك المدرسية.",
        createPlan: "ابنِ خطتي",
        creatingPlan: "جارٍ بناء خطتك…",
    },

    progress: {
        title: "تقدمي",
        subtitle: "شاهد نتائج التشخيص والتدريب وتقدم خطتك.",

        loading: "جاري تحميل تقدمك...",
        errorTitle: "تعذر تحميل التقدم",
        errorMessage: "حدث خطأ أثناء تحميل بيانات التقدم.",
        retry: "إعادة المحاولة",

        emptyTitle: "ابدأ رحلتك التعليمية",
        emptyMessage:
            "لا توجد بيانات تقدم بعد. ابدأ التقييم التشخيصي حتى نتمكن من بناء تقدمك.",
        startAssessment: "ابدأ التقييم",

        latestDiagnostic: "آخر تشخيص",

        skillsTitle: "المهارات",
        diagnostic: "التشخيص",
        practice: "التدريب",
        practiceAttempts: "مرات التدريب",
        lastPractice: "آخر تدريب",
        notStarted: "لم تبدأ بعد",
        correctAnswers: "الإجابات الصحيحة",

        planTitle: "تقدم الخطة",
        noPlan: "لا توجد خطة تعلم حالياً.",

        recentAttempts: "آخر المحاولات",
        noAttempts: "لا توجد محاولات بعد.",

        diagnosticType: "تشخيص",
        practiceType: "تدريب",
    },

    learningErrors: {
        sessionExpired: "انتهت جلستك. سجّل الدخول مجددًا.",
        alreadySubmitted: "تم تسليم هذا التشخيص من قبل.",
        profileMissing: "أكمل ملفك الشخصي أولًا لنبني خطة تناسب وقتك.",
        invalidData: "هناك مشكلة في البيانات المرسلة. أعد المحاولة.",
        network: "تعذّر الاتصال بالخادم. تحقق من الإنترنت وأعد المحاولة.",
        generic: "حدث خطأ غير متوقع. أعد المحاولة.",
    },
};

export default learning;