import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Paper, Stack, Typography } from "@mui/material";

import {
  approveSpecialEvolutionRecommendation,
  getSpecialChampionLatest,
  getSpecialEvolutionRecommendations,
  getSpecialInfluenceLatest,
  getSpecialIntelligenceLatest,
  getSpecialLatest,
  getSpecialMetaLatest,
  getSpecialPhaseStatus,
  getSpecialRankingLeaderboard,
  getSpecialShadowPerformance,
  rejectSpecialEvolutionRecommendation,
} from "../api/specialPredictionApi";

function parseJson(value, fallback = []) {
  if (Array.isArray(value) || (value && typeof value === "object")) return value;
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function fmtPct(value) {
  if (value === null || value === undefined || value === "") return "--";
  const number = Number(value);
  return Number.isFinite(number) ? `${Math.round(number * 100)}%` : "--";
}

function num(value) {
  if (value === null || value === undefined || value === "") return "--";
  return String(value).padStart(2, "0");
}

function SummaryCard({ label, value, tone = "default" }) {
  const colors = {
    primary: ["#F5F3FF", "#4C1D95"],
    good: ["#ECFDF5", "#065F46"],
    warn: ["#FEF3C7", "#78350F"],
    default: ["#F8FAFC", "#0F172A"],
  };
  const [bg, color] = colors[tone] ?? colors.default;
  return (
    <Paper elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 2, p: 2, bgcolor: bg }}>
      <Typography sx={{ fontSize: 12, color: "#64748B", fontWeight: 950, mb: 0.75 }}>{label}</Typography>
      <Typography sx={{ fontSize: 22, color, fontWeight: 950, lineHeight: 1.15, overflowWrap: "anywhere" }}>{value ?? "--"}</Typography>
    </Paper>
  );
}

function Section({ title, children }) {
  return (
    <Paper elevation={0} sx={{ border: "1px solid #D6E1EA", borderRadius: 2, p: 2, background: "#FFFFFF" }}>
      <Typography sx={{ fontSize: 18, fontWeight: 950, color: "#0F172A", mb: 1.5 }}>{title}</Typography>
      {children}
    </Paper>
  );
}

function ChipList({ items, empty = "None", color = "#F1F5F9" }) {
  const list = Array.isArray(items) && items.length ? items : [empty];
  return (
    <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
      {list.map((item, index) => (
        <Chip key={`${String(item)}-${index}`} label={typeof item === "object" ? JSON.stringify(item) : item} sx={{ bgcolor: color, fontWeight: 900 }} />
      ))}
    </Stack>
  );
}

