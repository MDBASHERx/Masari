import LoadingIndicator from "../../components/design/LoadingIndicator.jsx";
import BackLink from "../../components/design/BackLink.jsx";
import PageHeading from "../../components/design/PageHeading.jsx";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import LearningTaskCard from "../../components/learningPath/LearningTaskCard.jsx";
import {
    getCurrentPlan,
    learningErrorKey,
    updateTaskStatus,
} from "../../services/learning.js";
import { getLocale } from "../../locales/locale.js";
import "../../styles/assessment.css";
import "../../styles/learningPath.css";

function LearningPath() {
    const locale = getLocale();

    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [savingTaskId, setSavingTaskId] = useState(null);
    const [saveError, setSaveError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        const loadPlan = async () => {
            try {
                setPlan(await getCurrentPlan(controller.signal));
            } catch (error) {
                if (error.name !== "CanceledError") setLoadError(learningErrorKey(error));
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };

        loadPlan();
        return () => controller.abort();
    }, []);

    const setTaskStatus = (taskId, status) =>
        setPlan((current) => ({
            ...current,
            tasks: current.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
        }));

    // Updates the checkbox right away, and undoes it if saving fails
    const handleToggleDone = async (task) => {
        if (savingTaskId) return;

        const previousStatus = task.status;
        const nextStatus = previousStatus === "done" ? "todo" : "done";

        setTaskStatus(task.id, nextStatus);
        setSavingTaskId(task.id);
        setSaveError("");

        try {
            const updated = await updateTaskStatus(task.id, nextStatus);
            setTaskStatus(updated.id, updated.status);
        } catch (error) {
            setTaskStatus(task.id, previousStatus);
            setSaveError(learningErrorKey(error));
        } finally {
            setSavingTaskId(null);
        }
    };

    const header = (
        <>
            <BackLink>{locale.all.backHome}</BackLink>

            <PageHeading icon="path" tone="mint" id="plan-title" title={locale.learningPath.title} description="خطوة صغيرة اليوم، ومهارة أقوى غدًا." />
        </>
    );

    if (loading) {
        return (
            <main className="assessment-page learning-plan-page">
                <section className="assessment-card" aria-busy="true">
                    <p><LoadingIndicator>{locale.learningPath.loading}</LoadingIndicator></p>
                </section>
            </main>
        );
    }

    if (loadError) {
        return (
            <main className="assessment-page learning-plan-page">
                <section className="assessment-card" aria-labelledby="plan-title">
                    {header}
                    <p className="assessment-error" role="alert">{locale.learningErrors[loadError]}</p>
                    <button className="assessment-button" type="button" onClick={() => window.location.reload()}>
                        {locale.learningPath.retry}
                    </button>
                </section>
            </main>
        );
    }

    // ---------- No plan yet ----------
    if (!plan) {
        return (
            <main className="assessment-page learning-plan-page">
                <section className="assessment-card" aria-labelledby="plan-title">
                    {header}
                    <p className="assessment-description">{locale.learningPath.empty}</p>
                    <Link className="assessment-button plan-link-button" to="/assessment">
                        {locale.assessment.start}
                    </Link>
                </section>
            </main>
        );
    }

    const tasks = [...plan.tasks].sort((a, b) => a.position - b.position);
    const doneCount = tasks.filter((task) => task.status === "done").length;
    const progress = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

    return (
        <main className="assessment-page learning-plan-page">
            <section className="assessment-card" aria-labelledby="plan-title">
                {header}

                <p className="assessment-description">{locale.learningPath.intro}</p>

                <div className="plan-metrics">
                    <div><span>خطوات أنجزتها</span><strong><bdi dir="ltr">{doneCount} / {tasks.length}</bdi></strong><small>كل خطوة تُحسب لك</small></div>
                    <div><span>وقت الخطة</span><strong>{plan.totalMinutes} <small>دقيقة</small></strong><small>قسّمها بما يناسب يومك</small></div>
                    <div><span>إنجاز المهام</span><strong>{progress}%</strong><small>يعكس إكمال المهام، وليس إتقان المهارة</small></div>
                </div>
                <div
                    className="question-card__progress"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress}
                    aria-label={locale.learningPath.progressLabel}
                >
                    <span style={{ inlineSize: `${progress}%` }} />
                </div>

                {saveError && (
                    <p className="assessment-error" role="alert">{locale.learningErrors[saveError]}</p>
                )}

                <ol className="task-list">
                    {tasks.map((task) => (
                        <LearningTaskCard
                            key={task.id}
                            task={task}
                            saving={savingTaskId === task.id}
                            onToggleDone={handleToggleDone}
                        />
                    ))}
                </ol>

                <p className="result-summary__note">{locale.learningPath.masteryNote}</p>
            </section>
        </main>
    );
}

export default LearningPath;
