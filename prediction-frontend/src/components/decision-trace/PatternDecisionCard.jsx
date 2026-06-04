import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import SystemSectionCard from "../systemEvaluation/SystemSectionCard";
import { formatMetric, translatePatternState } from "./format";

const METRICS = [
  ["Entropy", "entropy"],
  ["Độ trùng gần đây", "recentOverlap"],
  ["Độ trùng kích hoạt", "activationOverlap"],
  ["Độ lệch nền", "baselineShift"],
  ["Tỷ lệ số mới", "newNumberRatio"],
  ["Độ lệch nhóm", "groupShiftScore"],
  ["Tỷ lệ lặp", "repeatRatio"],
];

function metricValue(data, key) {
  return data?.[key];
}

function ListBlock({ title, items, emptyText }) {
  const theme = useTheme();
  const rows = Array.isArray(items) ? items.filter(Boolean) : [];

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: theme.palette.text.primary }}>
        {title}
      </Typography>
      {rows.length > 0 ? (
        rows.map((item, index) => (
          <Box
            key={`${item}-${index}`}
            sx={{
              p: 1.2,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: "#F8FAFC",
            }}
          >
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              {item}
            </Typography>
          </Box>
        ))
      ) : (
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          {emptyText}
        </Typography>
      )}
    </Stack>
  );
}

export default function PatternDecisionCard({ data }) {
  const theme = useTheme();
  const state = data?.state;

  return (
    <SystemSectionCard
      title="Quyết định mẫu"
      subtitle="Các chỉ số được dùng để phân loại trạng thái vận hành."
      action={
        <Chip
          label={translatePatternState(state)}
          sx={{
            color: theme.palette.primary.dark,
            backgroundColor: alpha(theme.palette.info.main, 0.16),
            border: `1px solid ${alpha(theme.palette.info.main, 0.32)}`,
            fontWeight: 900,
          }}
        />
      }
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
          gap: 1.2,
        }}
      >
        {METRICS.map(([label, key]) => (
          <Box
            key={key}
            sx={{
              p: 1.35,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: "#F8FAFC",
            }}
          >
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              {label}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              {formatMetric(metricValue(data, key))}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}>
        <ListBlock
          title="Lý do phân loại"
          items={data?.reasons}
          emptyText="Chưa có lý do phân loại"
        />
        <ListBlock
          title="Dấu vết ngưỡng"
          items={data?.thresholdTrace}
          emptyText="Chưa có dấu vết ngưỡng"
        />
      </Box>
    </SystemSectionCard>
  );
}
