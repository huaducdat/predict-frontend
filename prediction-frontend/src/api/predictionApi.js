import axios from "axios";

const BASE_URL = "http://localhost:8080/api/prediction";

// ✅ Lấy dữ liệu hôm nay
export const getTodayPrediction = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/today`);
    return res.data; // có thể null
  } catch (err) {
    throw new Error("Failed to fetch today prediction");
  }
};

// ✅ Trigger chạy prediction
export const runPrediction = async () => {
  try {
    const res = await axios.post(`${BASE_URL}/run`);
    return res.data;
  } catch (err) {
    throw new Error("Failed to run prediction");
  }
};