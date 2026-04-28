const BASE_URL = "http://localhost:8080/api/weights";

// =========================================================
// 🔥 LOAD CURRENT
// =========================================================
export const loadWeights = async () => {
  try {
    const res = await fetch(BASE_URL);

    if (!res.ok) throw new Error("Failed to load weights");

    return await res.json();
  } catch (err) {
    console.error("loadWeights error:", err);
    return null; // 👉 không throw để UI không crash
  }
};

// =========================================================
// 🔥 SAVE CURRENT
// =========================================================
export const saveWeights = async (weights) => {
  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(weights)
    });

    if (!res.ok) throw new Error("Failed to save weights");

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
    const res = await fetch(`${BASE_URL}/reset`, {
      method: "POST"
    });

    if (!res.ok) throw new Error("Failed to reset weights");

    return true;
  } catch (err) {
    console.error("resetWeights error:", err);
    return false;
  }
};