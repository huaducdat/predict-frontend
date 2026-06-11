import api from "./api";

export const getPerformanceCardsDashboard = async (limit = 30) => {
  const res = await api.get("/api/performance-cards", { params: { limit } });
  return res.data;
};

export const rebuildPerformanceCards = async () => {
  const res = await api.post("/api/performance-cards/rebuild");
  return res.data;
};

export const downloadPerformanceCardsCsv = async () => {
  const res = await api.get("/api/performance-cards/export/csv", {
    responseType: "blob",
  });
  return res.data;
};

export const getPerformanceCardsJson = async () => {
  const res = await api.get("/api/performance-cards/export/json");
  return res.data;
};
