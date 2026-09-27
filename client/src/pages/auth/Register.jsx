import { useState } from "react";
import { Link, Navigate } from "react-router";
import { useAuth } from "../../hooks/useAuth.js";
import { getLocale } from "../../locales/locale.js";
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
            if (error.code === "over_request_rate_limit" || error.code === "over_email_send_rate_limit")
            {
                setErrorKey("tooManyRequests");
            } else {
                setErrorKey("registerFailed");
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) 
    {
        return <p role="status">{locale.auth.loadingSession}</p>;
    }

    if (isAuthenticated) 
    {
        return <Navigate to="/" replace />;
    }

    if (submitted) 
    {
        return (
            <main className="auth-page">
                <section className="auth-card">
                <h1>{locale.auth.registrationSubmitted}</h1>

                <p className="auth-success" role="status">
                    {locale.auth.registrationEmailHint}
                </p>

                <Link to="/login">{locale.auth.backToLogin}</Link>
                </section>
            </main>
        );
    }

    return (
        <main className="auth-page">
            <section className="auth-card" aria-labelledby="register-title">
                <p className="auth-brand">
                    <bdi lang="en" dir="ltr">
                        {locale.auth.brand}
                    </bdi>
                </p>

                <h1 id="register-title">{locale.auth.registerTitle}</h1>

                <p className="auth-description">
                    {locale.auth.registerDescription}
                </p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-field">
                        <label htmlFor="fullName">{locale.auth.fullNameLabel}</label>
                        <input id="fullName" name="fullName" type="text" dir="auto" autoComplete="name" maxLength={100} value={fullName} onChange={(event) => setFullName(event.target.value)} disabled={submitting} required />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="email">{locale.auth.emailLabel}</label>
                        <input id="email" name="email" type="email" dir="ltr" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} disabled={submitting} required/>
                    </div>

                    <div className="auth-field">
                        <label htmlFor="password">{locale.auth.passwordLabel}</label>
                        <input id="password" name="password" type="password" dir="ltr" autoComplete="new-password" minLength={8} aria-describedby="password-hint" value={password} onChange={(event) => setPassword(event.target.value)} disabled={submitting} required/>
                        <small id="password-hint" className="auth-hint">{locale.auth.passwordHint}</small>
                    </div>

                    <div className="auth-field">
                        <label htmlFor="confirmPassword">{locale.auth.confirmPasswordLabel}</label>
                        <input id="confirmPassword" name="confirmPassword" type="password" dir="ltr" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={submitting} required/>
                    </div>

                    {errorKey && (
                        <p className="auth-error" role="alert">
                            {locale.error[errorKey]}
                        </p>
                    )}

                    <button className="auth-button" type="submit" disabled={submitting}>
                        {submitting ? locale.auth.registering : locale.auth.registerButton}
                    </button>
                </form>

                <p className="auth-footer">
                    {locale.auth.haveAccount}{" "}
                    <Link to="/login">{locale.auth.loginButton}</Link>
                </p>
            </section>
        </main>
    );
}

export default Register;