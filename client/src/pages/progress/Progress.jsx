import { useEffect, useState } from "react";
import { Link } from "react-router";

import {
    USE_MOCK_PROGRESS,
    getProgress,
} from "../../services/progress.js";

import { getLocale } from "../../locales/locale.js";

import "../../styles/progress.css";

function formatPercent(value) {
    if (value === null || value === undefined) {
        return "—";
    }

    return `${Math.round(value)}%`;
}

function formatDate(value) {
    if (!value) {
        return "—";
    }

    return new Intl.DateTimeFormat("ar", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

function Progress() {
    const locale = getLocale();

    const [progress, setProgress] = useState(null);
    const [status, setStatus] = useState("loading");

    const loadProgress = async (signal) => {
        setStatus("loading");

        try {
            const data = await getProgress(signal);

            setProgress(data);
            setStatus("success");
        } catch (error) {
            if (error.code === "ERR_CANCELED") return;
            console.error("Failed to load progress:", error);
            setStatus("error");
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        getProgress(controller.signal)
            .then((data) => {
                setProgress(data);
                setStatus("success");
            })
            .catch((error) => {
                if (error.code !== "ERR_CANCELED") {
                    console.error("Failed to load progress:", error);
                    setStatus("error");
                }
            });
        return () => controller.abort();
    }, []);

    // ---------- Loading ----------
    if (status === "loading") {
        return (
            <main className="progress-page">
                <section className="progress-state">
                    <h1>{locale.progress.title}</h1>

                    <p>{locale.progress.loading}</p>
                </section>
            </main>
        );
    }

    // ---------- Error ----------
    if (status === "error") {
        return (
            <main className="progress-page">
                <section className="progress-state">
                    <h1>{locale.progress.errorTitle}</h1>

                    <p role="alert">
                        {locale.progress.errorMessage}
                    </p>

                    <button
                        className="progress-button"
                        type="button"
                        onClick={() => loadProgress()}
                    >
                        {locale.progress.retry}
                    </button>
                </section>
            </main>
        );
    }

    const skills = progress?.skills ?? [];
    const recentAttempts =
        progress?.recentAttempts ?? [];

    const hasSkillProgress = skills.some(
        (skill) =>
            skill.diagnosticPercent !== null ||
            (skill.practice?.attempts ?? 0) > 0
    );

    const hasData =
        hasSkillProgress ||
        progress?.latestDiagnostic ||
        progress?.plan ||
        recentAttempts.length > 0;

    // ---------- New student ----------
    if (!hasData) {
        return (
            <main className="progress-page">
                <section className="progress-state">
                    <h1>
                        {locale.progress.emptyTitle}
                    </h1>

                    <p>
                        {locale.progress.emptyMessage}
                    </p>

                    <Link
                        className="progress-button"
                        to="/assessment"
                    >
                        {locale.progress.startAssessment}
                    </Link>
                </section>
            </main>
        );
    }

    const plan = progress?.plan;

    const planPercent =
        plan && plan.totalTasks > 0
            ? Math.round(
                  (plan.doneTasks / plan.totalTasks) *
                      100
              )
            : 0;

    return (
        <main className="progress-page">
            <header className="progress-header">
                <Link to="/">
                    {locale.all.backHome}
                </Link>

                {USE_MOCK_PROGRESS && (
                    <p className="progress-mock">
                        وضع تجريبي
                    </p>
                )}

                <h1>{locale.progress.title}</h1>

                <p>
                    {locale.progress.subtitle}
                </p>
            </header>

            {/* Latest diagnostic */}
            {progress.latestDiagnostic && (
                <section className="progress-section">
                    <h2>
                        {
                            locale.progress
                                .latestDiagnostic
                        }
                    </h2>

                    <div className="progress-summary-card">
                        <strong>
                            {formatPercent(
                                progress
                                    .latestDiagnostic
                                    .score
                            )}
                        </strong>

                        <span>
                            {formatDate(
                                progress
                                    .latestDiagnostic
                                    .submittedAt
                            )}
                        </span>
                    </div>
                </section>
            )}

            {/* Skills */}
            <section className="progress-section">
                <h2>
                    {locale.progress.skillsTitle}
                </h2>

                <div className="progress-skills">
                    {skills.map((skill) => {
                        const skillName =
                            locale.skills[
                                skill.skillId
                            ] ||
                            skill.name ||
                            skill.skillId;

                        return (
                            <article
                                className="progress-skill-card"
                                key={skill.skillId}
                            >
                                <h3>{skillName}</h3>

                                <div className="progress-scores">
                                    <div>
                                        <span>
                                            {
                                                locale
                                                    .progress
                                                    .diagnostic
                                            }
                                        </span>

                                        <strong>
                                            {formatPercent(
                                                skill.diagnosticPercent
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            {
                                                locale
                                                    .progress
                                                    .practice
                                            }
                                        </span>

                                        <strong>
                                            {formatPercent(
                                                skill.practice
                                                    ?.percent
                                            )}
                                        </strong>
                                    </div>
                                </div>

                                <div className="progress-skill-details">
                                    <p>
                                        {
                                            locale
                                                .progress
                                                .practiceAttempts
                                        }
                                        :{" "}
                                        <strong>
                                            {skill
                                                .practice
                                                ?.attempts ??
                                                0}
                                        </strong>
                                    </p>

                                    <p>
                                        {
                                            locale
                                                .progress
                                                .lastPractice
                                        }
                                        :{" "}
                                        <strong>
                                            {skill
                                                .practice
                                                ?.lastPracticedAt
                                                ? formatDate(
                                                      skill
                                                          .practice
                                                          .lastPracticedAt
                                                  )
                                                : locale
                                                      .progress
                                                      .notStarted}
                                        </strong>
                                    </p>

                                    {(skill.practice
                                        ?.total ??
                                        0) > 0 && (
                                        <p>
                                            {
                                                locale
                                                    .progress
                                                    .correctAnswers
                                            }
                                            :{" "}
                                            <strong>
                                                {
                                                    skill
                                                        .practice
                                                        .correct
                                                }{" "}
                                                من{" "}
                                                {
                                                    skill
                                                        .practice
                                                        .total
                                                }
                                            </strong>
                                        </p>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>

            {/* Plan */}
            <section className="progress-section">
                <h2>
                    {locale.progress.planTitle}
                </h2>

                {plan ? (
                    <div className="progress-plan">
                        <div className="progress-plan-header">
                            <span>
                                {plan.doneTasks} من{" "}
                                {plan.totalTasks} مهام
                            </span>

                            <strong>
                                {planPercent}%
                            </strong>
                        </div>

                        <div className="progress-bar">
                            <div
                                className="progress-bar-value"
                                style={{
                                    width: `${planPercent}%`,
                                }}
                            />
                        </div>
                    </div>
                ) : (
                    <p className="progress-muted">
                        {locale.progress.noPlan}
                    </p>
                )}
            </section>

            {/* Recent attempts */}
            <section className="progress-section">
                <h2>
                    {
                        locale.progress
                            .recentAttempts
                    }
                </h2>

                {recentAttempts.length === 0 ? (
                    <p className="progress-muted">
                        {
                            locale.progress
                                .noAttempts
                        }
                    </p>
                ) : (
                    <div className="progress-attempts">
                        {recentAttempts.map(
                            (attempt) => (
                                <article
                                    className="progress-attempt"
                                    key={
                                        attempt.id
                                    }
                                >
                                    <div>
                                        <strong>
                                            {attempt.type ===
                                            "diagnostic"
                                                ? locale
                                                      .progress
                                                      .diagnosticType
                                                : locale
                                                      .progress
                                                      .practiceType}
                                        </strong>

                                        {attempt.skillId && (
                                            <span>
                                                {locale
                                                    .skills[
                                                    attempt
                                                        .skillId
                                                ] ||
                                                    attempt.skillName ||
                                                    attempt.skillId}
                                            </span>
                                        )}
                                    </div>

                                    <div className="progress-attempt-result">
                                        <strong>
                                            {formatPercent(
                                                attempt.score
                                            )}
                                        </strong>

                                        <span>
                                            {formatDate(
                                                attempt.submittedAt
                                            )}
                                        </span>
                                    </div>
                                </article>
                            )
                        )}
                    </div>
                )}
            </section>
        </main>
    );
}

export default Progress;
