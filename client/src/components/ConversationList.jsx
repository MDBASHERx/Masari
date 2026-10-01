import LoadingIndicator from "./design/LoadingIndicator.jsx";
function ConversationList({ conversations, selectedId, onSelect, isLoading }) {
  return (
    <div className= "conversation-list">
      <h3>المحادثات</h3>

      {isLoading && <p><LoadingIndicator>جاري تحميل المحادثات...</LoadingIndicator></p>}
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
