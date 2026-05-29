import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import PsychologyAltRoundedIcon from "@mui/icons-material/PsychologyAltRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import {
  getPatternStateSnapshot,
  getPredictorDashboard,
  getPredictorDashboardHistory,
  getPredictorWeightHistory,
  getSelfEvaluationLatest,
  getSelfEvaluationRecent,
} from "../api/intelligenceApi";
import { labelFrom, vi } from "../i18n/vi";

const PREDICTOR_ORDER = ["PAIR", "TIME", "FREQ", "POS", "REP", "STRK", "GAP"];

function patternLabel(value) {
  return labelFrom(vi.patternState, value || "INSUFFICIENT_DATA");
}

function predictorLabel(value) {
  return labelFrom(vi.predictor, value);
}

function trendLabel(value) {
  return labelFrom(vi.trend, value || "UNKNOWN");
}

function dataStatusLabel(value) {
  return labelFrom(vi.dataStatus, value || "NO_DATA");
}

function speedLabel(value) {
  return labelFrom(vi.speed, value);
}

function modeLabel(value) {
  return vi.mode[value] ?? value ?? "--";
}

function stateTone(state, theme) {
  const normalized = String(state || "INSUFFICIENT_DATA").toUpperCase();
  if (normalized === "STABLE") {
    return {
      color: theme.palette.success.light,
      bg: alpha(theme.palette.success.main, 0.16),
      border: alpha(theme.palette.success.main, 0.34),
    };
  }
  if (normalized === "SHIFTING") {
    return {
      color: theme.palette.warning.light,
      bg: alpha(theme.palette.warning.main, 0.17),
      border: alpha(theme.palette.warning.main, 0.34),
    };
  }
  if (normalized === "VOLATILE") {
    return {
      color: theme.palette.error.light,
      bg: alpha(theme.palette.error.main, 0.18),
      border: alpha(theme.palette.error.main, 0.36),
    };
  }
  return {
    color: theme.palette.grey[300],
    bg: alpha(theme.palette.grey[500], 0.14),
    border: alpha(theme.palette.grey[500], 0.26),
  };
}

function dataStatusTone(status, theme) {
  const normalized = String(status || "NO_DATA").toUpperCase();
  if (normalized === "ACTIVE") return stateTone("STABLE", theme);
  if (normalized === "LEARNING") return stateTone("SHIFTING", theme);
  return stateTone("INSUFFICIENT_DATA", theme);
}

function formatPercent(value, digits = 1) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "--";
  return `${(num * 100).toFixed(digits)}%`;
}

function formatScore(value, digits = 3) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "--";
  return num.toFixed(digits);
}

function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: value.includes?.("T") ? "short" : undefined,
  }).format(date);
}

function calculateScore(item) {
  if (!item) return null;
  const hit3 = Number(item.hit3 ?? 0);
  const hit7 = Number(item.hit7 ?? 0);
  const hit14 = Number(item.hit14 ?? 0);
  const stability = Number(item.stability ?? 0);
  return hit3 * 0.45 + hit7 * 0.35 + hit14 * 0.15 + stability * 0.05;
}

function parseJsonData(report) {
  if (!report?.jsonData) return null;
  if (typeof report.jsonData === "object") return report.jsonData;
  try {
    return JSON.parse(report.jsonData);
  } catch {
    return null;
  }
}

function normalizePatternState(payload) {
  if (!payload) return null;
  if (typeof payload === "string") return payload;
  return payload.state ?? payload.patternState ?? payload.status ?? null;
}

function normalizeDashboardPredictors(dashboard) {
  const predictors = dashboard?.predictors ?? {};
  return Object.entries(predictors)
    .map(([key, value]) => ({ predictorKey: key, ...value }))
    .sort((a, b) => Number(b.effectiveWeight ?? 0) - Number(a.effectiveWeight ?? 0));
}

function flattenHistory(history) {
  const items = history?.items ?? {};
  return Object.entries(items).flatMap(([predictorKey, rows]) =>
    (Array.isArray(rows) ? rows : []).map((row) => ({
      predictorKey,
      ...row,
      score: calculateScore(row),
    })),
  );
}

