import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { formatAdaptiveNumber } from "./adaptiveFormatters";

export function AdaptivePageHeader({ title, description }) {
  return (
    <Box>
      <Typography sx={{ fontSize: { xs: 30, md: 42 }, fontWeight: 950, color: "#0F172A", letterSpacing: 0 }}>
        {title}
      </Typography>
      <Typography sx={{ color: "#475569", fontWeight: 750 }}>{description}</Typography>
    </Box>
  );
}

export function AdaptiveSection({ title, action, children }) {
  return (
    <Paper elevation={0} sx={{ border: "1px solid #D6E1EA", borderRadius: 2, p: { xs: 2, md: 2.5 }, background: "#FFFFFF" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 950, color: "#0F172A" }}>{title}</Typography>
        {action}
      </Stack>
      {children}
    </Paper>
  );
}

export function AdaptiveMetric({ label, value, accent = "#2563EB" }) {
  return (
    <Paper elevation={0} sx={{ minHeight: 108, border: "1px solid #D6E1EA", borderTop: `4px solid ${accent}`, borderRadius: 2, p: 2, background: "#FFFFFF" }}>
      <Typography sx={{ color: "#64748B", fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>{label}</Typography>
      <Typography sx={{ mt: 1, color: "#0F172A", fontSize: 22, fontWeight: 950, overflowWrap: "anywhere" }}>
        {value ?? "--"}
      </Typography>
    </Paper>
  );
}

export function AdaptiveStateChip({ label, value, color = "#F1F5F9" }) {
  return (
    <Chip
      size="small"
      label={label ? `${label} ${value ?? "--"}` : value ?? "--"}
      sx={{ bgcolor: color, color: "#0F172A", fontWeight: 950, maxWidth: "100%", "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" } }}
    />
  );
}

export function AdaptiveNumberPill({ item, hit = false }) {
  const number = typeof item === "number" ? item : item?.number;
  const rank = typeof item === "number" ? null : item?.rank;
  return (
    <Box
      component="span"
      title={rank ? `Rank ${rank}` : undefined}
      sx={{ minWidth: 38, height: 36, px: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 999, bgcolor: hit ? "#FDE68A" : "#EFF6FF", color: hit ? "#78350F" : "#0B1F2A", border: hit ? "2px solid #F59E0B" : "1px solid #BFDBFE", fontWeight: 950 }}
    >
      {formatAdaptiveNumber(number)}
    </Box>
  );
}

export function AdaptiveDataTable({ title, rows = [], columns, limit }) {
  const visibleRows = limit ? rows.slice(0, limit) : rows;
  return (
    <AdaptiveSection title={title}>
      {!visibleRows.length ? (
        <Typography sx={{ color: "#64748B", fontWeight: 800 }}>No data available yet.</Typography>
      ) : (
        <Box sx={{ overflowX: "auto" }}>
          <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
            <Box component="thead">
              <Box component="tr" sx={{ borderBottom: "1px solid #CBD5E1" }}>
                {columns.map((column) => (
                  <Box component="th" key={column.key} sx={{ textAlign: "left", p: 1, color: "#64748B", fontSize: 12, fontWeight: 950 }}>
                    {column.label}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box component="tbody">
              {visibleRows.map((row, index) => (
                <Box component="tr" key={row.id ?? `${title}-${index}`} sx={{ borderBottom: "1px solid #E2E8F0" }}>
                  {columns.map((column) => (
                    <Box component="td" key={column.key} sx={{ p: 1, fontWeight: 800, color: "#0F172A", overflowWrap: "anywhere" }}>
                      {column.render ? column.render(row, index) : row[column.key] ?? "--"}
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </AdaptiveSection>
  );
}
