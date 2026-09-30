import { useState } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { getLocale } from "../../locales/locale.js";
import { getCurrentUser } from "../../services/user.js";

function AccountTest() {
  const locale = getLocale();
  const { logout } = useAuth();

  const [busy, setBusy] = useState("");
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [errorKey, setErrorKey] = useState("");

  const handleVerify = async () => {
    if (busy) return;

    setBusy("verify");
    setErrorKey("");
    setVerifiedUser(null);

    try {
      const user = await getCurrentUser();
      setVerifiedUser(user);
    } catch {
      setErrorKey("verificationFailed");
    } finally {
      setBusy("");
    }
  };

  const handleLogout = async () => {
    if (busy) return;

    setBusy("logout");
    setErrorKey("");

    try {
      await logout();
    } catch {
      setErrorKey("logoutFailed");
    } finally {
      setBusy("");
    }
  };

  return (
    <section className="account-test" aria-labelledby="account-test-title">
      <h2 id="account-test-title">{locale.accountTest.title}</h2>

      <div className="account-test__actions">
        <button
          type="button"
          onClick={handleVerify}
          disabled={Boolean(busy)}
        >
          {busy === "verify"
            ? locale.accountTest.verifying
            : locale.accountTest.verify}
        </button>

        <button
          type="button"
          onClick={handleLogout}
          disabled={Boolean(busy)}
        >
          {busy === "logout"
            ? locale.auth.loggingOut
            : locale.auth.logout}
        </button>
      </div>

      {verifiedUser && (
        <p role="status">
          {locale.accountTest.verified}{" "}
          <bdi dir="ltr">{verifiedUser.email}</bdi>
        </p>
      )}

      {errorKey && (
        <p className="account-test__error" role="alert">
          {locale.error[errorKey]}
        </p>
      )}
    </section>
  );
}

export default AccountTest;