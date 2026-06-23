import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { useNavigate } from "react-router-dom";

import {
  getSpecialChampionLatest,
  getSpecialEvolutionRecommendations,
  getSpecialIntelligenceLatest,
  getSpecialLatest,
  getSpecialMetaLatest,
  getSpecialPerformanceCards,
  getSpecialRankingLeaderboard,
  getSpecialShadowPerformance,
  getSpecialShadowRankingLatest,
  runSpecialPrediction,
} from "../api/specialPredictionApi";

const QUICK_LINKS = [
  { label: "Special Prediction", path: "/special-prediction" },
  { label: "Special Performance Cards", path: "/special-prediction/performance-cards" },
  { label: "Special Intelligence", path: "/special-prediction/intelligence" },
  { label: "Special Analytics", path: "/special-prediction/analytics" },
];

const EMPTY_DATA = {
  latest: null,
  intelligence: null,
  champion: null,
  meta: null,
  cards: [],
  recommendations: [],
  shadowRanking: [],
  shadowPerformance: [],
  leaderboard: [],
};

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeObject(value) {
  return value && typeof value === "object" && Object.keys(value).length ? value : null;
}

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

function formatNumber(value) {
  if (value === null || value === undefined || value === "") return "--";
  return String(value).padStart(2, "0");
}

function formatDate(value, includeTime = false) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-US", includeTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(date);
}

function friendlyError(error, fallback) {
  const status = error?.response?.status;
  const message = error?.response?.data?.message || error?.response?.data || error?.message;
  if (status === 504 || /timeout/i.test(String(message || ""))) {
    return "Special Prediction request timed out. Please refresh in a moment.";
  }
  if (status >= 500) return "Special Prediction backend failed while processing the request.";
  if (message === "SPECIAL_PREDICTION_NOT_ENOUGH_HISTORY") return "Not enough result history to run Special Prediction.";
  return typeof message === "string" && message.trim() ? message : fallback;
}

async function settle(key, label, loader, fallback) {
  try {
    const value = await loader();
    return { key, label, value: value ?? fallback, error: "" };
  } catch (error) {
    return { key, label, value: fallback, error: friendlyError(error, `${label} could not be loaded.`) };
  }
}

