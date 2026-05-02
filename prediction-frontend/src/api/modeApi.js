import api from "./api"; // chính là interceptor của ông

// 🔥 GET MODE
export const getMode = async () => {
  const res = await api.get("/api/mode");
  return res.data;
};

// 🔥 SET MODE
export const setMode = async (mode) => {
  await api.post("/api/mode", null, {
    params: { mode },
  });
};