import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import ConversationList from "../components/ConversationList.jsx";
import MessageComposer from "../components/MessageComposer.jsx";
import MessageList from "../components/MessageList.jsx";
import SuggestedTask from "../components/SuggestedTask.jsx";
import TutorMentorSelector from "../components/TutorMentorSelector.jsx";
import { createConversation, getConversations, getMessages, saveUserMessage } from "../services/conversations.js";
import { addSuggestedTask, getCurrentPlan } from "../services/learning.js";
import { useAuth } from "../hooks/useAuth.js";
import "../styles/chat.css";

const PAGE_SIZE = 30;
const SELECTED_KEY = "my-coach:selected-conversation";
const PENDING_KEY = "my-coach:pending-messages";
const REJECTED_KEY = "my-coach:rejected-message-drafts";
const TASKS_KEY = "my-coach:suggested-tasks";
const MAX_MESSAGE_LENGTH = 2000;
const errorMessage = (error, fallback) => error.response?.data?.message || fallback;

function readStored(key) {
    try { return JSON.parse(localStorage.getItem(key) || "{}"); }
    catch { return {}; }
}

function userStorageKey(prefix, userId) {
    return `${prefix}:${userId}`;
}

function taskStorageKey(userId, planId, messageId) {
    return `${TASKS_KEY}:${userId}:${planId}:${messageId}`;
}

function isPermanentRejection(error) {
    const status = error.response?.status;
    const saved = error.response?.data?.userMessageSaved;
    return !saved && status >= 400 && status < 500 && status !== 401 && status !== 408 && status !== 429;
}

function savePending(userId, pending) {
    const key = userStorageKey(PENDING_KEY, userId);
    const stored = readStored(key);
    stored[pending.conversationId] = pending;
    localStorage.setItem(key, JSON.stringify(stored));
}

function removePending(userId, conversationId) {
    const key = userStorageKey(PENDING_KEY, userId);
    const stored = readStored(key);
    delete stored[conversationId];
    localStorage.setItem(key, JSON.stringify(stored));
}

function saveRejectedDraft(userId, pending) {
    const key = userStorageKey(REJECTED_KEY, userId);
    const stored = readStored(key);
    stored[pending.conversationId] = pending.content;
    localStorage.setItem(key, JSON.stringify(stored));
}

