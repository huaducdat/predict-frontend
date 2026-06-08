import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

function stateTone(value, theme) {
  const state = String(value || "UNKNOWN").toUpperCase();

  if (["STABLE", "HIGH_CONFIDENCE"].includes(state)) {
    return {
      color: theme.palette.success.dark,
      bg: alpha(theme.palette.success.main, 0.15),
      border: alpha(theme.palette.success.main, 0.34),
    };
  }

  if (["SHIFTING", "RECOVERING", "MEDIUM", "MEDIUM_CONFIDENCE", "PHASE_SHIFTING", "TRANSITION"].includes(state)) {
    return {
      color: theme.palette.warning.dark,
      bg: alpha(theme.palette.warning.main, 0.16),
      border: alpha(theme.palette.warning.main, 0.35),
    };
  }

  if (["CHAOTIC", "LOW_CONFIDENCE", "LOW", "DO_NOT_TRUST", "VOLATILE"].includes(state)) {
    return {
      color: theme.palette.error.dark,
      bg: alpha(theme.palette.error.main, 0.17),
      border: alpha(theme.palette.error.main, 0.36),
    };
  }

  return {
    color: theme.palette.grey[700],
    bg: alpha(theme.palette.grey[500], 0.14),
    border: alpha(theme.palette.grey[500], 0.26),
  };
}

export default function StateCard({ title, value, subtitle, formatValue }) {
  const theme = useTheme();
  const tone = stateTone(value, theme);
  const label = formatValue ? formatValue(value) : value || "--";

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${tone.border}`,
        background: "linear-gradient(145deg, #FFFFFF, #F8FAFC)",
        color: theme.palette.text.primary,
        boxShadow: `0 18px 46px ${alpha(theme.palette.common.black, 0.08)}`,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: "-45% auto auto -15%",
          width: 190,
          height: 190,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(tone.color, 0.13)}, transparent 68%)`,
        }}
      />
      <CardContent sx={{ position: "relative", p: 2.2 }}>
        <Stack spacing={1.2}>
          <Typography
            variant="caption"
            sx={{ color: theme.palette.text.secondary, letterSpacing: 0 }}
          >
            {title}
          </Typography>
          <Chip
            label={label}
            sx={{
              alignSelf: "flex-start",
              color: tone.color,
              backgroundColor: tone.bg,
              border: `1px solid ${tone.border}`,
              fontWeight: 900,
              letterSpacing: 0.4,
            }}
          />
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, minHeight: 40 }}>
            {subtitle || "Chua co mo ta bo sung."}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
