import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  getAdaptiveExplanationLatest,
  getAdaptiveIntelligenceLatest,
  getAdaptiveLatest,
  getAdaptivePerformanceCards,
  getAdaptivePredictorHealth,
  getAdaptiveShadowPerformance,
  getAdaptiveShadowRankingLatest,
  getAdaptiveVariantPerformance,
  getAdaptiveWeightsLatest,
  getAdaptiveWindowHealth,
} from "../api/adaptivePredictionApi";

function parseJson(value, fallback = []) {
  if (Array.isArray(value) || (value && typeof value === "object")) return value;
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function numberLabel(value) {
  if (value === null || value === undefined || value === "") return "--";
  return String(value).padStart(2, "0");
}

function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

function formatPercent(value) {
  if (value === null || value === undefined || value === "") return "--";
  const number = Number(value);
  if (!Number.isFinite(number)) return "--";
  return `${Math.round(number * 100)}%`;
}

function StateChip({ label, value, color = "#F1F5F9" }) {
  return (
    <Chip
      size="small"
      label={label ? `${label} ${value ?? "--"}` : value ?? "--"}
      sx={{
        bgcolor: color,
        color: "#0F172A",
        fontWeight: 950,
        maxWidth: "100%",
        "& .MuiChip-label": {
          overflow: "hidden",
          textOverflow: "ellipsis",
        },
      }}
    />
  );
}

function Section({ title, action, children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid #D6E1EA",
        borderRadius: 3,
        p: { xs: 2, md: 2.5 },
        background: "rgba(255,255,255,0.94)",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 950, color: "#0B1F2A" }}>{title}</Typography>
        {action}
      </Stack>
      {children}
    </Paper>
  );
}

function NumberPill({ item, hit = false }) {
  const number = typeof item === "number" ? item : item?.number;
  const rank = typeof item === "number" ? null : item?.rank;
  return (
    <Box
      component="span"
      sx={{
        minWidth: 38,
        height: 36,
        px: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 999,
        bgcolor: hit ? "#FDE68A" : "#EFF6FF",
        color: hit ? "#78350F" : "#0B1F2A",
        border: hit ? "2px solid #F59E0B" : "1px solid #BFDBFE",
        fontWeight: 950,
      }}
      title={rank ? `Rank ${rank}` : undefined}
    >
      {numberLabel(number)}
    </Box>
  );
}

function Top10Panel({ snapshot, explanation }) {
  const top10 = parseJson(snapshot?.top10Json, []);
  const risks = explanation?.riskFlags ?? [];
  return (
    <Section
      title="Current Adaptive Top10"
      action={<Chip label="PHASE_4" sx={{ bgcolor: "#D1FAE5", color: "#065F46", fontWeight: 950 }} />}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
          {top10.length === 0 ? <Typography sx={{ color: "#64748B", fontWeight: 800 }}>No adaptive Top10 yet.</Typography> : null}
          {top10.map((item) => (
            <NumberPill key={`${item.number}-${item.rank}`} item={item} />
          ))}
        </Stack>
        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
          <Chip label={`Prediction: ${formatDate(snapshot?.predictionDate)}`} />
          <Chip label={`Target: ${formatDate(snapshot?.targetDate)}`} />
          <Chip label={`Confidence: ${formatPercent(explanation?.adaptiveConfidence)}`} />
          <Chip label={`Entropy: ${formatPercent(explanation?.adaptiveEntropy)}`} />
          <Chip label={`Concentration: ${formatPercent(explanation?.adaptiveConcentration)}`} />
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
    </Section>
  );
}

