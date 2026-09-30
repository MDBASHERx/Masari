import { getLocale } from "../../locales/locale.js";

// Same threshold as the server's plan builder
const MASTERY_THRESHOLD = 75;

function ResultSummary({ attempt }) {
    const locale = getLocale();

    return (
        <section className="result-summary" aria-labelledby="result-title">
            <h2 id="result-title">{locale.assessment.resultTitle}</h2>

            <p className="result-summary__score">
                {locale.assessment.overallScore}
                <strong><bdi dir="ltr">{Math.round(attempt.score)}%</bdi></strong>
            </p>

            <ul className="result-summary__skills">
                {attempt.skills.map((skill) => {
                    const strong = skill.percent >= MASTERY_THRESHOLD;

                    return (
                        <li key={skill.skillId} className="skill-result">
                            <div className="skill-result__header">
                                <span className="skill-result__name">{locale.skills[skill.skillId]}</span>
                                <span className={`skill-result__badge skill-result__badge--${strong ? "strong" : "practice"}`}>
                                    {strong ? locale.assessment.strong : locale.assessment.needsPractice}
                                </span>
                            </div>

                            <div className="skill-result__bar" aria-hidden="true">
                                <span style={{ inlineSize: `${skill.percent}%` }} />
                            </div>

                            <small>{locale.assessment.skillScore(skill.correct, skill.total)}</small>
                        </li>
                    );
                })}
            </ul>

            <p className="result-summary__note">{locale.assessment.resultNote}</p>
        </section>
    );
}

export default ResultSummary;
