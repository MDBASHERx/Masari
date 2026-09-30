import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import ConversationList from "../components/ConversationList.jsx";
import MessageComposer from "../components/MessageComposer.jsx";
import MessageList from "../components/MessageList.jsx";
import SuggestedTask from "../components/SuggestedTask.jsx";
import TutorMentorSelector from "../components/TutorMentorSelector.jsx";
import { createConversation, getConversations, getMessages, saveUserMessage } from "../services/conversations.js";
import { addSuggestedTask, getCurrentPlan } from "../services/learning.js";
import "../styles/chat.css";

const PAGE_SIZE = 30;
const SELECTED_KEY = "my-coach:selected-conversation";
const errorMessage = (error, fallback) => error.response?.data?.message || fallback;

async function loadEveryPage(loader, signal) {
    const items = [];
    let offset = 0;
    while (true) {
        const page = await loader(offset, signal);
        items.push(...page.items);
        if (!page.pagination?.hasMore) return items;
        offset += page.pagination.limit || PAGE_SIZE;
    }
}

function mergeMessages(previous, incoming) {
    const byId = new Map(previous.filter((item) => !String(item.id).startsWith("pending-")).map((item) => [item.id, item]));
    incoming.filter(Boolean).forEach((item) => byId.set(item.id, item));
    return [...byId.values()].sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")));
}

