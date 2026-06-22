import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Chip, CircularProgress, Paper, Stack, Typography } from "@mui/material";

import {
  getSpecialIntelligenceLatest,
  getSpecialLatest,
  getSpecialPredictorHealth,
  getSpecialWindowHealth,
} from "../api/specialPredictionApi";

function parseJson(value, fallback = []) {
  if (Array.isArray(value) || (value && typeof value === "object")) return value;
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function fmtPct(value) {
  if (value === null || value === undefined || value === "") return "--";
  const number = Number(value);
  return Number.isFinite(number) ? `${Math.round(number * 100)}%` : "--";
}

function num(value) {
  if (value === null || value === undefined || value === "") return "--";
  return String(value).padStart(2, "0");
}

function SummaryCard({ label, value, tone = "default" }) {
  const colors = {
    primary: ["#F5F3FF", "#4C1D95"],
    good: ["#ECFDF5", "#065F46"],
    warn: ["#FEF3C7", "#78350F"],
    default: ["#F8FAFC", "#0F172A"],
  };
  const [bg, color] = colors[tone] ?? colors.default;
  return (
    <Paper elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 2, p: 2, bgcolor: bg }}>
      <Typography sx={{ fontSize: 12, color: "#64748B", fontWeight: 950, mb: 0.75 }}>{label}</Typography>
      <Typography sx={{ fontSize: 24, color, fontWeight: 950, lineHeight: 1.15 }}>{value ?? "--"}</Typography>
    </Paper>
  );
}

function Section({ title, children }) {
  return (
    <Paper elevation={0} sx={{ border: "1px solid #D6E1EA", borderRadius: 2, p: 2, background: "#FFFFFF" }}>
      <Typography sx={{ fontSize: 18, fontWeight: 950, color: "#0F172A", mb: 1.5 }}>{title}</Typography>
      {children}
    </Paper>
  );
}

export default function SpecialIntelligence() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [latest, intelligence, predictorHealth, windowHealth] = await Promise.all([
          getSpecialLatest().catch(() => null),
          getSpecialIntelligenceLatest().catch(() => null),
          getSpecialPredictorHealth(100),
          getSpecialWindowHealth(100),
        ]);
        if (active) setData({ latest, intelligence, predictorHealth, windowHealth });
      } catch (err) {
        console.error("Load special intelligence error:", err);
        if (active) setError("Khong tai duoc Special Intelligence.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const promotionCandidates = useMemo(() => parseJson(data?.intelligence?.promotionCandidatesJson, []), [data?.intelligence]);
  const agingPredictors = useMemo(() => parseJson(data?.intelligence?.agingPredictorsJson, []), [data?.intelligence]);
  const underperformingWindows = useMemo(() => parseJson(data?.intelligence?.underperformingWindowsJson, []), [data?.intelligence]);
  const summary = useMemo(() => parseJson(data?.intelligence?.summaryJson, {}), [data?.intelligence]);

  if (loading) {
    return <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>;
  }

  return (
    <Box sx={{ maxWidth: 1480, mx: "auto" }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography sx={{ fontSize: { xs: 30, md: 42 }, fontWeight: 950, color: "#0F172A", letterSpacing: 0 }}>Special Intelligence</Typography>
          <Typography sx={{ color: "#475569", fontWeight: 750 }}>Read-only state overview for the special-number prediction engine.</Typography>
        </Box>
        {error ? <Alert severity="error">{error}</Alert> : null}

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" }, gap: 1.5 }}>
          <SummaryCard label="Predicted Number" value={num(data?.intelligence?.primaryPrediction ?? data?.latest?.primaryPrediction)} tone="primary" />
          <SummaryCard label="RO" value={fmtPct(data?.intelligence?.specialRo)} tone="good" />
          <SummaryCard label="AO" value={fmtPct(data?.intelligence?.specialAo)} tone="good" />
          <SummaryCard label="Bias" value={data?.intelligence?.currentBias ?? "--"} />
          <SummaryCard label="Champion" value={data?.intelligence?.currentChampion ?? "--"} />
          <SummaryCard label="Strongest Predictor" value={data?.intelligence?.strongestPredictor ?? "--"} />
          <SummaryCard label="Strongest Window" value={data?.intelligence?.strongestWindow ?? "--"} />
          <SummaryCard label="Strongest Variant" value={data?.intelligence?.strongestVariant ?? "--"} />
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
          <Section title="Health Overview">
            <Stack spacing={1}>
              <Chip label={`Confidence ${fmtPct(summary?.confidence)}`} sx={{ fontWeight: 950 }} />
              <Chip label={`Predictors ${data?.predictorHealth?.length ?? 0}`} sx={{ fontWeight: 950 }} />
              <Chip label={`Windows ${data?.windowHealth?.length ?? 0}`} sx={{ fontWeight: 950 }} />
            </Stack>
          </Section>
          <Section title="Promotion Candidates">
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
              {(promotionCandidates.length ? promotionCandidates : ["None"]).map((item) => <Chip key={item} label={item} sx={{ fontWeight: 900 }} />)}
            </Stack>
          </Section>
          <Section title="Aging Predictors">
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
              {(agingPredictors.length ? agingPredictors : ["None"]).map((item) => <Chip key={item} label={item} sx={{ fontWeight: 900 }} />)}
            </Stack>
          </Section>
        </Box>

        <Section title="Underperforming Windows">
          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
            {(underperformingWindows.length ? underperformingWindows : [{ windowDays: "None" }]).map((item) => (
              <Chip
                key={item.windowDays}
                label={item.windowDays === "None" ? "None" : `${item.windowDays}d · ${fmtPct(item.effectiveness)} · conf ${fmtPct(item.confidence)}`}
                sx={{ fontWeight: 900 }}
              />
            ))}
          </Stack>
        </Section>
      </Stack>
    </Box>
  );
}
