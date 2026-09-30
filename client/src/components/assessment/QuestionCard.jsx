import MathText from "../common/MathText.jsx";
import { getLocale } from "../../locales/locale.js";

function QuestionCard({ question, index, total, selectedOption, onSelect, disabled }) {
    const locale = getLocale();
    const progress = Math.round(((index + 1) / total) * 100);

    return (
        <fieldset className="question-card" disabled={disabled}>
            <div className="question-card__meta">
                <span className="question-card__skill">{locale.skills[question.skillId]}</span>
                <span>{locale.assessment.questionOf(index + 1, total)}</span>
            </div>

            <div
                className="question-card__progress"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                aria-label={locale.assessment.progressLabel}
            >
                <span style={{ inlineSize: `${progress}%` }} />
            </div>

            <legend className="question-card__prompt">
                <MathText text={question.prompt} />
            </legend>

            <div className="question-card__options">
                {question.options.map((option, optionIndex) => {
                    const id = `${question.id}-option-${optionIndex}`;

                    return (
                        <label
                            key={id}
                            htmlFor={id}
                            className={`question-option${selectedOption === optionIndex ? " question-option--selected" : ""}`}
                        >
                            <input
                                id={id}
                                type="radio"
                                name={question.id}
                                checked={selectedOption === optionIndex}
                                onChange={() => onSelect(optionIndex)}
                            />
                            <MathText text={option} />
                        </label>
                    );
                })}
            </div>
        </fieldset>
    );
}

export default QuestionCard;
