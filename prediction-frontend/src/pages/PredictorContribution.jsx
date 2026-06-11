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
      setError(err.response?.data?.message || err.message || "Khong tai duoc dong gop predictor.");
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
            Dong gop predictor
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748B", mt: 0.5 }}>
            Replay ablation chi doc de xem tac dong predictor len cac chi so xep hang hien tai.
          </Typography>
        </Box>
        <Button startIcon={<RefreshRoundedIcon />} variant="outlined" onClick={load}>
          Lam moi
        </Button>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {!error && rows.length === 0 ? <Alert severity="info">Chua co du lieu chien luoc</Alert> : null}
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
                  Predictor manh nhat
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 950 }}>
                  {strongest?.predictor || "Chua co du lieu chien luoc"}
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748B" }}>
                  Tac dong {pp(strongest?.impactScore)}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, border: "1px solid #E2E8F0" }}>
          <CardContent>
            <Typography variant="overline" sx={{ color: "#64748B", fontWeight: 900 }}>
              Predictor yeu nhat
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 950 }}>
              {weakest?.predictor || "Chua co du lieu chien luoc"}
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748B" }}>
              Tac dong {pp(weakest?.impactScore)}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2, border: "1px solid #E2E8F0" }}>
          <CardContent>
            <Typography variant="overline" sx={{ color: "#64748B", fontWeight: 900 }}>
              Mau replay
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 950 }}>
              {summary?.sampleCount ?? 0}
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748B" }}>
              Top1 tai tao {pct(summary?.reconstructedBaseline?.top1HitRate)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <SectionCard title="Xep hang predictor" subtitle="Tac dong duong nghia la bo predictor lam giam do chinh xac.">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Rank</TableCell>
                <TableCell>Predictor</TableCell>
                <TableCell>Phan loai</TableCell>
                <TableCell>Dong gop Top1</TableCell>
                <TableCell>Dong gop Top3</TableCell>
                <TableCell>Top5</TableCell>
                <TableCell>Top10</TableCell>
                <TableCell>Top15</TableCell>
                <TableCell>Diem tac dong</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>Chua co du lieu chien luoc</TableCell>
                </TableRow>
              ) : null}
              {rows.map((row, index) => (
                <TableRow key={row?.predictor || index}>
                  <TableCell sx={{ fontWeight: 900 }}>#{index + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>{row?.predictor || "Chua co du lieu chien luoc"}</TableCell>
                  <TableCell>
                    <Chip size="small" label={row?.classification || "Trung lap"} />
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
        <SectionCard title="Tuong quan Top1" subtitle="Lan trung rieng cua predictor so voi lan trung Top1 production.">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Predictor</TableCell>
                  <TableCell>Top1 rieng</TableCell>
                  <TableCell>Tuong quan Top1 production</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {correlations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>Chua co du lieu chien luoc</TableCell>
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

        <SectionCard title="Xung dot predictor cao nhat" subtitle="Diem xung dot cao hon nghia la do trung lap Top10 thap hon.">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Predictor</TableCell>
                  <TableCell>Trung lap Top10 TB</TableCell>
                  <TableCell>Diem xung dot</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {conflicts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>Chua co du lieu chien luoc</TableCell>
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

      <SectionCard title="Thay doi tuong lai de xuat" subtitle="Chi la khuyen nghi; trong so production khong doi.">
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
          {(Array.isArray(summary?.recommendedFutureChanges) ? summary.recommendedFutureChanges : []).length === 0 ? (
            <Typography variant="body2" sx={{ color: "#64748B" }}>
              Chua co du lieu chien luoc
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
