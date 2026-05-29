import api from "./api";

export const getPredictorDashboard = async () => {
  const res = await api.get("/api/predictors/dashboard");
  return res.data;
};

export const getPredictorDashboardHistory = async (limit = 30) => {
  const res = await api.get("/api/predictors/dashboard/history", {
    params: { limit },
  });
  return res.data;
};

export const getPredictorWeightHistory = async (limit = 30) => {
  const res = await api.get("/api/predictors/weights/history", {
    params: { limit },
  });
  return res.data;
};

export const getSelfEvaluationLatest = async () => {
  const res = await api.get("/api/self-evaluation/latest");
  return res.data;
};

export const getSelfEvaluationRecent = async (limit = 20) => {
  const res = await api.get("/api/self-evaluation/recent", {
    params: { limit },
  });
  return res.data;
};

export const getPatternStateSnapshot = async () => {
  const res = await api.get("/api/pattern/state");
  return res.data;
};
