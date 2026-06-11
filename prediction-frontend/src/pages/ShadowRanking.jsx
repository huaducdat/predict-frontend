import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import {
  downloadShadowRankingCsv,
  downloadShadowRankingJson,
  getShadowRankingByDate,
  getShadowRankingCompare,
  getShadowRankingSummary,
} from "../api/auditApi";

const PRODUCTION_NAMES = ["PRODUCTION", "CURRENT_COMBINE", "COMBINE"];

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

function score(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "--";
  return Math.abs(num) < 1 ? num.toFixed(6) : num.toFixed(4);
}

function isProductionStrategy(strategy) {
  const name = String(strategy?.strategyName || "").toUpperCase();
  return PRODUCTION_NAMES.some((candidate) => name.includes(candidate));
}

function findProductionRanking(rankings) {
  const rows = Array.isArray(rankings) ? rankings.filter(Boolean) : [];
  return rows.find(isProductionStrategy) || rows[0] || null;
}

function findStrategyRanking(rankings, selectedStrategy) {
  const rows = Array.isArray(rankings) ? rankings.filter(Boolean) : [];
  if (!rows.length) return null;
  const selected = rows.find((ranking) => ranking?.strategyName === selectedStrategy);
  if (selected && !isProductionStrategy(selected)) return selected;
  return rows.find((ranking) => !isProductionStrategy(ranking)) || selected || rows[0];
}

function strategyOptions(summary, bundle) {
  const summaryStrategies = Array.isArray(summary?.strategies) ? summary.strategies : [];
  const bundleRankings = Array.isArray(bundle?.rankings) ? bundle.rankings.filter(Boolean) : [];
  const names = new Set([...summaryStrategies, ...bundleRankings.map((row) => row?.strategyName)]);
  return [...names].filter(Boolean).filter((name) => !isProductionStrategy({ strategyName: name }));
}

