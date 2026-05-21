import api from "./api";

export const getPatternState = async () => {
  const res = await api.get("/api/pattern/state");
  return res.data;
};

export const getLatestPatternReport = async () => {
  const res = await api.get("/api/pattern/report/latest");
  return res.data;
};

export const getRecentPatternReports = async (limit = 10) => {
  const res = await api.get("/api/pattern/report/recent", {
    params: { limit },
  });
  return res.data;
};
