import api from "./api";

export const getStreaks = async () => {
  const res = await api.get("/api/streaks/all");
  return res.data;
};

export const rebuildStreaks = async () => {
  const res = await api.post("/api/streaks/rebuild");
  return res.data;
};