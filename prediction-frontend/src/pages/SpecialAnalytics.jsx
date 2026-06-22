import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Chip, CircularProgress, Paper, Stack, Typography } from "@mui/material";

import {
  getSpecialAnalyticsAoTrend,
  getSpecialAnalyticsBiasHistory,
  getSpecialAnalyticsChampions,
  getSpecialAnalyticsPredictors,
  getSpecialAnalyticsRecommendations,
  getSpecialAnalyticsRegimes,
  getSpecialAnalyticsRoTrend,
  getSpecialAnalyticsVariants,
  getSpecialAnalyticsWindows,
} from "../api/specialPredictionApi";

function fmtPct(value) {
  if (value === null || value === undefined || value === "") return "--";
  const number = Number(value);
  return Number.isFinite(number) ? `${Math.round(number * 100)}%` : "--";
}

function fmtNumber(value) {
  if (value === null || value === undefined || value === "") return "--";
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(3) : "--";
}

function fmtDate(value) {
  if (!value) return "--";
  return String(value).slice(0, 10);
}

function Section({ title, children }) {
  return (
    <Paper elevation={0} sx={{ border: "1px solid #D6E1EA", borderRadius: 2, p: 2, background: "#FFFFFF" }}>
      <Typography sx={{ fontSize: 18, fontWeight: 950, color: "#0F172A", mb: 1.5 }}>{title}</Typography>
      {children}
    </Paper>
  );
}

function EmptyState() {
  return <Alert severity="info">No analytics rows available yet.</Alert>;
}

function TrendChip({ value }) {
  const label = value || "FLAT";
  const colors = {
    UP: ["#DCFCE7", "#166534"],
    DOWN: ["#FEE2E2", "#991B1B"],
    FLAT: ["#F1F5F9", "#334155"],
  };
  const [bg, color] = colors[label] ?? colors.FLAT;
  return <Chip size="small" label={label} sx={{ bgcolor: bg, color, fontWeight: 950 }} />;
}

