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
            count === 1 ? "بقي سؤال واحد بلا إجابة، وسيُحسب خطأ." : `بقي ${count} أسئلة بلا إجابة، وستُحسب خطأ.`,

        resultTitle: "نتيجتك",
        overallScore: "النتيجة الكلية: ",
        strong: "متمكّن",
        needsPractice: "يحتاج تدريبًا",
        skillScore: (correct, total) => `${correct} من ${total} صحيحة`,
        resultNote: "هذه النتيجة تساعدنا في ترتيب خطتك فقط، وهي منفصلة عن علاماتك المدرسية.",
        createPlan: "ابنِ خطتي",
        creatingPlan: "جارٍ بناء خطتك…",
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
