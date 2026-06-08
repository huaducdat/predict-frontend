import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

import {
  getLatestPatternReport,
  getPatternState,
  getRecentPatternReports,
} from "../api/patternApi";
import { PATTERN_STATE_UPDATED_EVENT } from "../events/patternStateEvents";
import { vi } from "../i18n/vi";

const STATE_LABELS = {
  STABLE: "STABLE",
  SHIFTING: "SHIFTING",
  VOLATILE: "VOLATILE",
  INSUFFICIENT_DATA: "INSUFFICIENT_DATA",
};

const METRIC_FIELDS = [
  "recentOverlap",
  "activeOverlap",
  "baselineShift",
  "newNumberRatio",
  "groupShiftScore",
  "repeatRatio",
  "entropy",
  "totalDaysUsed",
];

const WEIGHT_KEYS = ["PAIR", "TIME", "FREQ", "POS", "REP", "STRK", "GAP"];
const PATTERN_REPORT_MODE_STORAGE_KEY = "patternReportMode";
const PATTERN_REPORT_MODE_CHANGED_EVENT = "pattern-report-mode-changed";
const MODE_OPTIONS = [
  { value: "SHORT_TERM", label: "Ngắn hạn" },
  { value: "EXTENDED", label: "Dài hạn" },
];

function normalizePayload(payload) {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) {
    return data[0] ?? null;
  }

  if (typeof data === "string") {
    return { state: data };
  }

  if (data && typeof data === "object") {
    return data;
  }

  return null;
}

function normalizeList(payload) {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === "object") {
    const candidates = [
      data.content,
      data.items,
      data.list,
      data.data,
      data.reports,
      data.results,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }
  }

  return [];
}

function readFirst(source, keys) {
  if (!source || typeof source !== "object") return undefined;

  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return undefined;
}

function normalizeState(rawState) {
  const state = String(rawState || "INSUFFICIENT_DATA").toUpperCase();
  return STATE_LABELS[state] ? state : "INSUFFICIENT_DATA";
}

function isUsableReport(report) {
  if (!report || typeof report !== "object") return false;

  return [
    "state",
    "summary",
    "message",
    "mode",
    "boostCap",
    "boost_cap",
    "boost",
    "createdAt",
    "created_at",
    "targetDate",
    "target_date",
    "recentOverlap",
    "activeOverlap",
    "baselineShift",
    "newNumberRatio",
    "groupShiftScore",
    "repeatRatio",
    "entropy",
    "totalDaysUsed",
    "reasons",
    "reasonList",
    "effectiveWeights",
    "effective_weights",
    "weights",
    "metrics",
  ].some((key) => report[key] !== undefined && report[key] !== null);
}

function formatNumber(value, digits = 2) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "--";
  return num.toFixed(digits);
}

function formatMetricValue(value, key) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "--";

  if (key === "totalDaysUsed") {
    return String(Math.round(num));
  }

  if (/ratio|overlap/i.test(key)) {
    const percent = num * 100;
    return `${percent.toFixed(percent < 10 ? 1 : 0)}%`;
  }

  return num.toFixed(2);
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function normalizeReasons(raw) {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (item == null) return "";
        if (typeof item === "string") return item;
        if (typeof item === "number") return String(item);
        if (typeof item === "object") {
          return (
            item.label ??
            item.reason ??
            item.message ??
            item.text ??
            JSON.stringify(item)
          );
        }
        return String(item);
      })
      .filter(Boolean);
  }

  if (typeof raw === "string") {
    return [raw];
  }

  if (typeof raw === "object") {
    return Object.values(raw)
      .map((item) => {
        if (item == null) return "";
        if (typeof item === "string") return item;
        if (typeof item === "number") return String(item);
        if (typeof item === "object") {
          return item.label ?? item.reason ?? item.message ?? item.text ?? "";
        }
        return String(item);
      })
      .filter(Boolean);
  }

  return [String(raw)];
}

function normalizeWeights(raw) {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (item == null) return null;

        if (Array.isArray(item) && item.length >= 2) {
          return [String(item[0]), item[1]];
        }

        if (typeof item === "object" && !Array.isArray(item)) {
          const key = item.key ?? item.name ?? item.label ?? item.source;
          const value =
            item.value ?? item.weight ?? item.score ?? item.ratio ?? item.percent;

          if (key === undefined || value === undefined) return null;

          return [String(key), value];
        }

        return null;
      })
      .filter(Boolean);
  }

  if (typeof raw === "object") {
    return Object.entries(raw);
  }

  return [];
}

