import { supabase } from "./supabase.js";

// Create an account
export const register = async ({ fullName, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
            data: {
                full_name: fullName.trim(),
            },
        },
    });

    if (error)
    {
        throw error;
    }

  return data;
};

// Sign in
export const login = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
    });

    if (error)
    {
        throw error;
    }

    return data;
};

// Sign out of the current session
export const logout = async () => {
    const { error } = await supabase.auth.signOut({
        scope: "local",
    });

    if (error)
    {
        throw error;
    }
};