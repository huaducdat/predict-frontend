import api from "./api";

export const getLatestDecisionTrace = async (mode) => {
  const res = await api.get("/api/decision-trace/latest", {
    params: mode ? { mode } : undefined,
  });
  return res.data;
};

export const getRecentDecisionTrace = async (limit = 20, mode) => {
  const res = await api.get("/api/decision-trace/recent", {
    params: mode ? { limit, mode } : { limit },
  });
  return res.data;
};
