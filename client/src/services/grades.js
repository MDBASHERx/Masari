import API from "../api/axios.js";

export const getGrades = async ({
    offset = 0,
    limit = 20,
    signal,
} = {}) => {
    const { data } = await API.get("/grades", {
        params: { offset, limit },
        signal,
    });

    return data;
};

export const createGrade = async (payload) => {
    const { data } = await API.post("/grades", payload);
    return data;
};

export const updateGrade = async (gradeId, payload) => {
    const { data } = await API.patch(
        `/grades/${gradeId}`,
        payload,
    );

    return data;
};