import { Link } from "react-router";
import Icon from "./Icon.jsx";
export default function BackLink({ to = "/", children = "العودة للرئيسية" }) {
    return <Link className="back-link" to={to}><Icon name="arrow" size={18} /><span>{children}</span></Link>;
}
