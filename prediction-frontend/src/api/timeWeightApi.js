// src/api/globalApi.js
import axios from "axios";

const BASE_URL = "http://localhost:8080/api";

export const loadGlobal = async (date) => {
  const res = await axios.get(`${BASE_URL}/time-weight-global/${date}`);
  return res.data;
};