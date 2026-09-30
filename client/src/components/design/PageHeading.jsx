import Icon from "./Icon.jsx";
export default function PageHeading({ icon, title, description, id, tone = "purple", children }) {
    return <div className={`page-heading tone-${tone}`}>
        <span className="page-heading-icon"><Icon name={icon} size={28} /></span>
        <div><span className="page-heading-kicker">مساري · مساحة لنموّك</span><h1 id={id}>{title}</h1>{description && <p>{description}</p>}</div>
        {children}
    </div>;
}
