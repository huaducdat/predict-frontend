import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import SystemSectionCard from "../systemEvaluation/SystemSectionCard";
import { formatFactor, translatePatternState } from "./format";

export default function BoostDecisionCard({ data }) {
  const theme = useTheme();
  const hasPairBoost = data?.pairTimeBoost !== undefined && data?.pairTimeBoost !== null;
  const hasRepeatBoost = data?.repeatStreakBoost !== undefined && data?.repeatStreakBoost !== null;
  const note =
    data?.note ||
    (!hasPairBoost && !hasRepeatBoost
      ? "Backend hiện chưa lưu intermediate boost trace, chỉ đọc được boost cap."
      : "");

  return (
    <SystemSectionCard title="Quyết định tăng cường" subtitle="Giới hạn tăng cường được chọn theo trạng thái mẫu.">
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 1.2 }}>
        <Stack
          spacing={0.8}
          sx={{
            p: 1.5,
            borderRadius: 2,
            backgroundColor: "#F8FAFC",
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            Trạng thái pattern
          </Typography>
          <Chip label={translatePatternState(data?.patternState)} sx={{ alignSelf: "flex-start", fontWeight: 900 }} />
        </Stack>
        <Stack
          spacing={0.8}
          sx={{
            p: 1.5,
            borderRadius: 2,
            backgroundColor: "#F8FAFC",
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            Giới hạn tăng cường đang dùng
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            {formatFactor(data?.boostCapUsed)}
          </Typography>
        </Stack>
        <Stack
          spacing={0.8}
          sx={{
            p: 1.5,
            borderRadius: 2,
            backgroundColor: "#F8FAFC",
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            Tăng cường chi tiết
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            PAIR x TIME: {hasPairBoost ? formatFactor(data?.pairTimeBoost) : "Chưa có dữ liệu"}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            REP x STRK: {hasRepeatBoost ? formatFactor(data?.repeatStreakBoost) : "Chưa có dữ liệu"}
          </Typography>
        </Stack>
      </Box>

      {note && (
        <Box
          sx={{
            p: 1.25,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.warning.main, 0.26)}`,
            backgroundColor: alpha(theme.palette.warning.main, 0.08),
          }}
        >
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            {note}
          </Typography>
        </Box>
      )}
    </SystemSectionCard>
  );
}
