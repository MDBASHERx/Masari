import API from "../api/axios.js";

export const createConversation = async ({ title = "محادثة جديدة", mode = "tutor" } = {}) => {
    const { data } = await API.post("/conversations", {
        title,
        mode,
    });

    return data.conversation;
};

export const getConversations = async ({ offset = 0, limit = 30, signal } = {}) => {
    const { data } = await API.get("/conversations", {
        params: { offset, limit },
        signal,
    });

    return data;
};

export const getMessages = async (conversationId, { offset = 0, limit = 30, signal } = {} ) => {
    const { data } = await API.get(
        `/conversations/${conversationId}/messages`,
        {
            params: { offset, limit },
            signal,
        },
    );

    return data;
};

export const saveUserMessage = async (conversationId, { content, requestId } ) => {
    const { data } = await API.post(
        `/conversations/${conversationId}/messages`,
        {
            content,
            requestId,
        },
        {
            timeout: 60000,
        },
    );

    return data;
};