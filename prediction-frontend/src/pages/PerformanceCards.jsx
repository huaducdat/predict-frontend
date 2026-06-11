import { useEffect, useMemo, useRef, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";

import {
  downloadPerformanceCardsCsv,
  getPerformanceCardsDashboard,
  getPerformanceCardsJson,
  rebuildPerformanceCards,
} from "../api/performanceCardsApi";

const MODE_LABELS = {
  SHORT_TERM: "SHORT_TERM",
  EXTENDED: "EXTENDED",
  INTERSECTION: "INTERSECTION",
};

const HIT_FIELDS = [
  ["top1Hit", "Top1"],
  ["top3Hit", "Top3"],
  ["top5Hit", "Top5"],
  ["top10Hit", "Top10"],
  ["top15Hit", "Top15"],
];

const STREAK_FIELDS = [
  ["top1", "Top1"],
  ["top3", "Top3"],
  ["top5", "Top5"],
  ["top10", "Top10"],
  ["top15", "Top15"],
];

function formatPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0%";
  return `${Math.round(number * 100)}%`;
}

function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

function numberLabel(value) {
  if (value === null || value === undefined || value === "") return "--";
  return String(value).padStart(2, "0");
}

function predictedNumbers(card) {
  return numberList(card?.predictedTop10Numbers, card?.predictedTop10Csv);
}

function actualNumbers(card) {
  const numbers = numberList(card?.actualNumbers, card?.actualNumbersCsv);
  if (numbers.length > 0) return numbers;

  const actual = Number(card?.actualResult);
  return Number.isFinite(actual) ? [actual] : [];
}

function cardHitNumbers(card) {
  const storedHits = numberList(card?.hitNumbers, card?.hitNumbersCsv);
  if (storedHits.length > 0) return storedHits;

  const actualSet = new Set(actualNumbers(card));
  return predictedNumbers(card).filter((number) => actualSet.has(number));
}

function numberList(values, csv) {
  if (Array.isArray(values)) {
    return values.map((item) => Number(item)).filter((item) => Number.isFinite(item));
  }

  if (typeof csv === "string" && csv.trim()) {
    return csv
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isFinite(item));
  }

  return [];
}

function modeAccent(mode) {
  if (mode === "SHORT_TERM") return "#2563EB";
  if (mode === "EXTENDED") return "#0F766E";
  return "#7C3AED";
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function triggerJsonDownload(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  triggerBlobDownload(blob, filename);
}

function SummaryPanel({ mode, summary }) {
  const active = summary?.activeStreaks ?? {};
  const accent = modeAccent(mode);

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid #E2E8F0",
        borderRadius: 2,
        p: 2,
        minHeight: 154,
        background: "#FFFFFF",
      }}
    >
      <Stack spacing={1.4}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
          <Typography sx={{ fontWeight: 950, color: "#0F172A", letterSpacing: 0 }}>
            {MODE_LABELS[mode] ?? mode}
          </Typography>
          <Chip
            size="small"
            label={`${summary?.totalDays ?? 0} ngay`}
            sx={{ bgcolor: alpha(accent, 0.1), color: accent, fontWeight: 900 }}
          />
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 1,
          }}
        >
          {[
            ["Top1", summary?.top1Accuracy],
            ["Top3", summary?.top3Accuracy],
            ["Top10", summary?.top10Accuracy],
          ].map(([label, value]) => (
            <Box key={label}>
              <Typography sx={{ fontSize: 12, color: "#64748B", fontWeight: 800 }}>{label}</Typography>
              <Typography sx={{ fontSize: 24, fontWeight: 950, color: "#0F172A", lineHeight: 1.1 }}>
                {formatPercent(value)}
              </Typography>
            </Box>
          ))}
        </Box>

        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
          {STREAK_FIELDS.map(([key, label]) => {
            const value = active[key] ?? 0;
            const isActive = value > 0;
            return (
              <Chip
                key={key}
                size="small"
                label={`${label} ${value}`}
                sx={{
                  bgcolor: isActive ? "#FEF3C7" : "#F1F5F9",
                  color: isActive ? "#92400E" : "#64748B",
                  border: isActive ? "1px solid #F59E0B" : "1px solid #E2E8F0",
                  fontWeight: 900,
                }}
              />
            );
          })}
        </Stack>
      </Stack>
    </Paper>
  );
}

