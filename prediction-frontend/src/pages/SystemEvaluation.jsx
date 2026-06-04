import { useEffect, useMemo, useRef, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
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
import AnalyticsRoundedIcon from "@mui/icons-material/AnalyticsRounded";
import PsychologyAltRoundedIcon from "@mui/icons-material/PsychologyAltRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";

import {
  getSystemEvaluationLatest,
  getSystemEvaluationMetricsLatest,
  getSystemEvaluationRecent,
  getSystemEvaluationRecommendationLatest,
  runSystemEvaluation,
} from "../api/systemEvaluationApi";
import MetricLineChart from "../components/systemEvaluation/MetricLineChart";
import ScoreCard from "../components/systemEvaluation/ScoreCard";
import StateCard from "../components/systemEvaluation/StateCard";
import SystemSectionCard from "../components/systemEvaluation/SystemSectionCard";
import { vi } from "../i18n/vi";

const HISTORY_SERIES = [
  { field: "confidenceScore", label: "Confidence", color: "#00c6ff" },
  { field: "stabilityScore", label: "Stability", color: "#14b86a" },
  { field: "accuracyScore", label: "Accuracy", color: "#ff9f1c" },
];

const MODE_OPTIONS = [
  { value: "SHORT_TERM", label: "NgÃ¡ÂºÂ¯n hÃ¡ÂºÂ¡n" },
  { value: "EXTENDED", label: "DÃƒÂ i hÃ¡ÂºÂ¡n" },
];

function normalizePayload(payload) {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) return data[0] ?? null;
  if (data && typeof data === "object") return data;

  return null;
}

function normalizeList(payload) {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) return data;

  if (data && typeof data === "object") {
    for (const key of ["content", "items", "list", "reports", "results", "data"]) {
      if (Array.isArray(data[key])) return data[key];
    }
  }

  return [];
}

function readFirst(source, keys) {
  if (!source || typeof source !== "object") return undefined;

  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null) return value;
  }

  return undefined;
}

function hasSystemEvaluationData(report) {
  if (!report || typeof report !== "object") return false;

  return [
    "accuracyScore",
    "evaluationScore",
    "stabilityScore",
    "confidenceScore",
    "phaseState",
    "confidenceState",
    "recommendation",
    "summaryText",
    "reasonsJson",
  ].some((key) => report[key] !== undefined && report[key] !== null);
}

function formatPercent(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "--";
  return `${Math.round(num * 100)}%`;
}

function formatDate(value) {
  if (!value) return "--";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: String(value).includes("T") ? "short" : undefined,
  }).format(date);
}

function parseReasons(raw) {
  if (!raw) return [];

  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      if (parsed && typeof parsed === "object") return Object.values(parsed).map(String).filter(Boolean);
    } catch {
      return [raw];
    }
  }

  if (raw && typeof raw === "object") return Object.values(raw).map(String).filter(Boolean);

  return [String(raw)];
}

function sortHistory(rows) {
  return [...rows].sort((a, b) => {
    const aTime = new Date(a.createdAt ?? a.targetDate ?? a.date ?? 0).getTime();
    const bTime = new Date(b.createdAt ?? b.targetDate ?? b.date ?? 0).getTime();

    if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) {
      return aTime - bTime;
    }

    return Number(a.id ?? 0) - Number(b.id ?? 0);
  });
}

