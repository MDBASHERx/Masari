import { createClient } from "@supabase/supabase-js";

const createUserClient = (accessToken) => {
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY,
    {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
    },);
};

export default createUserClient;