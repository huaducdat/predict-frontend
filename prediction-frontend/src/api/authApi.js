import axios from "axios";
import api from "./api";
import { API_BASE_URL } from "./apiConfig";

const API = API_BASE_URL;

export const login = async (username, password) => {
  const res = await axios.post(`${API}/api/auth/login`, {
    username,
    password,
  });

  const token = res.data.token;

  // 🔥 LƯU TOKEN NGAY TẠI ĐÂY
  localStorage.setItem("token", token);

  return token;
};

export const getMe = async () => {
  const res = await api.get("/api/auth/me");
  return res.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const res = await api.post("/api/auth/change-password", {
    currentPassword,
    newPassword,
  });
  return res.data;
};

export const resetPassword = async (username, newPassword) => {
  const res = await api.post("/api/auth/reset-password", {
    username,
    newPassword,
  });
  return res.data;
};
