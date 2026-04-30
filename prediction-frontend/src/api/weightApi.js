import api from "./api"; // axios instance của ông

// =========================================================
// 🔥 LOAD CURRENT
// =========================================================
export const loadWeights = async () => {
  try {
    const res = await api.get("/api/weights");
    return res.data;
  } catch (err) {
    console.error("loadWeights error:", err);
    return null;
  }
};

// =========================================================
// 🔥 SAVE CURRENT
// =========================================================
export const saveWeights = async (weights) => {
  try {
    await api.post("/api/weights", weights);
    return true;
  } catch (err) {
    console.error("saveWeights error:", err);
    return false;
  }
};

// =========================================================
// 🔥 RESET → DEFAULT
// =========================================================
export const resetWeights = async () => {
  try {
    await api.post("/api/weights/reset");
    return true;
  } catch (err) {
    console.error("resetWeights error:", err);
    return false;
  }
};