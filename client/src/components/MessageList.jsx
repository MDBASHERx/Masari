import LoadingIndicator from "./design/LoadingIndicator.jsx";
import { Fragment } from "react";
import MessageBubble from "./MessageBubble.jsx";

function MessageList({
  messages,
  isLoading,
  error,
  onRetry,
  canRetry = true,
  onDismiss,
  renderAfterMessage,
}) {
  if (
    messages.length === 0 &&
    !isLoading &&
    !error
  ) {
    return <p>لا توجد رسائل بعد</p>;
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
        <p><LoadingIndicator>جاري انتظار رد المساعد...</LoadingIndicator></p>
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
