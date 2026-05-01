import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api/api";

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const check = async () => {
      const token = localStorage.getItem("token");

      // ❌ không có token → login
      if (!token) {
        setIsAuth(false);
        setLoading(false);
        return;
      }

      try {
        // 🔥 verify với backend
        await api.get("/api/auth/me");

        setIsAuth(true);
      } catch (err) {
        console.error("AUTH FAIL:", err);

        // ❌ token sai → clear
        localStorage.removeItem("token");
        setIsAuth(false);
      } finally {
        setLoading(false);
      }
    };

    check();
  }, []);

  // ⏳ đang check
  if (loading) {
    return <div>Checking login...</div>;
  }

  // ❌ không hợp lệ
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  // ✔ OK
  return children;
}

export default ProtectedRoute;