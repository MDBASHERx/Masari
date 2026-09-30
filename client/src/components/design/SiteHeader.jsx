import { NavLink, Link } from "react-router";
import { useAuth } from "../../hooks/useAuth.js";
import Icon from "./Icon.jsx";

const items = [["/", "الرئيسية", "home"], ["/learning-path", "خطتي", "path"], ["/chat", "مرشدي", "chat"], ["/future", "مستقبلي", "compass"], ["/progress", "تقدّمي", "chart"]];
export default function SiteHeader() {
    const { isAuthenticated } = useAuth();
    return <header className="site-header">
        <Link className="brand" to="/" aria-label="مساري — الرئيسية"><span className="brand-symbol"><Icon name="path" size={27} /></span><span>مساري<small>كل خطوة، أقرب لنفسك</small></span></Link>
        {isAuthenticated ? <>
            <nav className="site-nav" aria-label="التنقل الرئيسي">{items.map(([to, label, icon]) => <NavLink key={to} to={to} end={to === "/"}><Icon name={icon} size={19} /><span>{label}</span></NavLink>)}</nav>
            <Link className="profile-link" to="/profile"><Icon name="user" size={20} /><span>حسابي</span></Link>
        </> : <span className="header-note"><Icon name="spark" size={18} /> مساحة صغيرة لطموح كبير</span>}
    </header>;
}
