import Icon from "./design/Icon.jsx";
import LoadingIndicator from "./design/LoadingIndicator.jsx";

export default function ChatEmptyState({ mode = "tutor", hasConversation = false, onCreate, creating = false, onChoosePrompt }) {
    const mentor = mode === "mentor";
    const prompts = mentor
        ? ["كيف أنظّم وقتي للدراسة؟", "ساعدني على اكتشاف اهتماماتي", "كيف أختار هدفًا دراسيًا مناسبًا؟"]
        : ["اشرح لي جمع الكسور خطوة بخطوة", "أعطني تلميحًا لحل معادلة", "كيف أحسب النسبة المئوية؟"];
    return <div className={`chat-empty ${mentor ? "chat-empty--mentor" : ""}`}>
        <div className="chat-empty-art" aria-hidden="true">
            <span className="chat-empty-orbit" />
            <span className="chat-empty-icon"><Icon name={mentor ? "compass" : "chat"} size={43} /></span>
            <span className="chat-empty-spark"><Icon name="spark" size={20} /></span>
            <span className="chat-empty-book"><Icon name="book" size={21} /></span>
        </div>
        <span className="chat-empty-eyebrow">{mentor ? "خطوة أوضح نحو مستقبلك" : "كل فكرة تبدأ بسؤال"}</span>
        <h3>{hasConversation ? "أول رسالة، أول خطوة" : "مساحة لفضولك وطموحك"}</h3>
        <p className="chat-empty-description">{hasConversation
            ? mentor ? "احكِ لي عن هدفك أو ما يشغلك، ونفكّر في خطوتك القادمة معًا." : "اسأل بطريقتك، حتى لو لم تكن الفكرة واضحة بعد. نفهمها معًا خطوة بخطوة."
            : "اختر المعلّم لنفهم ونتدرّب، أو المرشد لنخطّط ونستكشف. محادثتك تبدأ من هنا."}</p>
        {hasConversation ? <div className="chat-empty-prompts" role="group" aria-label="أفكار لبدء المحادثة">
            {prompts.map(prompt => <button type="button" key={prompt} onClick={() => onChoosePrompt?.(prompt)}><Icon name="spark" size={16} /><span>{prompt}</span><Icon name="arrow" size={16} /></button>)}
        </div> : <button type="button" className="ui-button chat-empty-start" onClick={onCreate} disabled={creating}>
            {creating ? <LoadingIndicator announce={false}>جارٍ الإنشاء…</LoadingIndicator> : <><Icon name={mentor ? "compass" : "book"} size={19} />ابدأ مع {mentor ? "المرشد" : "المعلّم"}<Icon name="arrow" size={18} /></>}
        </button>}
        <small className="chat-empty-note">{hasConversation ? "اختر فكرة لتضعها في حقل الكتابة، وعدّلها كما تحب قبل الإرسال." : "على مهلك، لا يوجد سؤال صغير."}</small>
    </div>;
}
