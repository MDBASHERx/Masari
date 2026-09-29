import createUserClient from "../utils/createUserClient.js";
import { saveAssistantReply } from "../services/chat/saveAssistantReply.js";

export const createDemoReply = async (req, res) => {
    const { id: conversationId } = req.validated.params;
    const { requestId } = req.validated.body;

    const supabase = createUserClient(req.accessToken);

    const { data: conversation, error: conversationError } =
        await supabase
            .from("conversations")
            .select("id")
            .eq("id", conversationId)
            .eq("user_id", req.user.id)
            .maybeSingle();

    if (conversationError)
    {
        throw conversationError;
    }

    if (!conversation)
    {
        return res.status(404).json({
            success: false,
            code: "CONVERSATION_NOT_FOUND",
            message: "Conversation not found",
        });
    }

    const { data: message, error: messageError } = await supabase
        .from("messages")
        .select("id")
        .eq("conversation_id", conversationId)
        .eq("request_id", requestId)
        .eq("role", "user")
        .maybeSingle();

    if (messageError)
    {
        throw messageError;
    }

    if (!message)
    {
        return res.status(404).json({
            success: false,
            code: "MESSAGE_NOT_FOUND",
            message: "Original student message not found",
        });
    }

    const result = await saveAssistantReply({
        userId: req.user.id,
        accessToken: req.accessToken,
        conversationId,
        requestId,
        content:
            "[رد تجريبي لاختبار الحفظ، وليس إجابة من الذكاء الاصطناعي] " +
            "تم استلام رسالتك وحفظ هذا الرد بنجاح.",
        suggestedTask: {
    title: "تدريب تجريبي على المعادلات",
    skillId: "equations",
    minutes: 10,
},
    });

    return res.status(result.created ? 201 : 200).json({
        success: true,
        created: result.created,
        message: result.message,
        aiConnected: false,
    });
};