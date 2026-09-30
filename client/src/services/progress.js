import API from "../api/axios.js";

export const getProgress = async (signal) => {
    const { data } = await API.get("/progress", { signal });
    return data.progress;
};
