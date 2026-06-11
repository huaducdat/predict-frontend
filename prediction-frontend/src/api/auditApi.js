import api from "./api";

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const getAuditSummary = async () => {
  const res = await api.get("/api/audit/summary");
  return res.data;
};

export const getAuditRecentOverlap = async () => {
  const res = await api.get("/api/audit/recent-overlap");
  return res.data;
};

export const getAuditPhases = async () => {
  const res = await api.get("/api/audit/phases");
  return res.data;
};

export const getAuditScoreValidation = async () => {
  const res = await api.get("/api/audit/score-validation");
  return res.data;
};

export const getGapReversalSummary = async () => {
  const res = await api.get("/api/audit/gap-reversal/summary");
  return res.data;
};

export const getRankOptimizationSummary = async () => {
  const res = await api.get("/api/audit/rank-optimization/summary");
  return res.data;
};

export const getRankOptimizationStrategies = async () => {
  const res = await api.get("/api/audit/rank-optimization/strategies");
  return res.data;
};

export const getRankOptimizationBacktest = async () => {
  const res = await api.get("/api/audit/rank-optimization/backtest");
  return res.data;
};

export const getRankOptimizationBaselineCompare = async () => {
  const res = await api.get("/api/audit/rank-optimization/baseline-compare");
  return res.data;
};

export const getShadowRankingSummary = async (force = false) => {
  const res = await api.get("/api/audit/shadow-ranking/summary", {
    params: { force },
  });
  return res.data;
};

export const getShadowRankingLatest = async (force = false) => {
  const res = await api.get("/api/audit/shadow-ranking/latest", {
    params: { force },
  });
  return res.data;
};

export const getShadowRankingByDate = async ({ date, mode, force = false } = {}) => {
  const params = { force };
  if (date) params.date = date;
  if (mode) params.mode = mode;

  const res = await api.get("/api/audit/shadow-ranking/by-date", { params });
  return res.data;
};

export const getShadowRankingCompare = async ({ date, mode } = {}) => {
  const params = {};
  if (date) params.date = date;
  if (mode) params.mode = mode;

  const res = await api.get("/api/audit/shadow-ranking/compare", { params });
  return res.data;
};

export const getShadowRankingEvaluation = async () => {
  const res = await api.get("/api/audit/shadow-ranking/evaluate");
  return res.data;
};

export const downloadAuditSummaryJson = async () => {
  const res = await api.get("/api/audit/export/summary.json", { responseType: "blob" });
  downloadBlob(res.data, "audit_summary.json");
};

export const downloadAuditAccuracyCsv = async () => {
  const res = await api.get("/api/audit/export/accuracy.csv", { responseType: "blob" });
  downloadBlob(res.data, "audit_accuracy.csv");
};

export const downloadRankOptimizationJson = async () => {
  const res = await api.get("/api/audit/rank-optimization/export/json", { responseType: "blob" });
  downloadBlob(res.data, "rank_optimization_summary.json");
};

export const downloadRankOptimizationCsv = async () => {
  const res = await api.get("/api/audit/rank-optimization/export/csv", { responseType: "blob" });
  downloadBlob(res.data, "rank_optimization_strategies.csv");
};

export const downloadShadowRankingJson = async () => {
  const res = await api.get("/api/audit/shadow-ranking/export/json", { responseType: "blob" });
  downloadBlob(res.data, "shadow_ranking_summary.json");
};

export const downloadShadowRankingCsv = async () => {
  const res = await api.get("/api/audit/shadow-ranking/export/csv", { responseType: "blob" });
  downloadBlob(res.data, "shadow_ranking_rows.csv");
};