export default function Chat() {
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [selected, setSelected] = useState(null);
    const selectedRef = useRef(null);
    const [mode, setMode] = useState("tutor");
    const [messages, setMessages] = useState([]);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState("");
    const [pendingMessage, setPendingMessage] = useState(null);
    const [taskStates, setTaskStates] = useState({});
    const taskRequestIds = useRef(new Map());

    const selectConversation = useCallback(async (conversation) => {
        selectedRef.current = conversation;
        setSelected(conversation);
        setMode(conversation.mode);
        setMessages([]);
        setError("");
        setPendingMessage(null);
        setIsSending(false);
        setIsLoadingMessages(true);
        localStorage.setItem(SELECTED_KEY, conversation.id);
        try {
            const loaded = await loadEveryPage(async (offset, signal) => {
                const data = await getMessages(conversation.id, { offset, limit: PAGE_SIZE, signal });
                return { items: data.messages, pagination: data.pagination };
            });
            if (selectedRef.current?.id === conversation.id) setMessages(loaded);
        } catch (loadError) {
            if (loadError.code !== "ERR_CANCELED" && selectedRef.current?.id === conversation.id) {
                setError(errorMessage(loadError, "تعذر تحميل رسائل المحادثة."));
            }
        } finally {
            if (selectedRef.current?.id === conversation.id) setIsLoadingMessages(false);
        }
    }, []);

    const loadConversations = useCallback(async (signal) => {
        setIsLoadingConversations(true);
        setError("");
        try {
            const loaded = await loadEveryPage(async (offset, pageSignal) => {
                const data = await getConversations({ offset, limit: PAGE_SIZE, signal: pageSignal });
                return { items: data.conversations, pagination: data.pagination };
            }, signal);
            setConversations(loaded);
            const remembered = localStorage.getItem(SELECTED_KEY);
            const initial = loaded.find((item) => item.id === remembered) || loaded[0];
            if (initial) await selectConversation(initial);
        } catch (loadError) {
            if (loadError.code !== "ERR_CANCELED") setError(errorMessage(loadError, "تعذر تحميل المحادثات."));
        } finally {
            setIsLoadingConversations(false);
        }
    }, [selectConversation]);

    useEffect(() => {
        const controller = new AbortController();
        loadConversations(controller.signal);
        return () => controller.abort();
    }, [loadConversations]);

    async function handleNewConversation() {
        setIsCreating(true);
        setError("");
        try {
            const conversation = await createConversation({ mode });
            setConversations((current) => [conversation, ...current]);
            await selectConversation(conversation);
        } catch (createError) {
            setError(errorMessage(createError, "تعذر إنشاء المحادثة."));
        } finally {
            setIsCreating(false);
        }
    }

    async function submitPending(pending) {
        const conversationId = pending.conversationId;
        setIsSending(true);
        setError("");
        try {
            const result = await saveUserMessage(conversationId, { content: pending.content, requestId: pending.requestId });
            if (selectedRef.current?.id === conversationId) {
                setMessages((current) => mergeMessages(current, [result.message, result.assistantMessage]));
                setPendingMessage(null);
            }
        } catch (sendError) {
            const savedMessage = sendError.response?.data?.userMessage;
            if (savedMessage && selectedRef.current?.id === conversationId) setMessages((current) => mergeMessages(current, [savedMessage]));
            if (selectedRef.current?.id === conversationId) {
                setError(errorMessage(sendError, "تعذر الحصول على رد. احتفظنا بالرسالة لإعادة المحاولة."));
                setPendingMessage(pending);
            }
        } finally {
            if (selectedRef.current?.id === conversationId) setIsSending(false);
        }
    }

    function handleSend(content) {
        if (!selected || isSending || isLoadingMessages) return false;
        const pending = { conversationId: selected.id, content: content.trim(), requestId: crypto.randomUUID() };
        setPendingMessage(pending);
        setMessages((current) => [...current, { id: `pending-${pending.requestId}`, role: "user", content: pending.content, created_at: new Date().toISOString() }]);
        submitPending(pending);
        return true;
    }

    async function handleAddTask(message) {
        const task = message.suggested_task;
        const requestId = taskRequestIds.current.get(message.id) || crypto.randomUUID();
        taskRequestIds.current.set(message.id, requestId);
        setTaskStates((current) => ({ ...current, [message.id]: { status: "loading", error: "" } }));
        try {
            const plan = await getCurrentPlan();
            if (!plan) { navigate("/assessment"); return; }
            await addSuggestedTask(plan.id, { ...task, requestId });
            setTaskStates((current) => ({ ...current, [message.id]: { status: "success", error: "" } }));
        } catch (taskError) {
            setTaskStates((current) => ({ ...current, [message.id]: { status: "error", error: errorMessage(taskError, "تعذرت إضافة المهمة. حاول مرة أخرى.") } }));
        }
    }

    return (
        <main className="chat-page" dir="rtl">
            <header className="chat-page__header">
                <div><h1>المحادثات</h1><Link to="/">العودة للرئيسية</Link></div>
                <TutorMentorSelector mode={mode} onChangeMode={setMode} disabled={isCreating} />
                <button onClick={handleNewConversation} disabled={isCreating}>{isCreating ? "جارٍ الإنشاء..." : "محادثة جديدة"}</button>
            </header>
            <div className="chat-layout">
                <aside><ConversationList conversations={conversations} selectedId={selected?.id} onSelect={selectConversation} isLoading={isLoadingConversations} /></aside>
                <section className="chat-panel" aria-busy={isLoadingMessages || isSending}>
                    {!selected && !isLoadingConversations && <p>اختر الوضع ثم أنشئ محادثة جديدة.</p>}
                    {selected && <h2>{selected.title} · {selected.mode === "tutor" ? "معلم" : "مرشد"}</h2>}
                    <MessageList messages={messages} isLoading={isLoadingMessages || isSending} error={error}
                        onRetry={() => pendingMessage ? submitPending(pendingMessage) : loadConversations()}
                        renderAfterMessage={(message) => message.role === "assistant" && message.suggested_task ? (
                            <SuggestedTask task={message.suggested_task} status={taskStates[message.id]?.status}
                                error={taskStates[message.id]?.error} onAdd={() => handleAddTask(message)} />
                        ) : null} />
                    {selected && <MessageComposer onSend={handleSend} disabled={isSending || isLoadingMessages} />}
                </section>
            </div>
        </main>
    );
}
