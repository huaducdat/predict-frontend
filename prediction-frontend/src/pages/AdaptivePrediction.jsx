import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import {
  getAdaptiveExplanationLatest,
  getAdaptiveLatest,
  runAdaptivePrediction,
} from "../api/adaptivePredictionApi";
import {
  AdaptiveNumberPill,
  AdaptivePageHeader,
  AdaptiveSection,
} from "../components/adaptive/AdaptiveUi";
import {
  formatAdaptiveDate,
  formatAdaptivePercent,
  parseAdaptiveJson,
} from "../components/adaptive/adaptiveFormatters";

const SURFACE_SX = {
  border: "1px solid #D6E1EA",
  borderRadius: 2,
  background: "#FFFFFF",
  boxShadow: "0 14px 36px rgba(15,23,42,0.06)",
};

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "--";
  return Math.abs(number) < 1 ? number.toFixed(6) : number.toFixed(4);
}

function formatCount(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : "--";
}

function friendlyError(err, fallback) {
  const status = err?.response?.status;
  const message = err?.response?.data?.message || err?.response?.data || err?.message;
  if (status === 504 || /timeout/i.test(String(message || ""))) {
    return "Adaptive request timed out. Please refresh in a moment.";
  }
  if (status >= 500) return "Adaptive backend failed while processing the request.";
  if (message === "ADAPTIVE_NOT_ENOUGH_RESULT_HISTORY") return "Not enough result history to run Adaptive Prediction.";
  return typeof message === "string" && message.trim() ? message : fallback;
}

function normalizeSnapshot(value) {
  return value && typeof value === "object" && Object.keys(value).length ? value : null;
}

function getInfluenceSummary(snapshot) {
  return parseAdaptiveJson(snapshot?.influenceSummaryJson, {});
}

