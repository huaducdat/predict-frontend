import { useState, useEffect } from "react";
import { Box, Slider, Button, Stack } from "@mui/material";
import { loadWeights, saveWeights, resetWeights } from "../api/weightApi";

const INIT = {
  PAIR: 0.3,
  POS: 0.2,
  FREQ: 0.15,
  TIME: 0.15,
  STRK: 0.1,
  GAP: 0.05,
  REP: 0.05,
};

const ORDER = ["PAIR", "POS", "TIME", "FREQ", "STRK", "GAP", "REP"];

const LABELS = {
  PAIR: { en: "Pair To Next", vi: "Cặp số → ngày sau" },
  POS: { en: "Position", vi: "Nhóm số" },
  TIME: { en: "Time Weighted", vi: "Trọng số thời gian" },
  FREQ: { en: "Recent Frequency", vi: "Tần suất gần" },
  STRK: { en: "Streak Continue", vi: "Chuỗi tiếp diễn" },
  GAP: { en: "Gap", vi: "Khoảng cách" },
  REP: { en: "Repeat", vi: "Lặp lại" },
};

const PRESETS = {
  BALANCED: {
    PAIR: 0.3,
    POS: 0.2,
    TIME: 0.15,
    FREQ: 0.15,
    STRK: 0.1,
    GAP: 0.05,
    REP: 0.05,
  },
  AGGRESSIVE: {
    PAIR: 0.45,
    POS: 0.2,
    TIME: 0.15,
    FREQ: 0.1,
    STRK: 0.05,
    GAP: 0.025,
    REP: 0.025,
  },
  SAFE: {
    PAIR: 0.2,
    POS: 0.2,
    TIME: 0.2,
    FREQ: 0.2,
    STRK: 0.1,
    GAP: 0.05,
    REP: 0.05,
  },
  STREAK_FOCUS: {
    PAIR: 0.25,
    POS: 0.15,
    TIME: 0.1,
    FREQ: 0.1,
    STRK: 0.3,
    GAP: 0.05,
    REP: 0.05,
  },
};

function WeightControlMini() {
  const [weights, setWeights] = useState(INIT);
  const [defaultWeights, setDefaultWeights] = useState(INIT);
  const [loading, setLoading] = useState(true);

  const applyPreset = (preset) => {
    setWeights(preset);
  };

  // 🔥 LOAD từ backend
  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await loadWeights();

        const merged = { ...INIT, ...data };

        setWeights(merged);
        setDefaultWeights(merged); // lưu default
      } catch (e) {
        console.error("Load weights failed", e);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

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

  // 🔥 SAVE
  const handleSave = async () => {
    try {
      await saveWeights(weights);
      setDefaultWeights(weights);
      console.log("Saved!");
    } catch (e) {
      console.error(e);
    }
  };

  // 🔥 RESET
  const handleReset = async () => {
    try {
      await resetWeights();

      const data = await loadWeights();

      const merged = { ...INIT, ...data };

      setWeights(merged);
      setDefaultWeights(merged);
    } catch (e) {
      console.error(e);
    }
  };
  // 🔥 CHECK CHANGE
  const isChanged = JSON.stringify(weights) !== JSON.stringify(defaultWeights);

  if (loading) return null;

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        background: "rgba(255,255,255,0.05)",
        fontFamily: "Courier New",
      }}
    >
      {/* TITLE */}
      <Box sx={{ mb: 1, fontSize: 13, fontWeight: "bold" }}>
        ⚙️ Trọng số Predictor
      </Box>

      {/* SLIDERS */}
      {ORDER.map((key) => {
        const value = weights[key] ?? 0;
        const label = LABELS[key];

        return (
          <Box
            key={key}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 1,
            }}
          >
            <Box sx={{ width: 110, fontSize: 11, lineHeight: 1.2 }}>
              <div>{label.en}</div>
              <div style={{ opacity: 0.6 }}>{label.vi}</div>
            </Box>

            <Slider
              size="small"
              min={0}
              max={1}
              step={0.01}
              value={value}
              onChange={(e, v) => handleChange(key, v)}
              sx={{ flex: 1 }}
            />

            <Box sx={{ width: 40, fontSize: 11, textAlign: "right" }}>
              {(value * 100).toFixed(0)}%
            </Box>
          </Box>
        );
      })}

      {/* PRESETS */}
      <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }}>
        <Button size="small" onClick={() => applyPreset(PRESETS.BALANCED)}>
          ⚖️ Balanced
        </Button>

        <Button size="small" onClick={() => applyPreset(PRESETS.AGGRESSIVE)}>
          🚀 Aggressive
        </Button>

        <Button size="small" onClick={() => applyPreset(PRESETS.SAFE)}>
          🛡️ Safe
        </Button>

        <Button size="small" onClick={() => applyPreset(PRESETS.STREAK_FOCUS)}>
          🔥 Streak
        </Button>
      </Stack>

      {/* BUTTONS */}
      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        <Button
          size="small"
          variant="contained"
          onClick={handleSave}
          disabled={!isChanged}
        >
          💾 Save
        </Button>

        <Button size="small" variant="outlined" onClick={handleReset}>
          🔄 Reset
        </Button>
      </Stack>
    </Box>
  );
}

export default WeightControlMini;
