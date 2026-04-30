import api from "./api";

export const loadPairGlobal = async () => {
  const res = await api.get("/api/pair/global");
  return res.data;
};