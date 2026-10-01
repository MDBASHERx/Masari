import { beforeEach, describe, expect, it, vi } from "vitest";
const { signUp } = vi.hoisted(() => ({ signUp: vi.fn() }));
vi.mock("../../client/src/services/supabase.js", () => ({ supabase: { auth: { signUp } } }));
import { register } from "../../client/src/services/auth.js";
import { registrationErrorKey } from "../../client/src/services/signupResult.js";
const input = { fullName: " Student ", email: " student@example.com ", password: "test-password" };
beforeEach(() => signUp.mockReset());
describe("email signup responses", () => {
    it("rejects an obfuscated existing account without treating it as success", async () => {
        signUp.mockResolvedValue({ data: { user: { identities: [] }, session: null }, error: null });
        await expect(register(input)).rejects.toMatchObject({ code: "email_exists" });
    });
    it("keeps a real pending confirmation successful and trims submitted fields", async () => {
        const data = { user: { identities: [{ provider: "email" }] }, session: null };
        signUp.mockResolvedValue({ data, error: null });
        await expect(register(input)).resolves.toEqual(data);
        expect(signUp).toHaveBeenCalledWith({ email: "student@example.com", password: input.password, options: { data: { full_name: "Student" } } });
    });
    it("does not classify an absent identities field as a duplicate", async () => {
        const data = { user: { id: "new-user" }, session: null };
        signUp.mockResolvedValue({ data, error: null });
        await expect(register(input)).resolves.toEqual(data);
    });
    it("preserves an authenticated signup", async () => {
        const data = { user: { identities: [] }, session: { access_token: "test" } };
        signUp.mockResolvedValue({ data, error: null });
        await expect(register(input)).resolves.toEqual(data);
    });
    it.each(["user_already_exists", "email_exists"])("handles explicit %s", async (code) => {
        signUp.mockResolvedValue({ data: null, error: { code } });
        await expect(register(input)).rejects.toMatchObject({ code });
        expect(registrationErrorKey({ code })).toBe("emailAlreadyUsed");
    });
    it("distinguishes throttling and weak passwords from duplicate accounts", () => {
        expect(registrationErrorKey({ code: "over_email_send_rate_limit" })).toBe("tooManyRequests");
        expect(registrationErrorKey({ code: "weak_password" })).toBe("weakPassword");
        expect(registrationErrorKey(new Error("network"))).toBe("registerFailed");
    });
});
