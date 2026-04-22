const BASE_URL = "http://localhost:8080/api/results";

export const getAllResults = async () => {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error("Fetch failed");
  return res.json();
};

export const getResultsByDate = async (date) => {
  const res = await fetch(`${BASE_URL}/date/${date}`);
  if (!res.ok) throw new Error("Fetch by date failed");
  return res.json();
};

export const createResult = async (data) => {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Create failed");
  return res.json();
};

export const getLatestStreaks = async () => {
  const res = await fetch("http://localhost:8080/api/analysis/latest-streaks");

  if (!res.ok) {
    throw new Error("Failed to load streaks");
  }

  return res.json();
};
