import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080",
});

// 🔥 REQUEST: gắn token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// 🔥 RESPONSE: handle 401
let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response && error.response.status === 401) {
      console.log("🔥 Token expired / invalid");

      // 🔥 tránh gọi nhiều lần
      if (!isRedirecting) {
        isRedirecting = true;

        localStorage.removeItem("token");

        // 🔥 tránh redirect loop
        if (window.location.pathname !== "/login") {
          window.location.replace("/login");
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;