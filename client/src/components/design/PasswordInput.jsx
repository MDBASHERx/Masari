import { useState } from "react";
import { getLocale } from "../../locales/locale.js";

export default function PasswordInput(props) {
    const [visible, setVisible] = useState(false);
    const { auth } = getLocale();
    return <div className="auth-password">
        <input {...props} type={visible ? "text" : "password"} />
        <button type="button" className="auth-password-toggle" aria-controls={props.id} aria-pressed={visible} aria-label={`${visible ? auth.hidePassword : auth.showPassword}: ${props.id === "confirmPassword" ? auth.confirmPasswordLabel : auth.passwordLabel}`} disabled={props.disabled} onClick={() => setVisible(!visible)}>{visible ? auth.hidePassword : auth.showPassword}</button>
    </div>;
}
