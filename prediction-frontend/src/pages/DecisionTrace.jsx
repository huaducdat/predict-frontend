import { useEffect, useMemo, useRef, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";

import {
  getLatestDecisionTrace,
  getRecentDecisionTrace,
} from "../api/decisionTraceApi";
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

function OverviewItem({ icon, label, value }) {
  const theme = useTheme();

  return (
    <Stack
      spacing={1}
      sx={{
        p: 1.6,
        borderRadius: 2,
        minHeight: 112,
        border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
        backgroundColor: alpha(theme.palette.common.white, 0.045),
      }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: 2,
          display: "grid",
          placeItems: "center",
          color: "white",
          background: "linear-gradient(135deg, #00c6ff, #14b86a)",
        }}
      >
        {icon}
      </Box>
      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.56)" }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ color: "white", fontWeight: 900 }}>
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
        getLatestDecisionTrace(),
        getRecentDecisionTrace(20),
      ]);

      const latestTrace =
        latestResult.status === "fulfilled" ? normalizePayload(latestResult.value) : null;
      const recentTrace =
        recentResult.status === "fulfilled" ? normalizeList(recentResult.value) : [];

      if (mountedRef.current) {
        setLatest(hasTraceData(latestTrace) ? latestTrace : null);
        setRecent(Array.isArray(recentTrace) ? recentTrace : []);

        if (!hasTraceData(latestTrace) && !recentTrace.length) {
          setNotice("Chưa có dữ liệu luồng quyết định.");
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
    // imported API functions are stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeTrace = latest ?? (recent.length > 0 ? recent[0] : null);
  const recentRows = useMemo(() => (recent.length > 0 ? recent : activeTrace ? [activeTrace] : []), [
    activeTrace,
    recent,
  ]);

  const patternState = activeTrace?.patternState ?? activeTrace?.patternDecision?.state;
  const boostCap = activeTrace?.boostDecision?.boostCapUsed;

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
            "radial-gradient(circle at 12% 0%, rgba(0,198,255,0.15), transparent 28%), radial-gradient(circle at 86% 12%, rgba(20,184,106,0.13), transparent 30%), radial-gradient(circle at 52% 100%, rgba(255,159,28,0.12), transparent 34%)",
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
                letterSpacing: 0,
                background: "linear-gradient(90deg, #00c6ff, #14b86a, #ff9f1c)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Luồng quyết định
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.68)" }}>
              Theo dõi cách hệ thống điều chỉnh mẫu, trọng số và tăng cường trong lần dự đoán gần nhất.
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
              background: "linear-gradient(135deg, #00c6ff, #14b86a)",
            }}
          >
            {loading ? "Đang tải" : "Làm mới"}
          </Button>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}
        {notice && !error && <Alert severity="info">{notice}</Alert>}

        {loading && !activeTrace ? (
          <SystemSectionCard title="Đang tải dữ liệu" subtitle="Đang gọi API luồng quyết định.">
            <Stack direction="row" alignItems="center" spacing={1.2}>
              <CircularProgress size={20} />
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.72)" }}>
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
                    color: theme.palette.info.light,
                    backgroundColor: alpha(theme.palette.info.main, 0.16),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.32)}`,
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
                  label="Trạng thái mẫu"
                  value={translatePatternState(patternState)}
                />
                <OverviewItem
                  icon={<TuneRoundedIcon />}
                  label="Chế độ"
                  value={translateMode(activeTrace?.mode)}
                />
                <OverviewItem
                  icon={<AccountTreeRoundedIcon />}
                  label="Ngày dự đoán / mục tiêu"
                  value={`${formatDate(activeTrace?.predictionDate)} / ${formatDate(activeTrace?.targetDate)}`}
                />
                <OverviewItem
                  icon={<BoltRoundedIcon />}
                  label="Giới hạn tăng cường đang dùng"
                  value={formatFactor(boostCap)}
                />
              </Box>

              <Box
                sx={{
                  p: 1.4,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
                  backgroundColor: alpha(theme.palette.common.white, 0.04),
                }}
              >
                <Typography variant="subtitle2" sx={{ color: "rgba(255,255,255,0.62)", mb: 0.5 }}>
                  Tóm tắt
                </Typography>
                <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.84)", lineHeight: 1.65 }}>
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
