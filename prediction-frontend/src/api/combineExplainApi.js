import api from "./api";

export const loadCombineExplain = async () => {
  const res = await api.get("/api/combine/explain/latest");
  return res.data;
};