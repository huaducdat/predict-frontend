import axios from "axios";

const API = "http://localhost:8080";

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