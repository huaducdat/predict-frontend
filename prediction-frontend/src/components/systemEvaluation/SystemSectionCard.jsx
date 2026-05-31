import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

export default function SystemSectionCard({ title, subtitle, action, children, sx }) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
        background:
          "linear-gradient(135deg, rgba(17,20,29,0.96), rgba(8,10,18,0.92))",
        color: "white",
        backdropFilter: "blur(18px)",
        boxShadow: `0 20px 70px ${alpha(theme.palette.common.black, 0.28)}`,
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
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.62)" }}>
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
