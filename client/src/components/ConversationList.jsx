const conversations = [
  {
    id: 1,
    title: "خطة امتحان الرياضيات",
    messages: [
      {
        id: 1,
        text: "عندي امتحان رياضيات",
        role: "user",
      },
      {
        id: 2,
        text: "أكيد، متى الامتحان؟",
        role: "assistant",
      },
    ],
  },

  {
    id: 2,
    title: "تنظيم وقت الدراسة",
    messages: [
      {
        id: 3,
        text: "بدي أنظم وقت الدراسة",
        role: "user",
      },
      {
        id: 4,
        text: "كم ساعة بتقدر تدرس باليوم؟",
        role: "assistant",
      },
    ],
  },
];

function ConversationList({ onSelect }) {
  return (
    <div className= "conversation-list">
      <h3>المحادثات</h3>

      {conversations.map((conversation) => (
        <button
        className="conversation-item"
          key={conversation.id}
          onClick={() => onSelect(conversation)}
        >
          {conversation.title}
        </button>
      ))}
    </div>
  );
}

export default ConversationList;