export default function ShadowRanking() {
  const [summary, setSummary] = useState(null);
  const [bundle, setBundle] = useState(null);
  const [compare, setCompare] = useState(null);
  const [date, setDate] = useState("");
  const [mode, setMode] = useState("");
  const [strategy, setStrategy] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = async () => {
    setLoading(true);
    setError("");

    try {
      const nextSummary = await getShadowRankingSummary(false);
      const latest = nextSummary?.latest || null;
      setSummary(nextSummary);
      setBundle(latest);
      setDate(latest?.predictionDate || "");
      setMode(latest?.mode || "");

      const initialStrategy = findStrategyRanking(latest?.rankings || [], strategy)?.strategyName || "";
      setStrategy(initialStrategy);

      if (latest?.predictionDate || latest?.mode) {
        setCompare(
          await getShadowRankingCompare({
            date: latest?.predictionDate,
            mode: latest?.mode,
          })
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to load shadow ranking.");
    } finally {
      setLoading(false);
    }
  };

  const loadSelected = async () => {
    setLoading(true);
    setError("");

    try {
      const [nextBundle, nextCompare] = await Promise.all([
        getShadowRankingByDate({ date, mode, force: false }),
        getShadowRankingCompare({ date, mode }),
      ]);
      setBundle(nextBundle);
      setCompare(nextCompare);

      if (!strategy) {
        setStrategy(findStrategyRanking(nextBundle?.rankings || [], "")?.strategyName || "");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to load selected shadow ranking.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSummary();
  }, []);

  const rankings = Array.isArray(bundle?.rankings) ? bundle.rankings.filter(Boolean) : [];
  const productionRanking = useMemo(() => findProductionRanking(rankings), [rankings]);
  const shadowRanking = useMemo(() => findStrategyRanking(rankings, strategy), [rankings, strategy]);
  const options = useMemo(() => strategyOptions(summary, bundle), [summary, bundle]);
  const modes = useMemo(() => [...new Set([summary?.latest?.mode, bundle?.mode, mode].filter(Boolean))], [summary, bundle, mode]);
  const bestShadow = useMemo(
    () =>
      (Array.isArray(summary?.evaluation) ? summary.evaluation.filter(Boolean) : []).reduce((best, row) => {
        if (!best) return row;
        return Number(row.top1HitRate || 0) > Number(best.top1HitRate || 0) ? row : best;
      }, null),
    [summary]
  );

  const sideBySideRows = useMemo(() => {
    const productionItems = productionRanking?.items || [];
    const shadowItems = shadowRanking?.items || [];
    const maxLength = Math.max(productionItems.length, shadowItems.length, 15);

    return Array.from({ length: Math.min(maxLength, 25) }, (_, index) => ({
      rank: index + 1,
      production: productionItems[index] || null,
      shadow: shadowItems[index] || null,
    }));
  }, [productionRanking, shadowRanking]);

  if (loading && !summary) {
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
            Shadow Ranking
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748B", mt: 0.5 }}>
            Audit-only ranking snapshots stored beside production predictions. Production prediction output is unchanged.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<RefreshRoundedIcon />} variant="outlined" onClick={loadSummary}>
            Refresh
          </Button>
          <Button startIcon={<DownloadRoundedIcon />} variant="contained" onClick={downloadShadowRankingJson}>
            JSON
          </Button>
          <Button startIcon={<DownloadRoundedIcon />} variant="contained" color="secondary" onClick={downloadShadowRankingCsv}>
            CSV
          </Button>
        </Stack>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {(Array.isArray(summary?.warnings) ? summary.warnings : []).map((warning) => (
        <Alert key={warning} severity="warning">
          {warning}
        </Alert>
      ))}
      <Alert severity="info">
        This screen reads and evaluates shadow rankings only. Production rows generated after the GAP reversal use boosted aggregate scores with overdue GAP logic.
      </Alert>
      {!error && rankings.length === 0 ? <Alert severity="info">No strategy data available</Alert> : null}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.15fr 0.85fr" }, gap: 2 }}>
        <Card sx={{ borderRadius: 2, border: "1px solid #E2E8F0" }}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6" sx={{ fontWeight: 950 }}>
                Filters
              </Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <TextField
                  label="Date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <FormControl fullWidth>
                  <InputLabel id="shadow-mode-label">Prediction mode</InputLabel>
                  <Select
                    labelId="shadow-mode-label"
                    label="Prediction mode"
                    value={mode}
                    onChange={(event) => setMode(event.target.value)}
                  >
                    {modes.map((item) => (
                      <MenuItem key={item} value={item}>
                        {item}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel id="shadow-strategy-label">Strategy</InputLabel>
                  <Select
                    labelId="shadow-strategy-label"
                    label="Strategy"
                    value={strategy}
                    onChange={(event) => setStrategy(event.target.value)}
                    disabled={options.length === 0}
                  >
                    {options.length === 0 ? (
                      <MenuItem value="">No strategy data available</MenuItem>
                    ) : null}
                    {options.map((item) => (
                      <MenuItem key={item} value={item}>
                        {item}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button variant="contained" onClick={loadSelected} disabled={loading}>
                  Load
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, border: "1px solid #E2E8F0" }}>
          <CardContent>
            <Typography variant="overline" sx={{ color: "#64748B", fontWeight: 900 }}>
              Current Best Shadow Strategy
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 950 }}>
              {bestShadow?.strategyName || "No strategy data available"}
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748B" }}>
              Top1 {pct(bestShadow?.top1HitRate)} / Top3 {pct(bestShadow?.top3HitRate)} / Lift {pp(bestShadow?.top1LiftVsProduction)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Card sx={{ borderRadius: 2, border: "1px solid #E2E8F0", boxShadow: "0 12px 28px rgba(15,23,42,0.06)" }}>
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 950 }}>
                Production Ranking vs Shadow Ranking
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748B" }}>
                {bundle?.predictionDate || "--"} / {bundle?.mode || "--"} / {shadowRanking?.strategyName || "No strategy data available"}
              </Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Rank</TableCell>
                    <TableCell>Production Number</TableCell>
                    <TableCell>Production Score</TableCell>
                    <TableCell>Shadow Rank</TableCell>
                    <TableCell>Shadow Number</TableCell>
                    <TableCell>Original Score</TableCell>
                    <TableCell>Shadow Score</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sideBySideRows.map((row) => (
                    <TableRow key={row.rank}>
                      <TableCell sx={{ fontWeight: 900 }}>#{row.rank}</TableCell>
                      <TableCell>{row.production?.numberValue ?? "--"}</TableCell>
                      <TableCell>{score(row.production?.originalScore ?? row.production?.shadowScore)}</TableCell>
                      <TableCell>{row.shadow?.rankPosition ? `#${row.shadow.rankPosition}` : "--"}</TableCell>
                      <TableCell>{row.shadow?.numberValue ?? "--"}</TableCell>
                      <TableCell>{score(row.shadow?.originalScore)}</TableCell>
                      <TableCell>{score(row.shadow?.shadowScore)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 2, border: "1px solid #E2E8F0" }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 950, mb: 1.5 }}>
            Strategy Comparison
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>Production</TableCell>
                  <TableCell>Score Ascending</TableCell>
                  <TableCell>Score Inversion</TableCell>
                  <TableCell>Shadow Hybrid</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(Array.isArray(compare?.rows) ? compare.rows : []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>No strategy data available</TableCell>
                  </TableRow>
                ) : null}
                {(Array.isArray(compare?.rows) ? compare.rows : []).filter(Boolean).slice(0, 25).map((row) => (
                  <TableRow key={row.rankPosition}>
                    <TableCell sx={{ fontWeight: 900 }}>#{row.rankPosition}</TableCell>
                    <TableCell>{row.productionNumber ?? "--"}</TableCell>
                    <TableCell>{row.scoreAscendingNumber ?? "--"}</TableCell>
                    <TableCell>{row.scoreInversionNumber ?? "--"}</TableCell>
                    <TableCell>{row.shadowHybridNumber ?? "--"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Stack>
  );
}
