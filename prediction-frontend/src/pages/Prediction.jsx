import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";

import { getLatestModeRecommendation, loadCombine, runAllCombine } from "../api/combineApi";
import { getLatestDecisionTrace } from "../api/decisionTraceApi";
import { getLatestPatternReport } from "../api/patternApi";
import { loadPredict } from "../api/predictApi";
import PatternDecisionCard from "../components/decision-trace/PatternDecisionCard";
import WeightDecisionTable from "../components/decision-trace/WeightDecisionTable";
import BoostDecisionCard from "../components/decision-trace/BoostDecisionCard";
import NumberContributionTable from "../components/decision-trace/NumberContributionTable";
import PairCard from "../components/PairCard";
import GapCard from "../components/GapCard";
import RepeatCard from "../components/RepeatCard";
import StreakCard from "../components/StreakCard";
import RecentFrequencyCard from "../components/RecentFrequencyCard";
import TimeWeightMapCard from "../components/TimeWeightMapCard";
import PredictionSourceResultCard from "../components/PredictionSourceResultCard";
import TimeWeightGlobalCard from "../components/TimeWeightGlobalCard";
import PairGlobalCard from "../components/PairGlobalCard";
import PositionCard from "../components/PositionCard";
import { vi } from "../i18n/vi";

const MODE_OPTIONS = [
  { value: "SHORT_TERM", label: "Ngắn hạn" },
  { value: "EXTENDED", label: "Dài hạn" },
];

const RECOMMENDATION_LABELS = {
  SHORT_TERM: "Ngắn hạn",
  EXTENDED: "Dài hạn",
  LONG_TERM: "Dài hạn",
  INTERSECTION: "Vùng giao nhau",
  OBSERVE_ONLY: "Chỉ quan sát",
};

const CONFIDENCE_LABELS = {
  HIGH: "Cao",
  MEDIUM: "Trung bình",
  LOW: "Thấp",
};

const RISK_LABELS = {
  LOW: "Thấp",
  MEDIUM: "Trung bình",
  HIGH: "Cao",
};

const SURFACE_CARD_SX = {
  p: 2.4,
  borderRadius: 3,
  background: "rgba(255,255,255,0.94)",
  color: "#0F172A",
  borderColor: "#E2E8F0",
  boxShadow: "0 18px 46px rgba(15,23,42,0.08)",
};

const PRIMARY_CARD_SX = {
  ...SURFACE_CARD_SX,
  borderColor: "rgba(37,99,235,0.24)",
  background: "linear-gradient(145deg, #FFFFFF, #EEF4FF)",
};

const MUTED_TEXT_SX = { color: "#475569" };

function numberChipSx(accent = false) {
  return {
    fontWeight: 900,
    fontFamily: "'Courier New', monospace",
    fontSize: accent ? 18 : 14,
    color: accent ? "#1D4ED8" : "#0F172A",
    backgroundColor: accent ? "rgba(37,99,235,0.10)" : "#F8FAFC",
    border: "1px solid #E2E8F0",
    minHeight: accent ? 42 : 32,
  };
}

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

function modeLabel(value) {
  const normalized = String(value || "").toUpperCase();
  return vi.mode[normalized] || value || "--";
}

function recommendationLabel(value) {
  const normalized = String(value || "").toUpperCase();
  return RECOMMENDATION_LABELS[normalized] || value || "--";
}

function confidenceLabel(value) {
  const normalized = String(value || "").toUpperCase();
  return CONFIDENCE_LABELS[normalized] || value || "--";
}

function riskLabel(value) {
  const normalized = String(value || "").toUpperCase();
  return RISK_LABELS[normalized] || value || "--";
}

function percentScore(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "--";
  return `${numeric.toFixed(1)}/100`;
}

function numberSet(rows) {
  return new Set((rows || []).map((item) => Number(item?.number)).filter((n) => Number.isFinite(n)));
}

function topNumbers(rows, limit = 10) {
  return (rows || []).slice(0, limit);
}

function isTraceUsable(trace) {
  if (!trace || typeof trace !== "object") return false;
  return Boolean(trace.id || trace.summary || trace.patternDecision || trace.weightDecisions?.length);
}

