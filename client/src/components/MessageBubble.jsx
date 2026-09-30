function MessageBubble({ text, role }) {
  return (
    <div>
      <p>{text}</p>
      <small>{role}</small>
    </div>
  );
}

export default MessageBubble;