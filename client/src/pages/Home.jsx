import LoadingIndicator from "../components/design/LoadingIndicator.jsx";
import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../hooks/useAuth.js";
import { getLocale } from "../locales/locale.js";
import Icon from "../components/design/Icon.jsx";
import LearningIllustration from "../components/design/LearningIllustration.jsx";
import "../styles/home.css";

const destinations = [
    ["/learning-path", "path", "mint", "خطتك، على مقاسك", "مهام صغيرة وواضحة، تبني معها تقدّمك يومًا بعد يوم.", "اكتشف خطتي"],
    ["/chat", "chat", "purple", "اسأل، وافهم أكثر", "معلّم يشرح لك، ومرشد يساعدك على التفكير في خطوتك القادمة.", "ابدأ محادثة"],
    ["/future", "compass", "peach", "مستقبل يشبهك", "استكشف اهتماماتك ومسارات مهنية، وجرّب شيئًا جديدًا.", "استكشف المسارات"],
    ["/progress", "chart", "blue", "شاهد أثر خطواتك", "تابع مهاراتك ونتائج التدريب، واعرف أين تحتاج بعض الاهتمام.", "شاهد تقدّمي"],
    ["/grades", "grades", "yellow", "علاماتك في مكان واحد", "سجّل نتائجك الدراسية وعدّلها، لتبقى صورتك واضحة.", "افتح علاماتي"],
    ["/profile", "user", "rose", "نبدأ منك أنت", "حدّد صفّك وهدفك ووقت الدراسة المناسب ليومك.", "خصّص ملفي"],
];

export default function Home() {
    const locale = getLocale();
    const { logout } = useAuth();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(false);
    async function handleLogout() {
        if (busy) return;
        setBusy(true); setError(false);
        try { await logout(); } catch { setError(true); } finally { setBusy(false); }
    }
    return <main className="home-page">
        <div className="home-welcome"><span><Icon name="sun" size={20} /> أهلًا بك في مساحتك للتعلّم</span><span className="welcome-note">بخطوتك الصغيرة، يبدأ شيء كبير.</span></div>
        <section className="home-hero" aria-labelledby="welcome-title">
            <div className="hero-copy">
                <span className="hero-eyebrow"><span /> فضولك اليوم، طريقك بكرا</span>
                <h1 id="welcome-title">مستقبلك يبدأ<br />بـ<span className="hero-emphasis">خطوة منك.</span></h1>
                <p>تعلّم بطريقتك، اكتشف ما تحب، وابنِ مسارك بثقة.<br />مساري معك، من أول سؤال إلى خطوتك القادمة.</p>
                <div className="hero-actions"><Link className="primary-link" to="/assessment">اكتشف نقطة بدايتك <Icon name="arrow" size={20} /></Link><Link className="secondary-link" to="/chat"><Icon name="chat" size={20} /> تحدث مع مرشدك</Link></div>
                <p className="hero-footnote"><Icon name="spark" size={16} /> على مهلك. التعلّم رحلة، مش سباق.</p>
            </div>
            <div className="hero-art"><LearningIllustration /><div className="art-caption"><span className="art-caption-icon"><Icon name="book" size={20} /></span><div><strong>كل يوم فرصة جديدة</strong><span>افهم أكثر، واقترب من هدفك</span></div></div></div>
        </section>
        <section className="home-explore" aria-labelledby="explore-title">
            <div className="section-heading"><div><span className="section-kicker">مساحتك، بطريقتك</span><h2 id="explore-title">شو حاب تعمل اليوم؟</h2></div><p>اختر خطوة تناسبك، ونحن معك.</p></div>
            <nav className="home-links" aria-label="أقسام مساري">{destinations.map(([to, icon, color, title, description, action]) => <Link key={to} to={to} className={`destination-card tone-${color}`}><span className="destination-icon"><Icon name={icon} size={26} /></span><h3>{title}</h3><p>{description}</p><span className="destination-action">{action}<Icon name="arrow" size={18} /></span></Link>)}</nav>
        </section>
        <aside className="home-encouragement"><span className="encouragement-icon"><Icon name="spark" size={29} /></span><div><strong>مش لازم تعرف كل الإجابات من أول يوم.</strong><p>يكفي تكون عندك الرغبة تسأل، وتجرب، وتتعلم.</p></div><Link to="/chat">خلّينا نبدأ <Icon name="arrow" size={18} /></Link></aside>
        {error && <p role="alert">{locale.error.logoutFailed}</p>}
        <footer className="home-footer"><span>مساري · مرشدك المهني لمسارك الصحيح</span><button type="button" disabled={busy} onClick={handleLogout}>{busy ? <LoadingIndicator announce={false}>{locale.auth.loggingOut}</LoadingIndicator> : locale.auth.logout}</button></footer>
    </main>;
}
