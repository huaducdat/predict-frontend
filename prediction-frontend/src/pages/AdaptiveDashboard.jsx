import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { useNavigate } from "react-router-dom";

import {
  getAdaptiveExplanationLatest,
  getAdaptiveIntelligenceLatest,
  getAdaptiveLatest,
  getAdaptivePerformanceCards,
} from "../api/adaptivePredictionApi";

const QUICK_LINKS = [
  { label: "Adaptive Prediction", path: "/adaptive-prediction" },
  { label: "Adaptive Performance", path: "/adaptive-performance" },
  { label: "Adaptive Intelligence", path: "/adaptive-intelligence" },
  { label: "Adaptive Shadow Ranking", path: "/adaptive-shadow" },
];

function parseJson(value, fallback = []) {
  if (Array.isArray(value) || (value && typeof value === "object")) return value;
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function formatPercent(value) {
  if (value === null || value === undefined || value === "") return "--";
  const number = Number(value);
  return Number.isFinite(number) ? `${Math.round(number * 100)}%` : "--";
}

function formatPrediction(snapshot) {
  const top10 = parseJson(snapshot?.top10Json, []);
  if (!top10.length) return "--";
  return top10
    .map((item) => String(typeof item === "number" ? item : item?.number).padStart(2, "0"))
    .join(", ");
}

function formatRunDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function Metric({ label, value, accent = "#2563EB" }) {
  return (
    <Paper
      elevation={0}
      sx={{
        minHeight: 116,
        border: "1px solid #D6E1EA",
        borderTop: `4px solid ${accent}`,
        borderRadius: 2,
        p: 2,
        background: "#FFFFFF",
      }}
    >
      <Typography sx={{ color: "#64748B", fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>
        {label}
      </Typography>
      <Typography
        sx={{
          mt: 1,
          color: "#0F172A",
          fontSize: 22,
          fontWeight: 950,
          overflowWrap: "anywhere",
        }}
      >
        {value ?? "--"}
      </Typography>
    </Paper>
  );
}

export default function AdaptiveDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    (async () => {
      const [latest, explanation, intelligence, cards] = await Promise.all([
        getAdaptiveLatest().catch(() => null),
        getAdaptiveExplanationLatest().catch(() => null),
        getAdaptiveIntelligenceLatest().catch(() => null),
        getAdaptivePerformanceCards(1).catch(() => []),
      ]);

      if (!active) return;
      setData({ latest, explanation, intelligence, latestCard: cards?.[0] ?? null });
      if (!latest && !explanation && !intelligence && !cards?.length) {
        setError("Khong tai duoc tong quan Adaptive.");
      }
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const card = data?.latestCard;
    const intelligence = data?.intelligence;
    const explanation = data?.explanation;

    return [
      { label: "Current Prediction", value: formatPrediction(data?.latest), accent: "#2563EB" },
      { label: "RO", value: formatPercent(card?.adaptiveRo ?? intelligence?.adaptiveRo), accent: "#0284C7" },
      { label: "AO", value: formatPercent(card?.adaptiveAo ?? intelligence?.adaptiveAo), accent: "#16A34A" },
      {
        label: "Confidence",
        value: formatPercent(card?.adaptiveConfidence ?? explanation?.adaptiveConfidence ?? intelligence?.adaptiveConfidence),
        accent: "#D97706",
      },
      { label: "Champion", value: card?.rankingChampion ?? intelligence?.currentChampion ?? "--", accent: "#0F766E" },
      { label: "Strongest Predictor", value: card?.strongestPredictor ?? intelligence?.strongestPredictor ?? "--", accent: "#7C3AED" },
      { label: "Strongest Window", value: card?.strongestWindow ?? intelligence?.strongestWindow ?? "--", accent: "#DB2777" },
      { label: "Strongest Variant", value: card?.strongestVariant ?? intelligence?.strongestVariant ?? "--", accent: "#475569" },
    ];
  }, [data]);

  if (loading) {
    return <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>;
  }

  return (
    <Box sx={{ maxWidth: 1320, mx: "auto" }}>
      <Stack spacing={2.5}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
            <Typography sx={{ fontSize: { xs: 30, md: 40 }, fontWeight: 950, color: "#0F172A" }}>
              Adaptive Dashboard
            </Typography>
            <Chip label="Read-only" size="small" sx={{ bgcolor: "#E0F2FE", fontWeight: 900 }} />
          </Stack>
          <Typography sx={{ color: "#475569", fontWeight: 750 }}>
            Current Adaptive prediction and system state.
          </Typography>
        </Box>

        {error ? <Alert severity="warning">{error}</Alert> : null}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
            gap: 1.5,
          }}
        >
          {metrics.map((metric) => <Metric key={metric.label} {...metric} />)}
        </Box>

        <Paper elevation={0} sx={{ border: "1px solid #D6E1EA", borderRadius: 2, p: 2, background: "#FFFFFF" }}>
          <Typography sx={{ mb: 1.25, fontSize: 18, color: "#0F172A", fontWeight: 950 }}>Last Run Information</Typography>
          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
            <Chip label={`Run: ${formatRunDate(data?.latest?.createdAt)}`} />
            <Chip label={`Prediction: ${data?.latest?.predictionDate ?? "--"}`} />
            <Chip label={`Target: ${data?.latest?.targetDate ?? "--"}`} />
            <Chip label={`Variants: ${data?.latest?.totalVariantsRun ?? "--"}`} />
          </Stack>
        </Paper>

        <Box>
          <Typography sx={{ mb: 1, fontSize: 14, color: "#64748B", fontWeight: 900 }}>
            Adaptive Views
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap flexWrap="wrap">
            {QUICK_LINKS.map((item) => (
              <Button
                key={item.label}
                variant="outlined"
                endIcon={<ArrowForwardRoundedIcon />}
                onClick={() => navigate(item.path)}
                sx={{ justifyContent: "space-between", textTransform: "none", fontWeight: 900 }}
              >
                {item.label}
              </Button>
            ))}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