function SectionCard({ title, subtitle, children, action, sx }) {
  const theme = useTheme();
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
        background:
          "linear-gradient(135deg, rgba(17,20,29,0.96), rgba(8,10,18,0.92))",
        color: "white",
        backdropFilter: "blur(18px)",
        boxShadow: `0 20px 70px ${alpha(theme.palette.common.black, 0.28)}`,
        ...sx,
      }}
    >
      <CardContent sx={{ p: 2.4, "&:last-child": { pb: 2.4 } }}>
        <Stack spacing={1.7}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.62)" }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
            {action}
          </Stack>
          {children}
        </Stack>
      </CardContent>
    </Card>
  );
}

function OverviewCard({ title, value, subtitle, icon, tone = "default" }) {
  const theme = useTheme();
  const palette = {
    default: ["#6a5cff", "#00c6ff"],
    good: ["#14b86a", "#88e08f"],
    warning: ["#ff9f1c", "#ffd166"],
    danger: ["#ff4d6d", "#ff9f9f"],
  }[tone];

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        overflow: "hidden",
        position: "relative",
        border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
        background:
          "linear-gradient(145deg, rgba(18,22,35,0.98), rgba(9,12,20,0.95))",
        color: "white",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: "auto -20% -50% auto",
          width: 170,
          height: 170,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(palette[0], 0.36)}, transparent 68%)`,
        }}
      />
      <CardContent sx={{ position: "relative", p: 2.2 }}>
        <Stack spacing={1.2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.62)", letterSpacing: 0.8 }}>
              {title}
            </Typography>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                background: `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`,
                color: "white",
              }}
            >
              {icon}
            </Box>
          </Stack>
          <Typography variant="h5" sx={{ fontWeight: 950 }}>
            {value || "--"}
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", minHeight: 40 }}>
            {subtitle || vi.common.noData}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

function DataChip({ label, state }) {
  const theme = useTheme();
  const tone = stateTone(state, theme);
  return (
    <Chip
      size="small"
      label={label}
      sx={{
        color: tone.color,
        backgroundColor: tone.bg,
        border: `1px solid ${tone.border}`,
        fontWeight: 800,
      }}
    />
  );
}

function DataStatusChip({ status }) {
  const theme = useTheme();
  const tone = dataStatusTone(status, theme);
  return (
    <Chip
      size="small"
      label={dataStatusLabel(status)}
      sx={{
        color: tone.color,
        backgroundColor: tone.bg,
        border: `1px solid ${tone.border}`,
        fontWeight: 800,
      }}
    />
  );
}

export default function PredictionIntelligence() {
  const theme = useTheme();
  const [dashboard, setDashboard] = useState(null);
  const [performanceHistory, setPerformanceHistory] = useState(null);
  const [weightHistory, setWeightHistory] = useState(null);
  const [selfEvaluation, setSelfEvaluation] = useState(null);
  const [recentSelfEvaluation, setRecentSelfEvaluation] = useState([]);
  const [patternState, setPatternState] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");

    const [
      dashboardRes,
      perfHistoryRes,
      weightHistoryRes,
      selfRes,
      recentSelfRes,
      patternRes,
    ] = await Promise.allSettled([
      getPredictorDashboard(),
      getPredictorDashboardHistory(30),
      getPredictorWeightHistory(30),
      getSelfEvaluationLatest(),
      getSelfEvaluationRecent(10),
      getPatternStateSnapshot(),
    ]);

    if (dashboardRes.status === "fulfilled") setDashboard(dashboardRes.value);
    if (perfHistoryRes.status === "fulfilled") setPerformanceHistory(perfHistoryRes.value);
    if (weightHistoryRes.status === "fulfilled") setWeightHistory(weightHistoryRes.value);
    if (selfRes.status === "fulfilled") setSelfEvaluation(selfRes.value);
    if (recentSelfRes.status === "fulfilled") setRecentSelfEvaluation(recentSelfRes.value ?? []);
    if (patternRes.status === "fulfilled") setPatternState(normalizePatternState(patternRes.value));

    if (dashboardRes.status === "rejected" && selfRes.status === "rejected") {
      setError(vi.intelligence.loadError);
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const predictors = useMemo(() => normalizeDashboardPredictors(dashboard), [dashboard]);
  const selfPayload = useMemo(() => parseJsonData(selfEvaluation), [selfEvaluation]);
  const ranking = selfPayload?.ranking ?? [];
  const activePatternState =
    dashboard?.patternState ?? selfPayload?.patternState ?? selfEvaluation?.patternState ?? patternState;
  const best = selfEvaluation?.bestPredictor ?? selfPayload?.bestPredictor ?? ranking[0]?.predictorKey;
  const worst =
    selfEvaluation?.worstPredictor ??
    selfPayload?.worstPredictor ??
    ranking[ranking.length - 1]?.predictorKey;
  const bestRow = ranking.find((row) => row.predictorKey === best);
  const worstRow = ranking.find((row) => row.predictorKey === worst);
  const performanceRows = useMemo(() => flattenHistory(performanceHistory), [performanceHistory]);
  const weightRows = useMemo(() => flattenHistory(weightHistory), [weightHistory]);
  const displayMode = dashboard?.mode ?? selfEvaluation?.mode;

  const modeSummary = [
    `${vi.mode.label}: ${modeLabel(displayMode)}`,
    `${vi.mode.SHORT_TERM} ${formatScore(selfEvaluation?.shortTermScore ?? selfPayload?.shortTermScore)}`,
    `${vi.mode.EXTENDED} ${formatScore(selfEvaluation?.extendedScore ?? selfPayload?.extendedScore)}`,
  ].join(" · ");

  return (
    <Box
      sx={{
        minHeight: "100vh",
        p: { xs: 1.5, md: 3 },
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 10% 0%, rgba(0,198,255,0.16), transparent 28%), radial-gradient(circle at 90% 8%, rgba(255,159,28,0.14), transparent 26%), radial-gradient(circle at 50% 100%, rgba(106,92,255,0.16), transparent 32%)",
          pointerEvents: "none",
        }}
      />

      <Stack spacing={2.4} sx={{ position: "relative", zIndex: 1, maxWidth: 1500, mx: "auto" }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 950,
                letterSpacing: -0.8,
                background: "linear-gradient(90deg, #00c6ff, #6a5cff, #ff9f1c)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {vi.intelligence.title}
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.68)" }}>
              {vi.intelligence.subtitle}
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshRoundedIcon />}
            onClick={loadData}
            disabled={loading}
            sx={{
              textTransform: "none",
              borderRadius: 3,
              px: 2.4,
              background: "linear-gradient(135deg, #00c6ff, #6a5cff)",
            }}
          >
            {loading ? vi.common.loadingShort : vi.common.refresh}
          </Button>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" },
            gap: 1.6,
          }}
        >
          <OverviewCard
            title={vi.intelligence.patternState}
            value={patternLabel(activePatternState)}
            subtitle={vi.intelligence.patternStateSubtitle}
            icon={<PsychologyAltRoundedIcon />}
            tone={activePatternState === "VOLATILE" ? "danger" : activePatternState === "SHIFTING" ? "warning" : "good"}
          />
          <OverviewCard
            title={vi.intelligence.bestPredictor}
            value={predictorLabel(best)}
            subtitle={`${vi.table.score} ${formatScore(bestRow?.score)} · ${vi.table.trend} ${trendLabel(bestRow?.trend)}`}
            icon={<TrendingUpRoundedIcon />}
            tone="good"
          />
          <OverviewCard
            title={vi.intelligence.worstPredictor}
            value={predictorLabel(worst)}
            subtitle={`${vi.table.score} ${formatScore(worstRow?.score)} · ${vi.table.trend} ${trendLabel(worstRow?.trend)}`}
            icon={<WarningAmberRoundedIcon />}
            tone="danger"
          />
          <OverviewCard
            title={vi.intelligence.modeSummary}
            value={modeLabel(displayMode)}
            subtitle={modeSummary}
            icon={<PsychologyAltRoundedIcon />}
            tone="default"
          />
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", xl: "1.15fr 0.85fr" },
            gap: 2,
          }}
        >
          <SectionCard
            title={vi.intelligence.predictorTable}
            subtitle={vi.intelligence.predictorTableSubtitle}
            action={<DataChip label={patternLabel(activePatternState)} state={activePatternState} />}
          >
            <TableContainer sx={{ borderRadius: 3, border: `1px solid ${alpha(theme.palette.common.white, 0.08)}` }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {[
                      vi.table.predictor,
                      vi.table.speed,
                      vi.table.hit3,
                      vi.table.hit7,
                      vi.table.hit14,
                      vi.table.trend,
                      vi.table.stability,
                      vi.table.effectiveWeight,
                      vi.table.dataStatus,
                    ].map((head) => (
                      <TableCell key={head} sx={{ color: "white", fontWeight: 900, backgroundColor: "#10131b" }}>
                        {head}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {predictors.map((item) => (
                    <TableRow key={item.predictorKey}>
                      <TableCell sx={{ color: "white", fontWeight: 900 }}>{predictorLabel(item.predictorKey)}</TableCell>
                      <TableCell sx={{ color: "rgba(255,255,255,0.78)" }}>{speedLabel(item.speed)}</TableCell>
                      <TableCell sx={{ color: "white" }}>{formatPercent(item.hit3)}</TableCell>
                      <TableCell sx={{ color: "white" }}>{formatPercent(item.hit7)}</TableCell>
                      <TableCell sx={{ color: "white" }}>{formatPercent(item.hit14)}</TableCell>
                      <TableCell>
                        <Chip size="small" label={trendLabel(item.trend)} />
                      </TableCell>
                      <TableCell sx={{ color: "white" }}>{formatPercent(item.stability)}</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: 900 }}>
                        {formatPercent(item.effectiveWeight)}
                      </TableCell>
                      <TableCell>
                        <DataStatusChip status={item.dataStatus} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {!predictors.length && (
                    <TableRow>
                      <TableCell colSpan={9} sx={{ color: "rgba(255,255,255,0.7)", textAlign: "center", py: 4 }}>
                        {vi.intelligence.noPredictorData}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>

          <SectionCard title={vi.intelligence.selfEvaluation} subtitle={vi.intelligence.selfEvaluationSubtitle}>
            <Stack spacing={1.2}>
              {[
                [vi.intelligence.bestPredictor, predictorLabel(best)],
                [vi.intelligence.worstPredictor, predictorLabel(worst)],
                [vi.intelligence.mostImproved, predictorLabel(selfEvaluation?.mostImprovedPredictor ?? selfPayload?.mostImprovedPredictor)],
                [vi.intelligence.mostDeclined, predictorLabel(selfEvaluation?.mostDeclinedPredictor ?? selfPayload?.mostDeclinedPredictor)],
              ].map(([label, value]) => (
                <Box
                  key={label}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 1,
                    p: 1.2,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.common.white, 0.05),
                    border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
                  }}
                >
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.62)" }}>
                    {label}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 900 }}>
                    {value || "--"}
                  </Typography>
                </Box>
              ))}

              <Box sx={{ p: 1.4, borderRadius: 2, backgroundColor: alpha(theme.palette.info.main, 0.08) }}>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.62)" }}>
                  {vi.intelligence.summary}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {selfEvaluation?.summaryText ?? selfPayload?.summaryText ?? vi.intelligence.noSelfEvaluation}
                </Typography>
              </Box>

              <Box sx={{ p: 1.4, borderRadius: 2, backgroundColor: alpha(theme.palette.warning.main, 0.08) }}>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.62)" }}>
                  {vi.intelligence.recommendation}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {selfEvaluation?.recommendationText ??
                    selfPayload?.recommendationText ??
                    vi.intelligence.noRecommendation}
                </Typography>
              </Box>
            </Stack>
          </SectionCard>
        </Box>

        <SectionCard
          title={vi.intelligence.weightBreakdown}
          subtitle={vi.intelligence.weightBreakdownSubtitle}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" },
              gap: 1.2,
            }}
          >
            {PREDICTOR_ORDER.map((key) => {
              const item = dashboard?.predictors?.[key];
              return (
                <Box
                  key={key}
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
                    backgroundColor: alpha(theme.palette.common.white, 0.045),
                  }}
                >
                  <Stack spacing={0.8}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 950 }}>
                      {predictorLabel(key)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                      {vi.table.base} {formatPercent(item?.baseWeight)} · {vi.table.performance}{" "}
                      {formatScore(item?.performanceFactor, 2)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                      {vi.table.pattern} {formatScore(item?.patternFactor, 2)} · {vi.table.effective}{" "}
                      <strong>{formatPercent(item?.effectiveWeight)}</strong>
                    </Typography>
                  </Stack>
                </Box>
              );
            })}
          </Box>
        </SectionCard>

        <SectionCard
          title={vi.intelligence.history}
          subtitle={vi.intelligence.historySubtitle}
        >
          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            sx={{
              minHeight: 36,
              "& .MuiTab-root": { color: "rgba(255,255,255,0.68)", textTransform: "none" },
              "& .Mui-selected": { color: "#00c6ff !important" },
            }}
          >
            <Tab label={vi.intelligence.performanceHistory} />
            <Tab label={vi.intelligence.weightHistory} />
          </Tabs>

          {activeTab === 0 ? (
            <TableContainer sx={{ borderRadius: 3, border: `1px solid ${alpha(theme.palette.common.white, 0.08)}` }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {[
                      vi.table.predictionDate,
                      vi.table.targetDate,
                      vi.table.predictor,
                      vi.table.score,
                      vi.table.hit7,
                      vi.table.effectiveWeight,
                      vi.table.trend,
                    ].map((head) => (
                      <TableCell key={head} sx={{ color: "white", fontWeight: 900, backgroundColor: "#10131b" }}>
                        {head}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {performanceRows.slice(0, 80).map((row, index) => (
                    <TableRow key={`${row.predictorKey}-${row.snapshotId}-${index}`}>
                      <TableCell sx={{ color: "white" }}>{formatDate(row.predictionDate)}</TableCell>
                      <TableCell sx={{ color: "white" }}>{formatDate(row.targetDate)}</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: 900 }}>{predictorLabel(row.predictorKey)}</TableCell>
                      <TableCell sx={{ color: "white" }}>{formatScore(row.score)}</TableCell>
                      <TableCell sx={{ color: "white" }}>{formatPercent(row.hit7)}</TableCell>
                      <TableCell sx={{ color: "white" }}>{formatPercent(row.effectiveWeight)}</TableCell>
                      <TableCell>
                        <Chip size="small" label={trendLabel(row.trend)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <TableContainer sx={{ borderRadius: 3, border: `1px solid ${alpha(theme.palette.common.white, 0.08)}` }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {[
                      vi.table.predictionDate,
                      vi.table.targetDate,
                      vi.table.predictor,
                      vi.table.patternState,
                      vi.table.base,
                      vi.table.performance,
                      vi.table.pattern,
                      vi.table.effective,
                    ].map((head) => (
                      <TableCell key={head} sx={{ color: "white", fontWeight: 900, backgroundColor: "#10131b" }}>
                        {head}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {weightRows.slice(0, 80).map((row, index) => (
                    <TableRow key={`${row.predictorKey}-${row.snapshotId}-${index}`}>
                      <TableCell sx={{ color: "white" }}>{formatDate(row.predictionDate)}</TableCell>
                      <TableCell sx={{ color: "white" }}>{formatDate(row.targetDate)}</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: 900 }}>{predictorLabel(row.predictorKey)}</TableCell>
                      <TableCell>
                        <DataChip label={patternLabel(row.patternState)} state={row.patternState} />
                      </TableCell>
                      <TableCell sx={{ color: "white" }}>{formatPercent(row.baseWeight)}</TableCell>
                      <TableCell sx={{ color: "white" }}>{formatScore(row.performanceFactor, 2)}</TableCell>
                      <TableCell sx={{ color: "white" }}>{formatScore(row.patternFactor, 2)}</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: 900 }}>
                        {formatPercent(row.effectiveWeight)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </SectionCard>

        {recentSelfEvaluation.length > 0 && (
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.48)" }}>
            {vi.intelligence.loadedReports}: {recentSelfEvaluation.length}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
