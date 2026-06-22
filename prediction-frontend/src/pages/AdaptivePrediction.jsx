import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Chip, CircularProgress, Stack, Typography } from "@mui/material";

import { getAdaptiveExplanationLatest, getAdaptiveLatest } from "../api/adaptivePredictionApi";
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

function CurrentTop10({ snapshot, explanation }) {
  const top10 = parseAdaptiveJson(snapshot?.top10Json, []);
  const risks = explanation?.riskFlags ?? [];

  return (
    <AdaptiveSection title="Current Adaptive Top10" action={<Chip label="PHASE_4" sx={{ bgcolor: "#D1FAE5", color: "#065F46", fontWeight: 950 }} />}>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
          {top10.length ? top10.map((item) => (
            <AdaptiveNumberPill key={`${item.number}-${item.rank}`} item={item} />
          )) : <Typography sx={{ color: "#64748B", fontWeight: 800 }}>No adaptive Top10 yet.</Typography>}
        </Stack>
        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
          <Chip label={`Prediction: ${formatAdaptiveDate(snapshot?.predictionDate)}`} />
          <Chip label={`Target: ${formatAdaptiveDate(snapshot?.targetDate)}`} />
          <Chip label={`Confidence: ${formatAdaptivePercent(explanation?.adaptiveConfidence)}`} />
          <Chip label={`Strongest variant: ${explanation?.strongestVariant ?? explanation?.top10Explanations?.[0]?.strongestVariant ?? "--"}`} />
        </Stack>
        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
          {(risks.length ? risks : ["no_risk_flags"]).map((risk) => (
            <Chip key={risk} size="small" label={risk} sx={{ bgcolor: risk === "no_risk_flags" ? "#F1F5F9" : "#FEF3C7", fontWeight: 900 }} />
          ))}
        </Stack>
      </Stack>
    </AdaptiveSection>
  );
}

function RankingExplanation({ explanation }) {
  const rows = explanation?.top10Explanations ?? [];
  return (
    <AdaptiveSection title="Current Ranking and Explanation">
      {!rows.length ? <Alert severity="info">No ranking explanation available yet.</Alert> : (
        <Stack spacing={1}>
          {rows.slice(0, 10).map((row) => (
            <Box key={`${row.number}-${row.rank}`} sx={{ borderBottom: "1px solid #E2E8F0", pb: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                <AdaptiveNumberPill item={row.number} />
                <Chip size="small" label={`Rank ${row.rank}`} />
                <Chip size="small" label={`Score ${row.finalScore}`} />
                <Chip size="small" label={`Variant ${row.strongestVariant ?? "--"}`} />
                <Chip size="small" label={`Window ${row.strongestWindow ?? "--"}`} />
              </Stack>
              <Typography sx={{ mt: 0.75, fontSize: 13, color: "#475569", fontWeight: 750 }}>
                {(row.contributionBreakdown ?? []).slice(0, 3).map((item) => `${item.variantKey}: ${formatAdaptivePercent(item.share)}`).join(" | ") || "No contribution breakdown"}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
    </AdaptiveSection>
  );
}

export default function AdaptivePrediction() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [latest, explanation] = await Promise.all([
          getAdaptiveLatest(),
          getAdaptiveExplanationLatest(),
        ]);
        if (active) setData({ latest, explanation });
      } catch (err) {
        console.error("Load adaptive prediction error:", err);
        if (active) setError("Khong tai duoc Adaptive Prediction.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const strongestVariant = useMemo(() => {
    const rows = data?.explanation?.top10Explanations ?? [];
    return data?.explanation?.strongestVariant ?? rows.find((row) => row.strongestVariant)?.strongestVariant ?? "--";
  }, [data?.explanation]);

  if (loading) return <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>;

  return (
    <Box sx={{ maxWidth: 1180, mx: "auto" }}>
      <Stack spacing={2.5}>
        <AdaptivePageHeader title="Adaptive Prediction" description="Current Adaptive ranking, confidence, and prediction explanation." />
        {error ? <Alert severity="error">{error}</Alert> : null}
        <CurrentTop10 snapshot={data?.latest} explanation={{ ...data?.explanation, strongestVariant }} />
        <RankingExplanation explanation={data?.explanation} />
      </Stack>
    </Box>
  );
}
