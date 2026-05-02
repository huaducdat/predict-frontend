import api from "./api";

const BASE_URL = "/api/weights";

export const loadWeights = async () => {
  const res = await api.get(BASE_URL);
  return res.data;
};

export const saveWeights = async (weights) => {
  const res = await api.post(BASE_URL, weights);
  return res.data;
};

export const resetWeights = async () => {
  const res = await api.post(`${BASE_URL}/reset`);
  return res.data;
};

export const applyWeightPreset = async (type) => {
  const res = await api.post(`${BASE_URL}/preset`, null, {
    params: { type },
  });

  return res.data;
};

export const forceResetWeights = async () => {
  const res = await api.post(`${BASE_URL}/force-reset`);
  return res.data;
};