import api from "./api";

export const getPatternState = async () => {
  const res = await api.get("/api/pattern/state");
  return res.data;
};

export const getLatestPatternReport = async (mode) => {
  const res = await api.get("/api/pattern/report/latest", {
    params: mode ? { mode } : undefined,
  });
  return res.data;
};

export const getRecentPatternReports = async (limit = 10, mode) => {
  const res = await api.get("/api/pattern/report/recent", {
    params: mode ? { limit, mode } : { limit },
  });
  return res.data;
};
