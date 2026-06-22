import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Chip, CircularProgress, Stack, Typography } from "@mui/material";

import { getAdaptiveShadowPerformance, getAdaptiveShadowRankingLatest } from "../api/adaptivePredictionApi";
import {
  AdaptiveDataTable,
  AdaptiveMetric,
  AdaptiveNumberPill,
  AdaptivePageHeader,
  AdaptiveSection,
} from "../components/adaptive/AdaptiveUi";
import {
  formatAdaptiveDate,
  formatAdaptivePercent,
  parseAdaptiveJson,
} from "../components/adaptive/adaptiveFormatters";

function percentage(count, total) {
  return total ? formatAdaptivePercent(count / total) : "--";
}

export default function AdaptiveShadowRanking() {
  const [data, setData] = useState({ rankings: [], performance: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [rankings, performance] = await Promise.all([
          getAdaptiveShadowRankingLatest(),
          getAdaptiveShadowPerformance(100),
        ]);
        if (active) setData({ rankings: rankings ?? [], performance: performance ?? [] });
      } catch (err) {
        console.error("Load adaptive shadow ranking error:", err);
        if (active) setError("Khong tai duoc Adaptive Shadow Ranking.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const comparison = useMemo(() => {
    const grouped = new Map();
    data.performance.forEach((row) => {
      const current = grouped.get(row.strategyKey) ?? { strategyKey: row.strategyKey, runs: 0, top1: 0, top3: 0, top10: 0, hits: 0, bestRanks: [] };
      current.runs += 1;
      current.top1 += row.top1Hit ? 1 : 0;
      current.top3 += row.top3Hit ? 1 : 0;
      current.top10 += row.top10Hit ? 1 : 0;
      current.hits += row.hitCountTop10 ?? 0;
      if (row.bestRank !== null && row.bestRank !== undefined) current.bestRanks.push(row.bestRank);
      grouped.set(row.strategyKey, current);
    });
    return [...grouped.values()].map((row) => ({
      ...row,
      top1Rate: percentage(row.top1, row.runs),
      top3Rate: percentage(row.top3, row.runs),
      top10Rate: percentage(row.top10, row.runs),
      averageHits: row.runs ? (row.hits / row.runs).toFixed(2) : "--",
      bestRank: row.bestRanks.length ? Math.min(...row.bestRanks) : "--",
    }));
  }, [data.performance]);

  const shadowChampion = useMemo(() => comparison.reduce((best, row) => {
    if (!best || row.top10 > best.top10 || (row.top10 === best.top10 && row.hits > best.hits)) return row;
    return best;
  }, null), [comparison]);

  if (loading) return <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>;

  return (
    <Box sx={{ maxWidth: 1480, mx: "auto" }}>
      <Stack spacing={2.5}>
        <AdaptivePageHeader title="Adaptive Shadow Ranking" description="Read-only shadow strategy rankings, hit rates, performance, and comparison." />
        {error ? <Alert severity="error">{error}</Alert> : null}

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" }, gap: 1.5 }}>
          <AdaptiveMetric label="Shadow Champion" value={shadowChampion?.strategyKey ?? "--"} accent="#7C3AED" />
          <AdaptiveMetric label="Strategies" value={data.rankings.length} accent="#2563EB" />
          <AdaptiveMetric label="Champion Top10 Rate" value={shadowChampion?.top10Rate ?? "--"} accent="#16A34A" />
          <AdaptiveMetric label="Performance Runs" value={data.performance.length} accent="#D97706" />
        </Box>

        <AdaptiveSection title="Current Shadow Rankings">
          {!data.rankings.length ? <Alert severity="info">No current shadow rankings available yet.</Alert> : (
            <Stack spacing={1.5}>
              {data.rankings.map((ranking) => {
                const top10 = parseAdaptiveJson(ranking.top10Json, []);
                const latestPerformance = data.performance.find((row) => row.strategyKey === ranking.strategyKey);
                const hits = new Set(parseAdaptiveJson(latestPerformance?.hitNumbersJson, []));
                return (
                  <Box key={ranking.id} sx={{ borderBottom: "1px solid #E2E8F0", pb: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" gap={1} useFlexGap flexWrap="wrap">
                      <Typography sx={{ fontWeight: 950 }}>{ranking.strategyKey}</Typography>
                      <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                        <Chip size="small" label={`Target ${formatAdaptiveDate(ranking.targetDate)}`} />
                        <Chip size="small" label={`Confidence ${formatAdaptivePercent(ranking.adaptiveConfidence)}`} />
                        <Chip size="small" label={`Hits ${latestPerformance?.hitCountTop10 ?? 0}/10`} />
                        <Chip size="small" label={`Best rank ${latestPerformance?.bestRank ?? "--"}`} />
                      </Stack>
                    </Stack>
                    <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                      {top10.map((item) => <AdaptiveNumberPill key={`${ranking.strategyKey}-${item.number}`} item={item} hit={hits.has(item.number)} />)}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}
        </AdaptiveSection>

        <AdaptiveDataTable title="Shadow Strategy Comparison" rows={comparison} columns={[
          { key: "strategyKey", label: "Strategy" },
          { key: "runs", label: "Runs" },
          { key: "top1Rate", label: "Top1 Rate" },
          { key: "top3Rate", label: "Top3 Rate" },
          { key: "top10Rate", label: "Top10 Rate" },
          { key: "averageHits", label: "Avg Hits" },
          { key: "bestRank", label: "Best Rank" },
        ]} />

        <AdaptiveDataTable title="Shadow Performance History" rows={data.performance} columns={[
          { key: "targetDate", label: "Target", render: (row) => formatAdaptiveDate(row.targetDate) },
          { key: "strategyKey", label: "Strategy" },
          { key: "hitCountTop10", label: "Hits" },
          { key: "top1Hit", label: "Top1", render: (row) => row.top1Hit ? "Hit" : "Miss" },
          { key: "top3Hit", label: "Top3", render: (row) => row.top3Hit ? "Hit" : "Miss" },
          { key: "top10Hit", label: "Top10", render: (row) => row.top10Hit ? "Hit" : "Miss" },
          { key: "bestRank", label: "Best Rank" },
          { key: "rankDrift", label: "Rank Drift" },
        ]} />
      </Stack>
    </Box>
  );
}
