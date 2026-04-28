import axios from "axios";

const BASE_URL = "http://localhost:8080/api"; // 🔥 FIX

export const loadCombine = async () => {
  const res = await axios.get(`${BASE_URL}/combine/latest`);
  return res.data;
};

export const runCombine = async () => {
  const res = await axios.post(`${BASE_URL}/combine/run`);
  return res.data;
};