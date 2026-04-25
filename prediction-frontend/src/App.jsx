import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Input from "./pages/Input";
import Prediction from "./pages/Prediction";
import History from "./pages/History";
import Results from "./pages/Results";
import PredictDebug from "./pages/PredictDebug";
import CombineDebug from "./pages/CombineDebug";

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/input" element={<Input />} />
          <Route path="/prediction" element={<Prediction />} />
          <Route path="/history" element={<Results />} />
          <Route path="/debug" element={<PredictDebug />} />
          <Route path="/combine" element={<CombineDebug />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}
export default App;
