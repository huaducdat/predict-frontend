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
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import StackedLineChartRoundedIcon from "@mui/icons-material/StackedLineChartRounded";

import { getPredictorContributionSummary } from "../api/auditApi";

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

function num(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "--";
  return parsed.toFixed(4);
}

function SectionCard({ title, subtitle, children }) {
  const theme = useTheme();

  return (
    <Card
      sx={{
        borderRadius: 2,
        border: "1px solid #E2E8F0",
        boxShadow: "0 12px 28px rgba(15,23,42,0.06)",
        background: alpha(theme.palette.background.paper, 0.94),
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 950 }}>
              {title}
            </Typography>
            {subtitle ? (
              <Typography variant="body2" sx={{ color: "#64748B", mt: 0.5 }}>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
          {children}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function PredictorContribution() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      setSummary(await getPredictorContributionSummary());
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to load predictor contribution.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const rows = useMemo(
    () => (Array.isArray(summary?.predictorRanking) ? summary.predictorRanking.filter(Boolean) : []),
    [summary]
  );
  const correlations = useMemo(
    () => (Array.isArray(summary?.top1Correlations) ? summary.top1Correlations.filter(Boolean) : []),
    [summary]
  );
  const conflicts = useMemo(
    () => (Array.isArray(summary?.conflicts) ? summary.conflicts.filter(Boolean).slice(0, 8) : []),
    [summary]
  );
  const strongest = rows[0] || null;
  const weakest = rows.length > 0 ? rows[rows.length - 1] : null;

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
            Predictor Contribution
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748B", mt: 0.5 }}>
            Read-only ablation replay for predictor impact on current ranking metrics.
          </Typography>
        </Box>
        <Button startIcon={<RefreshRoundedIcon />} variant="outlined" onClick={load}>
          Refresh
        </Button>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {!error && rows.length === 0 ? <Alert severity="info">No strategy data available</Alert> : null}
      {(Array.isArray(summary?.warnings) ? summary.warnings : []).map((warning) => (
        <Alert key={warning} severity="warning">
          {warning}
        </Alert>
      ))}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
        <Card sx={{ borderRadius: 2, border: "1px solid #E2E8F0" }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <StackedLineChartRoundedIcon color="primary" />
              <Box>
                <Typography variant="overline" sx={{ color: "#64748B", fontWeight: 900 }}>
                  Strongest Predictor
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 950 }}>
                  {strongest?.predictor || "No strategy data available"}
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748B" }}>
                  Impact {pp(strongest?.impactScore)}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, border: "1px solid #E2E8F0" }}>
          <CardContent>
            <Typography variant="overline" sx={{ color: "#64748B", fontWeight: 900 }}>
              Weakest Predictor
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 950 }}>
              {weakest?.predictor || "No strategy data available"}
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748B" }}>
              Impact {pp(weakest?.impactScore)}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, border: "1px solid #E2E8F0" }}>
          <CardContent>
            <Typography variant="overline" sx={{ color: "#64748B", fontWeight: 900 }}>
              Replay Samples
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 950 }}>
              {summary?.sampleCount ?? 0}
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748B" }}>
              Reconstructed Top1 {pct(summary?.reconstructedBaseline?.top1HitRate)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <SectionCard title="Predictor Ranking" subtitle="Positive impact means removing the predictor reduced accuracy.">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Rank</TableCell>
                <TableCell>Predictor</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Top1 Contribution</TableCell>
                <TableCell>Top3 Contribution</TableCell>
                <TableCell>Top5</TableCell>
                <TableCell>Top10</TableCell>
                <TableCell>Top15</TableCell>
                <TableCell>Impact Score</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>No strategy data available</TableCell>
                </TableRow>
              ) : null}
              {rows.map((row, index) => (
                <TableRow key={row?.predictor || index}>
                  <TableCell sx={{ fontWeight: 900 }}>#{index + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>{row?.predictor || "No strategy data available"}</TableCell>
                  <TableCell>
                    <Chip size="small" label={row?.classification || "Neutral"} />
                  </TableCell>
                  <TableCell>{pp(row?.top1Impact)}</TableCell>
                  <TableCell>{pp(row?.top3Impact)}</TableCell>
                  <TableCell>{pp(row?.top5Impact)}</TableCell>
                  <TableCell>{pp(row?.top10Impact)}</TableCell>
                  <TableCell>{pp(row?.top15Impact)}</TableCell>
                  <TableCell>{pp(row?.impactScore)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </SectionCard>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
        <SectionCard title="Top1 Correlation" subtitle="Predictor-only hits compared with production Top1 hits.">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Predictor</TableCell>
                  <TableCell>Own Top1</TableCell>
                  <TableCell>Production Top1 Correlation</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {correlations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>No strategy data available</TableCell>
                  </TableRow>
                ) : null}
                {correlations.map((row) => (
                  <TableRow key={row?.predictor}>
                    <TableCell>{row?.predictor || "--"}</TableCell>
                    <TableCell>{pct(row?.predictorTop1HitRate)}</TableCell>
                    <TableCell>{num(row?.correlationWithProductionTop1)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </SectionCard>

        <SectionCard title="Highest Predictor Conflicts" subtitle="Higher conflict score means lower Top10 overlap.">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Predictors</TableCell>
                  <TableCell>Avg Top10 Overlap</TableCell>
                  <TableCell>Conflict Score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {conflicts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>No strategy data available</TableCell>
                  </TableRow>
                ) : null}
                {conflicts.map((row) => (
                  <TableRow key={`${row?.predictorA}-${row?.predictorB}`}>
                    <TableCell>
                      {row?.predictorA || "--"} / {row?.predictorB || "--"}
                    </TableCell>
                    <TableCell>{num(row?.averageTop10Overlap)}</TableCell>
                    <TableCell>{num(row?.conflictScore)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </SectionCard>
      </Box>

      <SectionCard title="Recommended Future Changes" subtitle="Advisory only; production weights are unchanged.">
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
          {(Array.isArray(summary?.recommendedFutureChanges) ? summary.recommendedFutureChanges : []).length === 0 ? (
            <Typography variant="body2" sx={{ color: "#64748B" }}>
              No strategy data available
            </Typography>
          ) : null}
          {(Array.isArray(summary?.recommendedFutureChanges) ? summary.recommendedFutureChanges : []).map((item) => (
            <Chip key={item} label={item} sx={{ maxWidth: "100%", height: "auto", py: 0.75, "& .MuiChip-label": { whiteSpace: "normal" } }} />
          ))}
        </Stack>
      </SectionCard>
    </Stack>
  );
}
