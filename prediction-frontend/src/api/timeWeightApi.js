import api from "./api";

export const loadGlobal = async () => {
  const res = await api.get(`/api/time-weight-global`);
  return res.data;
};