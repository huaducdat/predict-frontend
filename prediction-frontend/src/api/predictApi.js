import axios from "axios";

const BASE_URL = "http://localhost:8080/api";

export const getPredictData = async () => {
  const res = await axios.get(`${BASE_URL}/predict`);
  return res.data;
};

