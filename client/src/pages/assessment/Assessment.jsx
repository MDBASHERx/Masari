import LoadingIndicator from "../../components/design/LoadingIndicator.jsx";
import BackLink from "../../components/design/BackLink.jsx";
import { useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import QuestionCard from "../../components/assessment/QuestionCard.jsx";
import ResultSummary from "../../components/assessment/ResultSummary.jsx";
import {
    createPlan,
    learningErrorKey,
    startDiagnostic,
    startPractice,
    submitAttempt,
} from "../../services/learning.js";
import { getLocale } from "../../locales/locale.js";
import "../../styles/assessment.css";
import "../../styles/learningPath.css";

// Screen flow: intro -> answering -> result.
// /assessment is the diagnostic; /assessment?skill=<id> is practice on one skill.
function Assessment() {
    const locale = getLocale();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const requestedSkill = searchParams.get("skill");
    const practiceSkill = requestedSkill && locale.skills[requestedSkill] ? requestedSkill : null;
    const skillName = practiceSkill && locale.skills[practiceSkill];

    const [attempt, setAttempt] = useState(null);
    const [answers, setAnswers] = useState({}); // questionId -> option index
    const [current, setCurrent] = useState(0);

    const [starting, setStarting] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [creatingPlan, setCreatingPlan] = useState(false);
    const [error, setError] = useState("");

    // Same id for retries of the same submission (server returns the saved result)
    const requestIdRef = useRef(null);

    const handleStart = async () => {
        setStarting(true);
        setError("");

        try {
            const started = practiceSkill ? await startPractice(practiceSkill) : await startDiagnostic();
            setAttempt(started);
            setAnswers({});
            setCurrent(0);
        } catch (startError) {
            setError(learningErrorKey(startError));
        } finally {
            setStarting(false);
        }
    };

    const handleSelect = (optionIndex) => {
        const question = attempt.questions[current];
        setAnswers((previous) => ({ ...previous, [question.id]: optionIndex }));
        setError("");
    };

    const handleSubmit = async () => {
        if (submitting) return;

        setSubmitting(true);
        setError("");
        requestIdRef.current ??= crypto.randomUUID();

        try {
            const payload = attempt.questions.map((question) => ({
                questionId: question.id,
                selectedOption: answers[question.id] ?? null,
            }));

            const submitted = await submitAttempt(attempt.id, payload, requestIdRef.current);
            setAttempt(submitted);
            requestIdRef.current = null;
        } catch (submitError) {
            setError(learningErrorKey(submitError));
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreatePlan = async () => {
        if (creatingPlan) return;

        setCreatingPlan(true);
        setError("");

        try {
            await createPlan(attempt.id);
            navigate("/learning-path");
        } catch (planError) {
            setError(learningErrorKey(planError));
            setCreatingPlan(false);
        }
    };

    const errorMessage = error && (
        <p className="assessment-error" role="alert">
            {locale.learningErrors[error]}
        </p>
    );

    // ---------- Intro ----------
    if (!attempt) {
        return (
            <main className="assessment-page">
                <section className="assessment-card" aria-labelledby="assessment-title">
                    {practiceSkill
                        ? <BackLink to="/learning-path">{locale.practice.backToPlan}</BackLink>
                        : <BackLink>{locale.all.backHome}</BackLink>}


                    <h1 id="assessment-title">
                        {practiceSkill ? locale.practice.title(skillName) : locale.assessment.title}
                    </h1>
                    <p className="assessment-description">
                        {practiceSkill ? locale.practice.description : locale.assessment.description}
                    </p>

                    <ul className="assessment-facts">
                        <li>{practiceSkill ? locale.practice.factQuestions : locale.assessment.factQuestions}</li>
                        <li>{practiceSkill ? locale.practice.factTime : locale.assessment.factTime}</li>
                        <li>{locale.assessment.factNoMarks}</li>
                    </ul>

                    {errorMessage}

                    <button className="assessment-button" type="button" onClick={handleStart} disabled={starting}>
                        {starting
                            ? <LoadingIndicator announce={false}>{locale.assessment.starting}</LoadingIndicator>
                            : practiceSkill ? locale.practice.start : locale.assessment.start}
                    </button>
                </section>
            </main>
        );
    }

    // ---------- Result ----------
    if (attempt.status === "submitted") {
        return (
            <main className="assessment-page">
                <section className="assessment-card">
                    <BackLink>{locale.all.backHome}</BackLink>


                    <ResultSummary attempt={attempt} />

                    {errorMessage}

                    {attempt.type === "practice" ? (
                        <Link className="assessment-button plan-link-button" to="/learning-path">
                            {locale.practice.backToPlan}
                        </Link>
                    ) : (
                        <button
                            className="assessment-button"
                            type="button"
                            onClick={handleCreatePlan}
                            disabled={creatingPlan}
                        >
                            {creatingPlan ? <LoadingIndicator announce={false}>{locale.assessment.creatingPlan}</LoadingIndicator> : locale.assessment.createPlan}
                        </button>
                    )}
                </section>
            </main>
        );
    }

    // ---------- Answering ----------
    const question = attempt.questions[current];
    const isLast = current === attempt.questions.length - 1;
    const answered = answers[question.id] !== undefined;
    const unanswered = attempt.questions.filter((q) => answers[q.id] === undefined).length;

    return (
        <main className="assessment-page">
            <section className="assessment-card" aria-live="polite">


                <QuestionCard
                    key={question.id}
                    question={question}
                    index={current}
                    total={attempt.questions.length}
                    selectedOption={answers[question.id]}
                    onSelect={handleSelect}
                    disabled={submitting}
                />

                {errorMessage}

                {isLast && unanswered > 0 && (
                    <p className="assessment-hint" role="status">
                        {locale.assessment.unansweredWarning(unanswered)}
                    </p>
                )}

                <div className="assessment-actions">
                    <button
                        className="assessment-button assessment-button--secondary"
                        type="button"
                        onClick={() => setCurrent((index) => index - 1)}
                        disabled={current === 0 || submitting}
                    >
                        {locale.assessment.previous}
                    </button>

                    {isLast ? (
                        <button className="assessment-button" type="button" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? <LoadingIndicator announce={false}>{locale.assessment.submitting}</LoadingIndicator> : locale.assessment.submit}
                        </button>
                    ) : (
                        <button
                            className="assessment-button"
                            type="button"
                            onClick={() => setCurrent((index) => index + 1)}
                            disabled={!answered}
                        >
                            {locale.assessment.next}
                        </button>
                    )}
                </div>
            </section>
        </main>
    );
}

export default Assessment;
