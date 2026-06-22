import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RefreshIcon from "@mui/icons-material/Refresh";

import {
  getSpecialCatalog,
  getSpecialIntelligenceLatest,
  getSpecialLatest,
  getSpecialPredictorHealth,
  getSpecialShadowPerformance,
  getSpecialShadowRankingLatest,
  getSpecialVariantPerformance,
  getSpecialWeightsLatest,
  getSpecialWindowHealth,
  runSpecialPrediction,
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

function fmtDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
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

function Section({ title, action, children }) {
  return (
    <Paper elevation={0} sx={{ border: "1px solid #D6E1EA", borderRadius: 2, p: 2, background: "#FFFFFF" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 950, color: "#0F172A" }}>{title}</Typography>
        {action}
      </Stack>
      {children}
    </Paper>
  );
}

function NumberPill({ item }) {
  return (
    <Box component="span" sx={{ minWidth: 38, height: 36, px: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 999, bgcolor: "#EFF6FF", border: "1px solid #BFDBFE", fontWeight: 950 }}>
      {num(typeof item === "number" ? item : item?.number)}
    </Box>
  );
}

function HealthTable({ title, rows, columns }) {
  return (
    <Section title={title}>
      <Box sx={{ overflowX: "auto" }}>
        <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
          <Box component="thead">
            <Box component="tr">
              {columns.map((column) => (
                <Box component="th" key={column.key} sx={{ textAlign: "left", p: 1, color: "#64748B", fontSize: 12 }}>
                  {column.label}
                </Box>
              ))}
            </Box>
          </Box>
          <Box component="tbody">
            {rows.slice(0, 14).map((row, index) => (
              <Box component="tr" key={row.id ?? `${title}-${index}`} sx={{ borderTop: "1px solid #E2E8F0" }}>
                {columns.map((column) => (
                  <Box component="td" key={column.key} sx={{ p: 1, fontWeight: 850, color: "#0F172A" }}>
                    {column.render ? column.render(row) : row[column.key] ?? "--"}
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Section>
  );
}

export default function SpecialPrediction() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    const [catalog, latest, intelligence, predictorHealth, windowHealth, variants, weights, shadows, shadowPerformance] = await Promise.all([
      getSpecialCatalog(),
      getSpecialLatest().catch(() => null),
      getSpecialIntelligenceLatest().catch(() => null),
      getSpecialPredictorHealth(100),
      getSpecialWindowHealth(100),
      getSpecialVariantPerformance(200),
      getSpecialWeightsLatest().catch(() => []),
      getSpecialShadowRankingLatest().catch(() => []),
      getSpecialShadowPerformance(50),
    ]);
    setData({ catalog, latest, intelligence, predictorHealth, windowHealth, variants, weights, shadows, shadowPerformance });
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await load();
      } catch (err) {
        console.error("Load special prediction error:", err);
        if (active) setError("Khong tai duoc Special Prediction.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const top10 = useMemo(() => parseJson(data?.latest?.top10Json, []), [data?.latest]);

  const handleRun = async () => {
    setRunning(true);
    setError("");
    try {
      await runSpecialPrediction();
      await load();
    } catch (err) {
      console.error("Run special prediction error:", err);
      setError("Khong chay duoc Special Prediction.");
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>;
  }

  return (
    <Box sx={{ maxWidth: 1480, mx: "auto" }}>
      <Stack spacing={2.5}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1.5}>
          <Box>
            <Typography sx={{ fontSize: { xs: 30, md: 42 }, fontWeight: 950, color: "#0F172A", letterSpacing: 0 }}>Special Prediction</Typography>
            <Typography sx={{ color: "#475569", fontWeight: 750 }}>Independent PHASE_2 single-special-number prediction context.</Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button startIcon={<RefreshIcon />} onClick={load} variant="outlined" sx={{ textTransform: "none", fontWeight: 900 }}>Refresh</Button>
            <Button startIcon={<PlayArrowIcon />} onClick={handleRun} disabled={running} variant="contained" sx={{ textTransform: "none", fontWeight: 900 }}>{running ? "Running..." : "Run"}</Button>
          </Stack>
        </Stack>

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Section title="Predicted Special Number" action={<Chip label={data?.catalog?.phase ?? "PHASE_2"} sx={{ bgcolor: "#DCFCE7", fontWeight: 950 }} />}>
          <Stack spacing={1.6}>
            {top10.length ? (
              <Stack direction={{ xs: "column", md: "row" }} gap={2} alignItems={{ xs: "flex-start", md: "center" }}>
                <Box sx={{ width: 116, height: 116, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 2, bgcolor: "#F5F3FF", border: "1px solid #DDD6FE" }}>
                  <Typography sx={{ fontSize: 52, fontWeight: 950, color: "#4C1D95", lineHeight: 1 }}>
                    {num(data?.latest?.primaryPrediction ?? top10[0]?.number)}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 13, color: "#64748B", fontWeight: 950, mb: 0.75 }}>Alternative Candidates</Typography>
                  <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                    {top10.slice(1, 5).map((item) => (
                      <Chip key={`${item.number}-${item.rank}`} label={`#${item.rank} ${num(item.number)}`} sx={{ bgcolor: "#EFF6FF", fontWeight: 950 }} />
                    ))}
                  </Stack>
                </Box>
              </Stack>
            ) : (
              <Typography sx={{ fontWeight: 800, color: "#64748B" }}>No special prediction yet. Run the Phase 2 engine.</Typography>
            )}
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
              <Chip label={`Prediction ${fmtDate(data?.latest?.predictionDate)}`} />
              <Chip label={`Target ${fmtDate(data?.latest?.targetDate)}`} />
              <Chip label={`Variants ${data?.catalog?.variantCount ?? "--"}`} />
              <Chip label={`RO ${fmtPct(data?.intelligence?.specialRo)}`} />
              <Chip label={`AO ${fmtPct(data?.intelligence?.specialAo)}`} />
              <Chip label={`Confidence ${fmtPct(data?.intelligence?.summaryJson ? parseJson(data.intelligence.summaryJson, {})?.confidence : null)}`} />
              <Chip label={`Bias ${data?.intelligence?.currentBias ?? "--"}`} />
              <Chip label={`Champion ${data?.intelligence?.currentChampion ?? "--"}`} />
            </Stack>
          </Stack>
        </Section>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
          <HealthTable
            title="Predictor Health"
            rows={data?.predictorHealth ?? []}
            columns={[
              { key: "predictorFamily", label: "Predictor" },
              { key: "effectiveness", label: "Effectiveness", render: (row) => fmtPct(row.effectiveness) },
              { key: "confidence", label: "Confidence", render: (row) => fmtPct(row.confidence) },
              { key: "sampleCount", label: "Samples" },
              { key: "trend", label: "Trend" },
              { key: "promotionState", label: "State" },
            ]}
          />
          <HealthTable
            title="Window Health"
            rows={data?.windowHealth ?? []}
            columns={[
              { key: "windowDays", label: "Window" },
              { key: "effectiveness", label: "Effectiveness", render: (row) => fmtPct(row.effectiveness) },
              { key: "confidence", label: "Confidence", render: (row) => fmtPct(row.confidence) },
              { key: "sampleCount", label: "Samples" },
              { key: "trend", label: "Trend" },
              { key: "promotionState", label: "State" },
            ]}
          />
        </Box>

        <HealthTable
          title="Variant Health"
          rows={data?.variants ?? []}
          columns={[
            { key: "variantKey", label: "Variant" },
            { key: "predictorFamily", label: "Predictor" },
            { key: "windowDays", label: "Window" },
            { key: "effectiveness", label: "Effectiveness", render: (row) => fmtPct(row.effectiveness) },
            { key: "confidence", label: "Confidence", render: (row) => fmtPct(row.confidence) },
            { key: "promotionState", label: "State" },
          ]}
        />
      </Stack>
    </Box>
  );
}
