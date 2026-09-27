import { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext.js";
import { supabase } from "../services/supabase.js";
import { register, login, logout } from "../services/auth.js";

function AuthProvider({ children }) 
{
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

    useEffect(() => {
        let active = true;
        let authEventReceived = false;

        // Listen for session changes
        const { data: { subscription } } =
            supabase.auth.onAuthStateChange((_event, nextSession) => {
                if (!active) 
                {
                    return;
                }

                authEventReceived = true;
                setSession(nextSession);
                setAuthError(null);
                setLoading(false);
            });

        // Restore the current session
        const loadSession = async () => {
            try {
                const { data, error } = await supabase.auth.getSession();

                if (!active || authEventReceived)
                {
                    return;
                }

                if (error)
                {
                    throw error;
                }

                setSession(data.session);
                setLoading(false);
            } catch {
                if (!active || authEventReceived)
                {
                    return;
                }

                setSession(null);
                setAuthError("sessionRestore");
                setLoading(false);
            }
        };

        loadSession();

        return () => {
            active = false;
            subscription.unsubscribe();
        };
    }, []);

    const value = {
        user: session?.user ?? null,
        loading,
        authError,
        isAuthenticated: Boolean(session),
        register,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;