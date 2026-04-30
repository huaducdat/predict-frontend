import api from "./api";

export const loadCombine = async () => {
  const res = await api.get("/api/combine/latest");
  return res.data;
};

export const runCombine = async () => {
  const res = await api.post("/api/combine/run");
  return res.data;
};