function DataTable({ columns, rows, getKey }) {
  if (!rows?.length) return <EmptyState />;

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
        <Box component="thead">
          <Box component="tr" sx={{ borderBottom: "1px solid #CBD5E1" }}>
            {columns.map((column) => (
              <Box key={column.key} component="th" sx={{ p: 1, textAlign: "left", fontSize: 12, color: "#64748B", fontWeight: 950 }}>
                {column.label}
              </Box>
            ))}
          </Box>
        </Box>
        <Box component="tbody">
          {rows.map((row, index) => (
            <Box component="tr" key={getKey ? getKey(row, index) : index} sx={{ borderBottom: "1px solid #E2E8F0" }}>
              {columns.map((column) => (
                <Box key={column.key} component="td" sx={{ p: 1, color: "#0F172A", fontWeight: 750, verticalAlign: "top", overflowWrap: "anywhere" }}>
                  {column.render ? column.render(row, index) : row[column.key] ?? "--"}
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function RecommendationGroup({ title, rows }) {
  return (
    <Section title={title}>
      <DataTable
        rows={rows ?? []}
        getKey={(row) => row.id}
        columns={[
          { key: "targetKey", label: "Target" },
          { key: "confidence", label: "Confidence", render: (row) => fmtPct(row.confidence) },
          { key: "reason", label: "Reason" },
          { key: "evidence", label: "Evidence", render: (row) => row.evidence || "--" },
          { key: "status", label: "Status", render: (row) => <Chip size="small" label={row.status ?? "--"} sx={{ fontWeight: 900 }} /> },
        ]}
      />
    </Section>
  );
}

export default function SpecialAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [
          predictors,
          windows,
          variants,
          champions,
          roTrend,
          aoTrend,
          biasHistory,
          regimes,
          recommendations,
        ] = await Promise.all([
          getSpecialAnalyticsPredictors(50),
          getSpecialAnalyticsWindows(50),
          getSpecialAnalyticsVariants(100),
          getSpecialAnalyticsChampions(100),
          getSpecialAnalyticsRoTrend(100),
          getSpecialAnalyticsAoTrend(100),
          getSpecialAnalyticsBiasHistory(100),
          getSpecialAnalyticsRegimes(100),
          getSpecialAnalyticsRecommendations(100),
        ]);
        if (active) {
          setData({ predictors, windows, variants, champions, roTrend, aoTrend, biasHistory, regimes, recommendations });
        }
      } catch (err) {
        console.error("Load special analytics error:", err);
        if (active) setError("Khong tai duoc Special Analytics.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const recommendationGroups = useMemo(() => ([
    ["Promotion Candidates", data?.recommendations?.promotionCandidates],
    ["Demotion Candidates", data?.recommendations?.demotionCandidates],
    ["Retirement Candidates", data?.recommendations?.retirementCandidates],
    ["Window Shift Candidates", data?.recommendations?.windowShiftCandidates],
    ["Shadow Promotion Candidates", data?.recommendations?.shadowPromotionCandidates],
    ["New Predictor Ideas", data?.recommendations?.newPredictorIdeas],
  ]), [data?.recommendations]);

  if (loading) {
    return <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>;
  }

  return (
    <Box sx={{ maxWidth: 1480, mx: "auto" }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography sx={{ fontSize: { xs: 30, md: 42 }, fontWeight: 950, color: "#0F172A", letterSpacing: 0 }}>Special Analytics</Typography>
          <Typography sx={{ color: "#475569", fontWeight: 750 }}>Read-only observability for Special Prediction learning signals.</Typography>
        </Box>
        {error ? <Alert severity="error">{error}</Alert> : null}

        <Section title="Predictor Leaderboard">
          <DataTable
            rows={data?.predictors ?? []}
            getKey={(row) => row.predictor}
            columns={[
              { key: "predictor", label: "Predictor" },
              { key: "health", label: "Health", render: (row) => fmtPct(row.health) },
              { key: "confidence", label: "Confidence", render: (row) => fmtPct(row.confidence) },
              { key: "trend", label: "Trend", render: (row) => <TrendChip value={row.trend} /> },
              { key: "sampleCount", label: "Samples" },
              { key: "promotionState", label: "State" },
              { key: "currentInfluence", label: "Influence", render: (row) => fmtPct(row.currentInfluence) },
              { key: "recentPerformance", label: "Recent", render: (row) => fmtPct(row.recentPerformance) },
            ]}
          />
        </Section>

        <Section title="Window Leaderboard">
          <DataTable
            rows={data?.windows ?? []}
            getKey={(row) => row.window}
            columns={[
              { key: "window", label: "Window", render: (row) => `${row.window}d` },
              { key: "health", label: "Health", render: (row) => fmtPct(row.health) },
              { key: "confidence", label: "Confidence", render: (row) => fmtPct(row.confidence) },
              { key: "trend", label: "Trend", render: (row) => <TrendChip value={row.trend} /> },
              { key: "sampleCount", label: "Samples" },
              { key: "influence", label: "Influence", render: (row) => fmtPct(row.influence) },
              { key: "recentPerformance", label: "Recent", render: (row) => fmtPct(row.recentPerformance) },
            ]}
          />
        </Section>

        <Section title="Variant Leaderboard">
          <DataTable
            rows={data?.variants ?? []}
            getKey={(row) => row.variant}
            columns={[
              { key: "variant", label: "Variant" },
              { key: "predictor", label: "Predictor" },
              { key: "window", label: "Window", render: (row) => `${row.window}d` },
              { key: "health", label: "Health", render: (row) => fmtPct(row.health) },
              { key: "confidence", label: "Confidence", render: (row) => fmtPct(row.confidence) },
              { key: "trend", label: "Trend", render: (row) => <TrendChip value={row.trend} /> },
              { key: "influence", label: "Influence", render: (row) => fmtPct(row.influence) },
            ]}
          />
        </Section>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
          <Section title="Champion Timeline">
            <DataTable
              rows={data?.champions ?? []}
              getKey={(row, index) => `${row.date}-${row.champion}-${index}`}
              columns={[
                { key: "date", label: "Date", render: (row) => fmtDate(row.date) },
                { key: "champion", label: "Champion" },
                { key: "confidence", label: "Confidence", render: (row) => fmtPct(row.confidence) },
                { key: "winRate", label: "Win Rate", render: (row) => fmtPct(row.winRate) },
                { key: "streak", label: "Streak" },
                { key: "drift", label: "Drift", render: (row) => fmtNumber(row.drift) },
              ]}
            />
          </Section>

          <Section title="RO Trend">
            <DataTable
              rows={data?.roTrend ?? []}
              getKey={(row, index) => `${row.date}-ro-${index}`}
              columns={[
                { key: "date", label: "Date", render: (row) => fmtDate(row.date) },
                { key: "value", label: "RO", render: (row) => fmtPct(row.value) },
              ]}
            />
          </Section>

          <Section title="AO Trend">
            <DataTable
              rows={data?.aoTrend ?? []}
              getKey={(row, index) => `${row.date}-ao-${index}`}
              columns={[
                { key: "date", label: "Date", render: (row) => fmtDate(row.date) },
                { key: "value", label: "AO", render: (row) => fmtPct(row.value) },
              ]}
            />
          </Section>

          <Section title="Bias Timeline">
            <DataTable
              rows={data?.biasHistory ?? []}
              getKey={(row, index) => `${row.date}-bias-${index}`}
              columns={[
                { key: "date", label: "Date", render: (row) => fmtDate(row.date) },
                { key: "bias", label: "Bias", render: (row) => <Chip size="small" label={row.bias ?? "--"} sx={{ fontWeight: 900 }} /> },
              ]}
            />
          </Section>
        </Box>

        <Section title="Regime History">
          <DataTable
            rows={data?.regimes ?? []}
            getKey={(row, index) => `${row.date}-regime-${index}`}
            columns={[
              { key: "date", label: "Date", render: (row) => fmtDate(row.date) },
              { key: "regime", label: "Regime", render: (row) => <Chip size="small" label={row.regime ?? "--"} sx={{ fontWeight: 900 }} /> },
              { key: "confidence", label: "Confidence", render: (row) => fmtPct(row.confidence) },
              { key: "evidenceSummary", label: "Evidence Summary", render: (row) => row.evidenceSummary || "--" },
            ]}
          />
        </Section>

        <Box>
          <Typography sx={{ fontSize: 22, fontWeight: 950, color: "#0F172A", mb: 1.5 }}>Recommendation Center</Typography>
          <Stack spacing={2}>
            {recommendationGroups.map(([title, rows]) => (
              <RecommendationGroup key={title} title={title} rows={rows} />
            ))}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
