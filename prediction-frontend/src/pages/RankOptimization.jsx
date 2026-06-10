import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";

import {
  downloadRankOptimizationCsv,
  downloadRankOptimizationJson,
  getRankOptimizationSummary,
} from "../api/auditApi";

const STRATEGY_ORDER = [
  "CURRENT_COMBINE",
  "SCORE_ASCENDING",
  "SCORE_INVERSION",
  "SHADOW_HYBRID",
  "HYBRID",
];

function pct(value, digits = 1) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "--";
  return `${(num * 100).toFixed(digits)}%`;
}

function pp(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "--";
  return `${num >= 0 ? "+" : ""}${(num * 100).toFixed(1)} pp`;
}

function rowKey(row) {
  return row.strategyKey || row.strategyName;
}

function strategyMatches(row, keys) {
  const key = String(row.strategyKey || "").toUpperCase();
  const name = String(row.strategyName || "").toUpperCase().replaceAll(" ", "_");
  return keys.some((candidate) => key.includes(candidate) || name.includes(candidate));
}

export default function RankOptimization() {
  const theme = useTheme();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      setSummary(await getRankOptimizationSummary());
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to load rank optimization.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const strategies = useMemo(() => {
    const rows = summary?.strategies || [];
    return [...rows].sort((a, b) => {
      const aIndex = STRATEGY_ORDER.findIndex((key) => strategyMatches(a, [key]));
      const bIndex = STRATEGY_ORDER.findIndex((key) => strategyMatches(b, [key]));
      return (aIndex < 0 ? 99 : aIndex) - (bIndex < 0 ? 99 : bIndex);
    });
  }, [summary]);

  const bestTop1 = useMemo(
    () => strategies.reduce((best, row) => (!best || Number(row.top1HitRate || 0) > Number(best.top1HitRate || 0) ? row : best), null),
    [strategies]
  );
  const bestTop3 = useMemo(
    () => strategies.reduce((best, row) => (!best || Number(row.top3HitRate || 0) > Number(best.top3HitRate || 0) ? row : best), null),
    [strategies]
  );
  const highlightedRows = useMemo(
    () => new Set([rowKey(bestTop1), rowKey(bestTop3)].filter(Boolean)),
    [bestTop1, bestTop3]
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 950 }}>
            Rank Optimization
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748B", mt: 0.5 }}>
            Experimental audit-only ranking strategies. None of these strategies are promoted to production output.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<RefreshRoundedIcon />} variant="outlined" onClick={load}>
            Refresh
          </Button>
          <Button startIcon={<DownloadRoundedIcon />} variant="contained" onClick={downloadRankOptimizationJson}>
            JSON
          </Button>
          <Button startIcon={<DownloadRoundedIcon />} variant="contained" color="secondary" onClick={downloadRankOptimizationCsv}>
            CSV
          </Button>
        </Stack>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}
      <Alert severity="info">
        Current production output now uses reduced-softmax boosted aggregate scores. Historical strategy comparisons can still include rows produced before the change.
      </Alert>
      {(summary?.warnings || []).map((warning) => (
        <Alert key={warning} severity="warning">
          {warning}
        </Alert>
      ))}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
        <Card sx={{ borderRadius: 2, border: "1px solid #E2E8F0" }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <TrendingUpRoundedIcon color="primary" />
              <Box>
                <Typography variant="overline" sx={{ color: "#64748B", fontWeight: 900 }}>
                  Best Top1 Strategy
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 950 }}>
                  {bestTop1?.strategyName || "--"}
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748B" }}>
                  {pct(bestTop1?.top1HitRate)} / {pp(bestTop1?.top1LiftVsCombine)} vs combine
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, border: "1px solid #E2E8F0" }}>
          <CardContent>
            <Typography variant="overline" sx={{ color: "#64748B", fontWeight: 900 }}>
              Best Top3 Strategy
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 950 }}>
              {bestTop3?.strategyName || "--"}
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748B" }}>
              {pct(bestTop3?.top3HitRate)} / {pp(bestTop3?.top3LiftVsCombine)} vs combine
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, border: "1px solid #E2E8F0" }}>
          <CardContent>
            <Typography variant="overline" sx={{ color: "#64748B", fontWeight: 900 }}>
              Recommended Next Phase
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 800 }}>
              {summary?.findings?.recommendedNextPhase || "No recommendation available."}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Card sx={{ borderRadius: 2, border: "1px solid #E2E8F0", boxShadow: "0 12px 28px rgba(15,23,42,0.06)" }}>
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 950 }}>
                Strategy Comparison
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748B" }}>
                Current Combine, Score Ascending, Score Inversion, Hybrid, and all other experimental strategies.
              </Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Strategy</TableCell>
                    <TableCell>Samples</TableCell>
                    <TableCell>Top1</TableCell>
                    <TableCell>Top3</TableCell>
                    <TableCell>Top5</TableCell>
                    <TableCell>Top10</TableCell>
                    <TableCell>Top15</TableCell>
                    <TableCell>Lift Top1</TableCell>
                    <TableCell>Lift Top3</TableCell>
                    <TableCell>Warning</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {strategies.map((row) => {
                    const highlighted = highlightedRows.has(rowKey(row));
                    return (
                      <TableRow
                        key={rowKey(row)}
                        sx={{
                          backgroundColor: highlighted ? alpha(theme.palette.success.main, 0.1) : "inherit",
                        }}
                      >
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography sx={{ fontWeight: highlighted ? 950 : 800 }}>{row.strategyName}</Typography>
                            {rowKey(bestTop1) === rowKey(row) ? <Chip size="small" color="success" label="Best Top1" /> : null}
                            {rowKey(bestTop3) === rowKey(row) ? <Chip size="small" color="primary" label="Best Top3" /> : null}
                          </Stack>
                        </TableCell>
                        <TableCell>{row.samples}</TableCell>
                        <TableCell>{pct(row.top1HitRate)}</TableCell>
                        <TableCell>{pct(row.top3HitRate)}</TableCell>
                        <TableCell>{pct(row.top5HitRate)}</TableCell>
                        <TableCell>{pct(row.top10HitRate)}</TableCell>
                        <TableCell>{pct(row.top15HitRate)}</TableCell>
                        <TableCell>{pp(row.top1LiftVsCombine)}</TableCell>
                        <TableCell>{pp(row.top3LiftVsCombine)}</TableCell>
                        <TableCell>{row.confidenceWarning || "--"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 2, border: "1px solid #E2E8F0" }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 950, mb: 1.5 }}>
            Findings
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
            <Chip label={`Score inversion: ${summary?.findings?.scoreInversionHelps || "--"}`} />
            <Chip label={`Recent hit/miss: ${summary?.findings?.recentHitMissHelps || "--"}`} />
            <Chip label={`Phase-aware: ${summary?.findings?.phaseAwareUsefulYet || "--"}`} />
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
