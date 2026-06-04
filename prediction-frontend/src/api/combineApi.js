import api from "./api";

export const loadCombine = async (mode) => {
  const res = await api.get("/api/combine/latest", {
    params: mode ? { mode } : undefined,
  });
  return res.data;
};

export const runCombine = async (mode) => {
  const res = await api.post("/api/combine/run", null, {
    params: mode ? { mode } : undefined,
  });
  return res.data;
};

export const runAllCombine = async () => {
  const res = await api.post("/api/combine/run-all");
  return res.data;
};

export const getLatestModeRecommendation = async () => {
  const res = await api.get("/api/mode-recommendation/latest");
  return res.data;
};
