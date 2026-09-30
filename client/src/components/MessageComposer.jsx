import { useState } from "react";

function MessageComposer({ onSend }) {
  const [text, setText] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    if (!text.trim()) {
      return;
    }

    onSend(text);
    setText("");
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="اكتب رسالتك..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button type="submit">إرسال</button>
    </form>
  );
}

export default MessageComposer;