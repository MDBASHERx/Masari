import API from "../api/axios.js";

export const getCurrentUser = async () => {
    const { data } = await API.get("/me");

    return data.user;
};