import API from "../api/axios.js";

export const getProfile = async (signal) => {
    const { data } = await API.get("/me/profile", { signal });

    return data.profile;
};

export const updateProfile = async (changes) => {
    const { data } = await API.patch("/me/profile", changes);

    return data.profile;
};