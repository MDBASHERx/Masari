import { useEffect, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";

import MessageList from "./components/MessageList.jsx";
import MessageComposer from "./components/MessageComposer.jsx";
import ConversationList from "./components/ConversationList.jsx";
import TutorMentorSelector from "./components/TutorMentorSelector.jsx";
import SuggestedTask from "./components/SuggestedTask.jsx";

import CareerExploration from "./pages/CareerExploration.jsx";

import { getServerHealth } from "./services/api.js";
import "./styles/Test.css";

function App() {
  const [serverStatus, setServerStatus] = useState("loading");

  const [mode, setMode] = useState("tutor");

  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState("");

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "عندي امتحان رياضيات وبدي أرتب خطة دراسة",
      role: "user",
    },
    {
      id: 2,
      text: "أكيد، متى الامتحان وكم ساعة تقدر تدرس باليوم؟",
      role: "assistant",
    },
  ]);

  const [suggestedTask, setSuggestedTask] = useState({
    title: "تدرب على المعادلات",
    skillId: "equations",
    minutes: 10,
  });

  useEffect(() => {
    const controller = new AbortController();

    const checkServer = async () => {
      try {
        await getServerHealth(controller.signal);

        if (!controller.signal.aborted) {
          setServerStatus("success");
        }
      } catch {
        if (!controller.signal.aborted) {
          setServerStatus("error");
        }
      }
    };

    checkServer();

    return () => controller.abort();
  }, []);

  function handleSendMessage(text) {
    if (!text.trim()) {
      return;
    }

    setError("");

    const newMessage = {
      id: Date.now(),
      text: text,
      role: "user",
    };

    setMessages((prevMessages) => [
      ...prevMessages,
      newMessage,
    ]);

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      setError(
        "تعذر الحصول على رد، حاول مرة أخرى"
      );
    }, 1500);
  }

  function handleRetry() {
    setError("");

    setIsLoading(true);

    setTimeout(() => {
      const replyMessage = {
        id: Date.now(),
        text:
          mode === "tutor"
            ? "تمام، خلينا نكمل الدرس خطوة بخطوة."
            : "تمام، خلينا نرتب خطتك مع بعض.",
        role: "assistant",
      };

      setMessages((prevMessages) => [
        ...prevMessages,
        replyMessage,
      ]);

      setIsLoading(false);
    }, 1500);
  }

  function handleSelectConversation(conversation) {
    setMessages(conversation.messages);

    setError("");
  }

  function handleClearMessages() {
    setMessages([]);

    setError("");
  }

  function handleChangeMode(newMode) {
    setMode(newMode);

    setError("");

    if (newMode === "tutor") {
      setMessages([
        {
          id: 1,
          text: "مرحباً، أنا معلمك. ماذا تريد أن تتعلم اليوم؟",
          role: "assistant",
        },
      ]);
    } else {
      setMessages([
        {
          id: 1,
          text: "مرحباً، أنا مرشدك. كيف أساعدك في تنظيم خطتك؟",
          role: "assistant",
        },
      ]);
    }
  }

  function handleAddSuggestedTask(task) {
    alert(`تمت إضافة: ${task.title}`);

    setSuggestedTask(null);
  }

  return (
    <Routes>

      <Route
        path="/"
        element={
          <main className="welcome">

            <span className="welcome__badge">
              خطوة صغيرة اليوم، مستقبل أفضل غداً
            </span>

            <Link to="/future">
              استكشف مستقبلك
            </Link>

            <ConversationList
              onSelect={handleSelectConversation}
            />

            <TutorMentorSelector
              mode={mode}
              onChangeMode={handleChangeMode}
            />

            <button onClick={handleClearMessages}>
              مسح المحادثة
            </button>

            <MessageList
              messages={messages}
              isLoading={isLoading}
              error={error}
              onRetry={handleRetry}
            />

            <SuggestedTask
              task={suggestedTask}
              onAdd={handleAddSuggestedTask}
            />

            <MessageComposer
              onSend={handleSendMessage}
            />

            <h1>
              MY COACH
            </h1>

            <h2>
              معلمك ومرشدك الدراسي
            </h2>

            <p>
              لقدراتك، نظم دراستك، وابن طريقك نحو المستقبل خطوة بخطوة
            </p>

            <p
              className={`server-status server-status--${serverStatus}`}
            >
              {serverStatus === "loading" &&
                "جاري الاتصال بالخادم"}

              {serverStatus === "success" &&
                "تم الاتصال بالخادم بنجاح"}

              {serverStatus === "error" &&
                "تعذر الاتصال بالخادم"}
            </p>

          </main>
        }
      />

      <Route
        path="/future"
        element={
          <main className="welcome">

            <Link to="/">
              العودة إلى الشات
            </Link>

            <CareerExploration />

          </main>
        }
      />

    </Routes>
  );
}

export default App;