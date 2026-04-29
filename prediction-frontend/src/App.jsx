import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Input from "./pages/Input";
import Prediction from "./pages/Prediction";
import Results from "./pages/Results";
import Login from "./pages/Login";
import ProtectedRoute from "./pages/ProtectedRoute";
import BetPage from "./pages/BetPage";
import BetDetailPage from "./pages/BetDetailPage"



function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 🔐 LOGIN */}
        <Route path="/login" element={<Login />} />

        {/* 🔒 PROTECTED AREA */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/input" element={<Input />} />
                  <Route path="/prediction" element={<Prediction />} />
                  <Route path="/history" element={<Results />} />
                  <Route path="/bet" element={<BetPage />} />
                  <Route path="/bet/:date" element={<BetDetailPage />} />
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
