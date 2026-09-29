import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getServerHealth } from "../services/api.js";
import { getLocale } from "../locales/locale.js";
import AccountTest from "../components/auth/AccountTest.jsx";
import "../styles/Test.css";

function Home() 
{
    const locale = getLocale();
    const [serverStatus, setServerStatus] = useState("loading");

    useEffect(() => {
        const controller = new AbortController();

    const checkServer = async () => {
        try {
            await getServerHealth(controller.signal);

        if (!controller.signal.aborted) 
        {
            setServerStatus("success");
        }
        } catch {
            if (!controller.signal.aborted) 
            {
            setServerStatus("error");
            }
        }
    };

        checkServer();

        return () => controller.abort();
    }, []);

    return (
        <main className="welcome">
            <span className="welcome__badge">{locale.home.badge}</span>

            <h1 lang="en" dir="ltr">{locale.auth.brand}</h1>
            <h2>{locale.home.title}</h2>
            <p>{locale.home.description}</p>
            <Link to="/profile">{locale.profile.title}</Link>
            <Link to="/assessment">{locale.assessment.start}</Link>

            <p className={`server-status server-status--${serverStatus}`} role="status">
            {locale.server[serverStatus]}
            </p>

            <p className={`server-status server-status--${serverStatus}`} role="status">
                {serverStatus === "loading" && "جارٍ التحقق من الاتصال بالخادم…"}
                {serverStatus === "success" && "تم الاتصال بالخادم بنجاح"}
                {serverStatus === "error" && "تعذّر الاتصال بالخادم"}
            </p>
            <AccountTest />
        </main>
    );
}

export default Home;