import { useEffect, useState } from "react";
import { Alert, Box, Chip, CircularProgress, MenuItem, Paper, Select, Stack, Typography } from "@mui/material";

import { getSpecialPerformanceCards } from "../api/specialPredictionApi";

function parseJson(value, fallback = []) {
  if (Array.isArray(value) || (value && typeof value === "object")) return value;
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function fmtDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
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

function StateChip({ label, value, color = "#F1F5F9" }) {
  return <Chip size="small" label={label ? `${label} ${value ?? "--"}` : value ?? "--"} sx={{ bgcolor: color, fontWeight: 950 }} />;
}

function NumberPill({ item, actual }) {
  const value = typeof item === "number" ? item : item?.number;
  const hit = actual !== null && actual !== undefined && Number(value) === Number(actual);
  return (
    <Box component="span" sx={{ minWidth: 38, height: 36, px: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 999, bgcolor: hit ? "#FDE68A" : "#EFF6FF", color: hit ? "#78350F" : "#0F172A", border: hit ? "2px solid #F59E0B" : "1px solid #BFDBFE", fontWeight: 950 }}>
      {num(value)}
    </Box>
  );
}

function Card({ card }) {
  const top10 = parseJson(card?.predictedTop10Json, []);
  const primary = card?.primaryPrediction ?? top10[0]?.number;
  const directHit = card?.actualSpecialNumber !== null && card?.actualSpecialNumber !== undefined && Number(primary) === Number(card.actualSpecialNumber);
  return (
    <Paper elevation={0} sx={{ border: "1px solid #E2E8F0", borderTop: "4px solid #7C3AED", borderRadius: 2, p: 2, background: "#FFFFFF" }}>
      <Stack spacing={1.4}>
        <Stack direction="row" justifyContent="space-between" gap={1}>
          <Box>
            <Typography sx={{ fontWeight: 950, color: "#0F172A" }}>Special Performance</Typography>
            <Typography sx={{ fontSize: 13, color: "#64748B", fontWeight: 750 }}>Prediction {fmtDate(card?.predictionDate)} to Target {fmtDate(card?.targetDate)}</Typography>
          </Box>
          <Chip label={`Actual ${num(card?.actualSpecialNumber)}`} sx={{ bgcolor: "#F5F3FF", fontWeight: 950 }} />
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} gap={1.5} alignItems={{ xs: "flex-start", sm: "center" }}>
          <Box sx={{ width: 92, height: 92, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 2, bgcolor: directHit ? "#FEF3C7" : "#F5F3FF", border: directHit ? "2px solid #F59E0B" : "1px solid #DDD6FE" }}>
            <Typography sx={{ fontSize: 42, fontWeight: 950, color: directHit ? "#78350F" : "#4C1D95", lineHeight: 1 }}>{num(primary)}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, color: "#64748B", fontWeight: 950, mb: 0.75 }}>Alternative Candidates</Typography>
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
              {top10.slice(1, 5).map((item) => <Chip key={`${card?.id}-alt-${item.number}`} size="small" label={`#${item.rank} ${num(item.number)}`} sx={{ bgcolor: "#EFF6FF", fontWeight: 950 }} />)}
            </Stack>
          </Box>
        </Stack>
        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
          <Chip size="small" label={`Direct Hit ${card?.top1Hit ? "Hit" : "Miss"}`} sx={{ bgcolor: card?.top1Hit ? "#DCFCE7" : "#FEE2E2", color: card?.top1Hit ? "#166534" : "#991B1B", fontWeight: 950 }} />
          <Chip size="small" label={`Top3 Candidate Hit ${card?.top3Hit ? "Hit" : "Miss"}`} sx={{ bgcolor: card?.top3Hit ? "#DCFCE7" : "#FEE2E2", color: card?.top3Hit ? "#166534" : "#991B1B", fontWeight: 950 }} />
          <Chip size="small" label={`Top5 Candidate Hit ${card?.top5Hit ? "Hit" : "Miss"}`} sx={{ bgcolor: card?.top5Hit ? "#DCFCE7" : "#FEE2E2", color: card?.top5Hit ? "#166534" : "#991B1B", fontWeight: 950 }} />
          <Chip size="small" label={`Top10 Candidate Hit ${card?.top10Hit ? "Hit" : "Miss"}`} sx={{ bgcolor: card?.top10Hit ? "#DCFCE7" : "#FEE2E2", color: card?.top10Hit ? "#166534" : "#991B1B", fontWeight: 950 }} />
          <StateChip label="Best Rank" value={card?.bestRank ?? "--"} color="#EFF6FF" />
        </Stack>
        <Box>
          <Typography sx={{ fontSize: 12, color: "#64748B", fontWeight: 950, mb: 0.75 }}>Internal Candidate Ranking</Typography>
          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
            {top10.length ? top10.map((item) => <NumberPill key={`${card?.id}-${item.number}`} item={item} actual={card?.actualSpecialNumber} />) : <Typography sx={{ color: "#64748B", fontWeight: 800 }}>No candidates stored.</Typography>}
          </Stack>
        </Box>
        <Box>
          <Typography sx={{ fontSize: 12, color: "#64748B", fontWeight: 950, mb: 0.75 }}>System State</Typography>
          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
            <StateChip label="RO" value={fmtPct(card?.specialRo)} color="#E0F2FE" />
            <StateChip label="AO" value={fmtPct(card?.specialAo)} color="#DCFCE7" />
            <StateChip label="" value={card?.bias ?? "--"} color="#F1F5F9" />
            <StateChip label="Confidence" value={fmtPct(card?.confidence)} color="#DBEAFE" />
            <StateChip label="Champion" value={card?.rankingChampion ?? "--"} color="#CCFBF1" />
            <StateChip label="Predictor" value={card?.strongestPredictor ?? "--"} color="#F8FAFC" />
            <StateChip label="Window" value={card?.strongestWindow ?? "--"} color="#F8FAFC" />
            <StateChip label="Strongest" value={card?.strongestVariant ?? "--"} color="#F8FAFC" />
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}

export default function SpecialPerformanceCards() {
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
        const data = await getSpecialPerformanceCards(limit);
        if (active) setCards(data);
      } catch (err) {
        console.error("Load special performance cards error:", err);
        if (active) setError("Khong tai duoc Special Performance Cards.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [limit]);

  return (
    <Box sx={{ maxWidth: 1480, mx: "auto" }}>
      <Stack spacing={2.5}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1.5}>
          <Box>
            <Typography sx={{ fontSize: { xs: 30, md: 42 }, fontWeight: 950, color: "#0F172A", letterSpacing: 0 }}>Special Performance Cards</Typography>
            <Typography sx={{ color: "#475569", fontWeight: 750 }}>Daily monitoring for the special-number bounded context.</Typography>
          </Box>
          <Select size="small" value={limit} onChange={(event) => setLimit(Number(event.target.value))} sx={{ minWidth: 120, bgcolor: "#FFFFFF" }}>
            {[10, 30, 60, 100].map((value) => <MenuItem key={value} value={value}>{value} cards</MenuItem>)}
          </Select>
        </Stack>

        {error ? <Alert severity="error">{error}</Alert> : null}
        {loading ? <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack> : null}
        {!loading && cards.length === 0 ? <Alert severity="info">No special performance cards yet. Run Special Prediction first.</Alert> : null}
        {!loading && cards.length > 0 ? (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
            {cards.map((card) => <Card key={card.id} card={card} />)}
          </Box>
        ) : null}
      </Stack>
    </Box>
  );
}
