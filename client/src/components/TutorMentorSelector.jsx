import Icon from "./design/Icon.jsx";
export default function TutorMentorSelector({ mode, onChangeMode, disabled = false }) {
    return <div className="mode-selector" role="group" aria-label="وضع المحادثة الجديدة">
        <div className="mode-options">
            {[
                ["tutor", "المعلّم", "book", "شرح الرياضيات، تلميحات، ومراجعة الحلول.", "مثال: كيف أجمع كسرين بمقامين مختلفين؟"],
                ["mentor", "المرشد", "compass", "تنظيم الدراسة واستكشاف اهتماماتك ومستقبلك.", "مثال: كيف أوزّع نصف ساعة للدراسة؟"],
            ].map(([value, label, icon, description, example]) => <button key={value} type="button" aria-pressed={mode === value} className={mode === value ? "mode-button active" : "mode-button"} onClick={() => onChangeMode(value)} disabled={disabled}>
                <span className="mode-title"><Icon name={icon} size={22} /><strong>{label}</strong><span className="mode-check" aria-hidden="true">{mode === value ? "✓" : "○"}</span></span>
                <span className="mode-description">{description}</span><small>{example}</small>
            </button>)}
        </div>
        <p className="mode-hint">اختيارك يخص المحادثة الجديدة فقط؛ المحادثة المفتوحة تحتفظ بوضعها.</p>
    </div>;
}
