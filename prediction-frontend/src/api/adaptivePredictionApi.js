import api from "./api";

export const runAdaptivePrediction = async () => {
  const res = await api.post("/api/adaptive-prediction/run");
  return res.data;
};

export const rebuildAdaptivePhase3 = async () => {
  const res = await api.post("/api/adaptive-prediction/phase3/rebuild");
  return res.data;
};

export const rebuildAdaptivePhase4 = async () => {
  const res = await api.post("/api/adaptive-prediction/phase4/rebuild");
  return res.data;
};

export const getAdaptiveLatest = async () => {
  const res = await api.get("/api/adaptive-prediction/latest");
  return res.data;
};

export const getAdaptiveExplanationLatest = async () => {
  const res = await api.get("/api/adaptive-prediction/explanation/latest");
  return res.data;
};

export const getAdaptivePerformanceCards = async (limit = 30) => {
  const res = await api.get("/api/adaptive-prediction/performance-cards", { params: { limit } });
  return res.data;
};

export const getAdaptiveShadowRankingLatest = async () => {
  const res = await api.get("/api/adaptive-prediction/shadow-ranking/latest");
  return res.data;
};

export const getAdaptiveShadowPerformance = async (limit = 50) => {
  const res = await api.get("/api/adaptive-prediction/shadow-performance", { params: { limit } });
  return res.data;
};

export const getAdaptiveIntelligenceLatest = async () => {
  const res = await api.get("/api/adaptive-prediction/intelligence/latest");
  return res.data;
};

export const getAdaptivePredictorHealth = async (limit = 100) => {
  const res = await api.get("/api/adaptive-prediction/predictor-health", { params: { limit } });
  return res.data;
};

export const getAdaptiveWindowHealth = async (limit = 100) => {
  const res = await api.get("/api/adaptive-prediction/window-health", { params: { limit } });
  return res.data;
};

export const getAdaptiveWeightsLatest = async () => {
  const res = await api.get("/api/adaptive-prediction/weights/latest");
  return res.data;
};

export const getAdaptiveVariantPerformance = async (limit = 200) => {
  const res = await api.get("/api/adaptive-prediction/variants/performance", { params: { limit } });
  return res.data;
};
