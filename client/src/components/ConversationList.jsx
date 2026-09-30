function ConversationList({ conversations, selectedId, onSelect, isLoading }) {
  return (
    <div className= "conversation-list">
      <h3>المحادثات</h3>

      {isLoading && <p role="status">جاري تحميل المحادثات...</p>}
      {!isLoading && conversations.length === 0 && <p>لا توجد محادثات محفوظة.</p>}
      {conversations.map((conversation) => (
        <button
        className="conversation-item"
          key={conversation.id}
          onClick={() => onSelect(conversation)}
          aria-current={selectedId === conversation.id ? "true" : undefined}
        >
          {conversation.title}
        </button>
      ))}
    </div>
  );
}

export default ConversationList;
