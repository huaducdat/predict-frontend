const BASE = "http://localhost:8080/api/bet";

export const getLastUnit = async () => {
  const res = await fetch(`${BASE}/last-unit`);
  return res.json();
};

export const checkExists = async (date) => {
  const res = await fetch(`${BASE}/exists?date=${date}`);
  return res.json();
};

export const saveBet = async (data) => {
  await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

export const loadBet = async (date) => {
  const res = await fetch(`${BASE}?date=${date}`);
  return res.json();
};

export const getAllSessions = async () => {
  const res = await fetch("http://localhost:8080/api/bet/all");
  return res.json();
};

export const checkByDate = async (date) => {
  const res = await fetch(
    `http://localhost:8080/api/bet/check?date=${date}`
  );
  return res.json();
};