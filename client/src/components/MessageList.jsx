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
        <p role="status">جاري انتظار رد المساعد...</p>
      )}

      {error && (
        <div role="alert">
          <p>{error}</p>

          {canRetry && <button onClick={onRetry}>إعادة المحاولة</button>}
          {!canRetry && onDismiss && <button onClick={onDismiss}>إخفاء الخطأ</button>}
        </div>
      )}
    </div>
  );
}

export default MessageList;
