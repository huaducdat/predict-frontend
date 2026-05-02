import { useState, useEffect } from "react";
import { Box, Slider, Button, Stack, Typography } from "@mui/material";
import {
  loadWeights,
  saveWeights,
  resetWeights,
  applyWeightPreset,
} from "../api/weightApi";

import { getMode, setMode } from "../api/modeApi";

const ORDER = ["PAIR", "POS", "TIME", "FREQ", "STRK", "GAP", "REP"];

const LABELS = {
  PAIR: { en: "Pair", vi: "Cặp số → ngày sau" },
  POS: { en: "Position", vi: "Nhóm số" },
  TIME: { en: "Time", vi: "Trọng số thời gian" },
  FREQ: { en: "Frequency", vi: "Tần suất gần" },
  STRK: { en: "Streak", vi: "Chuỗi tiếp diễn" },
  GAP: { en: "Gap", vi: "Khoảng cách" },
  REP: { en: "Repeat", vi: "Lặp lại" },
};

const PRESETS = ["SAFE", "BALANCED", "AGGRESSIVE", "STREAK_FOCUS"];

const PRESET_LABELS = {
  SAFE: "🛡 Safe",
  BALANCED: "⚖️ Balanced",
  AGGRESSIVE: "🚀 Aggressive",
  STREAK_FOCUS: "🔥 Streak",
};

function WeightControlMini() {
  const [weights, setWeights] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [activePreset, setActivePreset] = useState("CUSTOM");
  const [lastSaved, setLastSaved] = useState({});

  const [mode, setModeState] = useState("LONG");

  
 const MODES = [
  { label: "SHORT", value: "SHORT_TERM" },
  { label: "LONG", value: "EXTENDED" },
];

  useEffect(() => {
    const fetch = async () => {
      try {
        await fetchWeights();

        const m = await getMode();
        setModeState(m);
      } catch (e) {
        console.error("Load failed", e);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  const handleModeChange = async (m) => {
    try {
      setSaving(true);

      await setMode(m);
      setModeState(m);

      console.log("✅ Mode changed:", m);
    } catch (e) {
      console.error("Change mode failed", e);
    } finally {
      setSaving(false);
    }
  };

  const fetchWeights = async () => {
    const data = await loadWeights();

    setWeights(data);
    setLastSaved(data);
  };

  const handleChange = (key, newValue) => {
    setActivePreset("CUSTOM");

    setWeights((prev) => {
      const oldValue = prev[key] ?? 0;
      const diff = newValue - oldValue;

      const next = { ...prev, [key]: newValue };

      const others = ORDER.filter((k) => k !== key);
      const othersSum = others.reduce((sum, k) => sum + (prev[k] ?? 0), 0);

      if (othersSum <= 0) {
        return next;
      }

      others.forEach((k) => {
        const current = prev[k] ?? 0;
        const ratio = current / othersSum;
        const value = current - diff * ratio;

        next[k] = Math.max(0, value);
      });

      return next;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      await saveWeights(weights);

      setLastSaved(weights);
      console.log("✅ Weights saved");
    } catch (e) {
      console.error("Save weights failed", e);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setSaving(true);

      await resetWeights();
      await fetchWeights();

      setActivePreset("AGGRESSIVE");
      console.log("✅ Reset to default");
    } catch (e) {
      console.error("Reset failed", e);
    } finally {
      setSaving(false);
    }
  };

  const handlePreset = async (type) => {
    try {
      setSaving(true);

      await applyWeightPreset(type);
      await fetchWeights();

      setActivePreset(type);
      console.log("✅ Preset applied:", type);
    } catch (e) {
      console.error("Apply preset failed", e);
    } finally {
      setSaving(false);
    }
  };

  const isChanged = JSON.stringify(weights) !== JSON.stringify(lastSaved);

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
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        {MODES.map((m) => (
          <Button
            key={m.value}
            size="small"
            variant={mode === m.value ? "contained" : "outlined"}
            onClick={() => handleModeChange(m.value)}
            disabled={saving}
            sx={{
              fontSize: 11,
              px: 1.5,
              minWidth: 60,
            }}
          >
            {m.label}
          </Button>
        ))}
      </Stack>

      <Box sx={{ mb: 1, fontSize: 13, fontWeight: "bold" }}>
        ⚙️ Trọng số Predictor
      </Box>

      <Typography sx={{ fontSize: 11, opacity: 0.7, mb: 1 }}>
        Preset hiện tại: {activePreset}
      </Typography>

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
            <Box sx={{ width: 130, fontSize: 11, lineHeight: 1.2 }}>
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

            <Box sx={{ width: 45, fontSize: 11, textAlign: "right" }}>
              {(value * 100).toFixed(1)}%
            </Box>
          </Box>
        );
      })}

      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
        {PRESETS.map((type) => (
          <Button
            key={type}
            size="small"
            variant={activePreset === type ? "contained" : "outlined"}
            onClick={() => handlePreset(type)}
            disabled={saving}
            sx={{ fontSize: 10 }}
          >
            {PRESET_LABELS[type]}
          </Button>
        ))}
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        <Button
          size="small"
          variant="contained"
          onClick={handleSave}
          disabled={!isChanged || saving}
        >
          💾 Save
        </Button>

        <Button
          size="small"
          variant="outlined"
          onClick={handleReset}
          disabled={saving}
        >
          🔄 Reset
        </Button>
      </Stack>

      {isChanged && (
        <Typography sx={{ mt: 1, fontSize: 11, color: "#ffb74d" }}>
          ⚠️ Có thay đổi chưa lưu
        </Typography>
      )}
    </Box>
  );
}

export default WeightControlMini;
