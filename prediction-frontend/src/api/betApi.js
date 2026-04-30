import api from "./api";

export const getLastUnit = async () => {
  const res = await api.get("/api/bet/last-unit");
  return res.data;
};

export const checkExists = async (date) => {
  const res = await api.get(`/api/bet/exists?date=${date}`);
  return res.data;
};

export const saveBet = async (data) => {
  await api.post("/api/bet", data);
};

export const loadBet = async (date) => {
  const res = await api.get(`/api/bet?date=${date}`);
  return res.data;
};

export const getAllSessions = async () => {
  const res = await api.get("/api/bet/all");
  return res.data;
};

export const checkByDate = async (date) => {
  const res = await api.get(`/api/bet/check?date=${date}`);
  return res.data;
};