function devLog(label, payload) {
  if (!import.meta.env.DEV) return;
  console.debug(`[${new Date().toISOString()}] ${label}`, payload ?? "");
}

function stateTone(state, theme) {
  if (state === "STABLE") {
    return {
      border: alpha(theme.palette.success.main, 0.32),
      bg: alpha(theme.palette.success.main, 0.12),
      chipBg: alpha(theme.palette.success.main, 0.18),
      chipColor: theme.palette.success.dark,
    };
  }

  if (state === "SHIFTING") {
    return {
      border: alpha(theme.palette.warning.main, 0.32),
      bg: alpha(theme.palette.warning.main, 0.12),
      chipBg: alpha(theme.palette.warning.main, 0.2),
      chipColor: theme.palette.warning.dark,
    };
  }

  if (state === "VOLATILE") {
    return {
      border: alpha(theme.palette.error.main, 0.32),
      bg: alpha(theme.palette.error.main, 0.12),
      chipBg: alpha(theme.palette.error.main, 0.2),
      chipColor: theme.palette.error.dark,
    };
  }

  return {
    border: alpha(theme.palette.grey[500], 0.28),
    bg: alpha(theme.palette.grey[500], 0.12),
    chipBg: alpha(theme.palette.grey[500], 0.18),
    chipColor: theme.palette.grey[700],
  };
}

function SectionCard({ title, subtitle, action, children, sx }) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        background: theme.palette.background.paper,
        color: theme.palette.text.primary,
        boxShadow: `0 18px 50px ${alpha(theme.palette.primary.main, 0.08)}`,
        ...sx,
      }}
    >
      <CardContent sx={{ p: 2.25, "&:last-child": { pb: 2.25 } }}>
        <Stack spacing={1.5}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {action}
          {children}
        </Stack>
      </CardContent>
    </Card>
  );
}