function CurrentTop10({ top10, snapshot, explanation }) {
  const risks = asArray(explanation?.riskFlags);

  return (
    <AdaptiveSection
      title="Current Adaptive Top10"
      action={<Chip label={explanation?.phase ?? "PHASE_UNKNOWN"} sx={{ bgcolor: "#D1FAE5", color: "#065F46", fontWeight: 950 }} />}
    >
      <Stack spacing={1.8}>
        {!top10.length ? (
          <Alert severity="info">No adaptive ranking is available yet. Run Adaptive Prediction to generate a snapshot.</Alert>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(5, minmax(0, 1fr))", sm: "repeat(10, minmax(0, 1fr))" }, gap: 1 }}>
            {top10.map((item, index) => (
              <Box
                key={`${item.number}-${item.rank ?? index}`}
                sx={{
                  minHeight: 86,
                  p: 1,
                  borderRadius: 2,
                  border: "1px solid #BFDBFE",
                  background: index < 3 ? "#EFF6FF" : "#F8FAFC",
                  textAlign: "center",
                }}
              >
                <Typography sx={{ color: "#64748B", fontSize: 11, fontWeight: 950 }}>
                  #{item.rank ?? index + 1}
                </Typography>
                <Box sx={{ mt: 0.8 }}>
                  <AdaptiveNumberPill item={item} />
                </Box>
                <Typography sx={{ mt: 0.6, color: "#475569", fontSize: 11, fontWeight: 850 }}>
                  {formatScore(item.score)}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
          <Chip label={`Prediction ${formatAdaptiveDate(snapshot?.predictionDate)}`} />
          <Chip label={`Target ${formatAdaptiveDate(snapshot?.targetDate)}`} />
          <Chip label={`Confidence ${formatAdaptivePercent(explanation?.adaptiveConfidence)}`} />
          <Chip label={`Strongest ${explanation?.strongestVariant ?? "--"}`} />
        </Stack>

        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
          {(risks.length ? risks : ["no_risk_flags"]).map((risk) => (
            <Chip
              key={risk}
              size="small"
              label={risk}
              sx={{ bgcolor: risk === "no_risk_flags" ? "#F1F5F9" : "#FEF3C7", fontWeight: 900 }}
            />
          ))}
        </Stack>
      </Stack>
    </AdaptiveSection>
  );
}

function AdaptiveStatusPanel({ snapshot, top10, explanation, influenceSummary }) {
  const topCandidate = top10[0]?.number ?? "--";
  const candidateCount = top10.length || formatCount(influenceSummary?.top10Generated);
  const rankingGenerated = Boolean(top10.length || explanation?.rankingImplemented || influenceSummary?.rankingImplemented);

  return (
    <AdaptiveSection title="Adaptive Status">
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(5, minmax(0, 1fr))" }, gap: 1.2 }}>
        {[
          ["Top candidate", topCandidate],
          ["Candidate count", candidateCount],
          ["Snapshot date", formatAdaptiveDate(snapshot?.predictionDate)],
          ["Current phase", explanation?.phase ?? influenceSummary?.phase ?? "--"],
          ["Ranking generated", rankingGenerated ? "Yes" : "No"],
        ].map(([label, value]) => (
          <Box key={label} sx={{ ...SURFACE_SX, p: 1.5, minHeight: 92 }}>
            <Typography sx={{ color: "#64748B", fontSize: 12, fontWeight: 950, textTransform: "uppercase" }}>
              {label}
            </Typography>
            <Typography sx={{ mt: 1, color: "#0F172A", fontSize: 20, fontWeight: 950, overflowWrap: "anywhere" }}>
              {value ?? "--"}
            </Typography>
          </Box>
        ))}
      </Box>
    </AdaptiveSection>
  );
}

function InfluenceSummary({ influenceSummary, explanation }) {
  const rows = [
    ["Active variant signals", influenceSummary?.activeVariantSignals],
    ["Pair influence", influenceSummary?.pairInfluence],
    ["Adaptive confidence", formatAdaptivePercent(influenceSummary?.adaptiveConfidence ?? explanation?.adaptiveConfidence)],
    ["Adaptive entropy", formatScore(influenceSummary?.adaptiveEntropy ?? explanation?.adaptiveEntropy)],
    ["Adaptive concentration", formatScore(influenceSummary?.adaptiveConcentration ?? explanation?.adaptiveConcentration)],
  ];

  return (
    <AdaptiveSection title="Influence Summary">
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(5, minmax(0, 1fr))" }, gap: 1 }}>
        {rows.map(([label, value]) => (
          <Box key={label} sx={{ border: "1px solid #E2E8F0", borderRadius: 2, p: 1.4 }}>
            <Typography sx={{ color: "#64748B", fontSize: 12, fontWeight: 900 }}>{label}</Typography>
            <Typography sx={{ mt: 0.8, color: "#0F172A", fontWeight: 950 }}>{value ?? "--"}</Typography>
          </Box>
        ))}
      </Box>
    </AdaptiveSection>
  );
}

function RankingExplanation({ explanation }) {
  const rows = asArray(explanation?.top10Explanations);

  return (
    <AdaptiveSection title="Current Ranking and Explanation">
      {!rows.length ? (
        <Alert severity="info">No ranking explanation is available yet.</Alert>
      ) : (
        <Stack spacing={1.2}>
          {rows.slice(0, 10).map((row) => {
            const breakdown = asArray(row.contributionBreakdown).slice(0, 4);
            return (
              <Box
                key={`${row.number}-${row.rank}`}
                sx={{ border: "1px solid #E2E8F0", borderRadius: 2, p: 1.5, background: "#FFFFFF" }}
              >
                <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                  <AdaptiveNumberPill item={row.number} />
                  <Chip size="small" label={`Rank ${row.rank ?? "--"}`} />
                  <Chip size="small" label={`Score ${formatScore(row.finalScore)}`} />
                  <Chip size="small" label={`Variant ${row.strongestVariant ?? "--"}`} />
                  <Chip size="small" label={`Window ${row.strongestWindow ?? "--"}`} />
                  <Chip size="small" label={`Confidence ${formatAdaptivePercent(row.confidence)}`} />
                </Stack>
                <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                  {breakdown.length ? breakdown.map((item) => (
                    <Chip
                      key={`${row.number}-${item.variantKey}`}
                      size="small"
                      label={`${item.variantKey}: ${formatAdaptivePercent(item.share)}`}
                      sx={{ bgcolor: "#F8FAFC", fontWeight: 850 }}
                    />
                  )) : (
                    <Typography sx={{ color: "#64748B", fontSize: 13, fontWeight: 800 }}>
                      No contribution breakdown.
                    </Typography>
                  )}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}
    </AdaptiveSection>
  );
}

export default function AdaptivePrediction() {
  const [data, setData] = useState({ latest: null, explanation: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState({ open: false, severity: "success", message: "" });

  const loadAdaptiveData = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const [latest, explanation] = await Promise.all([
        getAdaptiveLatest(),
        getAdaptiveExplanationLatest(),
      ]);
      setData({
        latest: normalizeSnapshot(latest),
        explanation: normalizeSnapshot(explanation),
      });
      return true;
    } catch (err) {
      console.error("Load adaptive prediction error:", err);
      const message = friendlyError(err, "Could not load Adaptive Prediction.");
      setError(message);
      setNotice({ open: true, severity: "error", message });
      return false;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadAdaptiveData();
  }, [loadAdaptiveData]);

  const snapshot = data.latest;
  const explanation = data.explanation ?? {};
  const top10 = useMemo(() => parseAdaptiveJson(snapshot?.top10Json, []), [snapshot?.top10Json]);
  const influenceSummary = useMemo(() => getInfluenceSummary(snapshot), [snapshot]);
  const generatedAt = snapshot?.createdAt ?? snapshot?.updatedAt ?? null;

  const handleRefresh = async () => {
    const ok = await loadAdaptiveData({ silent: true });
    if (ok) setNotice({ open: true, severity: "success", message: "Adaptive data refreshed." });
  };

  const handleRun = async () => {
    setRunning(true);
    setError("");

    try {
      const result = await runAdaptivePrediction();
      await loadAdaptiveData({ silent: true });
      setNotice({
        open: true,
        severity: "success",
        message: `Adaptive Prediction completed. Snapshot #${result?.snapshotId ?? "--"} generated.`,
      });
    } catch (err) {
      console.error("Run adaptive prediction error:", err);
      const message = friendlyError(err, "Adaptive Prediction run failed.");
      setError(message);
      setNotice({ open: true, severity: "error", message });
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <Stack alignItems="center" sx={{ py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Box sx={{ maxWidth: 1280, mx: "auto" }}>
      <Stack spacing={2.5}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "stretch", md: "flex-start" }}>
          <AdaptivePageHeader title="Adaptive Prediction" description="Run adaptive predictors, inspect the latest ranking, and review influence and explanation details." />
          <Stack direction="row" spacing={1} justifyContent={{ xs: "stretch", md: "flex-end" }} useFlexGap flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={running ? <CircularProgress size={16} color="inherit" /> : <PlayArrowRoundedIcon />}
              onClick={handleRun}
              disabled={running || refreshing}
              sx={{ textTransform: "none", fontWeight: 950 }}
            >
              {running ? "Running..." : "Run Adaptive Prediction"}
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

        <Box sx={{ ...SURFACE_SX, p: 2 }}>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip label={`Snapshot ${formatAdaptiveDate(snapshot?.predictionDate)}`} />
            <Chip label={`Generated ${formatAdaptiveDate(generatedAt, true)}`} />
            <Chip label={`Target ${formatAdaptiveDate(snapshot?.targetDate)}`} />
          </Stack>
        </Box>

        {error ? <Alert severity="error">{error}</Alert> : null}
        {!snapshot ? <Alert severity="info">No adaptive snapshot exists yet. Run Adaptive Prediction to create one.</Alert> : null}
        {snapshot && !top10.length ? <Alert severity="warning">Adaptive snapshot exists, but no ranking has been generated yet.</Alert> : null}

        <AdaptiveStatusPanel snapshot={snapshot} top10={top10} explanation={explanation} influenceSummary={influenceSummary} />
        <CurrentTop10 top10={top10} snapshot={snapshot} explanation={explanation} />
        <InfluenceSummary influenceSummary={influenceSummary} explanation={explanation} />
        <RankingExplanation explanation={explanation} />
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
