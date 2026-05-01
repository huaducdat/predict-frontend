import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080",
});

let isRedirecting = false;

// 🔥 REQUEST
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// 🔥 RESPONSE
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;

    if ((status === 401 || status === 404) && !isRedirecting) {
      isRedirecting = true;

      console.error("🔥 AUTH ERROR:", status, err.response?.data);

      localStorage.removeItem("token");

      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    return Promise.reject(err);
  }
);

export default api;