function ModeBundleCard({ bundle }) {
  const top = topNumbers(bundle?.combinedPrediction, 10);
  const summary = bundle?.summary || bundle?.decisionTrace?.summary || "Chưa có dữ liệu";

  if (!bundle || top.length === 0) {
    return (
      <Paper variant="outlined" sx={SURFACE_CARD_SX}>
        <Typography sx={MUTED_TEXT_SX}>
          Chưa có dữ liệu dự đoán. Hãy bấm Chạy dự đoán để bắt đầu.
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={2}>
      <Paper
        variant="outlined"
        sx={PRIMARY_CARD_SX}
      >
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <Chip label={modeLabel(bundle?.mode)} sx={{ fontWeight: 800 }} />
            <Chip
              label={bundle?.patternState ? String(bundle.patternState).toUpperCase() : "INSUFFICIENT_DATA"}
              sx={{ fontWeight: 800 }}
            />
            {bundle?.snapshotId && <Chip label={`Snapshot #${bundle.snapshotId}`} />}
          </Stack>

          <Typography variant="body1" sx={{ lineHeight: 1.65 }}>
            {summary}
          </Typography>

          {top.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {top.map((item, index) => (
                <Chip
                  key={`${item.number}-${index}`}
                  label={`${String(item.number).padStart(2, "0")} · ${Number(item.score * 100).toFixed(2)}%`}
                  sx={numberChipSx(true)}
                />
              ))}
            </Box>
          )}
        </Stack>
      </Paper>

      <Paper
        variant="outlined"
        sx={SURFACE_CARD_SX}
      >
        <Stack spacing={1.8}>
          <Stack direction="row" gap={1} sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Luồng quyết định
              </Typography>
              <Typography variant="body2" sx={MUTED_TEXT_SX}>
                Luồng quyết định của mode đang xem
              </Typography>
            </Box>
            <Chip label={bundle?.decisionTrace?.patternState || bundle?.patternState || "INSUFFICIENT_DATA"} />
          </Stack>

          <PatternDecisionCard data={bundle?.decisionTrace?.patternDecision} />
          <WeightDecisionTable rows={bundle?.decisionTrace?.weightDecisions} />
          <BoostDecisionCard data={bundle?.decisionTrace?.boostDecision} />
          <NumberContributionTable rows={bundle?.decisionTrace?.topNumberContributions} />
        </Stack>
      </Paper>
    </Stack>
  );
}

function CompareCard({ shortTerm, longTerm }) {
  const shared = useMemo(() => {
    const left = numberSet(topNumbers(shortTerm?.combinedPrediction, 10));
    const right = numberSet(topNumbers(longTerm?.combinedPrediction, 10));
    return [...left].filter((value) => right.has(value)).sort((a, b) => a - b);
  }, [shortTerm, longTerm]);

  return (
    <Paper
      variant="outlined"
      sx={SURFACE_CARD_SX}
    >
      <Stack spacing={1.5}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Giao nhau top 10 giữa hai mode
            </Typography>
            <Typography variant="body2" sx={MUTED_TEXT_SX}>
              Chỉ lấy các số xuất hiện trong top 10 của cả Ngắn hạn và Dài hạn.
            </Typography>
          </Box>

        {shared.length > 0 ? (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {shared.map((value) => (
              <Chip key={value} label={String(value).padStart(2, "0")} sx={{ fontWeight: 800 }} />
            ))}
          </Box>
        ) : (
          <Typography variant="body1">Chưa có số giao nhau giữa hai mode.</Typography>
        )}
      </Stack>
    </Paper>
  );
}

