import axios from "axios";

const BASE_URL = "http://localhost:8080/api";

export const loadCombineExplain = async () => {
  const res = await axios.get(`${BASE_URL}/combine/explain/latest`);
  return res.data;
};