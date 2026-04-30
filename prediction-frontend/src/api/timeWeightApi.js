import api from "./api";

export const loadGlobal = async (date) => {
  const res = await api.get(`/api/time-weight-global/${date}`);
  return res.data;
};