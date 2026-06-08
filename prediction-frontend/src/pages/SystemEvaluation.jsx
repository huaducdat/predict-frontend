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

const HISTORY_SERIES = [
  { field: "confidenceScore", label: "Do tin cay", color: "#00c6ff" },
  { field: "stabilityScore", label: "Do on dinh", color: "#14b86a" },
  { field: "accuracyScore", label: "Do chinh xac", color: "#ff9f1c" },
];

const MODE_OPTIONS = [
  { value: "SHORT_TERM", label: "Ngan han" },
  { value: "EXTENDED", label: "Dai han" },
];

const MODE_LABELS = {
  SHORT_TERM: "Ngan han",
  LONG_TERM: "Dai han",
  EXTENDED: "Dai han",
};

const STATE_LABELS = {
  STABLE: "On dinh",
  VOLATILE: "Bien dong manh",
  SHIFTING: "Dang thay doi",
  TRANSITION: "Dang thay doi",
  PHASE_SHIFTING: "Dang thay doi",
  RECOVERING: "Dang phuc hoi",
  CHAOTIC: "Hon loan",
  UNKNOWN: "Chua xac dinh",
  HIGH_CONFIDENCE: "Do tin cay cao",
  MEDIUM_CONFIDENCE: "Do tin cay trung binh",
  LOW_CONFIDENCE: "Do tin cay thap",
  MEDIUM: "Trung binh",
  LOW: "Thap",
  DO_NOT_TRUST: "Khong nen tin",
};

const RECOMMENDATION_LABELS = {
  TRUST: "Co the tin",
  USE: "Co the dung",
  USE_SHORT_TERM: "Uu tien ngan han",
  USE_LONG_TERM: "Uu tien dai han",
  USE_EXTENDED: "Uu tien dai han",
  WATCH: "Can theo doi",
  MONITOR: "Can theo doi",
  WAIT: "Cho them du lieu",
  HOLD: "Tam giu",
  DO_NOT_TRUST: "Khong nen tin",
  UNKNOWN: "Chua xac dinh",
};

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

function labelFromMap(value, labels) {
  if (value === undefined || value === null || value === "") return "Chua xac dinh";
  const key = String(value).toUpperCase();
  return labels[key] ?? "Chua xac dinh";
}

function modeLabel(value) {
  return labelFromMap(value, MODE_LABELS);
}

function stateLabel(value) {
  return labelFromMap(value, STATE_LABELS);
}

function recommendationLabel(value) {
  return labelFromMap(value, RECOMMENDATION_LABELS);
}

