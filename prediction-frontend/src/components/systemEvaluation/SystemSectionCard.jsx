import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

export default function SystemSectionCard({ title, subtitle, action, children, sx }) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.divider, 0.95)}`,
        background: "rgba(255,255,255,0.92)",
        color: theme.palette.text.primary,
        backdropFilter: "blur(8px)",
        boxShadow: `0 18px 46px ${alpha(theme.palette.common.black, 0.08)}`,
        ...sx,
      }}
    >
      <CardContent sx={{ p: 2.4, "&:last-child": { pb: 2.4 } }}>
        <Stack spacing={1.7}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "flex-start" }}
            justifyContent="space-between"
            spacing={1.5}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
            {action}
          </Stack>
          {children}
        </Stack>
      </CardContent>
    </Card>
  );
}
