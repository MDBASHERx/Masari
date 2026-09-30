import { useEffect, useState } from "react";
import { Link } from "react-router";
import LearningTaskCard from "../../components/learningPath/LearningTaskCard.jsx";
import {
    USE_MOCK_LEARNING,
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
            <Link to="/">{locale.all.backHome}</Link>
            {USE_MOCK_LEARNING && <p className="assessment-mock">{locale.assessment.mockMode}</p>}
            <h1 id="plan-title">{locale.learningPath.title}</h1>
        </>
    );

    if (loading) {
        return (
            <main className="assessment-page">
                <section className="assessment-card" aria-busy="true">
                    <p role="status">{locale.learningPath.loading}</p>
                </section>
            </main>
        );
    }

    if (loadError) {
        return (
            <main className="assessment-page">
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
            <main className="assessment-page">
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
        <main className="assessment-page">
            <section className="assessment-card" aria-labelledby="plan-title">
                {header}

                <p className="assessment-description">{locale.learningPath.intro}</p>

                <div className="plan-summary">
                    <span>{locale.learningPath.doneOf(doneCount, tasks.length)}</span>
                    <span>{locale.learningPath.totalTime(plan.totalMinutes)}</span>
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
