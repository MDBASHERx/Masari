import { createClient } from "@supabase/supabase-js";

// Server-only client that BYPASSES Row Level Security.
// Use it only when RLS cannot do the job (answer keys, writing scores),
// and always filter by the verified req.user.id yourself.
let adminClient = null;

const createAdminClient = () => {
    if (adminClient) return adminClient;

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVER_KEY) {
        throw new Error("SUPABASE_URL and SUPABASE_SERVER_KEY are required for grading");
    }

    adminClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVER_KEY, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
    });

    return adminClient;
};

export default createAdminClient;
