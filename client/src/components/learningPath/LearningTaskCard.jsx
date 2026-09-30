import { Link } from "react-router";
import { getLocale } from "../../locales/locale.js";

function LearningTaskCard({ task, saving, onToggleDone }) {
    const locale = getLocale();
    const done = task.status === "done";

    return (
        <li className={`task-card${done ? " task-card--done" : ""}`}>
            <span className="task-card__position" aria-hidden="true">{task.position}</span>

            <div className="task-card__body">
                <div className="task-card__meta">
                    <span className="task-card__skill">{task.skillName ?? locale.skills[task.skillId]}</span>
                    <span>{locale.learningPath.minutes(task.minutes)}</span>
                    {task.source === "chat" && <span className="task-card__source">{locale.learningPath.fromChat}</span>}
                </div>

                <h3 className="task-card__title">{task.title}</h3>

                {task.reason && (
                    <p className="task-card__reason">
                        <strong>{locale.learningPath.whyHere}</strong> {task.reason}
                    </p>
                )}

                <div className="task-card__actions">
                    {!done && (
                        <Link className="task-card__practice" to={`/assessment?skill=${encodeURIComponent(task.skillId)}`}>
                            {locale.learningPath.practice}
                        </Link>
                    )}

                    <label className="task-card__done">
                        <input
                            type="checkbox"
                            checked={done}
                            disabled={saving}
                            onChange={() => onToggleDone(task)}
                        />
                        {saving ? locale.learningPath.saving : locale.learningPath.markDone}
                    </label>
                </div>
            </div>
        </li>
    );
}

export default LearningTaskCard;
