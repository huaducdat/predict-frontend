import api from "./api";

export const getUsers = async () => {
  const res = await api.get("/internal/users");
  return res.data;
};
