import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

function stateTone(value, theme) {
  const state = String(value || "UNKNOWN").toUpperCase();

  if (["STABLE", "HIGH_CONFIDENCE"].includes(state)) {
    return {
      color: theme.palette.success.light,
      bg: alpha(theme.palette.success.main, 0.15),
      border: alpha(theme.palette.success.main, 0.34),
      glow: alpha(theme.palette.success.main, 0.28),
    };
  }

  if (["SHIFTING", "RECOVERING", "MEDIUM", "MEDIUM_CONFIDENCE", "PHASE_SHIFTING"].includes(state)) {
    return {
      color: theme.palette.warning.light,
      bg: alpha(theme.palette.warning.main, 0.16),
      border: alpha(theme.palette.warning.main, 0.35),
      glow: alpha(theme.palette.warning.main, 0.26),
    };
  }

  if (["CHAOTIC", "LOW_CONFIDENCE", "LOW", "DO_NOT_TRUST"].includes(state)) {
    return {
      color: theme.palette.error.light,
      bg: alpha(theme.palette.error.main, 0.17),
      border: alpha(theme.palette.error.main, 0.36),
      glow: alpha(theme.palette.error.main, 0.28),
    };
  }

  return {
    color: theme.palette.grey[300],
    bg: alpha(theme.palette.grey[500], 0.14),
    border: alpha(theme.palette.grey[500], 0.26),
    glow: alpha(theme.palette.grey[500], 0.16),
  };
}

export default function StateCard({ title, value, subtitle }) {
  const theme = useTheme();
  const tone = stateTone(value, theme);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${tone.border}`,
        background:
          "linear-gradient(145deg, rgba(17,20,29,0.96), rgba(9,12,20,0.94))",
        color: "white",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: "-45% auto auto -15%",
          width: 190,
          height: 190,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${tone.glow}, transparent 68%)`,
        }}
      />
      <CardContent sx={{ position: "relative", p: 2.2 }}>
        <Stack spacing={1.2}>
          <Typography
            variant="caption"
            sx={{ color: "rgba(255,255,255,0.62)", letterSpacing: 0.8 }}
          >
            {title}
          </Typography>
          <Chip
            label={value || "--"}
            sx={{
              alignSelf: "flex-start",
              color: tone.color,
              backgroundColor: tone.bg,
              border: `1px solid ${tone.border}`,
              fontWeight: 900,
              letterSpacing: 0.4,
            }}
          />
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.72)", minHeight: 40 }}>
            {subtitle || "No additional context."}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