function sanitizeBackendText(value, fallback = "Chua co du lieu hien thi.") {
  if (!value || typeof value !== "string") return fallback;

  return value
    .replaceAll("System Evaluation", "danh gia he thong")
    .replaceAll("summary", "tom tat")
    .replaceAll("from backend", "tu may chu")
    .replaceAll("backend", "may chu")
    .replaceAll("Recommendation Phase", "giai doan de xuat")
    .replaceAll("Recommendation", "De xuat")
    .replaceAll("Confidence", "Do tin cay")
    .replaceAll("Stability", "Do on dinh")
    .replaceAll("Accuracy", "Do chinh xac")
    .replaceAll("Recent Overlap", "Do trung lap gan day")
    .replaceAll("Active Overlap", "Do trung lap kich hoat")
    .replaceAll("Short Term", "Ngan han")
    .replaceAll("Long Term", "Dai han")
    .replaceAll("Stable", "On dinh")
    .replaceAll("Volatile", "Bien dong manh")
    .replaceAll("Unknown", "Chua xac dinh")
    .replaceAll(" is low", " thap")
    .replaceAll(" is stable", " on dinh")
    .replaceAll(" ready", " san sang");
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

  if (["SHIFTING", "RECOVERING", "MEDIUM", "MEDIUM_CONFIDENCE", "PHASE_SHIFTING", "TRANSITION"].includes(state)) {
    return {
      color: theme.palette.warning.dark,
      backgroundColor: alpha(theme.palette.warning.main, 0.17),
      border: `1px solid ${alpha(theme.palette.warning.main, 0.34)}`,
    };
  }

  if (["CHAOTIC", "LOW_CONFIDENCE", "LOW", "DO_NOT_TRUST", "VOLATILE"].includes(state)) {
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
          setError("Khong tai duoc du lieu danh gia he thong. Kiem tra may chu hoac ma dang nhap.");
        }
      }
    } catch (err) {
      console.error("Load system evaluation error:", err);
      if (mountedRef.current) {
        setError("Khong tai duoc du lieu danh gia he thong.");
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
        setError("Khong chay duoc danh gia he thong. Kiem tra du lieu du doan, ket qua va nhat ky may chu.");
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
  const summaryText = sanitizeBackendText(
    valueOrFallback(activeReport?.summaryText, recommendation?.summaryText),
    "Chua co tom tat he thong.",
  );
  const recommendationText = sanitizeBackendText(
    valueOrFallback(activeReport?.recommendationText, recommendation?.recommendationText),
    "De xuat ngan tu backend.",
  );

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
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 950,
                letterSpacing: 0,
                background: "linear-gradient(90deg, #00c6ff, #14b86a, #ff9f1c)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Danh gia he thong
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Tong hop do tin cay, do on dinh va de xuat van hanh tu may chu danh gia he thong.
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
              {running ? "Dang danh gia" : "Chay danh gia"}
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
              {loading ? "Dang tai" : "Lam moi"}
            </Button>
          </Stack>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}
        {notice && !error && <Alert severity="info">{notice}</Alert>}

        {loading && !activeReport ? (
          <SystemSectionCard title="Dang tai du lieu" subtitle="Dang tai du lieu danh gia he thong.">
            <Stack direction="row" spacing={1.2} sx={{ alignItems: "center" }}>
              <CircularProgress size={20} />
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Vui long doi trong giay lat.
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
                label="Do chinh xac"
                value={accuracyScore}
                subtitle="Do chinh xac thuc te gan nhat"
                icon={<AnalyticsRoundedIcon />}
              />
              <ScoreCard
                label="Diem danh gia"
                value={evaluationScore}
                subtitle="Diem danh gia tong hop"
                icon={<PsychologyAltRoundedIcon />}
              />
              <ScoreCard
                label="Do on dinh"
                value={stabilityScore}
                subtitle="Muc on dinh cua tin hieu"
                icon={<ShieldRoundedIcon />}
              />
              <ScoreCard
                label="Do tin cay"
                value={confidenceScore}
                subtitle="Do tin cay hien tai"
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
              <StateCard
                title="Giai doan de xuat"
                value={phaseState}
                formatValue={stateLabel}
                subtitle="Trang thai giai doan van hanh hien tai."
              />
              <StateCard
                title="Trang thai do tin cay"
                value={confidenceState}
                formatValue={stateLabel}
                subtitle="Phan loai muc do tin cay cua he thong."
              />
              <StateCard
                title="De xuat"
                value={recommendationCode}
                formatValue={recommendationLabel}
                subtitle={recommendationText}
              />
            </Box>

            <SystemSectionCard
              title="Tom tat he thong"
              subtitle={`Nguon moi nhat: ${formatDate(activeReport?.createdAt ?? activeReport?.targetDate)}`}
            >
              <Typography variant="body1" sx={{ lineHeight: 1.7, color: theme.palette.text.primary }}>
                {summaryText}
              </Typography>
            </SystemSectionCard>

            <SystemSectionCard
              title="Ly do"
              subtitle="Danh sach ly do da duoc xu ly de hien thi de doc."
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
                      <Typography variant="body2">{sanitizeBackendText(reason)}</Typography>
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
                  Chua co ly do cu the.
                </Box>
              )}
            </SystemSectionCard>

            <SystemSectionCard
              title="Lich su do tin cay, do on dinh va do chinh xac"
              subtitle="Nguon du lieu: lich su danh gia he thong gan nhat."
            >
              <MetricLineChart title="Lich su diem he thong" rows={historyRows} series={HISTORY_SERIES} />
            </SystemSectionCard>

            <SystemSectionCard title="Lich su" subtitle="20 ban ghi danh gia he thong gan nhat.">
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
                        {["Ngay", "Che do", "Giai doan", "Do tin cay", "De xuat"].map((head) => (
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
                        const rowPhase = row.phaseState;
                        const rowConfidence = row.confidenceState;
                        const rowRecommendation = row.recommendation;

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
                              {modeLabel(row.mode)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={stateLabel(rowPhase)}
                                sx={{ fontWeight: 800, ...stateChipSx(rowPhase, theme) }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={`${stateLabel(rowConfidence)} - ${formatPercent(row.confidenceScore)}`}
                                sx={{ fontWeight: 800, ...stateChipSx(rowConfidence, theme) }}
                              />
                            </TableCell>
                            <TableCell sx={{ color: theme.palette.text.primary, whiteSpace: "nowrap" }}>
                              {recommendationLabel(rowRecommendation)}
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
                  Chua co ban ghi lich su.
                </Box>
              )}
            </SystemSectionCard>
          </>
        )}
      </Stack>
    </Box>
  );
}