function valueOrFallback(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function stateChipSx(value, theme) {
  const state = String(value || "").toUpperCase();

  if (["STABLE", "HIGH_CONFIDENCE"].includes(state)) {
    return {
      color: theme.palette.success.dark,
      backgroundColor: alpha(theme.palette.success.main, 0.16),
      border: `1px solid ${alpha(theme.palette.success.main, 0.34)}`,
    };
  }

  if (["SHIFTING", "RECOVERING", "MEDIUM", "MEDIUM_CONFIDENCE", "PHASE_SHIFTING"].includes(state)) {
    return {
      color: theme.palette.warning.dark,
      backgroundColor: alpha(theme.palette.warning.main, 0.17),
      border: `1px solid ${alpha(theme.palette.warning.main, 0.34)}`,
    };
  }

  if (["CHAOTIC", "LOW_CONFIDENCE", "LOW", "DO_NOT_TRUST"].includes(state)) {
    return {
      color: theme.palette.error.dark,
      backgroundColor: alpha(theme.palette.error.main, 0.18),
      border: `1px solid ${alpha(theme.palette.error.main, 0.36)}`,
    };
  }

  return {
    color: theme.palette.grey[700],
    backgroundColor: alpha(theme.palette.grey[500], 0.14),
    border: `1px solid ${alpha(theme.palette.grey[500], 0.26)}`,
  };
}

export default function SystemEvaluation() {
  const theme = useTheme();
  const mountedRef = useRef(true);
  const [selectedMode, setSelectedMode] = useState("SHORT_TERM");

  const [latestReport, setLatestReport] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = async () => {
    if (mountedRef.current) {
      setLoading(true);
      setError("");
      setNotice("");
    }

    try {
      const [latestRes, recentRes, metricsRes, recommendationRes] = await Promise.allSettled([
        getSystemEvaluationLatest(selectedMode),
        getSystemEvaluationRecent(20, selectedMode),
        getSystemEvaluationMetricsLatest(selectedMode),
        getSystemEvaluationRecommendationLatest(selectedMode),
      ]);

      const latest = latestRes.status === "fulfilled" ? normalizePayload(latestRes.value) : null;
      const recent = recentRes.status === "fulfilled" ? normalizeList(recentRes.value) : [];
      const metricSnapshot = metricsRes.status === "fulfilled" ? normalizePayload(metricsRes.value) : null;
      const recommendationSnapshot =
        recommendationRes.status === "fulfilled" ? normalizePayload(recommendationRes.value) : null;

      if (mountedRef.current) {
        setLatestReport(hasSystemEvaluationData(latest) ? latest : null);
        setRecentReports(Array.isArray(recent) ? recent : []);
        setMetrics(metricSnapshot);
        setRecommendation(recommendationSnapshot);

        if (!hasSystemEvaluationData(latest) && !recent.length) {
          setNotice(latest?.message || "Chua co bao cao danh gia he thong. Bam Chay danh gia de tao bao cao.");
        }

        if (
          latestRes.status === "rejected" &&
          recentRes.status === "rejected" &&
          metricsRes.status === "rejected" &&
          recommendationRes.status === "rejected"
        ) {
          setError("KhÃƒÂ´ng tÃ¡ÂºÂ£i Ã„â€˜Ã†Â°Ã¡Â»Â£c dÃ¡Â»Â¯ liÃ¡Â»â€¡u System Evaluation. KiÃ¡Â»Æ’m tra backend hoÃ¡ÂºÂ·c token Ã„â€˜Ã„Æ’ng nhÃ¡ÂºÂ­p.");
        }
      }
    } catch (err) {
      console.error("Load system evaluation error:", err);
      if (mountedRef.current) {
        setError("KhÃƒÂ´ng tÃ¡ÂºÂ£i Ã„â€˜Ã†Â°Ã¡Â»Â£c dÃ¡Â»Â¯ liÃ¡Â»â€¡u System Evaluation.");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleRunEvaluation = async () => {
    setRunning(true);
    setError("");
    setNotice("");

    try {
      const report = await runSystemEvaluation(selectedMode);
      if (mountedRef.current) {
        setLatestReport(hasSystemEvaluationData(report) ? report : null);
        setNotice("Da chay danh gia he thong.");
      }
      await loadData();
    } catch (err) {
      console.error("Run system evaluation error:", err);
      if (mountedRef.current) {
        setError("Khong chay duoc danh gia he thong. Kiem tra du lieu du doan/ket qua va backend log.");
      }
    } finally {
      if (mountedRef.current) {
        setRunning(false);
      }
    }
  };
  useEffect(() => {
    mountedRef.current = true;
    void loadData();

    return () => {
      mountedRef.current = false;
    };
    // stable refs and imported API functions only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMode]);

  const activeReport = latestReport ?? (recentReports.length ? recentReports[0] : null);
  const historyRows = useMemo(() => sortHistory(recentReports).slice(-20), [recentReports]);
  const displayRows = useMemo(() => [...historyRows].reverse(), [historyRows]);
  const reasons = useMemo(
    () => parseReasons(readFirst(activeReport, ["reasonsJson", "reasons", "reasonList"])),
    [activeReport],
  );

  const accuracyScore = valueOrFallback(activeReport?.accuracyScore, metrics?.accuracyScore);
  const evaluationScore = valueOrFallback(activeReport?.evaluationScore, metrics?.evaluationScore);
  const stabilityScore = valueOrFallback(activeReport?.stabilityScore, metrics?.stabilityScore);
  const confidenceScore = valueOrFallback(activeReport?.confidenceScore, metrics?.confidenceScore);
  const phaseState = valueOrFallback(activeReport?.phaseState, recommendation?.phaseState);
  const confidenceState = valueOrFallback(activeReport?.confidenceState, recommendation?.confidenceState);
  const recommendationCode = valueOrFallback(activeReport?.recommendation, recommendation?.recommendation);
  const summaryText = valueOrFallback(
    activeReport?.summaryText,
    recommendation?.summaryText,
    "ChÃ†Â°a cÃƒÂ³ tÃƒÂ³m tÃ¡ÂºÂ¯t hÃ¡Â»â€¡ thÃ¡Â»â€˜ng.",
  );
  const recommendationText = valueOrFallback(activeReport?.recommendationText, recommendation?.recommendationText);

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
            "radial-gradient(circle at 10% 0%, rgba(0,198,255,0.16), transparent 28%), radial-gradient(circle at 88% 10%, rgba(20,184,106,0.13), transparent 28%), radial-gradient(circle at 48% 100%, rgba(255,159,28,0.13), transparent 32%)",
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
                background: "linear-gradient(90deg, #00c6ff, #14b86a, #ff9f1c)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Ã„ÂÃƒÂ¡nh GiÃƒÂ¡ HÃ¡Â»â€¡ ThÃ¡Â»â€˜ng
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              TÃ¡Â»â€¢ng hÃ¡Â»Â£p Ã„â€˜Ã¡Â»â„¢ tin cÃ¡ÂºÂ­y, Ã¡Â»â€¢n Ã„â€˜Ã¡Â»â€¹nh vÃƒÂ  khuyÃ¡ÂºÂ¿n nghÃ¡Â»â€¹ vÃ¡ÂºÂ­n hÃƒÂ nh tÃ¡Â»Â« System Evaluation backend.
            </Typography>
          </Box>

          <Tabs
            value={selectedMode}
            onChange={(_, value) => setSelectedMode(value)}
            sx={{
              minHeight: 40,
              "& .MuiTab-root": { color: theme.palette.text.secondary, textTransform: "none", fontWeight: 800 },
              "& .Mui-selected": { color: `${theme.palette.primary.main} !important` },
            }}
          >
            {MODE_OPTIONS.map((item) => (
              <Tab key={item.value} value={item.value} label={item.label} />
            ))}
          </Tabs>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              variant="outlined"
              startIcon={running ? <CircularProgress size={16} /> : <AnalyticsRoundedIcon />}
              onClick={handleRunEvaluation}
              disabled={loading || running}
              sx={{ textTransform: "none", borderRadius: 3, px: 2.2 }}
            >
              {running ? "Äang Ä‘Ã¡nh giÃ¡" : "Cháº¡y Ä‘Ã¡nh giÃ¡"}
            </Button>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshRoundedIcon />}
              onClick={loadData}
              disabled={loading || running}
              sx={{
                textTransform: "none",
                borderRadius: 3,
                px: 2.4,
                background: "linear-gradient(135deg, #00c6ff, #14b86a)",
              }}
            >
              {loading ? "Äang táº£i" : "LÃ m má»›i"}
            </Button>
          </Stack>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}
        {notice && !error && <Alert severity="info">{notice}</Alert>}

        {loading && !activeReport ? (
          <SystemSectionCard title="Ã„Âang tÃ¡ÂºÂ£i dÃ¡Â»Â¯ liÃ¡Â»â€¡u" subtitle="Ã„Âang gÃ¡Â»Âi cÃƒÂ¡c API System Evaluation.">
            <Stack direction="row" alignItems="center" spacing={1.2}>
              <CircularProgress size={20} />
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Vui lÃƒÂ²ng Ã„â€˜Ã¡Â»Â£i trong giÃƒÂ¢y lÃƒÂ¡t.
              </Typography>
            </Stack>
          </SystemSectionCard>
        ) : (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" },
                gap: 1.6,
              }}
            >
              <ScoreCard
                label="Accuracy"
                value={accuracyScore}
                subtitle="Ã„ÂÃ¡Â»â„¢ chÃƒÂ­nh xÃƒÂ¡c thÃ¡Â»Â±c tÃ¡ÂºÂ¿ gÃ¡ÂºÂ§n nhÃ¡ÂºÂ¥t"
                icon={<AnalyticsRoundedIcon />}
              />
              <ScoreCard
                label="Evaluation"
                value={evaluationScore}
                subtitle="Ã„ÂiÃ¡Â»Æ’m Ã„â€˜ÃƒÂ¡nh giÃƒÂ¡ tÃ¡Â»â€¢ng hÃ¡Â»Â£p"
                icon={<PsychologyAltRoundedIcon />}
              />
              <ScoreCard
                label="Stability"
                value={stabilityScore}
                subtitle="MÃ¡Â»Â©c Ã¡Â»â€¢n Ã„â€˜Ã¡Â»â€¹nh tÃƒÂ­n hiÃ¡Â»â€¡u"
                icon={<ShieldRoundedIcon />}
              />
              <ScoreCard
                label="Confidence"
                value={confidenceScore}
                subtitle="Ã„ÂÃ¡Â»â„¢ tin cÃ¡ÂºÂ­y hiÃ¡Â»â€¡n tÃ¡ÂºÂ¡i"
                icon={<VerifiedRoundedIcon />}
              />
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                gap: 1.6,
              }}
            >
              <StateCard title="Phase State" value={phaseState} subtitle="TrÃ¡ÂºÂ¡ng thÃƒÂ¡i pha vÃ¡ÂºÂ­n hÃƒÂ nh hiÃ¡Â»â€¡n tÃ¡ÂºÂ¡i." />
              <StateCard
                title="Confidence State"
                value={confidenceState}
                subtitle="PhÃƒÂ¢n loÃ¡ÂºÂ¡i mÃ¡Â»Â©c tÃ¡Â»Â± tin cÃ¡Â»Â§a hÃ¡Â»â€¡ thÃ¡Â»â€˜ng."
              />
              <StateCard
                title="Recommendation"
                value={recommendationCode}
                subtitle={recommendationText || "KhuyÃ¡ÂºÂ¿n nghÃ¡Â»â€¹ ngÃ¡ÂºÂ¯n tÃ¡Â»Â« backend."}
              />
            </Box>

            <SystemSectionCard
              title="TÃƒÂ³m TÃ¡ÂºÂ¯t HÃ¡Â»â€¡ ThÃ¡Â»â€˜ng"
              subtitle={`NguÃ¡Â»â€œn mÃ¡Â»â€ºi nhÃ¡ÂºÂ¥t: ${formatDate(activeReport?.createdAt ?? activeReport?.targetDate)}`}
            >
              <Typography variant="body1" sx={{ lineHeight: 1.7, color: theme.palette.text.primary }}>
                {summaryText}
              </Typography>
            </SystemSectionCard>

            <SystemSectionCard
              title="LÃƒÂ½ Do"
              subtitle="Danh sÃƒÂ¡ch Ã„â€˜ÃƒÂ£ Ã„â€˜Ã†Â°Ã¡Â»Â£c parse tÃ¡Â»Â« reasonsJson string JSON, khÃƒÂ´ng hiÃ¡Â»Æ’n thÃ¡Â»â€¹ raw payload."
            >
              {reasons.length > 0 ? (
                <Stack spacing={1}>
                  {reasons.map((reason, index) => (
                    <Box
                      key={`${reason}-${index}`}
                      sx={{
                        p: 1.25,
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
                  ChÃ†Â°a cÃƒÂ³ lÃƒÂ½ do cÃ¡Â»Â¥ thÃ¡Â»Æ’.
                </Box>
              )}
            </SystemSectionCard>

            <SystemSectionCard
              title="Confidence / Stability / Accuracy History"
              subtitle="NguÃ¡Â»â€œn dÃ¡Â»Â¯ liÃ¡Â»â€¡u: GET /api/system-evaluation/recent?limit=20"
            >
              <MetricLineChart title="System Score History" rows={historyRows} series={HISTORY_SERIES} />
            </SystemSectionCard>

            <SystemSectionCard title="LÃ¡Â»â€¹ch SÃ¡Â»Â­" subtitle="20 bÃ¡ÂºÂ£n ghi System Evaluation gÃ¡ÂºÂ§n nhÃ¡ÂºÂ¥t.">
              {displayRows.length > 0 ? (
                <TableContainer
                  sx={{
                    maxHeight: 540,
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.paper,
                  }}
                >
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        {["NgÃƒÂ y", "Mode", "Phase", "Confidence", "Recommendation"].map((head) => (
                          <TableCell
                            key={head}
                            sx={{
                              color: theme.palette.text.primary,
                              fontWeight: 900,
                              backgroundColor: "#EEF4FF",
                            }}
                          >
                            {head}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayRows.map((row, index) => {
                        const rowDate = row.createdAt ?? row.targetDate ?? row.date;
                        const rowPhase = row.phaseState ?? "--";
                        const rowConfidence = row.confidenceState ?? "--";
                        const rowRecommendation = row.recommendation ?? "--";

                        return (
                          <TableRow
                            key={`${row.id ?? rowDate ?? index}-${index}`}
                            sx={{
                              "&:nth-of-type(odd)": {
                                backgroundColor: alpha(theme.palette.primary.main, 0.025),
                              },
                            }}
                          >
                            <TableCell sx={{ color: theme.palette.text.primary, whiteSpace: "nowrap" }}>
                              {formatDate(rowDate)}
                            </TableCell>
                            <TableCell sx={{ color: theme.palette.text.primary, whiteSpace: "nowrap" }}>
                              {row.mode ? vi.mode[String(row.mode).toUpperCase()] ?? String(row.mode).toUpperCase() : "--"}
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={rowPhase}
                                sx={{ fontWeight: 800, ...stateChipSx(rowPhase, theme) }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={`${rowConfidence} Ã‚Â· ${formatPercent(row.confidenceScore)}`}
                                sx={{ fontWeight: 800, ...stateChipSx(rowConfidence, theme) }}
                              />
                            </TableCell>
                            <TableCell sx={{ color: theme.palette.text.primary, whiteSpace: "nowrap" }}>
                              {rowRecommendation}
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
                  ChÃ†Â°a cÃƒÂ³ bÃ¡ÂºÂ£n ghi lÃ¡Â»â€¹ch sÃ¡Â»Â­.
                </Box>
              )}
            </SystemSectionCard>
          </>
        )}
      </Stack>
    </Box>
  );
}
