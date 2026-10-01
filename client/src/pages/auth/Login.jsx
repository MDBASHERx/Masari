import LoadingIndicator from "../../components/design/LoadingIndicator.jsx";
import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router";
import { useAuth } from "../../hooks/useAuth.js";
import { getLocale } from "../../locales/locale.js";
import AuthLayout from "../../components/design/AuthLayout.jsx";
import PasswordInput from "../../components/design/PasswordInput.jsx";
import "../../styles/Auth.css";

function Login() 
{
    const locale = getLocale();
    const location = useLocation();
    const { login, loading, isAuthenticated, authError } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [errorKey, setErrorKey] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (submitting) 
        {
            return;
        }

        setErrorKey("");
        setSubmitting(true);

        try {
            await login({ email, password });
        } catch (error) {
            switch (error.code) 
            {
                case "invalid_credentials":
                    setErrorKey("invalidCredentials");
                    break;

                case "email_not_confirmed":
                    setErrorKey("emailNotConfirmed");
                    break;

                case "over_request_rate_limit":
                case "over_email_send_rate_limit":
                    setErrorKey("tooManyRequests");
                    break;

                default:
                    setErrorKey("loginFailed");
            }
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
        const requestedPath = location.state?.from;
        const destination = typeof requestedPath === "string" && requestedPath.startsWith("/") && !requestedPath.startsWith("//") && !requestedPath.includes("\\")
            ? requestedPath
            : "/";
        return <Navigate to={destination} replace />;
    }

    return (
        <AuthLayout>
            <section className="auth-card" aria-labelledby="login-title">
                <p className="auth-brand">
                    <bdi lang="ar" dir="rtl">
                        {locale.auth.brand}
                    </bdi>
                </p>

                <h1 id="login-title">{locale.auth.loginTitle}</h1>

                <p className="auth-description">
                    {locale.auth.loginDescription}
                </p>

                {location.state?.reason === "sessionExpired" && (
                    <p className="auth-error" role="alert">انتهت جلستك. سجّل الدخول ثم أعد محاولة الرسالة المحفوظة.</p>
                )}

                {authError && (
                    <p className="auth-error" role="alert">
                        {locale.error[authError] || locale.error.sessionRestore}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="auth-form" aria-busy={submitting}>
                    <div className="auth-field">
                        <label htmlFor="email">{locale.auth.emailLabel}</label>
                        <input id="email" name="email" type="email" dir="ltr" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} disabled={submitting} required/>
                    </div>

                    <div className="auth-field">
                        <label htmlFor="password">{locale.auth.passwordLabel}</label>
                        <PasswordInput id="password" name="password" type="password" dir="ltr" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={submitting} required/>
                    </div>

                    {errorKey && (
                        <p className="auth-error" role="alert">
                            {locale.error[errorKey]}
                        </p>
                    )}

                    <button className="auth-button" type="submit" disabled={submitting}>
                        {submitting ? <LoadingIndicator announce={false}>{locale.auth.loggingIn}</LoadingIndicator> : locale.auth.loginButton}
                    </button>
                </form>

                <p className="auth-footer">
                    {locale.auth.noAccount}{" "}
                    <Link to="/register">{locale.auth.createAccount}</Link>
                </p>
                
            </section>
        </AuthLayout>
    );
}

export default Login;
