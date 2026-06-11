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
  getPairWeightSensitivitySummary,
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
  const bestShadow = (Array.isArray(shadowSummary?.evaluation) ? shadowSummary.evaluation.filter(Boolean) : []).reduce((best, row) => {
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
              Chien luoc tot nhat hien tai
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 950 }}>
              {bestShadow?.strategyName || rankSummary?.findings?.bestTop1Strategy || "Dang cho du lieu audit"}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
            <Chip label={`Top1 production: ${pct(productionTop1)}`} sx={{ color: "#F8FAFC", borderColor: "#5EEAD4" }} variant="outlined" />
            <Chip label={`Shadow Top1 tot nhat: ${pct(bestShadowTop1)}`} sx={{ color: "#F8FAFC", borderColor: "#93C5FD" }} variant="outlined" />
            <Chip label={`Cai thien: ${pp(improvement)}`} sx={{ color: "#F8FAFC", borderColor: "#FDE68A" }} variant="outlined" />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function AuditDashboard() {
  const theme = useTheme();
  const [auditSummary, setAuditSummary] = useState(null);
  const [pairSensitivity, setPairSensitivity] = useState(null);
  const [rankSummary, setRankSummary] = useState(null);
  const [shadowSummary, setShadowSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [audit, pair, rank, shadow] = await Promise.allSettled([
        getAuditSummary(),
        getPairWeightSensitivitySummary(),
        getRankOptimizationSummary(),
        getShadowRankingSummary(false),
      ]);
      setAuditSummary(audit.status === "fulfilled" ? audit.value : null);
      setPairSensitivity(pair.status === "fulfilled" ? pair.value : null);
      setRankSummary(rank.status === "fulfilled" ? rank.value : null);
      setShadowSummary(shadow.status === "fulfilled" ? shadow.value : null);

      const failures = [audit, pair, rank, shadow]
        .filter((result) => result.status === "rejected")
        .map((result) => result.reason?.response?.data?.message || result.reason?.message)
        .filter(Boolean);
      if (failures.length > 0) {
        setError(failures.join(" | "));
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Khong tai duoc tong quan audit.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const baselineRows = useMemo(() => (Array.isArray(rankSummary?.baselineCompare) ? rankSummary.baselineCompare.filter(Boolean) : []), [rankSummary]);
  const scoreValidation = auditSummary?.scoreValidation;
  const recentOverlap = auditSummary?.recentOverlap;
  const phaseRows = Array.isArray(auditSummary?.phaseStability?.combineByPhase) ? auditSummary.phaseStability.combineByPhase.filter(Boolean) : [];
  const pairRows = Array.isArray(pairSensitivity?.experiments) ? pairSensitivity.experiments.filter(Boolean) : [];

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
            Bang audit
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748B", mt: 0.5 }}>
            Theo doi do chinh xac lich su, hieu chuan diem, do trung lap va hanh vi theo pha.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<RefreshRoundedIcon />} variant="outlined" onClick={load}>
            Lam moi
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
        title="Trang thai cham diem production"
        subtitle="Ket qua combine moi dung diem xep hang tong hop da boost thay vi softmax lam phang diem cuoi."
      >
        <Alert severity="warning">
          Cac dong audit cu tao truoc thay doi nay co the van hien diem bi lam phang gan 0.0100. Dong production moi se co do trai diem rong hon.
        </Alert>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
          <Chip label="Softmax cuoi cu: da bo qua" color="warning" variant="outlined" />
          <Chip label="Logic dang dung: Reduced Softmax / Pre-Final Boost Score" color="success" />
          <Chip label="Da tao bao cao" variant="outlined" />
        </Stack>
        <Typography variant="body2" sx={{ color: "#64748B", overflowWrap: "anywhere" }}>
          reports/audit/production-ranking-fix/PRODUCTION_FIX_SUMMARY.md
        </Typography>
      </SectionCard>

      <SectionCard
        title="GAP rollback / logic hien tai"
        subtitle="Logic GAP production da quay ve cach cu: gap gan nho hon duoc cham diem cao hon."
      >
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
          <Chip label="Logic GAP hien tai: uu tien gap nho" color="success" />
          <Chip label="Dao chieu overdue GAP: da rollback" variant="outlined" />
          <Chip label={`Mau backtest: ${auditSummary?.dataset?.backtestSamples ?? 0}`} variant="outlined" />
        </Stack>
        <Alert severity="info">
          GAP hien cham diem cac so xuat hien trong cua so 7/14 ngay bang bang trong so production; so khong co trong cua so dong gop 0.
        </Alert>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Chi so</TableCell>
                <TableCell>Combine production hien tai</TableCell>
                <TableCell>Baseline da luu</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[
                "Top1",
                "Top3",
                "Top5",
                "Top10",
                "Top15",
              ].map((label) => (
                <TableRow key={label}>
                  <TableCell sx={{ fontWeight: 900 }}>{label}</TableCell>
                  <TableCell>{pct(auditSummary?.metaFindings?.[`currentCombine${label}Accuracy`])}</TableCell>
                  <TableCell>Hanh vi GAP production truoc do</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Typography variant="body2" sx={{ color: "#64748B" }}>
          reports/audit/predictor-contribution/PREDICTOR_ABLATION_ANALYSIS.md chua replay dong gop chi doc hien tai.
        </Typography>
      </SectionCard>

      <SectionCard
        title="Ket qua thu nghiem trong so PAIR"
        subtitle={pairSensitivity?.decision || "Chua co ket qua thu nghiem trong so PAIR."}
      >
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
          <Chip label={`PAIR goc hien tai: ${pct(pairSensitivity?.currentBasePairWeight, 2)}`} color="primary" variant="outlined" />
          <Chip label={`PAIR hieu luc hien tai: ${pct(pairSensitivity?.currentEffectivePairWeight, 2)}`} variant="outlined" />
          <Chip label={`Da chon: ${pairSensitivity?.bestBalancedConfiguration?.label || "Chua co du lieu chien luoc"}`} color={pairSensitivity?.productionChangeRecommended ? "success" : "default"} />
          <Chip label={`Mau: ${pairSensitivity?.currentProduction?.samples ?? 0}`} variant="outlined" />
        </Stack>
        {(Array.isArray(pairSensitivity?.warnings) ? pairSensitivity.warnings : []).map((warning) => (
          <Alert key={warning} severity="warning">
            {warning}
          </Alert>
        ))}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Trong so PAIR</TableCell>
                <TableCell>Top1</TableCell>
                <TableCell>Top3</TableCell>
                <TableCell>Top5</TableCell>
                <TableCell>Top10</TableCell>
                <TableCell>Top15</TableCell>
                <TableCell>Top1 tang</TableCell>
                <TableCell>Top3 tang</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pairRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>Chua co du lieu chien luoc</TableCell>
                </TableRow>
              ) : null}
              {pairRows.map((row) => (
                <TableRow key={row?.label || row?.pairWeightFactor}>
                  <TableCell sx={{ fontWeight: 900 }}>{row?.label || "Chua co du lieu chien luoc"}</TableCell>
                  <TableCell>{pct(row?.top1HitRate)}</TableCell>
                  <TableCell>{pct(row?.top3HitRate)}</TableCell>
                  <TableCell>{pct(row?.top5HitRate)}</TableCell>
                  <TableCell>{pct(row?.top10HitRate)}</TableCell>
                  <TableCell>{pct(row?.top15HitRate)}</TableCell>
                  <TableCell>{pp(row?.top1LiftVsCurrent)}</TableCell>
                  <TableCell>{pp(row?.top3LiftVsCurrent)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Typography variant="body2" sx={{ color: "#64748B" }}>
          {pairSensitivity?.nextMostLikelyRootCause || "Chua co danh gia nguyen nhan tiep theo."}
        </Typography>
      </SectionCard>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(5, 1fr)" }, gap: 2 }}>
        {TOP_FIELDS.map((field) => (
          <Card key={field.key} sx={metricCardSx(theme)}>
            <CardContent>
              <Typography variant="overline" sx={{ color: "#64748B", fontWeight: 900 }}>
                Do chinh xac {field.label}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 950, mt: 0.5 }}>
                {pct(auditSummary?.metaFindings?.[field.key])}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748B" }}>
                Combine production hien tai
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.1fr 0.9fr" }, gap: 2 }}>
        <SectionCard title="So sanh baseline ngau nhien" subtitle="Lay tu bang baseline audit toi uu rank.">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Chi so</TableCell>
                  <TableCell>Combine hien tai</TableCell>
                  <TableCell>Baseline ngau nhien</TableCell>
                  <TableCell>Chien luoc tot nhat</TableCell>
                  <TableCell>Tang vs combine</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {baselineRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>Chua co du lieu chien luoc</TableCell>
                  </TableRow>
                ) : null}
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

        <SectionCard title="Tuong quan diem" subtitle={scoreValidation?.calibrationAssessment || "Chua co danh gia hieu chuan."}>
          <Stack spacing={1.5}>
            <Box>
              <Typography variant="overline" sx={{ color: "#64748B", fontWeight: 900 }}>
                Diem vs xac suat trung
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 950 }}>
                {Number.isFinite(Number(scoreValidation?.scoreHitCorrelation))
                  ? Number(scoreValidation.scoreHitCorrelation).toFixed(3)
                  : "--"}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: "#64748B" }}>
              Mau: {scoreValidation?.samples ?? 0}
            </Typography>
          </Stack>
        </SectionCard>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
        <SectionCard title="Thong ke do trung lap gan day" subtitle={recentOverlap?.interpretation || "Chua co dien giai do trung lap."}>
          <Stack spacing={1.5}>
            <Chip
              label={`Tuong quan Top10: ${Number.isFinite(Number(recentOverlap?.top10Correlation)) ? Number(recentOverlap.top10Correlation).toFixed(3) : "--"}`}
              sx={{ alignSelf: "flex-start", fontWeight: 900 }}
            />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Vung trung lap</TableCell>
                    <TableCell>Mau</TableCell>
                    <TableCell>Ty le trung Top10</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(Array.isArray(recentOverlap?.ranges) ? recentOverlap.ranges.filter(Boolean) : []).map((row) => (
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

        <SectionCard title="Thong ke theo pha" subtitle="Do chinh xac combine production duoc gom nhom theo pha phat hien.">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Pha</TableCell>
                  <TableCell>Mau</TableCell>
                  <TableCell>Top1</TableCell>
                  <TableCell>Top3</TableCell>
                  <TableCell>Top10</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {phaseRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>Chua co du lieu chien luoc</TableCell>
                  </TableRow>
                ) : null}
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
