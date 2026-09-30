function MessageBubble({ content, role }) {
  return (
    <div className={`message message--${role}`}>
      <p>{content}</p>
      <small>{role === "user" ? "أنت" : "المساعد"}</small>
    </div>
  );
}

export default MessageBubble;
