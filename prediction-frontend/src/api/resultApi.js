const BASE_URL = "http://localhost:8080/api/results";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// 🔍 GET ALL
export const getAllResults = async () => {
  const res = await fetch(BASE_URL, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error("Fetch failed");
  return res.json();
};

// 🔍 GET BY DATE
export const getResultsByDate = async (date) => {
  const res = await fetch(`${BASE_URL}/date/${date}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error("Fetch by date failed");
  return res.json();
};

// ➕ CREATE
export const createResult = async (data) => {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();

    // 🎯 bắt đúng lỗi trùng ngày
    if (res.status === 409 && text === "DATE_ALREADY_EXISTS") {
      throw new Error("DATE_ALREADY_EXISTS");
    }

    console.error("SERVER ERROR:", text);
    throw new Error("CREATE_FAILED");
  }

  return res.json();
};

// 🔥 STREAK
export const getLatestStreaks = async () => {
  const res = await fetch("http://localhost:8080/api/analysis/latest-streaks", {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error("Failed to load streaks");
  }

  return res.json();
};

// 📄 PAGED
export const getPagedResults = async (page = 1) => {
  const res = await fetch(
    `http://localhost:8080/api/results?page=${page}&size=10`,
    {
      headers: getAuthHeaders(),
    },
  );

  if (!res.ok) throw new Error("Fetch failed");

  return res.json();
};
