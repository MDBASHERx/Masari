import API from "../api/axios.js";

export const USE_MOCK_PROGRESS =
  import.meta.env.VITE_USE_MOCK_LEARNING === "true";

const loadMock = () => import("./progress.mock.js");

export const getProgress = async () => {
  if (USE_MOCK_PROGRESS) {
    return (await loadMock()).getProgress();
  }

  const { data } = await API.get("/progress");

  return data.progress;
};