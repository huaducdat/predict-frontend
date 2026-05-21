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

function stateTone(state, theme) {
  if (state === "STABLE") {
    return {
      border: alpha(theme.palette.success.main, 0.32),
      bg: alpha(theme.palette.success.main, 0.12),
      chipBg: alpha(theme.palette.success.main, 0.18),
      chipColor: theme.palette.success.light,
    };
  }

  if (state === "SHIFTING") {
    return {
      border: alpha(theme.palette.warning.main, 0.32),
      bg: alpha(theme.palette.warning.main, 0.12),
      chipBg: alpha(theme.palette.warning.main, 0.2),
      chipColor: theme.palette.warning.light,
    };
  }

  if (state === "VOLATILE") {
    return {
      border: alpha(theme.palette.error.main, 0.32),
      bg: alpha(theme.palette.error.main, 0.12),
      chipBg: alpha(theme.palette.error.main, 0.2),
      chipColor: theme.palette.error.light,
    };
  }

  return {
    border: alpha(theme.palette.grey[500], 0.28),
    bg: alpha(theme.palette.grey[500], 0.12),
    chipBg: alpha(theme.palette.grey[500], 0.18),
    chipColor: theme.palette.grey[300],
  };
}

function SectionCard({ title, subtitle, action, children, sx }) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
        background:
          "linear-gradient(135deg, rgba(18,20,28,0.96), rgba(10,12,18,0.92))",
        backdropFilter: "blur(18px)",
        color: "white",
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
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.68)" }}>
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
        backgroundColor: alpha(theme.palette.common.white, 0.05),
      }}
    >
      <Typography
        variant="caption"
        sx={{
          display: "block",
          color: "rgba(255,255,255,0.6)",
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
        getLatestPatternReport(),
        getPatternState(),
        getRecentPatternReports(20),
      ]);

      const latest = latestRes.status === "fulfilled" ? normalizePayload(latestRes.value) : null;
      const snapshot = stateRes.status === "fulfilled" ? normalizePayload(stateRes.value) : null;
      const recent = recentRes.status === "fulfilled" ? normalizeList(recentRes.value) : [];

      if (mountedRef.current) {
        setLatestReport(isUsableReport(latest) ? latest : null);
        setStateSnapshot(isUsableReport(snapshot) ? snapshot : null);
        setRecentReports(Array.isArray(recent) ? recent : []);

        if (!isUsableReport(latest) && isUsableReport(snapshot)) {
          setNotice("Latest report chưa có, đang hiển thị realtime state.");
        } else if (!isUsableReport(latest) && !isUsableReport(snapshot)) {
          setNotice("Chưa có report mới nhất, page đang ở trạng thái empty.");
        }

        if (
          latestRes.status === "rejected" &&
          stateRes.status === "rejected" &&
          recentRes.status === "rejected"
        ) {
          setError("Không tải được dữ liệu Pattern.");
        }
      }
    } catch (err) {
      console.error("Load pattern page error:", err);
      if (mountedRef.current) {
        setError("Không tải được dữ liệu Pattern.");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    void loadData();

    return () => {
      mountedRef.current = false;
    };
    // stable refs only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const headerReport =
    isUsableReport(latestReport) ? latestReport : isUsableReport(stateSnapshot) ? stateSnapshot : null;

  const state = normalizeState(readFirst(headerReport, ["state", "status", "patternState"]));
  const tone = stateTone(state, theme);
  const summary =
    readFirst(headerReport, ["summary", "message", "title", "description"]) ??
    "Chưa có Pattern report";
  const mode = readFirst(headerReport, ["mode", "patternMode", "reportMode"]);
  const boostCap = readFirst(headerReport, ["boostCap", "boost_cap", "boost", "boostLimit"]);
  const createdAt = readFirst(headerReport, ["createdAt", "created_at", "timestamp", "generatedAt"]);
  const targetDate = readFirst(headerReport, ["targetDate", "target_date", "date"]);
  const source = readFirst(headerReport, ["source", "origin", "generatedBy", "service", "reportSource"]);
  const metricsSource = readFirst(headerReport, ["metrics", "detail", "details"]) ?? headerReport;
  const reasons = normalizeReasons(
    readFirst(headerReport, ["reasons", "reasonList", "reason", "signals"]),
  );
  const effectiveWeights = normalizeWeights(
    readFirst(headerReport, [
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
    ? "latest report"
    : isUsableReport(stateSnapshot)
      ? "realtime state"
      : "empty";

  const topMeta = [
    mode ? `mode ${String(mode).toUpperCase()}` : null,
    boostCap !== undefined && boostCap !== null && boostCap !== "" ? `boost ${formatNumber(boostCap, 2)}` : null,
    createdAt ? formatDate(createdAt) : null,
    targetDate ? `target ${formatDate(targetDate)}` : null,
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
            "radial-gradient(circle at top left, rgba(106,92,255,0.14), transparent 34%), radial-gradient(circle at top right, rgba(0,198,255,0.12), transparent 28%), linear-gradient(180deg, rgba(8,10,16,0.35), rgba(8,10,16,0.1))",
          pointerEvents: "none",
        }}
      />

      <Box sx={{ position: "relative", zIndex: 1, maxWidth: 1440, mx: "auto" }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
            spacing={2}
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
                Pattern Report
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                PatternShiftService, PatternReport và recent history trong một màn hình.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackRoundedIcon />}
                onClick={() => navigate(-1)}
                sx={{
                  color: "white",
                  borderColor: alpha(theme.palette.common.white, 0.2),
                  textTransform: "none",
                }}
              >
                Back
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
                {loading ? "Loading..." : "Refresh"}
              </Button>
            </Stack>
          </Stack>

          {error && <Alert severity="error">{error}</Alert>}
          {notice && !error && <Alert severity="info">{notice}</Alert>}

          <SectionCard
            title="Header card"
            subtitle="Current snapshot from latest report, falling back to realtime state when latest is missing."
            action={
              loading && !headerReport ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={18} />
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.65)" }}>
                    Loading pattern data...
                  </Typography>
                </Stack>
              ) : null
            }
          >
            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.5}
                alignItems={{ xs: "flex-start", md: "center" }}
              >
                <Chip
                  label={state}
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

              <Stack direction="row" flexWrap="wrap" gap={1}>
                {mode && <Chip size="small" label={`mode: ${String(mode).toUpperCase()}`} />}
                {boostCap !== undefined && boostCap !== null && boostCap !== "" && (
                  <Chip size="small" label={`boostCap: ${formatNumber(boostCap, 2)}`} />
                )}
                {createdAt && <Chip size="small" label={`createdAt: ${formatDate(createdAt)}`} />}
                {targetDate && <Chip size="small" label={`targetDate: ${formatDate(targetDate)}`} />}
                <Chip size="small" label={`source: ${selectedSourceLabel}`} />
                {source && <Chip size="small" label={`report source: ${String(source)}`} />}
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
              title="Metrics card"
              subtitle="Compact metrics from PatternReport."
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
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.72)" }}>
                  Chưa có metric chi tiết.
                </Typography>
              )}
            </SectionCard>

            <SectionCard
              title="Service flow card"
              subtitle="How the pattern flow is produced."
            >
              <Stack spacing={1}>
                {[
                  "PatternShiftService phân tích 3/7/14/30 ngày",
                  "Tạo PatternState theo realtime snapshot",
                  "CombineService sinh effectiveWeights runtime",
                  "Áp boostCap theo mode hiện tại",
                  "Lưu PatternReport",
                  "Frontend đọc latest và recent history",
                ].map((step, index) => (
                  <Box
                    key={step}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.2,
                      p: 1.2,
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
                      backgroundColor: alpha(theme.palette.common.white, 0.04),
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
              title="Reasons card"
              subtitle="Reason list from the latest PatternReport."
            >
              {reasons.length > 0 ? (
                <Stack spacing={1}>
                  {reasons.map((reason, index) => (
                    <Box
                      key={`${reason}-${index}`}
                      sx={{
                        p: 1.2,
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
                        backgroundColor: alpha(theme.palette.common.white, 0.04),
                      }}
                    >
                      <Typography variant="body2">{reason}</Typography>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.72)" }}>
                  Chưa có reason cụ thể.
                </Typography>
              )}
            </SectionCard>

            <SectionCard
              title="Effective weights card"
              subtitle="PAIR, TIME, FREQ, POS, REP, STRK, GAP and other runtime weights."
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
                        color: "white",
                        backgroundColor: alpha(theme.palette.common.white, 0.06),
                        border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
                      }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.72)" }}>
                  Chưa có effectiveWeights.
                </Typography>
              )}
            </SectionCard>
          </Box>

          <SectionCard
            title="Recent reports section"
            subtitle="20 report gần nhất từ /api/pattern/report/recent?limit=20"
          >
            {recentReports.length > 0 ? (
              <TableContainer
                sx={{
                  maxHeight: 540,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
                }}
              >
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      {["createdAt", "state", "summary", "boostCap", "mode", "source"].map((head) => (
                        <TableCell
                          key={head}
                          sx={{
                            fontWeight: 800,
                            backgroundColor: "#10131b",
                            color: "white",
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
                        "No summary";
                      const rowBoost = readFirst(row, ["boostCap", "boost_cap", "boost", "boostLimit"]);
                      const rowMode = readFirst(row, ["mode", "patternMode", "reportMode"]);
                      const rowCreatedAt = readFirst(row, ["createdAt", "created_at", "timestamp", "generatedAt"]);
                      const rowSource = readFirst(row, ["source", "origin", "generatedBy", "service", "reportSource"]) ?? selectedSourceLabel;

                      return (
                        <TableRow
                          key={`${rowCreatedAt ?? index}-${rowState}-${index}`}
                          sx={{
                            "&:nth-of-type(odd)": {
                              backgroundColor: alpha(theme.palette.common.white, 0.02),
                            },
                          }}
                        >
                          <TableCell sx={{ whiteSpace: "nowrap", color: "white" }}>
                            {rowCreatedAt ? formatDate(rowCreatedAt) : "--"}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={rowState}
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
                              color: "white",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {rowSummary}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap", color: "white" }}>
                            {rowBoost !== undefined && rowBoost !== null && rowBoost !== ""
                              ? formatNumber(rowBoost, 2)
                              : "--"}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap", color: "white" }}>
                            {rowMode ? String(rowMode).toUpperCase() : "--"}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap", color: "white" }}>
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
                  border: `1px dashed ${alpha(theme.palette.common.white, 0.16)}`,
                  textAlign: "center",
                  color: "rgba(255,255,255,0.72)",
                }}
              >
                Chưa có recent reports.
              </Box>
            )}
          </SectionCard>
        </Stack>
      </Box>
    </Box>
  );
}
