import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Chip, CircularProgress, MenuItem, Select, Stack, Typography } from "@mui/material";

import { getAdaptivePerformanceCards } from "../api/adaptivePredictionApi";
import {
  AdaptiveDataTable,
  AdaptiveMetric,
  AdaptiveNumberPill,
  AdaptivePageHeader,
  AdaptiveSection,
  AdaptiveStateChip,
} from "../components/adaptive/AdaptiveUi";
import {
  formatAdaptiveDate,
  formatAdaptivePercent,
  parseAdaptiveJson,
} from "../components/adaptive/adaptiveFormatters";

function hitRate(cards, field) {
  if (!cards.length) return "--";
  return formatAdaptivePercent(cards.filter((card) => card[field]).length / cards.length);
}

function PerformanceCard({ card }) {
  const predicted = parseAdaptiveJson(card?.predictedTop10Json, []);
  const hits = new Set(parseAdaptiveJson(card?.hitNumbersJson, []));
  return (
    <AdaptiveSection title={formatAdaptiveDate(card?.targetDate)} action={<Chip label={`Hits ${card?.hitCountTop10 ?? 0}/10`} sx={{ bgcolor: "#ECFDF5", fontWeight: 950 }} />}>
      <Stack spacing={1.25}>
        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
          {predicted.map((item) => <AdaptiveNumberPill key={`${card.id}-${item.number}`} item={item} hit={hits.has(item.number)} />)}
        </Stack>
        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
          {["top1Hit", "top3Hit", "top10Hit"].map((field) => (
            <Chip key={field} size="small" label={`${field.replace("Hit", "").toUpperCase()} ${card[field] ? "Hit" : "Miss"}`} sx={{ bgcolor: card[field] ? "#DCFCE7" : "#FEE2E2", color: card[field] ? "#166534" : "#991B1B", fontWeight: 950 }} />
          ))}
          <AdaptiveStateChip label="Best Rank" value={card?.bestRank} color="#EFF6FF" />
        </Stack>
        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
          <AdaptiveStateChip label="RO" value={formatAdaptivePercent(card?.adaptiveRo)} color="#E0F2FE" />
          <AdaptiveStateChip label="AO" value={formatAdaptivePercent(card?.adaptiveAo)} color="#DCFCE7" />
          <AdaptiveStateChip label="Confidence" value={formatAdaptivePercent(card?.adaptiveConfidence)} color="#DBEAFE" />
          <AdaptiveStateChip label="Champion" value={card?.rankingChampion} color="#CCFBF1" />
        </Stack>
      </Stack>
    </AdaptiveSection>
  );
}

export default function AdaptivePerformance() {
  const [limit, setLimit] = useState(30);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const rows = await getAdaptivePerformanceCards(limit);
        if (active) setCards(rows ?? []);
      } catch (err) {
        console.error("Load adaptive performance error:", err);
        if (active) setError("Khong tai duoc Adaptive Performance.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [limit]);

  const championRows = useMemo(() => {
    const totals = new Map();
    cards.forEach((card) => {
      const key = card.rankingChampion || "Unknown";
      totals.set(key, (totals.get(key) ?? 0) + 1);
    });
    return [...totals.entries()].map(([champion, appearances]) => ({ champion, appearances }));
  }, [cards]);

  const summary = useMemo(() => ([
    { label: "Top1 Hit Rate", value: hitRate(cards, "top1Hit"), accent: "#2563EB" },
    { label: "Top3 Hit Rate", value: hitRate(cards, "top3Hit"), accent: "#0284C7" },
    { label: "Top10 Hit Rate", value: hitRate(cards, "top10Hit"), accent: "#16A34A" },
    { label: "Latest Best Rank", value: cards[0]?.bestRank ?? "--", accent: "#D97706" },
    { label: "Latest RO", value: formatAdaptivePercent(cards[0]?.adaptiveRo), accent: "#0F766E" },
    { label: "Latest AO", value: formatAdaptivePercent(cards[0]?.adaptiveAo), accent: "#7C3AED" },
    { label: "Latest Confidence", value: formatAdaptivePercent(cards[0]?.adaptiveConfidence), accent: "#DB2777" },
    { label: "Current Champion", value: cards[0]?.rankingChampion ?? "--", accent: "#475569" },
  ]), [cards]);

  return (
    <Box sx={{ maxWidth: 1480, mx: "auto" }}>
      <Stack spacing={2.5}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1.5}>
          <AdaptivePageHeader title="Adaptive Performance" description="Read-only historical hit, overlap, ranking, confidence, and champion tracking." />
          <Select size="small" value={limit} onChange={(event) => setLimit(Number(event.target.value))} sx={{ minWidth: 130, bgcolor: "#FFFFFF", alignSelf: { md: "flex-start" } }}>
            {[10, 30, 60, 100].map((value) => <MenuItem key={value} value={value}>{value} cards</MenuItem>)}
          </Select>
        </Stack>
        {error ? <Alert severity="error">{error}</Alert> : null}
        {loading ? <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack> : null}
        {!loading && !cards.length ? <Alert severity="info">No Adaptive performance cards available yet.</Alert> : null}
        {!loading && cards.length ? (
          <>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" }, gap: 1.5 }}>
              {summary.map((item) => <AdaptiveMetric key={item.label} {...item} />)}
            </Box>
            <AdaptiveDataTable
              title="RO / AO / Rank / Confidence History"
              rows={cards}
              columns={[
                { key: "targetDate", label: "Target", render: (row) => formatAdaptiveDate(row.targetDate) },
                { key: "adaptiveRo", label: "RO", render: (row) => formatAdaptivePercent(row.adaptiveRo) },
                { key: "adaptiveAo", label: "AO", render: (row) => formatAdaptivePercent(row.adaptiveAo) },
                { key: "bestRank", label: "Best Rank" },
                { key: "adaptiveConfidence", label: "Confidence", render: (row) => formatAdaptivePercent(row.adaptiveConfidence) },
                { key: "rankingChampion", label: "Champion" },
              ]}
            />
            <AdaptiveDataTable title="Champion History Summary" rows={championRows} columns={[{ key: "champion", label: "Champion" }, { key: "appearances", label: "Appearances" }]} />
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
              {cards.map((card) => <PerformanceCard key={card.id} card={card} />)}
            </Box>
          </>
        ) : null}
      </Stack>
    </Box>
  );
}