function ModeRecommendationCard({ recommendation }) {
  if (!recommendation) {
    return (
      <Paper
        variant="outlined"
        sx={PRIMARY_CARD_SX}
      >
        <Typography variant="h6" sx={{ fontWeight: 900 }}>
          Gợi ý cho kỳ tiếp theo
        </Typography>
        <Typography sx={{ mt: 1, ...MUTED_TEXT_SX }}>
          Chưa có đủ dữ liệu để dựng khuyến nghị.
        </Typography>
      </Paper>
    );
  }

  const intersectionNumbers = Array.isArray(recommendation.intersectionNumbers)
    ? recommendation.intersectionNumbers
    : [];
  const reasons = Array.isArray(recommendation.reasons) ? recommendation.reasons : [];

  return (
    <Paper
      variant="outlined"
      sx={PRIMARY_CARD_SX}
    >
      <Stack spacing={1.6}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Gợi ý cho kỳ tiếp theo
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.4, ...MUTED_TEXT_SX }}>
            {recommendation.summary || "Chưa có tóm tắt khuyến nghị."}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <Chip
            label={`Khuyến nghị: ${recommendationLabel(recommendation.recommendedMode)}`}
            sx={{ fontWeight: 900 }}
          />
          <Chip label={`Tin cậy: ${confidenceLabel(recommendation.confidenceLevel)}`} />
          <Chip label={`Rủi ro: ${riskLabel(recommendation.riskLevel)}`} />
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
          <Chip label={`Ngắn hạn: ${percentScore(recommendation.shortTermScore)}`} />
          <Chip label={`Dài hạn: ${percentScore(recommendation.longTermScore)}`} />
          <Chip label={`Giao nhau: ${percentScore(recommendation.intersectionScore)}`} />
        </Stack>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 0.8, fontWeight: 800 }}>
            Số giao nhau
          </Typography>
          {intersectionNumbers.length > 0 ? (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {intersectionNumbers.map((value) => (
                <Chip key={value} label={String(value).padStart(2, "0")} sx={{ fontWeight: 800 }} />
              ))}
            </Box>
          ) : (
            <Typography variant="body2" sx={MUTED_TEXT_SX}>
              Chưa có số giao nhau giữa hai mode.
            </Typography>
          )}
        </Box>

        {reasons.length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.8, fontWeight: 800 }}>
              Lý do
            </Typography>
            <Stack spacing={0.7}>
              {reasons.map((reason, index) => (
                <Typography
                  key={`${reason}-${index}`}
                  variant="body2"
                  sx={MUTED_TEXT_SX}
                >
                  {reason}
                </Typography>
              ))}
            </Stack>
          </Box>
        )}

        {recommendation.warning && (
          <Alert severity="warning" sx={{ alignItems: "center" }}>
            {recommendation.warning}
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}

function Prediction() {
  const [selectedMode, setSelectedMode] = useState("SHORT_TERM");
  const [sourceData, setSourceData] = useState(null);
  const [sourceMeta, setSourceMeta] = useState(null);
  const [bundles, setBundles] = useState({ SHORT_TERM: null, EXTENDED: null });
  const [modeRecommendation, setModeRecommendation] = useState(null);
  const [loadingSource, setLoadingSource] = useState(false);
  const [loadingBundles, setLoadingBundles] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const activeBundle = bundles[selectedMode];

  const loadSource = async (mode) => {
    try {
      setLoadingSource(true);
      const res = await loadPredict(mode);
      setSourceData(res?.data ?? null);
      setSourceMeta(res || null);
    } catch (e) {
      console.error("Load source prediction failed:", e);
    } finally {
      setLoadingSource(false);
    }
  };

  const loadBundle = async (mode) => {
    const [combineRes, traceRes, patternRes] = await Promise.allSettled([
      loadCombine(mode),
      getLatestDecisionTrace(mode),
      getLatestPatternReport(mode),
    ]);

    const combinedPrediction =
      combineRes.status === "fulfilled" ? normalizeList(combineRes.value) : [];
    const decisionTrace =
      traceRes.status === "fulfilled" ? normalizePayload(traceRes.value) : null;
    const patternReport =
      patternRes.status === "fulfilled" ? normalizePayload(patternRes.value) : null;

    return {
      mode,
      combinedPrediction,
      decisionTrace: isTraceUsable(decisionTrace) ? decisionTrace : null,
      patternState:
        decisionTrace?.patternState ||
        decisionTrace?.patternDecision?.state ||
        patternReport?.state ||
        "INSUFFICIENT_DATA",
      summary: decisionTrace?.summary || patternReport?.summary || "Chưa có dữ liệu",
      snapshotId: decisionTrace?.id || null,
    };
  };

  const loadBundles = async () => {
    try {
      setLoadingBundles(true);
      const [shortTerm, longTerm, recommendationRes] = await Promise.allSettled([
        loadBundle("SHORT_TERM"),
        loadBundle("EXTENDED"),
        getLatestModeRecommendation(),
      ]);
      setBundles({
        SHORT_TERM: shortTerm.status === "fulfilled" ? shortTerm.value : null,
        EXTENDED: longTerm.status === "fulfilled" ? longTerm.value : null,
      });
      setModeRecommendation(
        recommendationRes.status === "fulfilled" ? normalizePayload(recommendationRes.value) : null
      );
    } catch (e) {
      console.error("Load bundles failed:", e);
      setError("Không tải được dữ liệu dự đoán theo mode.");
    } finally {
      setLoadingBundles(false);
    }
  };

  const loadPage = async () => {
    await loadBundles();
  };

  const handleRunAll = async () => {
    try {
      setRunning(true);
      setError("");
      const res = await runAllCombine();
      setBundles({
        SHORT_TERM: res?.shortTerm ?? null,
        EXTENDED: res?.longTerm ?? null,
      });
      setModeRecommendation(res?.modeRecommendation ?? null);
      await loadSource(selectedMode);
    } catch (e) {
      console.error("Run all combine failed:", e);
      setError("Chạy dự đoán thất bại.");
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    void loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadSource(selectedMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMode]);

  const positionData = sourceData?.POSITION;
  const gapData = sourceData?.GAP;
  const pairData = sourceData?.PAIR_TO_NEXT;
  const recentFreq = sourceData?.RECENT_FREQUENCY;
  const repeatData = sourceData?.REPEAT;
  const streakData = sourceData?.STREAK_CONTINUE;
  const timeweightData = sourceData?.TIME_WEIGHTED_COUNT;
  const isOld =
    sourceMeta && new Date(sourceMeta.date).toDateString() !== new Date().toDateString();

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={2.5}>
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
                mb: 0.5,
                fontWeight: 950,
                background: "linear-gradient(90deg, #00c6ff, #14b86a, #ff9f1c)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {vi.prediction.title}
            </Typography>
            <Typography sx={MUTED_TEXT_SX}>
              Bấm một lần để chạy cả hai mode và xem kết quả theo tab.
            </Typography>
          </Box>

          <Stack spacing={0.7} sx={{ alignItems: { xs: "stretch", md: "flex-end" } }}>
            <Button
              variant="contained"
              onClick={handleRunAll}
              disabled={running}
              sx={{ textTransform: "none" }}
            >
              {running ? "Đang chạy cả hai mode..." : "Chạy dự đoán"}
            </Button>
            <Typography variant="body2" sx={{ ...MUTED_TEXT_SX, maxWidth: 280 }}>
              Chạy một lần để tạo cả dự đoán Ngắn hạn và Dài hạn.
            </Typography>
          </Stack>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        <Paper
          sx={{
            ...SURFACE_CARD_SX,
            p: 2.4,
          }}
        >
          <Stack spacing={1.5}>
            <Tabs
              value={selectedMode}
              onChange={(_, value) => setSelectedMode(value)}
              textColor="inherit"
              indicatorColor="secondary"
              sx={{
                "& .MuiTab-root": { textTransform: "none", fontWeight: 800 },
              }}
            >
              {MODE_OPTIONS.map((item) => (
                <Tab key={item.value} value={item.value} label={item.label} />
              ))}
            </Tabs>

            {loadingBundles && !activeBundle && (
              <Stack direction="row" spacing={1} sx={{ py: 1, alignItems: "center" }}>
                <CircularProgress size={18} />
                <Typography variant="body2">Đang chạy cả hai mode...</Typography>
              </Stack>
            )}

            <ModeBundleCard bundle={activeBundle} />
          </Stack>
        </Paper>

        <CompareCard shortTerm={bundles.SHORT_TERM} longTerm={bundles.EXTENDED} />

        <ModeRecommendationCard recommendation={modeRecommendation} />

        <Paper
          sx={{
            ...SURFACE_CARD_SX,
            p: 2.4,
          }}
        >
          <Stack spacing={1.5}>
            <Stack direction="row" gap={1} sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  Nguồn dự đoán thô
                </Typography>
                <Typography variant="body2" sx={MUTED_TEXT_SX}>
                  {sourceMeta
                    ? `${vi.common.date}: ${sourceMeta.date} | ${new Date(sourceMeta.createdAt).toLocaleString("vi-VN")}${
                        isOld ? ` - ${vi.prediction.oldData}` : ""
                      }`
                    : "Chưa có dữ liệu nguồn."}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Chip label={modeLabel(selectedMode)} />
                {(loadingSource || running) && <CircularProgress size={18} />}
              </Stack>
            </Stack>

            {sourceMeta && <PredictionSourceResultCard date={sourceMeta.date} />}

            {!sourceData && !loadingSource ? (
              <Typography sx={MUTED_TEXT_SX}>
                {vi.prediction.noData}
              </Typography>
            ) : (
              <>
                <RecentFrequencyCard data={recentFreq} />
                <Divider sx={{ my: 2, borderColor: "#E2E8F0" }} />
                <PairGlobalCard />
                <Divider sx={{ my: 2, borderColor: "#E2E8F0" }} />
                <PairCard data={pairData?.["-1"]} />
                <Divider sx={{ my: 2, borderColor: "#E2E8F0" }} />
                <TimeWeightGlobalCard date={sourceMeta?.date} />
                <Divider sx={{ my: 2, borderColor: "#E2E8F0" }} />
                <TimeWeightMapCard data={timeweightData} />
                <Divider sx={{ my: 2, borderColor: "#E2E8F0" }} />
                <StreakCard data={streakData} />
                <Divider sx={{ my: 2, borderColor: "#E2E8F0" }} />
                <RepeatCard data={repeatData} />
                <Divider sx={{ my: 2, borderColor: "#E2E8F0" }} />
                <GapCard data={gapData} />
                <Divider sx={{ my: 2, borderColor: "#E2E8F0" }} />
                <PositionCard data={positionData} />
              </>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}

export default Prediction;