function Metric({ label, value, accent = "#7C3AED" }) {
  return (
    <Paper
      elevation={0}
      sx={{
        minHeight: 108,
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
      <Typography sx={{ mt: 1, color: "#0F172A", fontSize: 22, fontWeight: 950, overflowWrap: "anywhere" }}>
        {value ?? "--"}
      </Typography>
    </Paper>
  );
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

function EmptyState({ children = "No data available yet." }) {
  return <Alert severity="info">{children}</Alert>;
}

function NumberPill({ value }) {
  return (
    <Box
      component="span"
      sx={{
        minWidth: 38,
        height: 36,
        px: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 999,
        bgcolor: "#EFF6FF",
        border: "1px solid #BFDBFE",
        color: "#0F172A",
        fontWeight: 950,
      }}
    >
      {formatNumber(value)}
    </Box>
  );
}

function StatusPanel({ metrics }) {
  return (
    <Section title="Special Status">
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" }, gap: 1.5 }}>
        {metrics.map((metric) => <Metric key={metric.label} {...metric} />)}
      </Box>
    </Section>
  );
}

function LatestChampion({ champion }) {
  return (
    <Section title="Latest Champion">
      {!champion ? (
        <EmptyState>No champion history is available yet.</EmptyState>
      ) : (
        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
          <Chip label={champion.championKey ?? "--"} sx={{ bgcolor: "#CCFBF1", fontWeight: 950 }} />
          <Chip label={`Confidence ${formatPercent(champion.championConfidence)}`} />
          <Chip label={`Win Rate ${formatPercent(champion.championWinRate)}`} />
          <Chip label={`Streak ${champion.championStreak ?? "--"}`} />
          <Chip label={`Target ${formatDate(champion.targetDate)}`} />
        </Stack>
      )}
    </Section>
  );
}

function RecommendationsPreview({ recommendations }) {
  const rows = asArray(recommendations).slice(0, 5);
  return (
    <Section title="Latest Recommendations" action={<Chip size="small" label={`${asArray(recommendations).length} total`} />}>
      {!rows.length ? (
        <EmptyState>No evolution recommendations currently meet criteria.</EmptyState>
      ) : (
        <Stack spacing={1}>
          {rows.map((row) => (
            <Paper key={row.id ?? `${row.recommendationType}-${row.targetKey}`} elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 2, p: 1.5 }}>
              <Stack spacing={0.8}>
                <Typography sx={{ fontWeight: 950, color: "#0F172A" }}>{row.recommendationType ?? "--"} / {row.targetKey ?? "--"}</Typography>
                <Typography sx={{ color: "#64748B", fontSize: 13, fontWeight: 750 }}>{row.reason ?? "--"}</Typography>
                <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                  <Chip size="small" label={row.status ?? "--"} sx={{ fontWeight: 900 }} />
                  <Chip size="small" label={`Confidence ${formatPercent(row.confidence)}`} />
                  <Chip size="small" label={row.applied ? "Applied" : "Not applied"} />
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Section>
  );
}

function ShadowRankingPreview({ rows }) {
  const visibleRows = asArray(rows).slice(0, 4);
  return (
    <Section title="Shadow Ranking Preview">
      {!visibleRows.length ? (
        <EmptyState>No shadow ranking has been generated yet.</EmptyState>
      ) : (
        <Stack spacing={1.2}>
          {visibleRows.map((row) => {
            const top10 = parseJson(row.top10Json, []);
            return (
              <Box key={row.id ?? row.strategyKey} sx={{ border: "1px solid #E2E8F0", borderRadius: 2, p: 1.4 }}>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
                  <Typography sx={{ fontWeight: 950 }}>{row.strategyKey ?? "--"}</Typography>
                  <Chip size="small" label={`Target ${formatDate(row.targetDate)}`} />
                </Stack>
                <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                  {top10.length ? top10.slice(0, 10).map((item) => (
                    <NumberPill key={`${row.strategyKey}-${item.number ?? item}`} value={item.number ?? item} />
                  )) : <Typography sx={{ color: "#64748B", fontWeight: 800 }}>No candidates stored.</Typography>}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}
    </Section>
  );
}

function PerformancePreview({ cards, shadowPerformance }) {
  const latestCard = asArray(cards)[0];
  const shadowRows = asArray(shadowPerformance).slice(0, 4);
  return (
    <Section title="Recent Performance Summary">
      {!latestCard && !shadowRows.length ? (
        <EmptyState>No performance data is available yet.</EmptyState>
      ) : (
        <Stack spacing={1.4}>
          {latestCard ? (
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
              <Chip label={`Prediction ${formatDate(latestCard.predictionDate)}`} />
              <Chip label={`Target ${formatDate(latestCard.targetDate)}`} />
              <Chip label={`Actual ${formatNumber(latestCard.actualSpecialNumber)}`} />
              <Chip label={`Primary ${formatNumber(latestCard.primaryPrediction)}`} />
              <Chip label={`Top1 ${latestCard.top1Hit ? "Hit" : "Miss"}`} sx={{ bgcolor: latestCard.top1Hit ? "#DCFCE7" : "#FEE2E2", fontWeight: 900 }} />
              <Chip label={`Top10 ${latestCard.top10Hit ? "Hit" : "Miss"}`} sx={{ bgcolor: latestCard.top10Hit ? "#DCFCE7" : "#FEE2E2", fontWeight: 900 }} />
            </Stack>
          ) : null}
          {shadowRows.length ? (
            <Box sx={{ overflowX: "auto" }}>
              <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                <Box component="tbody">
                  {shadowRows.map((row) => (
                    <Box component="tr" key={row.id ?? row.strategyKey} sx={{ borderTop: "1px solid #E2E8F0" }}>
                      <Box component="td" sx={{ p: 1, fontWeight: 950 }}>{row.strategyKey ?? "--"}</Box>
                      <Box component="td" sx={{ p: 1 }}>{`Top1 ${row.top1Hit ? "Hit" : "Miss"}`}</Box>
                      <Box component="td" sx={{ p: 1 }}>{`Top10 ${row.top10Hit ? "Hit" : "Miss"}`}</Box>
                      <Box component="td" sx={{ p: 1 }}>{`Best Rank ${row.bestRank ?? "--"}`}</Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          ) : null}
        </Stack>
      )}
    </Section>
  );
}

function LeaderboardPreview({ leaderboard }) {
  const groups = useMemo(() => {
    const result = {};
    for (const row of asArray(leaderboard)) {
      result[row.leaderboardType] = [...(result[row.leaderboardType] ?? []), row];
    }
    return result;
  }, [leaderboard]);
  const rows = ["PREDICTOR", "WINDOW", "VARIANT", "SHADOW_STRATEGY"]
    .flatMap((type) => asArray(groups[type]).slice(0, 3));

  return (
    <Section title="Leaderboard Preview">
      {!rows.length ? (
        <EmptyState>No ranking leaderboard is available yet.</EmptyState>
      ) : (
        <Box sx={{ overflowX: "auto" }}>
          <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
            <Box component="tbody">
              {rows.map((row) => (
                <Box component="tr" key={`${row.leaderboardType}-${row.entryKey}-${row.rankPosition}`} sx={{ borderTop: "1px solid #E2E8F0" }}>
                  <Box component="td" sx={{ p: 1, color: "#64748B", fontWeight: 950 }}>{row.leaderboardType}</Box>
                  <Box component="td" sx={{ p: 1, fontWeight: 950 }}>{`#${row.rankPosition ?? "--"} ${row.entryKey ?? "--"}`}</Box>
                  <Box component="td" sx={{ p: 1 }}>{`Score ${formatPercent(row.score)}`}</Box>
                  <Box component="td" sx={{ p: 1 }}>{`Confidence ${formatPercent(row.confidence)}`}</Box>
                  <Box component="td" sx={{ p: 1 }}>{row.trend ?? "--"}</Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </Section>
  );
}

export default function SpecialDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [running, setRunning] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const [notice, setNotice] = useState({ open: false, severity: "success", message: "" });

  const loadDashboardData = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    const results = await Promise.all([
      settle("latest", "Latest snapshot", getSpecialLatest, null),
      settle("intelligence", "Latest intelligence", getSpecialIntelligenceLatest, null),
      settle("champion", "Latest champion", getSpecialChampionLatest, null),
      settle("meta", "Latest meta signal", getSpecialMetaLatest, null),
      settle("cards", "Performance cards", () => getSpecialPerformanceCards(5), []),
      settle("recommendations", "Evolution recommendations", () => getSpecialEvolutionRecommendations(100), []),
      settle("shadowRanking", "Shadow ranking", getSpecialShadowRankingLatest, []),
      settle("shadowPerformance", "Shadow performance", () => getSpecialShadowPerformance(20), []),
      settle("leaderboard", "Ranking leaderboard", getSpecialRankingLeaderboard, []),
    ]);

    const nextData = { ...EMPTY_DATA };
    const nextWarnings = [];
    for (const result of results) {
      nextData[result.key] = result.value;
      if (result.error) nextWarnings.push(`${result.label}: ${result.error}`);
    }

    setData({
      latest: normalizeObject(nextData.latest),
      intelligence: normalizeObject(nextData.intelligence),
      champion: normalizeObject(nextData.champion),
      meta: normalizeObject(nextData.meta),
      cards: asArray(nextData.cards),
      recommendations: asArray(nextData.recommendations),
      shadowRanking: asArray(nextData.shadowRanking),
      shadowPerformance: asArray(nextData.shadowPerformance),
      leaderboard: asArray(nextData.leaderboard),
    });
    setWarnings(nextWarnings);
    setLoading(false);
    setRefreshing(false);
    return !nextWarnings.length;
  }, []);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  const latestCard = data.cards[0] ?? null;
  const summary = useMemo(() => parseJson(data.intelligence?.summaryJson, {}), [data.intelligence]);
  const lastUpdated = data.latest?.updatedAt
    ?? data.latest?.createdAt
    ?? data.intelligence?.createdAt
    ?? latestCard?.createdAt
    ?? data.champion?.createdAt
    ?? data.meta?.createdAt;
  const hasAnyData = Boolean(
    data.latest
    || data.intelligence
    || data.champion
    || data.meta
    || data.cards.length
    || data.recommendations.length
    || data.shadowRanking.length
    || data.shadowPerformance.length
    || data.leaderboard.length
  );

  const metrics = useMemo(() => {
    const intelligence = data.intelligence;
    const champion = data.champion;
    const card = latestCard;

    return [
      { label: "Primary Prediction", value: formatNumber(data.latest?.primaryPrediction ?? intelligence?.primaryPrediction ?? card?.primaryPrediction), accent: "#7C3AED" },
      { label: "Champion", value: champion?.championKey ?? intelligence?.currentChampion ?? card?.rankingChampion ?? "--", accent: "#0F766E" },
      { label: "Champion Confidence", value: formatPercent(champion?.championConfidence ?? intelligence?.championConfidence ?? card?.championConfidence), accent: "#0891B2" },
      { label: "RO", value: formatPercent(intelligence?.specialRo ?? card?.specialRo), accent: "#0284C7" },
      { label: "AO", value: formatPercent(intelligence?.specialAo ?? card?.specialAo), accent: "#16A34A" },
      { label: "Bias", value: intelligence?.currentBias ?? card?.bias ?? summary?.bias ?? "--", accent: "#D97706" },
      { label: "Strongest Predictor", value: intelligence?.strongestPredictor ?? card?.strongestPredictor ?? "--", accent: "#2563EB" },
      { label: "Strongest Window", value: intelligence?.strongestWindow ?? card?.strongestWindow ?? "--", accent: "#DB2777" },
      { label: "Strongest Variant", value: intelligence?.strongestVariant ?? card?.strongestVariant ?? summary?.strongestVariant ?? "--", accent: "#475569" },
      { label: "Recommendation Count", value: data.recommendations.length, accent: "#DC2626" },
      { label: "Snapshot Date", value: formatDate(data.latest?.predictionDate ?? intelligence?.predictionDate ?? card?.predictionDate), accent: "#4F46E5" },
      { label: "Last Updated", value: formatDate(lastUpdated, true), accent: "#0F766E" },
    ];
  }, [data, latestCard, lastUpdated, summary]);

  const handleRefresh = async () => {
    const ok = await loadDashboardData({ silent: true });
    setNotice({
      open: true,
      severity: ok ? "success" : "warning",
      message: ok ? "Special dashboard refreshed." : "Special dashboard refreshed with warnings.",
    });
  };

  const handleRun = async () => {
    setRunning(true);
    try {
      const result = await runSpecialPrediction();
      await loadDashboardData({ silent: true });
      setNotice({
        open: true,
        severity: "success",
        message: `Special Prediction completed. Snapshot #${result?.snapshotId ?? "--"} generated.`,
      });
    } catch (error) {
      setNotice({
        open: true,
        severity: "error",
        message: friendlyError(error, "Special Prediction run failed."),
      });
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
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "stretch", md: "flex-start" }}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
              <Typography sx={{ fontSize: { xs: 30, md: 42 }, fontWeight: 950, color: "#0F172A", letterSpacing: 0 }}>
                Special Dashboard
              </Typography>
              <Chip label="Workflow" size="small" sx={{ bgcolor: "#F3E8FF", fontWeight: 900 }} />
            </Stack>
            <Typography sx={{ color: "#475569", fontWeight: 750 }}>
              Run Special Prediction and review the latest prediction, champion, performance, shadow, and recommendation state.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} justifyContent={{ xs: "stretch", md: "flex-end" }} useFlexGap flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={running ? <CircularProgress size={16} color="inherit" /> : <PlayArrowRoundedIcon />}
              onClick={handleRun}
              disabled={running || refreshing}
              sx={{ textTransform: "none", fontWeight: 950 }}
            >
              {running ? "Running..." : "Run Special Prediction"}
            </Button>
            <Button
              variant="outlined"
              startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshRoundedIcon />}
              onClick={handleRefresh}
              disabled={running || refreshing}
              sx={{ textTransform: "none", fontWeight: 950 }}
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </Stack>
        </Stack>

        {!hasAnyData ? <Alert severity="info">No Special Prediction data exists yet. Run Special Prediction to create the first snapshot.</Alert> : null}
        {warnings.length ? (
          <Alert severity="warning">
            <Stack spacing={0.5}>
              {warnings.map((warning) => <Typography key={warning} sx={{ fontWeight: 750 }}>{warning}</Typography>)}
            </Stack>
          </Alert>
        ) : null}

        <StatusPanel metrics={metrics} />

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
          <LatestChampion champion={data.champion} />
          <RecommendationsPreview recommendations={data.recommendations} />
          <ShadowRankingPreview rows={data.shadowRanking} />
          <PerformancePreview cards={data.cards} shadowPerformance={data.shadowPerformance} />
          <LeaderboardPreview leaderboard={data.leaderboard} />
        </Box>

        <Section title="Special Views">
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap flexWrap="wrap">
            {QUICK_LINKS.map((item) => (
              <Button
                key={item.path}
                variant="outlined"
                endIcon={<ArrowForwardRoundedIcon />}
                onClick={() => navigate(item.path)}
                sx={{ justifyContent: "space-between", textTransform: "none", fontWeight: 900 }}
              >
                {item.label}
              </Button>
            ))}
          </Stack>
        </Section>
      </Stack>

      <Snackbar
        open={notice.open}
        autoHideDuration={4200}
        onClose={() => setNotice((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={notice.severity}
          variant="filled"
          onClose={() => setNotice((current) => ({ ...current, open: false }))}
          sx={{ fontWeight: 850 }}
        >
          {notice.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
