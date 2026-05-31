import { Box, Card, CardContent, LinearProgress, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

function scoreTone(value, theme) {
  const score = Number(value);

  if (Number.isFinite(score) && score >= 0.7) {
    return {
      name: "HIGH",
      colors: ["#14b86a", "#88e08f"],
      text: theme.palette.success.light,
    };
  }

  if (Number.isFinite(score) && score >= 0.45) {
    return {
      name: "MEDIUM",
      colors: ["#ff9f1c", "#ffd166"],
      text: theme.palette.warning.light,
    };
  }

  return {
    name: "LOW",
    colors: ["#ff4d6d", "#ff9f9f"],
    text: theme.palette.error.light,
  };
}

function formatPercent(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "--";
  return `${Math.round(num * 100)}%`;
}

export default function ScoreCard({ label, value, subtitle, icon }) {
  const theme = useTheme();
  const tone = scoreTone(value, theme);
  const progressValue = Number.isFinite(Number(value))
    ? Math.min(100, Math.max(0, Number(value) * 100))
    : 0;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        overflow: "hidden",
        position: "relative",
        border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
        background:
          "linear-gradient(145deg, rgba(18,22,35,0.98), rgba(9,12,20,0.95))",
        color: "white",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: "auto -22% -58% auto",
          width: 190,
          height: 190,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(tone.colors[0], 0.36)}, transparent 68%)`,
        }}
      />
      <CardContent sx={{ position: "relative", p: 2.2 }}>
        <Stack spacing={1.25}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography
              variant="caption"
              sx={{ color: "rgba(255,255,255,0.62)", letterSpacing: 0.9 }}
            >
              {label}
            </Typography>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                background: `linear-gradient(135deg, ${tone.colors[0]}, ${tone.colors[1]})`,
                color: "white",
              }}
            >
              {icon}
            </Box>
          </Stack>

          <Stack spacing={0.6}>
            <Typography variant="h3" sx={{ fontWeight: 950, lineHeight: 1 }}>
              {formatPercent(value)}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progressValue}
              sx={{
                height: 7,
                borderRadius: 999,
                backgroundColor: alpha(theme.palette.common.white, 0.08),
                "& .MuiLinearProgress-bar": {
                  borderRadius: 999,
                  background: `linear-gradient(90deg, ${tone.colors[0]}, ${tone.colors[1]})`,
                },
              }}
            />
          </Stack>

          <Stack direction="row" justifyContent="space-between" spacing={1}>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", minHeight: 20 }}>
              {subtitle}
            </Typography>
            <Typography variant="caption" sx={{ color: tone.text, fontWeight: 900 }}>
              {tone.name}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
