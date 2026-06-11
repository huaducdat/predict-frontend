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
            label={`${summary?.totalDays ?? 0} days`}
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
      label={`${label} ${hit ? "Hit" : "Miss"}`}
      sx={{
        bgcolor: hit ? "#DCFCE7" : "#FEE2E2",
        color: hit ? "#166534" : "#991B1B",
        border: `1px solid ${hit ? "#86EFAC" : "#FCA5A5"}`,
        fontWeight: 950,
      }}
    />
  );
}

function StreakRow({ title, values, bestValues }) {
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
              label={`${label} ${value}`}
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
        minHeight: 366,
        display: "flex",
        flexDirection: "column",
        gap: 1.4,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
        <Box>
          <Typography sx={{ fontWeight: 950, color: "#0F172A", letterSpacing: 0 }}>{MODE_LABELS[mode] ?? mode}</Typography>
          <Typography sx={{ fontSize: 13, color: "#64748B", fontWeight: 700 }}>
            {formatDate(card?.resultDate)}
          </Typography>
        </Box>
        <Chip
          size="small"
          label={card?.predictionAvailable ? "Tracked" : "No snapshot"}
          sx={{
            bgcolor: card?.predictionAvailable ? alpha(theme.palette.success.main, 0.14) : "#F1F5F9",
            color: card?.predictionAvailable ? theme.palette.success.dark : "#64748B",
            fontWeight: 900,
          }}
        />
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 1 }}>
        <Box>
          <Typography sx={{ fontSize: 12, color: "#64748B", fontWeight: 800 }}>Actual Result</Typography>
          <Typography sx={{ fontSize: 28, color: "#0F172A", fontWeight: 950 }}>
            {numberLabel(card?.actualResult)}
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: 12, color: "#64748B", fontWeight: 800 }}>Rank Position</Typography>
          <Typography sx={{ fontSize: 28, color: "#0F172A", fontWeight: 950 }}>
            {card?.rankPosition ?? "--"}
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: 12, color: "#64748B", fontWeight: 800 }}>Prediction Date</Typography>
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

      <StreakRow title="Current Streaks" values={current} bestValues={best} />
      <StreakRow title="Best Streaks" values={best} />
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
      if (mountedRef.current) setError("Could not load performance cards.");
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
      setError("Could not rebuild performance cards.");
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
      setError("Could not export CSV.");
    }
  };

  const handleJson = async () => {
    try {
      const data = await getPerformanceCardsJson();
      triggerJsonDownload(data, "prediction-performance-cards.json");
    } catch (err) {
      console.error("Download JSON error:", err);
      setError("Could not export JSON.");
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
                Performance Cards
              </Typography>
            </Stack>
            <Typography sx={{ color: "#64748B", fontWeight: 700, mt: 0.4 }}>
              Daily prediction hits, active streaks, best streaks, and long-term mode health.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent={{ xs: "flex-start", md: "flex-end" }}>
            <FormControl size="small" sx={{ minWidth: 126 }}>
              <InputLabel id="performance-limit-label">Days</InputLabel>
              <Select
                labelId="performance-limit-label"
                label="Days"
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
              Rebuild
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
              <Typography sx={{ fontWeight: 950, color: "#0F172A", mb: 1 }}>Automatic Notes</Typography>
              <Stack spacing={0.8}>
                {notes.map((note) => (
                  <Alert key={note} severity="info" icon={false} sx={{ py: 0.6, fontWeight: 800 }}>
                    {note}
                  </Alert>
                ))}
              </Stack>
            </Paper>

            {days.length === 0 ? (
              <Alert severity="info">No performance cards yet. Cards will be created automatically after result data is entered.</Alert>
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
