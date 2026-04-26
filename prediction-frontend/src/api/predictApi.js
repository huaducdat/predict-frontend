import axios from "axios";

const BASE = "http://localhost:8080/api/predict";

export const runPredict = async () => {
  const res = await axios.post(`${BASE}/run`); // ✅
  return res.data;
};

export const loadPredict = async () => {
  const res = await axios.get(`${BASE}/latest`); // ✅
  return res.data; // ✅ KHÔNG parse nữa
};
