import API from "../api/axios.js";

export const getCareerPaths = async (signal) => {
    const { data } = await API.get("/career-paths", { signal });
    return data.careerPaths;
};
