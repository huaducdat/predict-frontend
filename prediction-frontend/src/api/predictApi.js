import api from "./api";

export const runPredict = async () => {
  const res = await api.post("/api/predict/run");
  return res.data;
};

export const loadPredict = async () => {
  const res = await api.get("/api/predict/latest");
  return res.data;
};