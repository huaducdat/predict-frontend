import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Chip, CircularProgress, Stack, Typography } from "@mui/material";

import {
  getAdaptiveExplanationLatest,
  getAdaptiveIntelligenceLatest,
  getAdaptivePerformanceCards,
  getAdaptivePredictorHealth,
  getAdaptiveVariantPerformance,
  getAdaptiveWeightsLatest,
  getAdaptiveWindowHealth,
} from "../api/adaptivePredictionApi";
import {
  AdaptiveDataTable,
  AdaptiveMetric,
  AdaptivePageHeader,
  AdaptiveSection,
} from "../components/adaptive/AdaptiveUi";
import {
  formatAdaptivePercent,
  parseAdaptiveJson,
} from "../components/adaptive/adaptiveFormatters";

function SignalList({ values, empty }) {
  const items = values.length ? values : [empty];
  return (
    <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
      {items.map((value, index) => <Chip key={`${String(value)}-${index}`} label={typeof value === "object" ? JSON.stringify(value) : value} sx={{ bgcolor: "#F1F5F9", fontWeight: 900 }} />)}
    </Stack>
  );
}

export default function AdaptiveIntelligence() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [intelligence, predictorHealth, windowHealth, weights, variants, explanation, cards] = await Promise.all([
          getAdaptiveIntelligenceLatest(),
          getAdaptivePredictorHealth(100),
          getAdaptiveWindowHealth(100),
          getAdaptiveWeightsLatest(),
          getAdaptiveVariantPerformance(200),
          getAdaptiveExplanationLatest().catch(() => null),
          getAdaptivePerformanceCards(1).catch(() => []),
        ]);
        if (active) setData({ intelligence, predictorHealth, windowHealth, weights, variants, explanation, latestCard: cards?.[0] ?? null });
      } catch (err) {
        console.error("Load adaptive intelligence error:", err);
        if (active) setError("Khong tai duoc Adaptive Intelligence.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const metaSignals = useMemo(() => ({
    improvingPredictors: parseAdaptiveJson(data?.intelligence?.improvingPredictorsJson, []),
    agingPredictors: parseAdaptiveJson(data?.intelligence?.agingPredictorsJson, []),
    improvingWindows: parseAdaptiveJson(data?.intelligence?.improvingWindowsJson, []),
    agingWindows: parseAdaptiveJson(data?.intelligence?.agingWindowsJson, []),
    risks: data?.explanation?.riskFlags ?? [],
  }), [data]);

  if (loading) return <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>;

  const intelligence = data?.intelligence;
  const card = data?.latestCard;
  return (
    <Box sx={{ maxWidth: 1480, mx: "auto" }}>
      <Stack spacing={2.5}>
        <AdaptivePageHeader title="Adaptive Intelligence" description="Read-only health, influence, champion, and Adaptive learning signals." />
        {error ? <Alert severity="error">{error}</Alert> : null}

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" }, gap: 1.5 }}>
          <AdaptiveMetric label="Strongest Predictor" value={intelligence?.strongestPredictor ?? card?.strongestPredictor} accent="#2563EB" />
          <AdaptiveMetric label="Strongest Window" value={intelligence?.strongestWindowDays ?? card?.strongestWindow} accent="#0284C7" />
          <AdaptiveMetric label="Strongest Variant" value={intelligence?.strongestVariant ?? card?.strongestVariant} accent="#16A34A" />
          <AdaptiveMetric label="Champion" value={card?.rankingChampion} accent="#D97706" />
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
          <AdaptiveDataTable title="Predictor Health" rows={data?.predictorHealth ?? []} limit={20} columns={[
            { key: "predictorFamily", label: "Predictor" },
            { key: "bestWindowDays", label: "Best Window" },
            { key: "strength", label: "Health", render: (row) => formatAdaptivePercent(row.strength) },
            { key: "confidence", label: "Confidence", render: (row) => formatAdaptivePercent(row.confidence) },
            { key: "influence", label: "Influence", render: (row) => formatAdaptivePercent(row.influence) },
            { key: "trend", label: "Trend" },
          ]} />
          <AdaptiveDataTable title="Window Health" rows={data?.windowHealth ?? []} limit={20} columns={[
            { key: "windowDays", label: "Window" },
            { key: "bestPredictorFamily", label: "Best Predictor" },
            { key: "strength", label: "Health", render: (row) => formatAdaptivePercent(row.strength) },
            { key: "confidence", label: "Confidence", render: (row) => formatAdaptivePercent(row.confidence) },
            { key: "influence", label: "Influence", render: (row) => formatAdaptivePercent(row.influence) },
            { key: "trend", label: "Trend" },
          ]} />
        </Box>

        <AdaptiveDataTable title="Variant Health and Strongest Variants" rows={data?.variants ?? []} limit={30} columns={[
          { key: "variantKey", label: "Variant" },
          { key: "predictorFamily", label: "Predictor" },
          { key: "windowDays", label: "Window" },
          { key: "strength", label: "Health", render: (row) => formatAdaptivePercent(row.strength) },
          { key: "confidence", label: "Confidence", render: (row) => formatAdaptivePercent(row.confidence) },
          { key: "influence", label: "Influence", render: (row) => formatAdaptivePercent(row.influence) },
          { key: "trend", label: "Trend" },
        ]} />

        <AdaptiveDataTable title="Influence Leaderboard" rows={data?.weights ?? []} limit={30} columns={[
          { key: "variantKey", label: "Variant" },
          { key: "predictorFamily", label: "Predictor" },
          { key: "windowDays", label: "Window" },
          { key: "normalizedInfluence", label: "Influence", render: (row) => formatAdaptivePercent(row.normalizedInfluence) },
          { key: "confidence", label: "Confidence", render: (row) => formatAdaptivePercent(row.confidence) },
          { key: "stabilityFactor", label: "Stability", render: (row) => formatAdaptivePercent(row.stabilityFactor) },
        ]} />

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
          <AdaptiveSection title="Champion Details">
            <SignalList values={[
              `Champion ${card?.rankingChampion ?? "--"}`,
              `Confidence ${formatAdaptivePercent(card?.adaptiveConfidence)}`,
              `RO ${formatAdaptivePercent(card?.adaptiveRo)}`,
              `AO ${formatAdaptivePercent(card?.adaptiveAo)}`,
            ]} empty="No champion details" />
          </AdaptiveSection>
          <AdaptiveSection title="Meta Signals">
            <Stack spacing={1.25}>
              <Typography sx={{ color: "#475569", fontWeight: 750 }}>{intelligence?.summaryText ?? "No adaptive intelligence report yet."}</Typography>
              <SignalList values={metaSignals.risks} empty="No risk flags" />
              <SignalList values={metaSignals.improvingPredictors} empty="No improving predictors" />
              <SignalList values={metaSignals.agingPredictors} empty="No aging predictors" />
              <SignalList values={metaSignals.improvingWindows} empty="No improving windows" />
              <SignalList values={metaSignals.agingWindows} empty="No aging windows" />
              {intelligence?.recommendationText ? <Typography sx={{ color: "#0F172A", fontWeight: 850 }}>{intelligence.recommendationText}</Typography> : null}
            </Stack>
          </AdaptiveSection>
        </Box>
      </Stack>
    </Box>
  );
}
