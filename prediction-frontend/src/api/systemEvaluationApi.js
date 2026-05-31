import api from "./api";

export const getSystemEvaluationLatest = async () => {
  const res = await api.get("/api/system-evaluation/latest");
  return res.data;
};

export const getSystemEvaluationRecent = async (limit = 20) => {
  const res = await api.get("/api/system-evaluation/recent", {
    params: { limit },
  });
  return res.data;
};

export const getSystemEvaluationMetricsLatest = async () => {
  const res = await api.get("/api/system-evaluation/metrics/latest");
  return res.data;
};

export const getSystemEvaluationRecommendationLatest = async () => {
  const res = await api.get("/api/system-evaluation/recommendation/latest");
  return res.data;
};