function AdaptiveCard({ card }) {
  const predicted = parseJson(card?.predictedTop10Json, []);
  const actual = parseJson(card?.actualNumbersJson, []);
  const hits = new Set(parseJson(card?.hitNumbersJson, []));
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid #E2E8F0",
        borderTop: "4px solid #0F766E",
        borderRadius: 2,
        p: 2,
        background: "#FFFFFF",
        minHeight: 340,
      }}
    >
      <Stack spacing={1.2}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
          <Box>
            <Typography sx={{ fontWeight: 950, color: "#0F172A" }}>Adaptive Performance</Typography>
            <Typography sx={{ fontSize: 13, color: "#64748B", fontWeight: 750 }}>
              Prediction {formatDate(card?.predictionDate)} to Target {formatDate(card?.targetDate)}
            </Typography>
          </Box>
          <Chip label={`Hits ${card?.hitCountTop10 ?? 0}/10`} sx={{ bgcolor: "#ECFDF5", fontWeight: 950 }} />
        </Stack>
        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
          {["top1Hit", "top3Hit", "top5Hit", "top10Hit"].map((field) => (
            <Chip
              key={field}
              size="small"
              label={`${field.replace("Hit", "").toUpperCase()} ${card?.[field] ? "Hit" : "Miss"}`}
              sx={{
                bgcolor: card?.[field] ? "#DCFCE7" : "#FEE2E2",
                color: card?.[field] ? "#166534" : "#991B1B",
                fontWeight: 950,
              }}
            />
          ))}
          <StateChip label="Hit Count" value={card?.hitCountTop10 ?? "--"} color="#ECFDF5" />
          <StateChip label="Best Rank" value={card?.bestRank ?? "--"} color="#EFF6FF" />
        </Stack>
        <Box>
          <Typography sx={{ fontSize: 12, color: "#64748B", fontWeight: 950, mb: 0.75 }}>Adaptive Top10</Typography>
          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
            {predicted.map((item) => (
              <NumberPill key={`${card?.id}-${item.number}`} item={item} hit={hits.has(item.number)} />
            ))}
          </Stack>
        </Box>
        <Box>
          <Typography sx={{ fontSize: 12, color: "#64748B", fontWeight: 950, mb: 0.75 }}>System State</Typography>
          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
            <StateChip label="RO" value={formatPercent(card?.adaptiveRo)} color="#E0F2FE" />
            <StateChip label="AO" value={formatPercent(card?.adaptiveAo)} color="#DCFCE7" />
            <StateChip label="SHORT AO" value={formatPercent(card?.shortClusterAo)} color="#FEF3C7" />
            <StateChip label="MID AO" value={formatPercent(card?.midClusterAo)} color="#EDE9FE" />
            <StateChip label="LONG AO" value={formatPercent(card?.longClusterAo)} color="#FCE7F3" />
            <StateChip label="" value={card?.adaptiveBias ?? "--"} color="#F1F5F9" />
            <StateChip label="Confidence" value={formatPercent(card?.adaptiveConfidence)} color="#DBEAFE" />
            <StateChip label="Champion:" value={card?.rankingChampion ?? "--"} color="#CCFBF1" />
            <StateChip label="Predictor" value={card?.strongestPredictor ?? "--"} color="#F8FAFC" />
            <StateChip label="Window" value={card?.strongestWindow ?? "--"} color="#F8FAFC" />
            <StateChip label="Strongest:" value={card?.strongestVariant ?? "--"} color="#F8FAFC" />
          </Stack>
        </Box>
        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
          <Chip label={`Actual: ${actual.length ? actual.map(numberLabel).join(", ") : "pending"}`} />
        </Stack>
        <Typography sx={{ fontSize: 13, color: "#475569", fontWeight: 750 }}>{card?.explanationSummary}</Typography>
      </Stack>
    </Paper>
  );
}

