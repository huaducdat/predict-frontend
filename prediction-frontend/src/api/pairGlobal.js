// src/api/pairApi.js

export const loadPairGlobal = async () => {
  const res = await fetch("http://localhost:8080/api/pair/global");
  if (!res.ok) throw new Error("Failed to load pair global");
  return res.json();
};