function StatusChip({ hit, label }) {
  return (
    <Chip
      size="small"
      label={`${label} ${hit ? "Trung" : "Truot"}`}
      sx={{
        bgcolor: hit ? "#DCFCE7" : "#FEE2E2",
        color: hit ? "#166534" : "#991B1B",
        border: `1px solid ${hit ? "#86EFAC" : "#FCA5A5"}`,
        fontWeight: 950,
      }}
    />
  );
}

function StreakRow({ title, values, bestValues, historical = false }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 12, color: "#64748B", fontWeight: 950, mb: 0.8 }}>{title}</Typography>
      <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
        {STREAK_FIELDS.map(([key, label]) => {
          const value = values?.[key] ?? 0;
          const isLongest = bestValues && value > 0 && value === (bestValues[key] ?? 0);
          return (
            <Chip
              key={key}
              size="small"
              icon={isLongest ? <WorkspacePremiumRoundedIcon /> : undefined}
              label={historical ? `${label} tot nhat ${value}` : `Chuoi ${label} ${value}`}
              sx={{
                bgcolor: value > 0 ? "#FEF3C7" : "#F8FAFC",
                color: value > 0 ? "#92400E" : "#64748B",
                border: isLongest ? "1px solid #D97706" : "1px solid #E2E8F0",
                fontWeight: 900,
                "& .MuiChip-icon": { color: "#B45309" },
              }}
            />
          );
        })}
      </Stack>
    </Box>
  );
}

function PredictedNumberList({ card }) {
  const numbers = predictedNumbers(card);
  const hits = cardHitNumbers(card);
  const hitSet = new Set(hits);
  const hitCountValue = Number(card?.top10HitCount);
  const hitCount = Number.isFinite(hitCountValue) ? hitCountValue : hits.length;
  const hasHit = hitCount > 0;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} sx={{ mb: 0.8 }}>
        <Typography sx={{ fontSize: 12, color: "#64748B", fontWeight: 950 }}>
          Ket qua du doan Top10
        </Typography>
        {hasHit ? (
          <Chip
            size="small"
            label="SO TRUNG"
            sx={{
              bgcolor: "#FCE7F3",
              color: "#9D174D",
              border: "1px solid #F9A8D4",
              fontWeight: 950,
            }}
          />
        ) : null}
      </Stack>
      <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
        {numbers.length === 0 ? (
          <Typography sx={{ color: "#94A3B8", fontWeight: 800 }}>Chua co danh sach du doan</Typography>
        ) : null}
        {numbers.map((number, index) => {
          const hit = hitSet.has(number);
          return (
            <Box
              key={`${card?.mode}-${card?.resultDate}-${number}-${index}`}
              component="span"
              sx={{
                minWidth: 34,
                height: 32,
                px: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                bgcolor: hit ? "#FCE7F3" : "#F8FAFC",
                color: hit ? "#9D174D" : "#0F172A",
                border: hit ? "2px solid #EC4899" : "1px solid #E2E8F0",
                fontWeight: 950,
                boxShadow: hit ? "0 8px 18px rgba(236,72,153,0.18)" : "none",
              }}
            >
              {numberLabel(number)}
            </Box>
          );
        })}
      </Stack>
      <Stack spacing={0.75} sx={{ mt: 1.2 }}>
        <Stack direction="row" spacing={0.75} alignItems="center" useFlexGap flexWrap="wrap">
          <Typography sx={{ fontSize: 12, color: "#64748B", fontWeight: 950 }}>
            So trung:
          </Typography>
          {hasHit ? (
            hits.map((number, index) => (
              <Chip
                key={`${card?.mode}-${card?.resultDate}-hit-${number}-${index}`}
                size="small"
                label={numberLabel(number)}
                sx={{
                  bgcolor: "#FCE7F3",
                  color: "#9D174D",
                  border: "1px solid #EC4899",
                  fontWeight: 950,
                }}
              />
            ))
          ) : (
            <Typography sx={{ fontSize: 12, color: "#64748B", fontWeight: 850 }}>
              Khong co
            </Typography>
          )}
        </Stack>
        <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap">
          <Typography sx={{ fontSize: 12, color: "#0F172A", fontWeight: 900 }}>
            Tong so trung: {hitCount}
          </Typography>
          <Typography sx={{ fontSize: 12, color: "#0F172A", fontWeight: 900 }}>
            Top10 Hit Count: {hitCount}/10
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