function Leaderboard({ title, rows }) {
  return (
    <Section title={title}>
      <Box sx={{ overflowX: "auto" }}>
        <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
          <Box component="tbody">
            {rows.slice(0, 8).map((row) => (
              <Box component="tr" key={`${row.leaderboardType}-${row.entryKey}`} sx={{ borderTop: "1px solid #E2E8F0" }}>
                <Box component="td" sx={{ p: 1, fontWeight: 950, color: "#64748B", width: 48 }}>#{row.rankPosition}</Box>
                <Box component="td" sx={{ p: 1, fontWeight: 950, color: "#0F172A", overflowWrap: "anywhere" }}>{row.entryKey}</Box>
                <Box component="td" sx={{ p: 1, fontWeight: 850 }}>{fmtPct(row.score)}</Box>
                <Box component="td" sx={{ p: 1, fontWeight: 850 }}>{fmtPct(row.confidence)}</Box>
                <Box component="td" sx={{ p: 1, fontWeight: 850 }}>{row.trend ?? "--"}</Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Section>
  );
}

export default function SpecialIntelligence() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    const [phaseStatus, latest, intelligence, influence, champion, meta, recommendations, leaderboard, shadowPerformance] = await Promise.all([
      getSpecialPhaseStatus(),
      getSpecialLatest().catch(() => null),
      getSpecialIntelligenceLatest().catch(() => null),
      getSpecialInfluenceLatest().catch(() => []),
      getSpecialChampionLatest().catch(() => null),
      getSpecialMetaLatest().catch(() => null),
      getSpecialEvolutionRecommendations(100).catch(() => []),
      getSpecialRankingLeaderboard().catch(() => []),
      getSpecialShadowPerformance(50).catch(() => []),
    ]);
    setData({ phaseStatus, latest, intelligence, influence, champion, meta, recommendations, leaderboard, shadowPerformance });
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await load();
      } catch (err) {
        console.error("Load special intelligence error:", err);
        if (active) setError("Khong tai duoc Special Intelligence.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(() => parseJson(data?.intelligence?.summaryJson, {}), [data?.intelligence]);
  const riskFlags = useMemo(() => parseJson(data?.meta?.riskFlagsJson ?? data?.intelligence?.riskFlagsJson, []), [data?.meta, data?.intelligence]);
  const promotionCandidates = useMemo(() => parseJson(data?.intelligence?.promotionCandidatesJson, []), [data?.intelligence]);
  const agingPredictors = useMemo(() => parseJson(data?.intelligence?.agingPredictorsJson, []), [data?.intelligence]);
  const underperformingWindows = useMemo(() => parseJson(data?.intelligence?.underperformingWindowsJson, []), [data?.intelligence]);
  const leaderboards = useMemo(() => {
    const grouped = {};
    for (const row of data?.leaderboard ?? []) {
      grouped[row.leaderboardType] = [...(grouped[row.leaderboardType] ?? []), row];
    }
    return grouped;
  }, [data?.leaderboard]);

  const handleDecision = async (id, action) => {
    try {
      if (action === "approve") await approveSpecialEvolutionRecommendation(id);
      if (action === "reject") await rejectSpecialEvolutionRecommendation(id);
      await load();
    } catch (err) {
      console.error("Special recommendation decision error:", err);
      setError("Khong cap nhat duoc recommendation.");
    }
  };

  if (loading) {
    return <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>;
  }

  return (
    <Box sx={{ maxWidth: 1480, mx: "auto" }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography sx={{ fontSize: { xs: 30, md: 42 }, fontWeight: 950, color: "#0F172A", letterSpacing: 0 }}>Special Intelligence</Typography>
          <Typography sx={{ color: "#475569", fontWeight: 750 }}>Active influence, champion, meta, and recommendation state for Special Prediction.</Typography>
        </Box>
        {error ? <Alert severity="error">{error}</Alert> : null}

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" }, gap: 1.5 }}>
          <SummaryCard label="Current Phase" value={data?.phaseStatus?.phase ?? "--"} tone="primary" />
          <SummaryCard label="Predicted Number" value={num(data?.intelligence?.primaryPrediction ?? data?.latest?.primaryPrediction)} tone="primary" />
          <SummaryCard label="RO" value={fmtPct(data?.intelligence?.specialRo)} tone="good" />
          <SummaryCard label="AO" value={fmtPct(data?.intelligence?.specialAo)} tone="good" />
          <SummaryCard label="Bias" value={data?.intelligence?.currentBias ?? "--"} />
          <SummaryCard label="Regime" value={data?.meta?.regimeState ?? data?.intelligence?.regimeState ?? "--"} />
          <SummaryCard label="Champion" value={data?.champion?.championKey ?? data?.intelligence?.currentChampion ?? "--"} />
          <SummaryCard label="Champion Confidence" value={fmtPct(data?.champion?.championConfidence ?? data?.intelligence?.championConfidence)} tone="good" />
          <SummaryCard label="Champion Streak" value={data?.champion?.championStreak ?? data?.intelligence?.championStreak ?? "--"} />
          <SummaryCard label="Champion Win Rate" value={fmtPct(data?.champion?.championWinRate ?? data?.intelligence?.championWinRate)} />
          <SummaryCard label="Strongest Predictor" value={data?.intelligence?.strongestPredictor ?? "--"} />
          <SummaryCard label="Strongest Window" value={data?.intelligence?.strongestWindow ?? "--"} />
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
          <Section title="Phase Status">
            <ChipList items={[
              `Phase 3 ${data?.phaseStatus?.phase3 ?? "--"}`,
              `Phase 4 ${data?.phaseStatus?.phase4 ?? "--"}`,
              `Phase 5 ${data?.phaseStatus?.phase5 ?? "--"}`,
              `Phase 6 ${data?.phaseStatus?.phase6 ?? "--"}`,
            ]} color="#E0F2FE" />
          </Section>
          <Section title="Risk Flags">
            <ChipList items={riskFlags} color={riskFlags.length ? "#FEF3C7" : "#DCFCE7"} />
          </Section>
          <Section title="Candidates">
            <Stack spacing={1}>
              <ChipList items={promotionCandidates} empty="No promotion candidates" color="#DCFCE7" />
              <ChipList items={agingPredictors} empty="No aging predictors" color="#FEE2E2" />
            </Stack>
          </Section>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
          <Leaderboard title="Predictor Leaderboard" rows={leaderboards.PREDICTOR ?? []} />
          <Leaderboard title="Window Leaderboard" rows={leaderboards.WINDOW ?? []} />
          <Leaderboard title="Variant Leaderboard" rows={leaderboards.VARIANT ?? []} />
          <Leaderboard title="Shadow Strategy Leaderboard" rows={leaderboards.SHADOW_STRATEGY ?? []} />
        </Box>

        <Section title="Influence Snapshot">
          <ChipList items={(data?.influence ?? []).slice(0, 16).map((row) => `${row.variantKey}: ${fmtPct(row.normalizedInfluence)}`)} color="#F8FAFC" />
        </Section>

        <Section title="Underperforming Windows">
          <ChipList items={(underperformingWindows.length ? underperformingWindows : [{ windowDays: "None" }]).map((item) => (
            item.windowDays === "None" ? "None" : `${item.windowDays}d / ${fmtPct(item.effectiveness)} / conf ${fmtPct(item.confidence)}`
          ))} color="#FEE2E2" />
        </Section>

        <Section title="Evolution Recommendations">
          <Stack spacing={1}>
            {(data?.recommendations?.length ? data.recommendations : []).slice(0, 12).map((row) => (
              <Paper key={row.id} elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 2, p: 1.5 }}>
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1}>
                  <Box>
                    <Typography sx={{ fontWeight: 950 }}>{row.recommendationType} / {row.targetKey}</Typography>
                    <Typography sx={{ color: "#64748B", fontWeight: 750, fontSize: 13 }}>{row.reason}</Typography>
                    <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                      <Chip size="small" label={row.status} sx={{ fontWeight: 900 }} />
                      <Chip size="small" label={`Confidence ${fmtPct(row.confidence)}`} sx={{ fontWeight: 900 }} />
                      <Chip size="small" label={row.applied ? "Applied" : "Not applied"} sx={{ fontWeight: 900 }} />
                    </Stack>
                  </Box>
                  {row.status === "PENDING_REVIEW" ? (
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="contained" onClick={() => handleDecision(row.id, "approve")} sx={{ textTransform: "none", fontWeight: 900 }}>Approve</Button>
                      <Button size="small" variant="outlined" color="error" onClick={() => handleDecision(row.id, "reject")} sx={{ textTransform: "none", fontWeight: 900 }}>Reject</Button>
                    </Stack>
                  ) : null}
                </Stack>
              </Paper>
            ))}
            {!data?.recommendations?.length ? <Alert severity="info">No evolution recommendations currently meet criteria.</Alert> : null}
          </Stack>
        </Section>

        <Section title="Meta Summary">
          <ChipList items={[
            `Confidence ${fmtPct(summary?.confidence)}`,
            `Champion ${summary?.champion ?? "--"}`,
            `Regime ${summary?.regimeState ?? data?.meta?.regimeState ?? "--"}`,
          ]} color="#F1F5F9" />
        </Section>
      </Stack>
    </Box>
  );
}
