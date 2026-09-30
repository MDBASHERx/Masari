import { useState } from "react";

function MessageComposer({ onSend, disabled = false }) {
  const [text, setText] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    if (!text.trim()) {
      return;
    }

    if (onSend(text) !== false) setText("");
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="اكتب رسالتك..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
      />

      <button type="submit" disabled={disabled}>{disabled ? "جارٍ الإرسال..." : "إرسال"}</button>
    </form>
  );
}

export default MessageComposer;