function PerformanceCard({ card }) {
  const theme = useTheme();
  const mode = card?.mode ?? "UNKNOWN";
  const accent = modeAccent(mode);
  const current = {
    top1: card?.currentTop1Streak,
    top3: card?.currentTop3Streak,
    top5: card?.currentTop5Streak,
    top10: card?.currentTop10Streak,
    top15: card?.currentTop15Streak,
  };
  const best = {
    top1: card?.bestTop1Streak,
    top3: card?.bestTop3Streak,
    top5: card?.bestTop5Streak,
    top10: card?.bestTop10Streak,
    top15: card?.bestTop15Streak,
  };

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid #E2E8F0",
        borderTop: `4px solid ${accent}`,
        borderRadius: 2,
        background: "#FFFFFF",
        p: 2,
        minHeight: 460,
        display: "flex",
        flexDirection: "column",
        gap: 1.4,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
        <Box>
          <Typography sx={{ fontWeight: 950, color: "#0F172A", letterSpacing: 0 }}>{MODE_LABELS[mode] ?? mode}</Typography>
          <Typography sx={{ fontSize: 13, color: "#64748B", fontWeight: 700 }}>
            Ngay {formatDate(card?.resultDate)}
          </Typography>
        </Box>
        <Chip
          size="small"
          label={card?.predictionAvailable ? "Da theo doi" : "Chua co anh chup"}
          sx={{
            bgcolor: card?.predictionAvailable ? alpha(theme.palette.success.main, 0.14) : "#F1F5F9",
            color: card?.predictionAvailable ? theme.palette.success.dark : "#64748B",
            fontWeight: 900,
          }}
        />
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 1 }}>
        <Box>
          <Typography sx={{ fontSize: 12, color: "#64748B", fontWeight: 800 }}>Ket qua thuc te</Typography>
          <Typography sx={{ fontSize: 28, color: "#0F172A", fontWeight: 950 }}>
            {numberLabel(card?.actualResult)}
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: 12, color: "#64748B", fontWeight: 800 }}>Vi tri rank</Typography>
          <Typography sx={{ fontSize: 28, color: "#0F172A", fontWeight: 950 }}>
            {card?.rankPosition ?? "--"}
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: 12, color: "#64748B", fontWeight: 800 }}>Ngay du doan</Typography>
          <Typography sx={{ fontSize: 14, color: "#0F172A", fontWeight: 900, mt: 1 }}>
            {card?.predictionDate ?? "--"}
          </Typography>
        </Box>
      </Box>

      <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
        {HIT_FIELDS.map(([field, label]) => (
          <StatusChip key={field} hit={Boolean(card?.[field])} label={label} />
        ))}
      </Stack>

      <Divider />

      <PredictedNumberList card={card} />

      <Divider />

      <StreakRow title="Chuoi hien tai" values={current} bestValues={best} />
      <StreakRow title="Chuoi tot nhat" values={best} historical />
    </Paper>
  );
}

