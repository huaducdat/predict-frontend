import api from "./api";

export const runPredict = async (mode) => {
  const res = await api.post("/api/predict/run", null, {
    params: mode ? { mode } : undefined,
  });
  return res.data;
};

export const loadPredict = async (mode) => {
  const res = await api.get("/api/predict/latest", {
    params: mode ? { mode } : undefined,
  });
  return res.data;
};
