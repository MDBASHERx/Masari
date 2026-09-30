import { Link } from "react-router";
import Icon from "../components/design/Icon.jsx";
import "../styles/notFound.css";

export default function NotFound() {
    return (
        <main className="not-found-page" aria-labelledby="not-found-title" dir="rtl">
            <section className="not-found-card">
                <span className="not-found-label"><Icon name="spark" size={17} /> انعطافة صغيرة في الطريق</span>
                <div className="not-found-art" aria-hidden="true">
                    <span className="not-found-orbit" />
                    <span className="not-found-decoration not-found-decoration--book"><Icon name="book" size={26} /></span>
                    <span className="not-found-decoration not-found-decoration--star"><Icon name="spark" size={24} /></span>
                    <div className="not-found-code" dir="ltr"><span>4</span><span className="not-found-compass"><Icon name="compass" size={92} /></span><span>4</span></div>
                    <svg className="not-found-trail" viewBox="0 0 300 44" fill="none"><path d="M15 24C60 0 85 44 132 24S218 5 276 23" stroke="currentColor" strokeWidth="2" strokeDasharray="5 7" strokeLinecap="round" /><path d="m267 15 12 9-14 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <h1 id="not-found-title">ضلّينا الصفحة… مش المسار.</h1>
                <p className="not-found-description">الصفحة التي تبحث عنها غير موجودة، أو ربما تغيّر رابطها.<br />نرجع لخطوتك القادمة؟</p>
                <Link className="ui-button not-found-home" to="/"><Icon name="home" size={20} /> العودة للرئيسية</Link>
                <nav className="not-found-shortcuts" aria-label="مسارات بديلة">
                    <Link to="/learning-path"><Icon name="path" size={18} /> خطتي</Link>
                    <Link to="/chat"><Icon name="chat" size={18} /> اسأل مرشدك</Link>
                    <Link to="/future"><Icon name="compass" size={18} /> استكشف مستقبلك</Link>
                </nav>
                <p className="not-found-note">كل طريق جديد يبدأ بخطوة. خلّينا نكمل سوا.</p>
                <span className="sr-only">خطأ 404 — الصفحة غير موجودة</span>
            </section>
        </main>
    );
}