function MetricTile({ label, value, theme, state }) {
  const tone = stateTone(state, theme);

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: `1px solid ${tone.border}`,
        backgroundColor: "#F8FAFC",
      }}
    >
      <Typography
        variant="caption"
        sx={{
          display: "block",
          color: theme.palette.text.secondary,
          textTransform: "uppercase",
          letterSpacing: 0.4,
        }}
      >
        {label}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 800, mt: 0.2 }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function PatternReportPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const mountedRef = useRef(true);
  const [selectedMode, setSelectedMode] = useState("SHORT_TERM");

  const [latestReport, setLatestReport] = useState(null);
  const [stateSnapshot, setStateSnapshot] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = async () => {
    if (mountedRef.current) {
      setLoading(true);
      setError("");
      setNotice("");
    }

    try {
      const [latestRes, stateRes, recentRes] = await Promise.allSettled([
        getLatestPatternReport(selectedMode),
        getPatternState(),
        getRecentPatternReports(20, selectedMode),
      ]);

      const latest = latestRes.status === "fulfilled" ? normalizePayload(latestRes.value) : null;
      const snapshot = stateRes.status === "fulfilled" ? normalizePayload(stateRes.value) : null;
      const recent = recentRes.status === "fulfilled" ? normalizeList(recentRes.value) : [];

      devLog("PATTERN STATE REFRESH", stateRes);
      devLog("PATTERN REPORT REFRESH", latestRes);

      if (import.meta.env.DEV) {
        console.debug("[PatternReportPage] state payload", stateRes);
        console.debug("[PatternReportPage] latest report payload", latestRes);
      }

      if (mountedRef.current) {
        setLatestReport(isUsableReport(latest) ? latest : null);
        setStateSnapshot(isUsableReport(snapshot) ? snapshot : null);
        setRecentReports(Array.isArray(recent) ? recent : []);

        if (!isUsableReport(latest) && isUsableReport(snapshot)) {
          setNotice("Chưa có báo cáo mới nhất, đang hiển thị trạng thái realtime.");
        } else if (!isUsableReport(latest) && !isUsableReport(snapshot)) {
          setNotice("Chưa có report mới nhất, page đang ở trạng thái empty.");
        }

        if (
          latestRes.status === "rejected" &&
          stateRes.status === "rejected" &&
          recentRes.status === "rejected"
        ) {
          setError(vi.pattern.loadError);
        }
      }
    } catch (err) {
      console.error("Load pattern page error:", err);
      if (mountedRef.current) {
        setError(vi.pattern.loadError);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PATTERN_REPORT_MODE_STORAGE_KEY, selectedMode);
      window.dispatchEvent(new Event(PATTERN_REPORT_MODE_CHANGED_EVENT));
    }
    void loadData();

    return () => {
      mountedRef.current = false;
    };
    // stable refs only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMode]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handlePatternStateUpdated = () => {
      void loadData();
    };

    window.addEventListener(PATTERN_STATE_UPDATED_EVENT, handlePatternStateUpdated);

    return () => {
      window.removeEventListener(PATTERN_STATE_UPDATED_EVENT, handlePatternStateUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMode]);

  const stateSource = isUsableReport(stateSnapshot) ? stateSnapshot : null;
  const reportSource = isUsableReport(latestReport) ? latestReport : null;
  const headerReport = stateSource ?? reportSource;

  const state = normalizeState(readFirst(stateSource, ["state", "status", "patternState"]));
  const tone = stateTone(state, theme);
  const summary =
    readFirst(stateSource, ["summary", "message", "title", "description"]) ??
    vi.pattern.noPatternReport;
  const mode = readFirst(reportSource, ["mode", "patternMode", "reportMode"]);
  const boostCap = readFirst(reportSource, ["boostCap", "boost_cap", "boost", "boostLimit"]);
  const createdAt = readFirst(reportSource, ["createdAt", "created_at", "timestamp", "generatedAt"]);
  const targetDate = readFirst(reportSource, ["targetDate", "target_date", "date"]);
  const source = readFirst(reportSource, ["source", "origin", "generatedBy", "service", "reportSource"]);
  const metricsSource = readFirst(reportSource, ["metrics", "detail", "details"]) ?? reportSource;
  const reasons = normalizeReasons(
    readFirst(reportSource, ["reasons", "reasonList", "reason", "signals"]),
  );
  const effectiveWeights = normalizeWeights(
    readFirst(reportSource, [
      "effectiveWeights",
      "effective_weights",
      "weights",
      "weightMap",
    ]),
  );

  const metricEntries = useMemo(
    () =>
      METRIC_FIELDS.map((key) => {
        const snakeKey = key.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);
        const value = readFirst(metricsSource, [key, key.toLowerCase(), snakeKey]);

        if (value === undefined || value === null) return null;

        return [key, value];
      }).filter(Boolean),
    [metricsSource],
  );

  const selectedSourceLabel = isUsableReport(latestReport)
    ? "báo cáo mới nhất"
    : isUsableReport(stateSnapshot)
      ? "trạng thái realtime"
      : "trống";

  const topMeta = [
    mode ? `${vi.mode.label} ${vi.mode[mode] ?? mode}` : null,
    boostCap !== undefined && boostCap !== null && boostCap !== "" ? `Tăng cường ${formatNumber(boostCap, 2)}` : null,
    createdAt ? formatDate(createdAt) : null,
    targetDate ? `${vi.table.targetDate} ${formatDate(targetDate)}` : null,
  ].filter(Boolean);

  const rowStateTone = (rowState) => stateTone(normalizeState(rowState), theme);

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
            "radial-gradient(circle at top left, rgba(37,99,235,0.12), transparent 34%), radial-gradient(circle at top right, rgba(22,163,74,0.1), transparent 28%), linear-gradient(180deg, rgba(248,250,252,0.78), rgba(244,247,251,0.28))",
          pointerEvents: "none",
        }}
      />

      <Box sx={{ position: "relative", zIndex: 1, maxWidth: 1440, mx: "auto" }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{
              alignItems: { xs: "flex-start", md: "center" },
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  background: "linear-gradient(90deg, #6a5cff, #00c6ff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {vi.pattern.pageTitle}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                {vi.pattern.pageSubtitle}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1}>
              <Tabs
                value={selectedMode}
                onChange={(_, value) => setSelectedMode(value)}
                sx={{
                  minHeight: 36,
                  "& .MuiTab-root": { color: theme.palette.text.secondary, textTransform: "none", fontWeight: 800 },
                  "& .Mui-selected": { color: `${theme.palette.primary.main} !important` },
                }}
              >
                {MODE_OPTIONS.map((item) => (
                  <Tab key={item.value} value={item.value} label={item.label} />
                ))}
              </Tabs>

              <Button
                variant="outlined"
                startIcon={<ArrowBackRoundedIcon />}
                onClick={() => navigate(-1)}
                sx={{
                  color: theme.palette.text.primary,
                  borderColor: theme.palette.divider,
                  textTransform: "none",
                }}
              >
                {vi.common.back}
              </Button>

              <Button
                variant="contained"
                startIcon={<RefreshRoundedIcon />}
                onClick={loadData}
                disabled={loading}
                sx={{
                  textTransform: "none",
                  background: "linear-gradient(135deg, #6a5cff, #00c6ff)",
                }}
              >
                {loading ? vi.common.loading : vi.common.refresh}
              </Button>
            </Stack>
          </Stack>

          {error && <Alert severity="error">{error}</Alert>}
          {notice && !error && <Alert severity="info">{notice}</Alert>}

          <SectionCard
            title={vi.pattern.headerCard}
            subtitle={vi.pattern.headerCardSubtitle}
            action={
              loading && !headerReport ? (
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <CircularProgress size={18} />
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    {vi.pattern.loadingData}
                  </Typography>
                </Stack>
              ) : null
            }
          >
            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.5}
                sx={{ alignItems: { xs: "flex-start", md: "center" } }}
              >
                <Chip
                  label={vi.patternState[state] ?? state}
                  sx={{
                    fontWeight: 800,
                    color: tone.chipColor,
                    backgroundColor: tone.chipBg,
                    border: `1px solid ${tone.border}`,
                  }}
                />

                <Typography variant="body1" sx={{ fontWeight: 800 }}>
                  {summary}
                </Typography>
              </Stack>

              <Stack direction="row" gap={1} sx={{ flexWrap: "wrap" }}>
                {mode && (
                  <Chip
                    size="small"
                    label={`${vi.mode.label}: ${vi.mode[String(mode).toUpperCase()] ?? String(mode).toUpperCase()}`}
                  />
                )}
                {boostCap !== undefined && boostCap !== null && boostCap !== "" && (
                  <Chip size="small" label={`${vi.pattern.boostCap}: ${formatNumber(boostCap, 2)}`} />
                )}
                {createdAt && <Chip size="small" label={`${vi.pattern.createdAt}: ${formatDate(createdAt)}`} />}
                {targetDate && <Chip size="small" label={`${vi.table.targetDate}: ${formatDate(targetDate)}`} />}
                <Chip size="small" label={`${vi.pattern.source}: ${selectedSourceLabel}`} />
                {source && <Chip size="small" label={`${vi.pattern.reportSource}: ${String(source)}`} />}
              </Stack>
            </Stack>
          </SectionCard>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1.2fr 0.8fr" },
              gap: 2,
            }}
          >
            <SectionCard
              title={vi.pattern.metricsCard}
              subtitle={vi.pattern.compactMetrics}
            >
              {metricEntries.length > 0 ? (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, minmax(0, 1fr))",
                      xl: "repeat(4, minmax(0, 1fr))",
                    },
                    gap: 1.25,
                  }}
                >
                  {metricEntries.map(([key, value]) => (
                    <MetricTile
                      key={key}
                      label={key}
                      value={formatMetricValue(value, key)}
                      theme={theme}
                      state={state}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  {vi.pattern.noMetrics}
                </Typography>
              )}
            </SectionCard>

            <SectionCard
              title={vi.pattern.serviceFlowCard}
              subtitle={vi.pattern.serviceFlowSubtitle}
            >
              <Stack spacing={1}>
                {[
                  "Phân tích dữ liệu 3/7/14/30 ngày",
                  "Tạo trạng thái hệ thống theo snapshot thời gian thực",
                  "Sinh mức độ tin cậy hiệu lực khi tổng hợp",
                  "Áp giới hạn tăng cường theo chế độ hiện tại",
                  "Lưu báo cáo trạng thái",
                  "Frontend đọc báo cáo mới nhất và lịch sử gần đây",
                ].map((step, index) => (
                  <Box
                    key={step}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.2,
                      p: 1.2,
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      backgroundColor: "#F8FAFC",
                    }}
                  >
                    <Chip
                      size="small"
                      label={`${index + 1}`}
                      sx={{
                        fontWeight: 800,
                        color: tone.chipColor,
                        backgroundColor: tone.chipBg,
                        border: `1px solid ${tone.border}`,
                      }}
                    />
                    <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                      {step}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </SectionCard>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
              gap: 2,
            }}
          >
            <SectionCard
              title={vi.pattern.reasonsCard}
              subtitle={vi.pattern.reasonList}
            >
              {reasons.length > 0 ? (
                <Stack spacing={1}>
                  {reasons.map((reason, index) => (
                    <Box
                      key={`${reason}-${index}`}
                      sx={{
                        p: 1.2,
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.divider}`,
                        backgroundColor: "#F8FAFC",
                      }}
                    >
                      <Typography variant="body2">{reason}</Typography>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  {vi.pattern.noReasons}
                </Typography>
              )}
            </SectionCard>

            <SectionCard
              title={vi.pattern.effectiveWeightsCard}
              subtitle={vi.pattern.effectiveWeights}
            >
              {effectiveWeights.length > 0 ? (
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  {effectiveWeights.map(([key, value]) => (
                    <Chip
                      key={key}
                      label={`${key}: ${formatMetricValue(value, key)}`}
                      sx={{
                        fontWeight: 700,
                        color: theme.palette.text.primary,
                        backgroundColor: "#F8FAFC",
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  {vi.pattern.noEffectiveWeights}
                </Typography>
              )}
            </SectionCard>
          </Box>

          <SectionCard
            title={vi.pattern.recentReports}
            subtitle={vi.pattern.recentReportsSubtitle}
          >
            {recentReports.length > 0 ? (
              <TableContainer
                sx={{
                  maxHeight: 540,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper,
                }}
              >
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      {[vi.pattern.createdAt, vi.table.patternState, vi.intelligence.summary, vi.pattern.boostCap, vi.mode.label, vi.pattern.source].map((head) => (
                        <TableCell
                          key={head}
                          sx={{
                            fontWeight: 800,
                            backgroundColor: "#EEF4FF",
                            color: theme.palette.text.primary,
                          }}
                        >
                          {head}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentReports.map((row, index) => {
                      const rowState = normalizeState(readFirst(row, ["state", "status", "patternState"]));
                      const rowTone = rowStateTone(rowState);
                      const rowSummary =
                        readFirst(row, ["summary", "message", "title", "description"]) ??
                        vi.intelligence.summary;
                      const rowBoost = readFirst(row, ["boostCap", "boost_cap", "boost", "boostLimit"]);
                      const rowMode = readFirst(row, ["mode", "patternMode", "reportMode"]);
                      const rowCreatedAt = readFirst(row, ["createdAt", "created_at", "timestamp", "generatedAt"]);
                      const rowSource = readFirst(row, ["source", "origin", "generatedBy", "service", "reportSource"]) ?? selectedSourceLabel;

                      return (
                        <TableRow
                          key={`${rowCreatedAt ?? index}-${rowState}-${index}`}
                          sx={{
                            "&:nth-of-type(odd)": {
                              backgroundColor: alpha(theme.palette.primary.main, 0.025),
                            },
                          }}
                        >
                          <TableCell sx={{ whiteSpace: "nowrap", color: theme.palette.text.primary }}>
                            {rowCreatedAt ? formatDate(rowCreatedAt) : "--"}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={vi.patternState[rowState] ?? rowState}
                              sx={{
                                fontWeight: 800,
                                color: rowTone.chipColor,
                                backgroundColor: rowTone.chipBg,
                                border: `1px solid ${rowTone.border}`,
                              }}
                            />
                          </TableCell>
                          <TableCell
                            sx={{
                              maxWidth: 420,
                              color: theme.palette.text.primary,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {rowSummary}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap", color: theme.palette.text.primary }}>
                            {rowBoost !== undefined && rowBoost !== null && rowBoost !== ""
                              ? formatNumber(rowBoost, 2)
                              : "--"}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap", color: theme.palette.text.primary }}>
                            {rowMode ? vi.mode[String(rowMode).toUpperCase()] ?? String(rowMode).toUpperCase() : "--"}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap", color: theme.palette.text.primary }}>
                            {rowSource ? String(rowSource) : "--"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  border: `1px dashed ${alpha(theme.palette.text.secondary, 0.28)}`,
                  textAlign: "center",
                  color: theme.palette.text.secondary,
                  backgroundColor: "#F8FAFC",
                }}
              >
                {vi.pattern.noRecentReports}
              </Box>
            )}
          </SectionCard>
        </Stack>
      </Box>
    </Box>
  );
}
