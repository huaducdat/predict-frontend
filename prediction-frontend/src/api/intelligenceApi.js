import api from "./api";

export const getPredictorDashboard = async (mode) => {
  const res = await api.get("/api/predictors/dashboard", {
    params: mode ? { mode } : undefined,
  });
  return res.data;
};

export const getPredictorDashboardHistory = async (limit = 30, mode) => {
  const res = await api.get("/api/predictors/dashboard/history", {
    params: mode ? { limit, mode } : { limit },
  });
  return res.data;
};

export const getPredictorWeightHistory = async (limit = 30, mode) => {
  const res = await api.get("/api/predictors/weights/history", {
    params: mode ? { limit, mode } : { limit },
  });
  return res.data;
};

export const getSelfEvaluationLatest = async (mode) => {
  const res = await api.get("/api/self-evaluation/latest", {
    params: mode ? { mode } : undefined,
  });
  return res.data;
};

export const getSelfEvaluationRecent = async (limit = 20, mode) => {
  const res = await api.get("/api/self-evaluation/recent", {
    params: mode ? { limit, mode } : { limit },
  });
  return res.data;
};

export const getPatternStateSnapshot = async () => {
  const res = await api.get("/api/pattern/state");
  return res.data;
};
