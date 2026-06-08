import api from "./api";
import { dispatchPatternStateUpdated } from "../events/patternStateEvents";

function devLog(label, payload) {
  if (!import.meta.env.DEV) return;
  console.debug(`[${new Date().toISOString()}] ${label}`, payload ?? "");
}

export const loadCombine = async (mode) => {
  const res = await api.get("/api/combine/latest", {
    params: mode ? { mode } : undefined,
  });
  return res.data;
};

export const runCombine = async (mode) => {
  devLog("COMBINE RUN START", { endpoint: "/api/combine/run", mode });
  const res = await api.post("/api/combine/run", null, {
    params: mode ? { mode } : undefined,
  });
  devLog("COMBINE RUN SUCCESS", { endpoint: "/api/combine/run", mode, payload: res.data });
  dispatchPatternStateUpdated();
  return res.data;
};

export const runAllCombine = async () => {
  devLog("COMBINE RUN START", { endpoint: "/api/combine/run-all" });
  const res = await api.post("/api/combine/run-all");
  devLog("COMBINE RUN SUCCESS", { endpoint: "/api/combine/run-all", payload: res.data });
  dispatchPatternStateUpdated();
  return res.data;
};

export const getLatestModeRecommendation = async () => {
  const res = await api.get("/api/mode-recommendation/latest");
  return res.data;
};
