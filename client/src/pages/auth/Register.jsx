import LoadingIndicator from "../../components/design/LoadingIndicator.jsx";
import { registrationErrorKey } from "../../services/signupResult.js";
import { useState } from "react";
import { Link, Navigate } from "react-router";
import { useAuth } from "../../hooks/useAuth.js";
import { getLocale } from "../../locales/locale.js";
import AuthLayout from "../../components/design/AuthLayout.jsx";
import PasswordInput from "../../components/design/PasswordInput.jsx";
import "../../styles/Auth.css";

function Register() 
{
    const locale = getLocale();
    const { register, loading, isAuthenticated } = useAuth();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [errorKey, setErrorKey] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (submitting)
        {
            return;
        }

        setErrorKey("");

        if (!fullName.trim()) 
        {
            setErrorKey("fullNameRequired");
            return;
        }

        if (password.length < 8) {
            setErrorKey("passwordTooShort");
            return;
        }

        if (password !== confirmPassword) 
        {
            setErrorKey("passwordMismatch");
            return;
        }

        setSubmitting(true);

        try {
            const data = await register({
                fullName,
                email,
                password,
            });

            setPassword("");
            setConfirmPassword("");

            // A session may be absent until email confirmation
            if (!data.session) 
            {
                setSubmitted(true);
            }
        } catch (error) {
            setErrorKey(registrationErrorKey(error));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) 
    {
        return <AuthLayout><section className="auth-card"><p><LoadingIndicator>{locale.auth.loadingSession}</LoadingIndicator></p></section></AuthLayout>;
    }

    if (isAuthenticated) 
    {
        return <Navigate to="/" replace />;
    }

    if (submitted) 
    {
        return (
            <AuthLayout>
                <section className="auth-card">
                <h1>{locale.auth.registrationSubmitted}</h1>

                <p className="auth-success" role="status">
                    {locale.auth.registrationEmailHint}
                </p>

                <Link className="ui-button" to="/login">{locale.auth.backToLogin}</Link>
                </section>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <section className="auth-card" aria-labelledby="register-title">
                <p className="auth-brand">
                    <bdi lang="ar" dir="rtl">
                        {locale.auth.brand}
                    </bdi>
                </p>

                <h1 id="register-title">{locale.auth.registerTitle}</h1>

                <p className="auth-description">
                    {locale.auth.registerDescription}
                </p>

                <form className="auth-form" onSubmit={handleSubmit} aria-busy={submitting}>
                    <div className="auth-field">
                        <label htmlFor="fullName">{locale.auth.fullNameLabel}</label>
                        <input id="fullName" name="fullName" type="text" dir="auto" autoComplete="name" maxLength={100} value={fullName} onChange={(event) => setFullName(event.target.value)} disabled={submitting} required />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="email">{locale.auth.emailLabel}</label>
                        <input id="email" name="email" type="email" dir="ltr" autoComplete="username" value={email} onChange={(event) => { setEmail(event.target.value); setErrorKey(""); }} aria-invalid={errorKey === "emailAlreadyUsed"} aria-describedby={errorKey === "emailAlreadyUsed" ? "register-error" : undefined} disabled={submitting} required/>
                    </div>

                    <div className="auth-field">
                        <label htmlFor="password">{locale.auth.passwordLabel}</label>
                        <PasswordInput id="password" name="password" type="password" dir="ltr" autoComplete="new-password" minLength={8} aria-describedby="password-hint" value={password} onChange={(event) => setPassword(event.target.value)} disabled={submitting} required/>
                        <small id="password-hint" className="auth-hint">{locale.auth.passwordHint}</small>
                    </div>

                    <div className="auth-field">
                        <label htmlFor="confirmPassword">{locale.auth.confirmPasswordLabel}</label>
                        <PasswordInput id="confirmPassword" name="confirmPassword" type="password" dir="ltr" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={submitting} required/>
                    </div>

                    {errorKey && (
                        <p id="register-error" className="auth-error" role="alert">
                            {locale.error[errorKey]}
                            {errorKey === "emailAlreadyUsed" && <> <Link to="/login">{locale.auth.loginButton}</Link></>}
                        </p>
                    )}

                    <button className="auth-button" type="submit" disabled={submitting}>
                        {submitting ? <LoadingIndicator announce={false}>{locale.auth.registering}</LoadingIndicator> : locale.auth.registerButton}
                    </button>
                </form>

                <p className="auth-footer">
                    {locale.auth.haveAccount}{" "}
                    <Link to="/login">{locale.auth.loginButton}</Link>
                </p>
            </section>
        </AuthLayout>
    );
}

export default Register;