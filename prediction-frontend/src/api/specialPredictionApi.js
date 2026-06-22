import api from "./api";

export const getSpecialStatus = async () => (await api.get("/api/special-prediction/status")).data;
export const getSpecialCatalog = async () => (await api.get("/api/special-prediction/catalog")).data;
export const runSpecialPrediction = async () => (await api.post("/api/special-prediction/run")).data;
export const getSpecialLatest = async () => (await api.get("/api/special-prediction/latest")).data;
export const getSpecialOutputsLatest = async () => (await api.get("/api/special-prediction/outputs/latest")).data;
export const getSpecialWeightsLatest = async () => (await api.get("/api/special-prediction/weights/latest")).data;
export const getSpecialPredictorHealth = async (limit = 100) => (await api.get("/api/special-prediction/predictor-health", { params: { limit } })).data;
export const getSpecialWindowHealth = async (limit = 100) => (await api.get("/api/special-prediction/window-health", { params: { limit } })).data;
export const getSpecialVariantPerformance = async (limit = 200) => (await api.get("/api/special-prediction/variants/performance", { params: { limit } })).data;
export const getSpecialIntelligenceLatest = async () => (await api.get("/api/special-prediction/intelligence/latest")).data;
export const getSpecialPerformanceCards = async (limit = 30) => (await api.get("/api/special-prediction/performance-cards", { params: { limit } })).data;
export const getSpecialShadowRankingLatest = async () => (await api.get("/api/special-prediction/shadow-ranking/latest")).data;
export const getSpecialShadowPerformance = async (limit = 50) => (await api.get("/api/special-prediction/shadow-performance", { params: { limit } })).data;
