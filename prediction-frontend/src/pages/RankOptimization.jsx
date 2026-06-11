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
  return row?.strategyKey || row?.strategyName || "";
}

function strategyMatches(row, keys) {
  const key = String(row?.strategyKey || "").toUpperCase();
  const name = String(row?.strategyName || "").toUpperCase().replaceAll(" ", "_");
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
      setError(err.response?.data?.message || err.message || "Khong tai duoc toi uu rank.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const strategies = useMemo(() => {
    const rows = Array.isArray(summary?.strategies) ? summary.strategies.filter(Boolean) : [];
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
            Toi uu rank
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748B", mt: 0.5 }}>
            Cac chien luoc xep hang thu nghiem chi dung cho audit. Khong chien luoc nao duoc dua vao ket qua production.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<RefreshRoundedIcon />} variant="outlined" onClick={load}>
            Lam moi
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
      {!error && strategies.length === 0 ? <Alert severity="info">Chua co du lieu chien luoc</Alert> : null}
      <Alert severity="info">
        Ket qua production hien dung diem tong hop da boost voi logic GAP da khoi phuc: uu tien gap gan nho hon.
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
                  Chien luoc Top1 tot nhat
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 950 }}>
                  {bestTop1?.strategyName || "Chua co du lieu chien luoc"}
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748B" }}>
                  {pct(bestTop1?.top1HitRate)} / {pp(bestTop1?.top1LiftVsCombine)} so voi combine
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, border: "1px solid #E2E8F0" }}>
          <CardContent>
            <Typography variant="overline" sx={{ color: "#64748B", fontWeight: 900 }}>
              Chien luoc Top3 tot nhat
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 950 }}>
              {bestTop3?.strategyName || "Chua co du lieu chien luoc"}
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748B" }}>
              {pct(bestTop3?.top3HitRate)} / {pp(bestTop3?.top3LiftVsCombine)} so voi combine
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, border: "1px solid #E2E8F0" }}>
          <CardContent>
            <Typography variant="overline" sx={{ color: "#64748B", fontWeight: 900 }}>
              Pha tiep theo de xuat
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 800 }}>
              {summary?.findings?.recommendedNextPhase || "Chua co de xuat."}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Card sx={{ borderRadius: 2, border: "1px solid #E2E8F0", boxShadow: "0 12px 28px rgba(15,23,42,0.06)" }}>
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 950 }}>
                So sanh chien luoc
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748B" }}>
                Combine hien tai, Score Ascending, Score Inversion, Hybrid va cac chien luoc thu nghiem khac.
              </Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Chien luoc</TableCell>
                    <TableCell>Mau</TableCell>
                    <TableCell>Top1</TableCell>
                    <TableCell>Top3</TableCell>
                    <TableCell>Top5</TableCell>
                    <TableCell>Top10</TableCell>
                    <TableCell>Top15</TableCell>
                    <TableCell>Tang Top1</TableCell>
                    <TableCell>Tang Top3</TableCell>
                    <TableCell>Canh bao</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {strategies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10}>Chua co du lieu chien luoc</TableCell>
                    </TableRow>
                  ) : null}
                  {strategies.map((row, index) => {
                    const highlighted = highlightedRows.has(rowKey(row));
                    return (
                      <TableRow
                        key={rowKey(row) || `strategy-${index}`}
                        sx={{
                          backgroundColor: highlighted ? alpha(theme.palette.success.main, 0.1) : "inherit",
                        }}
                      >
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography sx={{ fontWeight: highlighted ? 950 : 800 }}>{row?.strategyName || row?.strategyKey || "Chua co du lieu chien luoc"}</Typography>
                            {rowKey(bestTop1) === rowKey(row) ? <Chip size="small" color="success" label="Top1 tot nhat" /> : null}
                            {rowKey(bestTop3) === rowKey(row) ? <Chip size="small" color="primary" label="Top3 tot nhat" /> : null}
                          </Stack>
                        </TableCell>
                        <TableCell>{row?.samples ?? 0}</TableCell>
                        <TableCell>{pct(row?.top1HitRate)}</TableCell>
                        <TableCell>{pct(row?.top3HitRate)}</TableCell>
                        <TableCell>{pct(row?.top5HitRate)}</TableCell>
                        <TableCell>{pct(row?.top10HitRate)}</TableCell>
                        <TableCell>{pct(row?.top15HitRate)}</TableCell>
                        <TableCell>{pp(row?.top1LiftVsCombine)}</TableCell>
                        <TableCell>{pp(row?.top3LiftVsCombine)}</TableCell>
                        <TableCell>{row?.confidenceWarning || "--"}</TableCell>
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
            Phat hien
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
            <Chip label={`Dao diem: ${summary?.findings?.scoreInversionHelps || "--"}`} />
            <Chip label={`Trung/truot gan day: ${summary?.findings?.recentHitMissHelps || "--"}`} />
            <Chip label={`Theo pha: ${summary?.findings?.phaseAwareUsefulYet || "--"}`} />
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
