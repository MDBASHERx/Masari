import MessageBubble from "./MessageBubble.jsx";

function MessageList({
  messages,
  isLoading,
  error,
  onRetry,
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
        <MessageBubble
          key={message.id}
          text={message.text}
          role={message.role}
        />
      ))}

      {isLoading && (
        <p>جاري كتابة الرد...</p>
      )}

      {error && (
        <div>
          <p>{error}</p>

          <button onClick={onRetry}>
            إعادة المحاولة
          </button>
        </div>
      )}
    </div>
  );
}

export default MessageList;