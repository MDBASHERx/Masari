import createUserClient from "../utils/createUserClient.js";

const conversationFields = "id, title, mode, created_at";
const messageFields = "id, role, content, request_id, created_at";

const notFound = (res) => {
    return res.status(404).json({
        success: false,
        code: "CONVERSATION_NOT_FOUND",
        message: "Conversation not found",
    });
};

const findConversation = async (supabase, id, userId) => {
    const { data, error } = await supabase
        .from("conversations")
        .select(conversationFields)
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();

    if (error) 
    {
        throw error;
    }

    return data;
};

export const createConversation = async (req, res) => {
    const supabase = createUserClient(req.accessToken);
    const { title, mode } = req.validated.body;

    const { data, error } = await supabase
        .from("conversations")
        .insert({
            user_id: req.user.id,
            title,
            mode,
        })
        .select(conversationFields)
        .single();

    if (error)
    {
        throw error;
    }

    return res.status(201).json({
        success: true,
        conversation: data,
    });
};

export const listConversations = async (req, res) => {
    const supabase = createUserClient(req.accessToken);
    const { offset, limit } = req.validated.query;

    const { data, error } = await supabase
        .from("conversations")
        .select(conversationFields)
        .eq("user_id", req.user.id)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(offset, offset + limit);

    if (error) 
    {
        throw error;
    }

    return res.json({
        success: true,
        conversations: data.slice(0, limit),
        pagination: {
            offset,
            limit,
            hasMore: data.length > limit,
        },
    });
};

export const listMessages = async (req, res) => {
    const supabase = createUserClient(req.accessToken);
    const { id } = req.validated.params;
    const { offset, limit } = req.validated.query;

    const conversation = await findConversation(supabase, id, req.user.id);

    if (!conversation) return notFound(res);

    const { data, error } = await supabase
        .from("messages")
        .select(messageFields)
        .eq("conversation_id", id)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(offset, offset + limit);

    if (error) 
    {
        throw error;
    }

    return res.json({
        success: true,
        conversation,
        messages: data.slice(0, limit),
        pagination: {
            offset,
            limit,
            hasMore: data.length > limit,
        },
    });
};

export const saveUserMessage = async (req, res) => {
    const supabase = createUserClient(req.accessToken);
    const { id } = req.validated.params;
    const { content, requestId } = req.validated.body;

    const conversation = await findConversation(supabase, id, req.user.id);

    if (!conversation) 
    {
        return notFound(res);
    }
    
    const { data, error } = await supabase
        .from("messages")
        .insert({
            conversation_id: id,
            role: "user",
            content,
            request_id: requestId,
        })
        .select(messageFields)
        .single();

    if (error?.code === "23505") 
    {
        const { data: existing, error: readError } = await supabase
            .from("messages")
            .select(messageFields)
            .eq("conversation_id", id)
            .eq("request_id", requestId)
            .eq("role", "user")
            .maybeSingle();

        if (readError) 
        {
            throw readError;
        }

        if (!existing) 
        {
            throw error;
        }

        if (existing.content !== content) 
        {
            return res.status(409).json({
                success: false,
                code: "REQUEST_ID_CONFLICT",
                message: "This requestId was used for a different message",
            });
        }

        return res.status(200).json({
            success: true,
            created: false,
            message: existing,
            aiConnected: false,
        });
    }

    if (error) 
    {
        throw error;
    }

    return res.status(201).json({
        success: true,
        created: true,
        message: data,
        aiConnected: false,
    });
};