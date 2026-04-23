import axios from "axios";

const BASE_URL = "http://localhost:8080/api";

export const predictNumbers = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/predictions`);
    return res.data;
  } catch (err) {
    throw new Error("Failed to fetch prediction");
  }
};

export const getTodayPrediction = async () => {
  const res = await axios.get("http://localhost:8080/api/predictions/today");
  return res.data;
};