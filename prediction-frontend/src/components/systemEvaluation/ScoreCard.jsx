import { Box, Card, CardContent, LinearProgress, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

function scoreTone(value, theme) {
  const score = Number(value);

  if (Number.isFinite(score) && score >= 0.7) {
    return {
      name: "Cao",
      colors: ["#16A34A", "#86EFAC"],
      text: theme.palette.success.dark,
    };
  }

  if (Number.isFinite(score) && score >= 0.45) {
    return {
      name: "Trung bình",
      colors: ["#D97706", "#FCD34D"],
      text: theme.palette.warning.dark,
    };
  }

  return {
    name: "Thấp",
    colors: ["#DC2626", "#FCA5A5"],
    text: theme.palette.error.dark,
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
        borderRadius: 3,
        overflow: "hidden",
        position: "relative",
        border: `1px solid ${theme.palette.divider}`,
        background: "linear-gradient(145deg, #FFFFFF, #F8FAFC)",
        color: theme.palette.text.primary,
        boxShadow: `0 18px 46px ${alpha(theme.palette.common.black, 0.08)}`,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: "auto -22% -58% auto",
          width: 190,
          height: 190,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(tone.colors[0], 0.16)}, transparent 68%)`,
        }}
      />
      <CardContent sx={{ position: "relative", p: 2.2 }}>
        <Stack spacing={1.25}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.secondary, letterSpacing: 0 }}
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
                backgroundColor: alpha(theme.palette.grey[400], 0.18),
                "& .MuiLinearProgress-bar": {
                  borderRadius: 999,
                  background: `linear-gradient(90deg, ${tone.colors[0]}, ${tone.colors[1]})`,
                },
              }}
            />
          </Stack>

          <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between" }}>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, minHeight: 20 }}>
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
