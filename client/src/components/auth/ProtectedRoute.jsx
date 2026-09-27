import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../hooks/useAuth.js";
import { getLocale } from "../../locales/locale.js";

function ProtectedRoute() 
{
    const locale = getLocale();
    const { loading, authError, isAuthenticated } = useAuth();

    if (loading) 
    {
        return <p role="status">{locale.auth.loadingSession}</p>;
    }

    if (authError) 
    {
        return (
            <p role="alert">
                {locale.error[authError] || locale.error.sessionRestore}
            </p>
        );
    }

    if (!isAuthenticated) 
    {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;