function RankingExplanation({ explanation }) {
  const rows = explanation?.top10Explanations ?? [];
  return (
    <Section title="Ranking Explanation">
      <Stack spacing={1}>
        {rows.slice(0, 10).map((row) => (
          <Box key={`${row.number}-${row.rank}`} sx={{ borderBottom: "1px solid #E2E8F0", pb: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
              <NumberPill item={row.number} />
              <Chip size="small" label={`Rank ${row.rank}`} />
              <Chip size="small" label={`Score ${row.finalScore}`} />
              <Chip size="small" label={row.strongestVariant ?? "--"} />
              <Chip size="small" label={`Window ${row.strongestWindow ?? "--"}`} />
            </Stack>
            <Typography sx={{ mt: 0.75, fontSize: 13, color: "#475569", fontWeight: 750 }}>
              {(row.contributionBreakdown ?? [])
                .slice(0, 3)
                .map((item) => `${item.variantKey}: ${formatPercent(item.share)}`)
                .join(" | ") || "No contribution breakdown"}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Section>
  );
}

function HealthTable({ title, rows, columns }) {
  return (
    <Section title={title}>
      <Box sx={{ overflowX: "auto" }}>
        <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
          <Box component="thead">
            <Box component="tr">
              {columns.map((column) => (
                <Box component="th" key={column.key} sx={{ textAlign: "left", p: 1, color: "#64748B", fontSize: 12 }}>
                  {column.label}
                </Box>
              ))}
            </Box>
          </Box>
          <Box component="tbody">
            {rows.slice(0, 12).map((row, index) => (
              <Box component="tr" key={row.id ?? `${title}-${index}`} sx={{ borderTop: "1px solid #E2E8F0" }}>
                {columns.map((column) => (
                  <Box component="td" key={column.key} sx={{ p: 1, fontWeight: 850, color: "#0F172A" }}>
                    {column.render ? column.render(row) : row[column.key] ?? "--"}
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Section>
  );
}

function ShadowPanel({ rankings, performance }) {
  return (
    <Section title="Adaptive Shadow Performance">
      <Stack spacing={1.4}>
        {rankings.map((ranking) => {
          const card = performance.find((item) => item.strategyKey === ranking.strategyKey);
          const top10 = parseJson(ranking.top10Json, []);
          const hits = new Set(parseJson(card?.hitNumbersJson, []));
          return (
            <Box key={ranking.id} sx={{ borderBottom: "1px solid #E2E8F0", pb: 1.4 }}>
              <Stack direction="row" justifyContent="space-between" gap={1} useFlexGap flexWrap="wrap">
                <Typography sx={{ fontWeight: 950 }}>{ranking.strategyKey}</Typography>
                <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                  <Chip size="small" label={`Hits ${card?.hitCountTop10 ?? 0}/10`} />
                  <Chip size="small" label={`Best rank ${card?.bestRank ?? "--"}`} />
                  <Chip size="small" label={`Rank drift ${card?.rankDrift ?? "--"}`} />
                </Stack>
              </Stack>
              <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                {top10.map((item) => (
                  <NumberPill key={`${ranking.strategyKey}-${item.number}`} item={item} hit={hits.has(item.number)} />
                ))}
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Section>
  );
}

export default function AdaptivePrediction() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [
          latest,
          explanation,
          cards,
          shadowRankings,
          shadowPerformance,
          intelligence,
          predictorHealth,
          windowHealth,
          weights,
          variants,
        ] = await Promise.all([
          getAdaptiveLatest(),
          getAdaptiveExplanationLatest(),
          getAdaptivePerformanceCards(20),
          getAdaptiveShadowRankingLatest(),
          getAdaptiveShadowPerformance(50),
          getAdaptiveIntelligenceLatest(),
          getAdaptivePredictorHealth(100),
          getAdaptiveWindowHealth(100),
          getAdaptiveWeightsLatest(),
          getAdaptiveVariantPerformance(200),
        ]);
        if (active) {
          setData({ latest, explanation, cards, shadowRankings, shadowPerformance, intelligence, predictorHealth, windowHealth, weights, variants });
        }
      } catch (err) {
        console.error("Load adaptive prediction error:", err);
        if (active) setError("Khong tai duoc Adaptive Prediction.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const experimentalPredictors = useMemo(() => {
    const rows = data?.weights ?? [];
    return rows.filter((row) => row.predictorFamily === "PAIR_TO_NEXT");
  }, [data?.weights]);

  const promotionCandidates = useMemo(() => {
    return (data?.predictorHealth ?? []).filter((row) => row.promotionState === "PROMOTION_CANDIDATE");
  }, [data?.predictorHealth]);

  const agingPredictors = useMemo(() => {
    return (data?.predictorHealth ?? []).filter((row) => row.trend === "AGING" || row.age >= 0.7);
  }, [data?.predictorHealth]);

  if (loading) {
    return (
      <Stack alignItems="center" sx={{ py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Box sx={{ maxWidth: 1480, mx: "auto" }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography sx={{ fontSize: { xs: 30, md: 42 }, fontWeight: 950, color: "#0B1F2A", letterSpacing: -1 }}>
            Adaptive Prediction
          </Typography>
          <Typography sx={{ color: "#475569", fontWeight: 750 }}>
            Separate adaptive ranking, performance cards, shadow rankings, and system intelligence.
          </Typography>
        </Box>

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Top10Panel snapshot={data?.latest} explanation={data?.explanation} />

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.2fr 0.8fr" }, gap: 2 }}>
          <Section title="Adaptive Performance Cards">
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
              {(data?.cards ?? []).slice(0, 4).map((card) => (
                <AdaptiveCard key={card.id} card={card} />
              ))}
            </Box>
          </Section>
          <ShadowPanel rankings={data?.shadowRankings ?? []} performance={data?.shadowPerformance ?? []} />
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
          <HealthTable
            title="Predictor Health"
            rows={data?.predictorHealth ?? []}
            columns={[
              { key: "predictorFamily", label: "Family" },
              { key: "bestWindowDays", label: "Best Window" },
              { key: "confidence", label: "Confidence", render: (row) => formatPercent(row.confidence) },
              { key: "influence", label: "Influence", render: (row) => formatPercent(row.influence) },
              { key: "trend", label: "Trend" },
            ]}
          />
          <HealthTable
            title="Window Health"
            rows={data?.windowHealth ?? []}
            columns={[
              { key: "windowDays", label: "Window" },
              { key: "bestPredictorFamily", label: "Best Family" },
              { key: "confidence", label: "Confidence", render: (row) => formatPercent(row.confidence) },
              { key: "influence", label: "Influence", render: (row) => formatPercent(row.influence) },
              { key: "trend", label: "Trend" },
            ]}
          />
        </Box>

        <HealthTable
          title="Variant Leaderboard"
          rows={data?.variants ?? []}
          columns={[
            { key: "variantKey", label: "Variant" },
            { key: "predictorFamily", label: "Family" },
            { key: "windowDays", label: "Window" },
            { key: "confidence", label: "Confidence", render: (row) => formatPercent(row.confidence) },
            { key: "influence", label: "Influence", render: (row) => formatPercent(row.influence) },
            { key: "trend", label: "Trend" },
          ]}
        />

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
          <Section title="Experimental Predictors">
            <Typography sx={{ fontWeight: 850 }}>{experimentalPredictors.length} PAIR_TO_NEXT variants tracked with zero ranking influence.</Typography>
          </Section>
          <Section title="Promotion Candidates">
            <Stack spacing={0.75}>
              {(promotionCandidates.length ? promotionCandidates : [{ predictorFamily: "None" }]).map((row) => (
                <Chip key={row.predictorFamily} label={row.predictorFamily} sx={{ fontWeight: 900 }} />
              ))}
            </Stack>
          </Section>
          <Section title="Aging Predictors">
            <Stack spacing={0.75}>
              {(agingPredictors.length ? agingPredictors : [{ predictorFamily: "None" }]).map((row) => (
                <Chip key={row.predictorFamily} label={row.predictorFamily} sx={{ fontWeight: 900 }} />
              ))}
            </Stack>
          </Section>
        </Box>

        <RankingExplanation explanation={data?.explanation} />

        <Section title="Risk Flags">
          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
            {((data?.explanation?.riskFlags ?? []).length ? data.explanation.riskFlags : ["no_risk_flags"]).map((risk) => (
              <Chip key={risk} label={risk} sx={{ bgcolor: risk === "no_risk_flags" ? "#ECFDF5" : "#FEF3C7", fontWeight: 950 }} />
            ))}
          </Stack>
          <Divider sx={{ my: 1.5 }} />
          <Typography sx={{ color: "#475569", fontWeight: 750 }}>
            {data?.intelligence?.summaryText ?? "No adaptive intelligence report yet."}
          </Typography>
        </Section>
      </Stack>
    </Box>
  );
}
