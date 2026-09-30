import BackLink from "../components/design/BackLink.jsx";
import PageHeading from "../components/design/PageHeading.jsx";
import { useEffect, useState } from "react";
import { getLocale } from "../locales/locale.js";
import { getCareerPaths } from "../services/careerPaths.js";
import "../styles/career.css";

export default function CareerExploration() {
    const locale = getLocale();
    const [data, setData] = useState(null);
    const [error, setError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        getCareerPaths(controller.signal)
            .then(setData)
            .catch((requestError) => {
                if (requestError.code !== "ERR_CANCELED") setError("تعذر تحميل المسارات المهنية.");
            });
        return () => controller.abort();
    }, [reloadKey]);

    return (
        <main className="career-page container" dir="rtl">
            <BackLink>العودة للرئيسية</BackLink>
            <PageHeading icon="compass" tone="peach" title="استكشف مستقبلك" description="جرّب، اسأل، واكتشف ما يثير فضولك. الخيارات أمامك، والقرار لك." />
            {!data && !error && <p role="status">جاري تحميل المسارات...</p>}
            {error && <div role="alert"><p>{error}</p><button className="ui-button ui-button--soft" type="button" onClick={() => { setError(""); setReloadKey((key) => key + 1); }}>إعادة المحاولة</button></div>}
            {data?.disclaimer && <p className="career-intro">{data.disclaimer}</p>}
            <div className="career-grid">
                {data?.paths?.map((path) => (
                    <article className="career-card" key={path.id}>
                        <h2>{path.title}</h2><p>{path.summary}</p>
                        <h3>لماذا تستكشفه؟</h3><ul>{path.whyItMightFit.map((reason) => <li key={reason}>{reason}</li>)}</ul>
                        <h3>المهارات المرتبطة</h3><ul>{path.relatedSkills.map((skill) => <li key={skill.skillId}><strong>{locale.skills[skill.skillId] || skill.skillId}:</strong> {skill.why}</li>)}</ul>
                        <h3>مواد تساعدك</h3><p>{path.subjectsToFocus.join("، ")}</p>
                        <h3>{path.activity.title}</h3><p>{path.activity.minutes} دقيقة</p>
                        <p><strong>المواد:</strong> {path.activity.materials.join("، ")}</p>
                        <ol>{path.activity.steps.map((step) => <li key={step}>{step}</li>)}</ol>
                        <p>{path.activity.reflection}</p>
                        <h3>أسئلة للاستكشاف</h3><ul>{path.questionsToExplore.map((question) => <li key={question}>{question}</li>)}</ul>
                    </article>
                ))}
            </div>
        </main>
    );
}