function removeRejectedDraft(userId, conversationId) {
    const key = userStorageKey(REJECTED_KEY, userId);
    const stored = readStored(key);
    delete stored[conversationId];
    localStorage.setItem(key, JSON.stringify(stored));
}

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
    const { user, logout } = useAuth();
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
    const [errorRetryable, setErrorRetryable] = useState(true);
    const [pendingMessage, setPendingMessage] = useState(null);
    const [composerText, setComposerText] = useState("");
    const [hasRejectedDraft, setHasRejectedDraft] = useState(false);
    const [taskStates, setTaskStates] = useState({});
    const [currentPlan, setCurrentPlan] = useState(null);
    const sendingConversationIds = useRef(new Set());

    const selectConversation = useCallback(async (conversation) => {
        selectedRef.current = conversation;
        setSelected(conversation);
        setMode(conversation.mode);
        setMessages([]);
        setError("");
        setErrorRetryable(true);
        const rejectedDraft = readStored(userStorageKey(REJECTED_KEY, user.id))[conversation.id] || "";
        setComposerText(rejectedDraft);
        setHasRejectedDraft(Boolean(rejectedDraft));
        const restoredPending = readStored(userStorageKey(PENDING_KEY, user.id))[conversation.id] || null;
        setPendingMessage(restoredPending);
        setIsSending(sendingConversationIds.current.has(conversation.id));
        setIsLoadingMessages(true);
        localStorage.setItem(SELECTED_KEY, conversation.id);
        try {
            const loaded = await loadEveryPage(async (offset, signal) => {
                const data = await getMessages(conversation.id, { offset, limit: PAGE_SIZE, signal });
                return { items: data.messages, pagination: data.pagination };
            });
            if (selectedRef.current?.id === conversation.id) {
                const hasSavedUserMessage = restoredPending && loaded.some((message) => message.request_id === restoredPending.requestId && message.role === "user");
                const restoredMessages = restoredPending && !hasSavedUserMessage
                    ? [...loaded, { id: `pending-${restoredPending.requestId}`, role: "user", content: restoredPending.content, created_at: restoredPending.createdAt }]
                    : loaded;
                setMessages(restoredMessages);
                if (restoredPending) {
                    setErrorRetryable(true);
                    setError("هذه الرسالة ما زالت بانتظار رد. أعد المحاولة قبل إرسال رسالة أخرى.");
                } else if (rejectedDraft) {
                    setErrorRetryable(false);
                    setError("رُفضت الرسالة السابقة. صحّحها أو ألغها ثم حاول مجددًا.");
                }
            }
        } catch (loadError) {
            if (loadError.code !== "ERR_CANCELED" && selectedRef.current?.id === conversation.id) {
                setError(errorMessage(loadError, "تعذر تحميل رسائل المحادثة."));
            }
        } finally {
            if (selectedRef.current?.id === conversation.id) setIsLoadingMessages(false);
        }
    }, [user.id]);

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

    useEffect(() => {
        getCurrentPlan().then(setCurrentPlan).catch(() => {});
    }, []);

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
        sendingConversationIds.current.add(conversationId);
        setIsSending(true);
        setError("");
        setErrorRetryable(true);
        try {
            const result = await saveUserMessage(conversationId, { content: pending.content, requestId: pending.requestId });
            removePending(user.id, conversationId);
            if (selectedRef.current?.id === conversationId) {
                setMessages((current) => mergeMessages(current, [result.message, result.assistantMessage]));
                setPendingMessage(null);
            }
        } catch (sendError) {
            const savedMessage = sendError.response?.data?.userMessage;
            const permanentlyRejected = isPermanentRejection(sendError);
            if (permanentlyRejected) {
                removePending(user.id, conversationId);
                saveRejectedDraft(user.id, pending);
            }
            if (savedMessage && selectedRef.current?.id === conversationId) setMessages((current) => mergeMessages(current, [savedMessage]));
            if (selectedRef.current?.id === conversationId) {
                if (permanentlyRejected) {
                    setMessages((current) => current.filter((message) => message.id !== `pending-${pending.requestId}`));
                    setPendingMessage(null);
                    setComposerText(pending.content);
                    setHasRejectedDraft(true);
                    setErrorRetryable(false);
                    setError("رُفضت الرسالة ولم تُحفظ. صحّحها أو ألغها ثم حاول مجددًا.");
                } else {
                    setErrorRetryable(true);
                    setError(errorMessage(sendError, "تعذر الحصول على رد. احتفظنا بالرسالة لإعادة المحاولة."));
                    setPendingMessage(pending);
                }
            }
            if (sendError.response?.status === 401) {
                await logout().catch(() => {});
                navigate("/login", { replace: true, state: { from: "/chat", reason: "sessionExpired" } });
            }
        } finally {
            sendingConversationIds.current.delete(conversationId);
            if (selectedRef.current?.id === conversationId) setIsSending(false);
        }
    }

    function handleSend(content) {
        if (!selected || pendingMessage || isSending || isLoadingMessages) return false;
        const trimmedContent = content.trim();
        if (!trimmedContent || trimmedContent.length > MAX_MESSAGE_LENGTH) {
            setErrorRetryable(false);
            setError(`يجب ألا تتجاوز الرسالة ${MAX_MESSAGE_LENGTH} حرفًا.`);
            return false;
        }
        setHasRejectedDraft(false);
        removeRejectedDraft(user.id, selected.id);
        const pending = { conversationId: selected.id, content: trimmedContent, requestId: crypto.randomUUID(), createdAt: new Date().toISOString() };
        savePending(user.id, pending);
        setPendingMessage(pending);
        setMessages((current) => [...current, { id: `pending-${pending.requestId}`, role: "user", content: pending.content, created_at: pending.createdAt }]);
        submitPending(pending);
        return true;
    }

    async function handleAddTask(message) {
        const task = message.suggested_task;
        setTaskStates((current) => ({ ...current, [message.id]: { status: "loading", error: "" } }));
        try {
            const plan = currentPlan || await getCurrentPlan();
            if (!plan) { navigate("/assessment"); return; }
            if (!currentPlan) setCurrentPlan(plan);
            const storageKey = taskStorageKey(user.id, plan.id, message.id);
            const storedTask = readStored(storageKey);
            const requestId = storedTask.requestId || crypto.randomUUID();
            localStorage.setItem(storageKey, JSON.stringify({ requestId, status: "idle" }));
            await addSuggestedTask(plan.id, { ...task, requestId });
            localStorage.setItem(storageKey, JSON.stringify({ requestId, status: "success" }));
            setTaskStates((current) => ({ ...current, [message.id]: { status: "success", error: "" } }));
        } catch (taskError) {
            setTaskStates((current) => ({ ...current, [message.id]: { status: "error", error: errorMessage(taskError, "تعذرت إضافة المهمة. حاول مرة أخرى.") } }));
        }
    }

    function getTaskState(messageId) {
        if (taskStates[messageId]) return taskStates[messageId];
        if (!currentPlan) return undefined;
        return readStored(taskStorageKey(user.id, currentPlan.id, messageId));
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
                        canRetry={errorRetryable}
                        onDismiss={() => setError("")}
                        renderAfterMessage={(message) => message.role === "assistant" && message.suggested_task ? (
                            <SuggestedTask task={message.suggested_task} status={getTaskState(message.id)?.status}
                                error={getTaskState(message.id)?.error} onAdd={() => handleAddTask(message)} />
                        ) : null} />
                    {selected && <MessageComposer text={composerText} onTextChange={setComposerText} onSend={handleSend}
                        onCancel={hasRejectedDraft ? () => { removeRejectedDraft(user.id, selected.id); setComposerText(""); setHasRejectedDraft(false); setError(""); } : undefined}
                        maxLength={MAX_MESSAGE_LENGTH} disabled={Boolean(pendingMessage) || isSending || isLoadingMessages} />}
                </section>
            </div>
        </main>
    );
}
