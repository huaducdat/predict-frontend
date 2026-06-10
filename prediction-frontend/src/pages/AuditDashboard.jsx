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
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import {
  downloadAuditAccuracyCsv,
  downloadAuditSummaryJson,
  getAuditSummary,
  getRankOptimizationSummary,
  getShadowRankingSummary,
} from "../api/auditApi";

const TOP_FIELDS = [
  { label: "Top1", key: "currentCombineTop1Accuracy" },
  { label: "Top3", key: "currentCombineTop3Accuracy" },
  { label: "Top5", key: "currentCombineTop5Accuracy" },
  { label: "Top10", key: "currentCombineTop10Accuracy" },
  { label: "Top15", key: "currentCombineTop15Accuracy" },
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

function metricCardSx(theme) {
  return {
    borderRadius: 2,
    border: "1px solid #E2E8F0",
    boxShadow: "0 12px 28px rgba(15,23,42,0.06)",
    background: alpha(theme.palette.background.paper, 0.92),
  };
}

function SectionCard({ title, subtitle, children }) {
  const theme = useTheme();

  return (
    <Card sx={metricCardSx(theme)}>
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
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

function HeaderIndicator({ auditSummary, rankSummary, shadowSummary }) {
  const productionTop1 = auditSummary?.metaFindings?.currentCombineTop1Accuracy;
  const bestRankTop1 = rankSummary?.findings?.bestTop1HitRate;
  const bestShadow = (shadowSummary?.evaluation || []).reduce((best, row) => {
    if (!best) return row;
    return Number(row.top1HitRate || 0) > Number(best.top1HitRate || 0) ? row : best;
  }, null);
  const bestShadowTop1 = bestShadow?.top1HitRate ?? bestRankTop1;
  const improvement =
    Number.isFinite(Number(bestShadowTop1)) && Number.isFinite(Number(productionTop1))
      ? Number(bestShadowTop1) - Number(productionTop1)
      : null;

  return (
    <Card
      sx={{
        borderRadius: 2,
        background: "linear-gradient(135deg, #0F172A, #115E59)",
        color: "#F8FAFC",
        boxShadow: "0 18px 40px rgba(15,23,42,0.22)",
      }}
    >
      <CardContent>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
          <InsightsRoundedIcon />
          <Box sx={{ flex: 1 }}>
            <Typography variant="overline" sx={{ color: "#BAE6FD", fontWeight: 900 }}>
              Current Best Strategy
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 950 }}>
              {bestShadow?.strategyName || rankSummary?.findings?.bestTop1Strategy || "Waiting for audit data"}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
            <Chip label={`Production Top1: ${pct(productionTop1)}`} sx={{ color: "#F8FAFC", borderColor: "#5EEAD4" }} variant="outlined" />
            <Chip label={`Best Shadow Top1: ${pct(bestShadowTop1)}`} sx={{ color: "#F8FAFC", borderColor: "#93C5FD" }} variant="outlined" />
            <Chip label={`Improvement: ${pp(improvement)}`} sx={{ color: "#F8FAFC", borderColor: "#FDE68A" }} variant="outlined" />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function AuditDashboard() {
  const theme = useTheme();
  const [auditSummary, setAuditSummary] = useState(null);
  const [rankSummary, setRankSummary] = useState(null);
  const [shadowSummary, setShadowSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [audit, rank, shadow] = await Promise.all([
        getAuditSummary(),
        getRankOptimizationSummary(),
        getShadowRankingSummary(false),
      ]);
      setAuditSummary(audit);
      setRankSummary(rank);
      setShadowSummary(shadow);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to load audit summary.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const baselineRows = useMemo(() => rankSummary?.baselineCompare || [], [rankSummary]);
  const scoreValidation = auditSummary?.scoreValidation;
  const recentOverlap = auditSummary?.recentOverlap;
  const phaseRows = auditSummary?.phaseStability?.combineByPhase || [];

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
            Audit Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748B", mt: 0.5 }}>
            Main application view for historical accuracy, score calibration, overlap, and phase behavior.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<RefreshRoundedIcon />} variant="outlined" onClick={load}>
            Refresh
          </Button>
          <Button startIcon={<DownloadRoundedIcon />} variant="contained" onClick={downloadAuditSummaryJson}>
            JSON
          </Button>
          <Button startIcon={<DownloadRoundedIcon />} variant="contained" color="secondary" onClick={downloadAuditAccuracyCsv}>
            CSV
          </Button>
        </Stack>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <HeaderIndicator auditSummary={auditSummary} rankSummary={rankSummary} shadowSummary={shadowSummary} />

      <SectionCard
        title="Production Scoring Status"
        subtitle="New production combines use boosted aggregate ranking scores instead of the final score-flattening softmax."
      >
        <Alert severity="warning">
          Historical audit rows created before this change can still show flattened scores near 0.0100. New production rows should show a wider score spread.
        </Alert>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
          <Chip label="Old final softmax: bypassed" color="warning" variant="outlined" />
          <Chip label="Active logic: Reduced Softmax / Pre-Final Boost Score" color="success" />
          <Chip label="Report generated" variant="outlined" />
        </Stack>
        <Typography variant="body2" sx={{ color: "#64748B", overflowWrap: "anywhere" }}>
          reports/audit/production-ranking-fix/PRODUCTION_FIX_SUMMARY.md
        </Typography>
      </SectionCard>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(5, 1fr)" }, gap: 2 }}>
        {TOP_FIELDS.map((field) => (
          <Card key={field.key} sx={metricCardSx(theme)}>
            <CardContent>
              <Typography variant="overline" sx={{ color: "#64748B", fontWeight: 900 }}>
                {field.label} Accuracy
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 950, mt: 0.5 }}>
                {pct(auditSummary?.metaFindings?.[field.key])}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748B" }}>
                Current production combine
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.1fr 0.9fr" }, gap: 2 }}>
        <SectionCard title="Random Baseline Comparison" subtitle="Pulled from the rank optimization audit baseline table.">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Metric</TableCell>
                  <TableCell>Current Combine</TableCell>
                  <TableCell>Random Baseline</TableCell>
                  <TableCell>Best Strategy</TableCell>
                  <TableCell>Lift vs Combine</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {baselineRows.map((row) => (
                  <TableRow key={row.topN}>
                    <TableCell sx={{ fontWeight: 900 }}>{row.topN}</TableCell>
                    <TableCell>{pct(row.currentCombineHitRate)}</TableCell>
                    <TableCell>{pct(row.randomBaselineHitRate)}</TableCell>
                    <TableCell>{row.bestStrategyName || "--"}</TableCell>
                    <TableCell>{pp(row.bestLiftVsCombine)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </SectionCard>

        <SectionCard title="Score Correlation" subtitle={scoreValidation?.calibrationAssessment || "No calibration assessment available."}>
          <Stack spacing={1.5}>
            <Box>
              <Typography variant="overline" sx={{ color: "#64748B", fontWeight: 900 }}>
                Score vs Hit Probability
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 950 }}>
                {Number.isFinite(Number(scoreValidation?.scoreHitCorrelation))
                  ? Number(scoreValidation.scoreHitCorrelation).toFixed(3)
                  : "--"}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: "#64748B" }}>
              Samples: {scoreValidation?.samples ?? 0}
            </Typography>
          </Stack>
        </SectionCard>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
        <SectionCard title="Recent Overlap Statistics" subtitle={recentOverlap?.interpretation || "No overlap interpretation available."}>
          <Stack spacing={1.5}>
            <Chip
              label={`Top10 correlation: ${Number.isFinite(Number(recentOverlap?.top10Correlation)) ? Number(recentOverlap.top10Correlation).toFixed(3) : "--"}`}
              sx={{ alignSelf: "flex-start", fontWeight: 900 }}
            />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Overlap Range</TableCell>
                    <TableCell>Samples</TableCell>
                    <TableCell>Top10 Hit Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(recentOverlap?.ranges || []).map((row) => (
                    <TableRow key={row.range}>
                      <TableCell>{row.range}</TableCell>
                      <TableCell>{row.samples}</TableCell>
                      <TableCell>{pct(row.top10HitRate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </SectionCard>

        <SectionCard title="Phase Statistics" subtitle="Production combine accuracy grouped by detected phase.">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Phase</TableCell>
                  <TableCell>Samples</TableCell>
                  <TableCell>Top1</TableCell>
                  <TableCell>Top3</TableCell>
                  <TableCell>Top10</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {phaseRows.map((row) => (
                  <TableRow key={`${row.name}-${row.mode}-${row.phase}`}>
                    <TableCell>{row.phase || "UNKNOWN"}</TableCell>
                    <TableCell>{row.samples}</TableCell>
                    <TableCell>{pct(row.top1HitRate)}</TableCell>
                    <TableCell>{pct(row.top3HitRate)}</TableCell>
                    <TableCell>{pct(row.top10HitRate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </SectionCard>
      </Box>
    </Stack>
  );
}
