function CareerExploration() {
  const careers = [
    {
      id: 1,
      title: "الهندسة",
      description:
        "استخدم الرياضيات والعلوم لتصميم حلول للمشاكل الواقعية.",
      reason:
        "قد يناسبك هذا المجال إذا كنت تحب حل المشاكل وبناء الأشياء.",
      activity:
        "جرّب تصميم جسر بسيط من الورق واختبر كم وزن يستطيع حمله.",
    },
    {
      id: 2,
      title: "علوم الحاسوب",
      description:
        "تعلم البرمجة وكيفية بناء التطبيقات والأنظمة الرقمية.",
      reason:
        "قد يناسبك هذا المجال إذا كنت تحب التكنولوجيا والتفكير المنطقي.",
      activity:
        "ابنِ برنامج JavaScript صغير يحسب مجموع رقمين.",
    },
  ];

  return (
    <section className="career-page">
      <h1>استكشف مستقبلك</h1>

      <p className="career-intro">
        اكتشف مجالات مختلفة وتعرّف على نشاط بسيط يمكنك تجربته.
      </p>

      <div className="career-grid">
        {careers.map((career) => (
          <article className="career-card" key={career.id}>
            <h2>{career.title}</h2>

            <p>{career.description}</p>

            <h3>لماذا تستكشفه؟</h3>
            <p>{career.reason}</p>

            <h3>نشاط عملي</h3>
            <p>{career.activity}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default CareerExploration;