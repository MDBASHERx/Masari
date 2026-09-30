import { useState } from "react";
import Icon from "./Icon.jsx";

export default function AmbientBackground() {
    const [paused, setPaused] = useState(false);
    return <>
        <div className={`ambient ${paused ? "ambient--paused" : ""}`} aria-hidden="true">
            <div className="ambient-glow ambient-glow--violet" />
            <div className="ambient-glow ambient-glow--mint" />
            <div className="ambient-glow ambient-glow--peach" />
            <span className="float-icon float-icon--one"><Icon name="book" size={36} /></span>
            <span className="float-icon float-icon--two"><Icon name="spark" size={30} /></span>
            <span className="float-icon float-icon--three"><Icon name="compass" size={34} /></span>
            <span className="ambient-bubble bubble-one" /><span className="ambient-bubble bubble-two" />
            <span className="ambient-bubble bubble-three" />
        </div>
        <button className="motion-toggle" type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}>
            <Icon name="spark" size={16} />{paused ? "تشغيل حركة الخلفية" : "إيقاف حركة الخلفية"}
        </button>
    </>;
}
