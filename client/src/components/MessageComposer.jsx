function MessageComposer({ text, onTextChange, onSend, onCancel, disabled = false, maxLength = 2000 }) {
  function handleSubmit(e) {
    e.preventDefault();

    if (!text.trim()) {
      return;
    }

    if (onSend(text) !== false) onTextChange("");
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="اكتب رسالتك..."
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        disabled={disabled}
        maxLength={maxLength}
        aria-label="رسالتك للمعلم أو المرشد"
        aria-describedby="message-length"
      />

      <span id="message-length" dir="ltr">{text.length} / {maxLength}</span>
      <button className="ui-button" type="submit" disabled={disabled || !text.trim()}>{disabled ? "جارٍ الإرسال..." : "إرسال"}</button>
      {onCancel && <button className="ui-button ui-button--soft" type="button" onClick={onCancel}>إلغاء الرسالة المرفوضة</button>}
    </form>
  );
}

export default MessageComposer;
