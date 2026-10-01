// Supabase can return an obfuscated user for an existing confirmed account.
export function isExistingSignup(data) {
    return !data?.session && Array.isArray(data?.user?.identities)
        && data.user.identities.length === 0;
}

export function registrationErrorKey(error) {
    switch (error?.code) {
        case "user_already_exists":
        case "email_exists":
            return "emailAlreadyUsed";
        case "over_request_rate_limit":
        case "over_email_send_rate_limit":
            return "tooManyRequests";
        case "weak_password":
            return "weakPassword";
        default:
            return "registerFailed";
    }
}
