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
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";

import { getLatestDecisionTrace, getRecentDecisionTrace } from "../api/decisionTraceApi";
import BoostDecisionCard from "../components/decision-trace/BoostDecisionCard";
import NumberContributionTable from "../components/decision-trace/NumberContributionTable";
import PatternDecisionCard from "../components/decision-trace/PatternDecisionCard";
import RecentDecisionTrace from "../components/decision-trace/RecentDecisionTrace";
import WeightDecisionTable from "../components/decision-trace/WeightDecisionTable";
import {
  formatDate,
  formatFactor,
  translateMode,
  translatePatternState,
} from "../components/decision-trace/format";
import SystemSectionCard from "../components/systemEvaluation/SystemSectionCard";

const MODE_OPTIONS = [
  { value: "SHORT_TERM", label: "Ngắn hạn" },
  { value: "EXTENDED", label: "Dài hạn" },
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

function hasTraceData(trace) {
  if (!trace || typeof trace !== "object") return false;
  return Boolean(
    trace.id ||
      trace.patternDecision ||
      trace.weightDecisions?.length ||
      trace.topNumberContributions?.length ||
      trace.boostDecision,
  );
}

function OverviewItem({ icon, label, value, accent = false }) {
  const theme = useTheme();

  return (
    <Stack
      spacing={1}
      sx={{
        p: 1.6,
        borderRadius: 3,
        minHeight: 112,
        border: `1px solid ${accent ? alpha(theme.palette.primary.main, 0.24) : theme.palette.divider}`,
        backgroundColor: accent ? alpha(theme.palette.primary.main, 0.08) : "#F8FAFC",
      }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: 2,
          display: "grid",
          placeItems: "center",
          color: accent ? theme.palette.primary.dark : theme.palette.text.secondary,
          background: accent ? alpha(theme.palette.primary.main, 0.12) : "#EEF4FF",
        }}
      >
        {icon}
      </Box>
      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ color: theme.palette.text.primary, fontWeight: 900 }}>
        {value || "Chưa có dữ liệu"}
      </Typography>
    </Stack>
  );
}

export default function DecisionTrace() {
  const theme = useTheme();
  const mountedRef = useRef(true);
  const [latest, setLatest] = useState(null);
  const [recent, setRecent] = useState([]);
  const [mode, setMode] = useState("SHORT_TERM");
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
      const [latestResult, recentResult] = await Promise.allSettled([
        getLatestDecisionTrace(mode),
        getRecentDecisionTrace(20, mode),
      ]);

      const latestTrace = latestResult.status === "fulfilled" ? normalizePayload(latestResult.value) : null;
      const recentTrace = recentResult.status === "fulfilled" ? normalizeList(recentResult.value) : [];

      if (mountedRef.current) {
        setLatest(hasTraceData(latestTrace) ? latestTrace : null);
        setRecent(Array.isArray(recentTrace) ? recentTrace : []);

        if (!hasTraceData(latestTrace) && !recentTrace.length) {
          setNotice("Chưa có dữ liệu luồng quyết định cho mode này.");
        }

        if (latestResult.status === "rejected" && recentResult.status === "rejected") {
          setError("Không tải được dữ liệu luồng quyết định. Kiểm tra backend hoặc token đăng nhập.");
        }
      }
    } catch (err) {
      console.error("Load decision trace error:", err);
      if (mountedRef.current) {
        setError("Không tải được dữ liệu luồng quyết định.");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const activeTrace = latest ?? (recent.length > 0 ? recent[0] : null);
  const recentRows = useMemo(() => (recent.length > 0 ? recent : activeTrace ? [activeTrace] : []), [
    activeTrace,
    recent,
  ]);
  const patternState = activeTrace?.patternState ?? activeTrace?.patternDecision?.state;
  const boostCap = activeTrace?.boostDecision?.boostCapUsed;

  return (
    <Box sx={{ minHeight: "100vh", p: { xs: 1.5, md: 3 } }}>
      <Stack spacing={2.4} sx={{ maxWidth: 1500, mx: "auto" }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ color: "#0F172A", fontWeight: 950 }}>
              Luồng quyết định
            </Typography>
            <Typography variant="body2" sx={{ color: "#475569", maxWidth: 760 }}>
              Trang này cho biết vì sao hệ thống tăng/giảm weight của từng predictor trong từng mode dự đoán.
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ alignItems: { xs: "stretch", sm: "center" } }}>
            <Tabs
              value={mode}
              onChange={(_, value) => setMode(value)}
              sx={{
                minHeight: 40,
                "& .MuiTab-root": { minHeight: 40, textTransform: "none", fontWeight: 800 },
              }}
            >
              {MODE_OPTIONS.map((item) => (
                <Tab key={item.value} value={item.value} label={item.label} />
              ))}
            </Tabs>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshRoundedIcon />}
              onClick={loadData}
              disabled={loading}
              sx={{ textTransform: "none", borderRadius: 999, px: 2.4 }}
            >
              {loading ? "Đang tải" : "Làm mới"}
            </Button>
          </Stack>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}
        {notice && !error && <Alert severity="info">{notice}</Alert>}

        {loading && !activeTrace ? (
          <SystemSectionCard title="Đang tải dữ liệu" subtitle="Đang gọi API luồng quyết định theo mode đã chọn.">
            <Stack direction="row" spacing={1.2} sx={{ alignItems: "center" }}>
              <CircularProgress size={20} />
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Vui lòng đợi trong giây lát.
              </Typography>
            </Stack>
          </SystemSectionCard>
        ) : (
          <>
            <SystemSectionCard
              title="Tổng quan quyết định"
              subtitle={`Nguồn mới nhất: ${formatDate(activeTrace?.createdAt ?? activeTrace?.targetDate)}`}
              action={
                <Chip
                  label={translatePatternState(patternState)}
                  sx={{
                    color: theme.palette.primary.dark,
                    backgroundColor: alpha(theme.palette.primary.main, 0.12),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.26)}`,
                    fontWeight: 900,
                  }}
                />
              }
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" },
                  gap: 1.3,
                }}
              >
                <OverviewItem
                  icon={<AccountTreeRoundedIcon />}
                  label="Trạng thái pattern"
                  value={translatePatternState(patternState)}
                  accent
                />
                <OverviewItem icon={<TuneRoundedIcon />} label="Chế độ" value={translateMode(activeTrace?.mode)} />
                <OverviewItem
                  icon={<AccountTreeRoundedIcon />}
                  label="Ngày dự đoán / mục tiêu"
                  value={`${formatDate(activeTrace?.predictionDate)} / ${formatDate(activeTrace?.targetDate)}`}
                />
                <OverviewItem icon={<BoltRoundedIcon />} label="Boost cap đang dùng" value={formatFactor(boostCap)} />
              </Box>

              <Box
                sx={{
                  p: 1.6,
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: "#F8FAFC",
                }}
              >
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, mb: 0.5 }}>
                  Tóm tắt
                </Typography>
                <Typography variant="body1" sx={{ color: theme.palette.text.primary, lineHeight: 1.65 }}>
                  {activeTrace?.summary || "Chưa có dữ liệu"}
                </Typography>
              </Box>
            </SystemSectionCard>

            <PatternDecisionCard data={activeTrace?.patternDecision} />
            <WeightDecisionTable rows={activeTrace?.weightDecisions} />
            <BoostDecisionCard data={activeTrace?.boostDecision} />
            <NumberContributionTable rows={activeTrace?.topNumberContributions} />
            <RecentDecisionTrace rows={recentRows} fallback={activeTrace} />
          </>
        )}
      </Stack>
    </Box>
  );
}
