import api from "./api";

export const getSystemEvaluationLatest = async (mode) => {
  const res = await api.get("/api/system-evaluation/latest", {
    params: mode ? { mode } : undefined,
  });
  return res.data;
};

export const getSystemEvaluationRecent = async (limit = 20, mode) => {
  const res = await api.get("/api/system-evaluation/recent", {
    params: mode ? { limit, mode } : { limit },
  });
  return res.data;
};

export const getSystemEvaluationMetricsLatest = async (mode) => {
  const res = await api.get("/api/system-evaluation/metrics/latest", {
    params: mode ? { mode } : undefined,
  });
  return res.data;
};

export const getSystemEvaluationRecommendationLatest = async (mode) => {
  const res = await api.get("/api/system-evaluation/recommendation/latest", {
    params: mode ? { mode } : undefined,
  });
  return res.data;
};

export const runSystemEvaluation = async (mode, targetDate) => {
  const params = {};
  if (mode) params.mode = mode;
  if (targetDate) params.targetDate = targetDate;

  const res = await api.post("/api/system-evaluation/run", null, { params });
  return res.data;
};
