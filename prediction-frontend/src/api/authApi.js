import axios from "axios";
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
