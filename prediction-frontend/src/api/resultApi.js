import api from "./api";

// 🔍 GET ALL
export const getAllResults = async () => {
  const res = await api.get("/api/results");
  return res.data;
};

// 🔍 GET BY DATE
export const getResultsByDate = async (date) => {
  const res = await api.get(`/api/results/date/${date}`);
  return res.data;
};

// ➕ CREATE
export const createResult = async (data) => {
  try {
    const res = await api.post("/api/results", data);
    return res.data;
  } catch (err) {
    const text = err.response?.data;

    if (err.response?.status === 409 && text === "DATE_ALREADY_EXISTS") {
      throw new Error("DATE_ALREADY_EXISTS");
    }

    console.error("SERVER ERROR:", text);
    throw new Error("CREATE_FAILED");
  }
};

// 🔥 STREAK
export const getLatestStreaks = async () => {
  const res = await api.get("/api/analysis/latest-streaks");
  return res.data;
};

// 📄 PAGED
export const getPagedResults = async (page = 1) => {
  const res = await api.get(`/api/results?page=${page}&size=10`);
  return res.data;
};

// ❌ DELETE BY DATE
export const deleteResultByDate = async (date) => {
  await api.delete(`/api/results/date/${date}`);
  return true;
};