export default function PerformanceCards() {
  const mountedRef = useRef(true);
  const [limit, setLimit] = useState(30);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const modes = dashboard?.modes ?? ["SHORT_TERM", "EXTENDED", "INTERSECTION"];
  const days = dashboard?.days ?? [];
  const summary = dashboard?.summary ?? {};

  const loadData = async () => {
    if (mountedRef.current) {
      setLoading(true);
      setError("");
    }

    try {
      const data = await getPerformanceCardsDashboard(limit);
      if (mountedRef.current) setDashboard(data);
    } catch (err) {
      console.error("Load performance cards error:", err);
      if (mountedRef.current) setError("Khong tai duoc the theo doi hieu suat.");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    void loadData();
    return () => {
      mountedRef.current = false;
    };
  }, [limit]);

  const notes = useMemo(() => dashboard?.notes ?? [], [dashboard]);

  const handleRebuild = async () => {
    setRunning(true);
    setError("");
    try {
      await rebuildPerformanceCards();
      await loadData();
    } catch (err) {
      console.error("Rebuild performance cards error:", err);
      setError("Khong tao lai duoc the theo doi hieu suat.");
    } finally {
      setRunning(false);
    }
  };

  const handleCsv = async () => {
    try {
      const blob = await downloadPerformanceCardsCsv();
      triggerBlobDownload(blob, "prediction-performance-cards.csv");
    } catch (err) {
      console.error("Download CSV error:", err);
      setError("Khong xuat duoc CSV.");
    }
  };

  const handleJson = async () => {
    try {
      const data = await getPerformanceCardsJson();
      triggerJsonDownload(data, "prediction-performance-cards.json");
    } catch (err) {
      console.error("Download JSON error:", err);
      setError("Khong xuat duoc JSON.");
    }
  };

  return (
    <Box sx={{ maxWidth: 1500, mx: "auto" }}>
      <Stack spacing={2.5}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          gap={1.5}
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <InsightsRoundedIcon sx={{ color: "#2563EB" }} />
              <Typography variant="h4" sx={{ fontWeight: 950, color: "#0F172A", letterSpacing: 0 }}>
                Theo doi hieu suat
              </Typography>
            </Stack>
            <Typography sx={{ color: "#64748B", fontWeight: 700, mt: 0.4 }}>
              Theo doi trung hang ngay, chuoi hien tai, chuoi tot nhat va suc khoe du doan dai han.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent={{ xs: "flex-start", md: "flex-end" }}>
            <FormControl size="small" sx={{ minWidth: 126 }}>
              <InputLabel id="performance-limit-label">So ngay</InputLabel>
              <Select
                labelId="performance-limit-label"
                label="So ngay"
                value={limit}
                onChange={(event) => setLimit(Number(event.target.value))}
              >
                {[14, 30, 60, 90, 180].map((value) => (
                  <MenuItem key={value} value={value}>{value}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              startIcon={running ? <CircularProgress size={16} /> : <RefreshRoundedIcon />}
              onClick={handleRebuild}
              disabled={running}
              variant="outlined"
              sx={{ textTransform: "none", fontWeight: 900 }}
            >
              Tao lai
            </Button>
            <Button startIcon={<DownloadRoundedIcon />} onClick={handleCsv} variant="contained" sx={{ textTransform: "none", fontWeight: 900 }}>
              CSV
            </Button>
            <Button startIcon={<DownloadRoundedIcon />} onClick={handleJson} variant="contained" color="secondary" sx={{ textTransform: "none", fontWeight: 900 }}>
              JSON
            </Button>
          </Stack>
        </Stack>

        {error ? <Alert severity="error">{error}</Alert> : null}

        {loading ? (
          <Paper elevation={0} sx={{ p: 4, border: "1px solid #E2E8F0", borderRadius: 2, textAlign: "center" }}>
            <CircularProgress />
          </Paper>
        ) : (
          <>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 1.5 }}>
              {modes.map((mode) => (
                <SummaryPanel key={mode} mode={mode} summary={summary[mode]} />
              ))}
            </Box>

            <Paper elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: 2, p: 2, background: "#FFFFFF" }}>
              <Typography sx={{ fontWeight: 950, color: "#0F172A", mb: 1 }}>Ghi chu tu dong</Typography>
              <Stack spacing={0.8}>
                {notes.map((note) => (
                  <Alert key={note} severity="info" icon={false} sx={{ py: 0.6, fontWeight: 800 }}>
                    {note}
                  </Alert>
                ))}
              </Stack>
            </Paper>

            {days.length === 0 ? (
              <Alert severity="info">Chua co the theo doi hieu suat. The se tu tao sau khi nhap ket qua.</Alert>
            ) : (
              <Stack spacing={2}>
                {days.map((day) => (
                  <Box key={day.date}>
                    <Typography sx={{ fontWeight: 950, color: "#0F172A", mb: 1 }}>
                      {formatDate(day.date)}
                    </Typography>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", lg: "repeat(3, minmax(0, 1fr))" },
                        gap: 1.5,
                      }}
                    >
                      {(day.cards ?? []).map((card) => (
                        <PerformanceCard key={`${card.resultDate}-${card.mode}`} card={card} />
                      ))}
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </>
        )}
      </Stack>
    </Box>
  );
}
