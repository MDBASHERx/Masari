import Icon from "./Icon.jsx";
import LearningIllustration from "./LearningIllustration.jsx";
import { getLocale } from "../../locales/locale.js";

export default function AuthLayout({ children }) {
    const { auth } = getLocale();
    return <main className="auth-page auth-page--vivid">
        <div className="auth-layout">
            <aside className="auth-story" aria-label={auth.storyLabel}>
                <span className="auth-eyebrow"><Icon name="spark" size={18} />{auth.storyBadge}</span>
                <h2>{auth.storyTitle}<span>{auth.storyAccent}</span></h2>
                <p>{auth.storyDescription}</p>
                <div className="auth-art"><LearningIllustration /><span className="auth-art-bubble"><Icon name="sun" size={28} /></span></div>
                <div className="auth-benefits">
                    {[["path", auth.benefitPlan], ["chat", auth.benefitTutor], ["compass", auth.benefitFuture]].map(([icon, label]) => <span key={icon}><Icon name={icon} size={20} />{label}</span>)}
                </div>
                <p className="auth-story-note">{auth.storyNote}</p>
            </aside>
            {children}
        </div>
    </main>;
}
