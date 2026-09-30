import Icon from "./design/Icon.jsx";

export default function SuggestedTask({ task, onAdd, status = "idle", error = "" }) {
    if (!task) return null;
    const saving = status === "loading";
    const saved = status === "success";
    return <aside className={`suggested-task ${saved ? "suggested-task--saved" : ""}`} aria-label="مهمة مقترحة" aria-busy={saving}>
        <div className="suggested-task-heading"><span className="suggested-task-icon"><Icon name="spark" size={21} /></span><h3>خطوة صغيرة تقرّبك</h3><span className="suggested-task-time">{task.minutes} دقيقة</span></div>
        <p className="suggested-task-title">{task.title}</p>
        <p className="suggested-task-description">مهمة مقترحة من المحادثة، يمكنك إضافتها إلى خطة تعلّمك.</p>
        <button className={`ui-button ${saved ? "ui-button--success" : ""}`} type="button" onClick={() => onAdd(task)} disabled={saving || saved}>
            {saving ? <span className="button-spinner" aria-hidden="true" /> : <Icon name="path" size={18} />}
            {saving ? "جارٍ الإضافة…" : saved ? "تمت الإضافة إلى خطتي" : error ? "إعادة محاولة الإضافة" : "أضف إلى خطتي"}
        </button>
        <span className="sr-only" role="status">{saved ? "تمت إضافة المهمة إلى خطتك" : saving ? "جارٍ إضافة المهمة" : ""}</span>
        {error && <p className="inline-error" role="alert">{error}</p>}
    </aside>;
}
