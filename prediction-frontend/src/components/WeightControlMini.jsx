import { useState } from "react";
import { Box, Slider } from "@mui/material";

const INIT = {
  PAIR: 0.3,
  POS: 0.2,
  FREQ: 0.15,
  TIME: 0.15,
  STRK: 0.1,
  GAP: 0.05,
  REP: 0.05
};

// 🔥 thứ tự hệ thống
const ORDER = ["PAIR", "POS", "TIME", "FREQ", "STRK", "GAP", "REP"];

// 🔥 tên đầy đủ + việt hóa
const LABELS = {
  PAIR: {
    en: "Pair To Next",
    vi: "Cặp số → ngày sau"
  },
  POS: {
    en: "Position",
    vi: "Nhóm số"
  },
  TIME: {
    en: "Time Weighted",
    vi: "Trọng số thời gian"
  },
  FREQ: {
    en: "Recent Frequency",
    vi: "Tần suất gần"
  },
  STRK: {
    en: "Streak Continue",
    vi: "Chuỗi tiếp diễn"
  },
  GAP: {
    en: "Gap",
    vi: "Khoảng cách"
  },
  REP: {
    en: "Repeat",
    vi: "Lặp lại"
  }
};

function WeightControlMini() {
  const [weights, setWeights] = useState(INIT);

  const handleChange = (key, newValue) => {
    setWeights((prev) => {
      const oldValue = prev[key];
      const diff = newValue - oldValue;

      const next = { ...prev };
      next[key] = newValue;

      const others = Object.keys(prev).filter((k) => k !== key);
      const othersSum = others.reduce((s, k) => s + prev[k], 0);

      if (othersSum === 0) return prev;

      others.forEach((k) => {
        const ratio = prev[k] / othersSum;
        next[k] = prev[k] - diff * ratio;
      });

      return next;
    });
  };

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        background: "rgba(255,255,255,0.05)",
        fontFamily: "Courier New"
      }}
    >
      {/* 🔥 TITLE */}
      <Box sx={{ mb: 1, fontSize: 13, fontWeight: "bold" }}>
        ⚙️ Trọng số Predictor
      </Box>

      {ORDER.map((key) => {
        const value = weights[key];
        const label = LABELS[key];

        return (
          <Box
            key={key}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 1
            }}
          >
            {/* NAME */}
            <Box sx={{ width: 110, fontSize: 11, lineHeight: 1.2 }}>
              <div>{label.en}</div>
              <div style={{ opacity: 0.6 }}>{label.vi}</div>
            </Box>

            {/* SLIDER */}
            <Slider
              size="small"
              min={0}
              max={1}
              step={0.01}
              value={value}
              onChange={(e, v) => handleChange(key, v)}
              sx={{ flex: 1 }}
            />

            {/* % */}
            <Box sx={{ width: 40, fontSize: 11, textAlign: "right" }}>
              {(value * 100).toFixed(0)}%
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

export default WeightControlMini;