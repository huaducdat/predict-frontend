import axios from "axios";

const API = "http://localhost:8080";

export const login = async (username, password) => {
  const res = await axios.post(`${API}/api/auth/login`, {
    username,
    password,
  });

  return res.data.token;
};