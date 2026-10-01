import LoadingIndicator from "./design/LoadingIndicator.jsx";
import Icon from "./design/Icon.jsx";
import { Fragment } from "react";
import MessageBubble from "./MessageBubble.jsx";

function MessageList({
  messages,
  isLoading,
  isSending = false,
  mode = "tutor",
  error,
  onRetry,
  canRetry = true,
  onDismiss,
  renderAfterMessage,
  emptyState,
}) {
  if (
    messages.length === 0 &&
    !isLoading &&
    !error
  ) {
    return emptyState ?? <p>لا توجد رسائل بعد</p>;
  }

  return (
    <div>
      {messages.map((message) => (
        <Fragment key={message.id}>
          <MessageBubble content={message.content} role={message.role} />
          {renderAfterMessage?.(message)}
        </Fragment>
      ))}

      {isLoading && (
        isSending ? <div className="assistant-wait" role="status">
          <span className="assistant-wait-avatar" aria-hidden="true"><Icon name={mode === "mentor" ? "compass" : "spark"} size={22} /></span>
          <div className="assistant-wait-bubble">
            <span className="assistant-wait-title">{mode === "mentor" ? "مرشدك يفكّر معك" : "معلّمك يحضّر الشرح"}</span>
            <span className="assistant-wait-detail">جارٍ انتظار رد المساعد<span className="typing-dots" aria-hidden="true"><i /><i /><i /></span></span>
          </div>
        </div> : <div className="chat-history-loading"><LoadingIndicator>جارٍ تحميل المحادثة…</LoadingIndicator></div>
      )}

      {error && (
        <div className="chat-feedback" role="alert">
          <p>{error}</p>

          {canRetry && <button className="ui-button ui-button--soft" type="button" disabled={isLoading} onClick={onRetry}>إعادة المحاولة</button>}
          {!canRetry && onDismiss && <button className="ui-button ui-button--soft" type="button" onClick={onDismiss}>إخفاء الخطأ</button>}
        </div>
      )}
    </div>
  );
}

export default MessageList;
