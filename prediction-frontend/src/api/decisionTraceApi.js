import api from "./api";

export const getLatestDecisionTrace = async () => {
  const res = await api.get("/api/decision-trace/latest");
  return res.data;
};

export const getRecentDecisionTrace = async (limit = 20) => {
  const res = await api.get("/api/decision-trace/recent", {
    params: { limit },
  });
  return res.data;
};
