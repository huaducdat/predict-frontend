import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Input from "./pages/Input";
import Prediction from "./pages/Prediction";
import Results from "./pages/Results";
import Login from "./pages/Login";
import ProtectedRoute from "./pages/ProtectedRoute";
import BetPage from "./pages/BetPage";
import BetDetailPage from "./pages/BetDetailPage";
import PatternReportPage from "./pages/PatternReportPage";
import PredictionIntelligence from "./pages/PredictionIntelligence";
import SystemEvaluation from "./pages/SystemEvaluation";
import DecisionTrace from "./pages/DecisionTrace";
import Account from "./pages/Account";
import AdminUsers from "./pages/AdminUsers";
import AuditDashboard from "./pages/AuditDashboard";
import RankOptimization from "./pages/RankOptimization";
import ShadowRanking from "./pages/ShadowRanking";
import PredictorContribution from "./pages/PredictorContribution";
import PerformanceCards from "./pages/PerformanceCards";
import AdaptivePrediction from "./pages/AdaptivePrediction";
import SpecialPrediction from "./pages/SpecialPrediction";
import SpecialPerformanceCards from "./pages/SpecialPerformanceCards";
import SpecialIntelligence from "./pages/SpecialIntelligence";
import SpecialAnalytics from "./pages/SpecialAnalytics";



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
                  <Route path="/pattern-report" element={<PatternReportPage />} />
                  <Route path="/intelligence" element={<PredictionIntelligence />} />
                  <Route path="/system-evaluation" element={<SystemEvaluation />} />
                  <Route path="/decision-trace" element={<DecisionTrace />} />
                  <Route path="/system-intelligence/audit" element={<AuditDashboard />} />
                  <Route path="/system-intelligence/rank-optimization" element={<RankOptimization />} />
                  <Route path="/system-intelligence/shadow-ranking" element={<ShadowRanking />} />
                  <Route path="/system-intelligence/predictor-contribution" element={<PredictorContribution />} />
                  <Route path="/system-intelligence/performance-cards" element={<PerformanceCards />} />
                  <Route path="/adaptive-prediction" element={<AdaptivePrediction />} />
                  <Route path="/special-prediction" element={<SpecialPrediction />} />
                  <Route path="/special-prediction/performance-cards" element={<SpecialPerformanceCards />} />
                  <Route path="/special-prediction/intelligence" element={<SpecialIntelligence />} />
                  <Route path="/special-prediction/analytics" element={<SpecialAnalytics />} />
                  <Route path="/audit" element={<AuditDashboard />} />
                  <Route path="/audit/rank-optimization" element={<RankOptimization />} />
                  <Route path="/audit/shadow-ranking" element={<ShadowRanking />} />
                  <Route path="/audit/predictor-contribution" element={<PredictorContribution />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
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
