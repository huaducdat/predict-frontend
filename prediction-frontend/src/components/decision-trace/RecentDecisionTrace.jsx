import {
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import SystemSectionCard from "../systemEvaluation/SystemSectionCard";
import { formatDate, formatFactor, translateMode, translatePatternState } from "./format";

export default function RecentDecisionTrace({ rows, fallback }) {
  const theme = useTheme();
  const sourceRows = Array.isArray(rows) && rows.length > 0 ? rows : fallback ? [fallback] : [];

  return (
    <SystemSectionCard
      title="Lịch sử luồng quyết định"
      subtitle="20 decision trace gần nhất nếu backend có dữ liệu."
    >
      {sourceRows.length > 0 ? (
        <TableContainer
          sx={{
            maxHeight: 540,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {["Thời gian", "Mẫu", "Chế độ", "Tóm tắt", "Số dòng trọng số", "Giới hạn tăng cường"].map((head) => (
                  <TableCell
                    key={head}
                    sx={{
                      color: theme.palette.text.primary,
                      fontWeight: 900,
                      backgroundColor: "#EEF4FF",
                    }}
                  >
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sourceRows.map((row, index) => (
                <TableRow
                  key={`${row?.id ?? row?.createdAt ?? index}-${index}`}
                  sx={{
                    "&:nth-of-type(odd)": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.025),
                    },
                  }}
                >
                  <TableCell sx={{ color: theme.palette.text.primary, whiteSpace: "nowrap" }}>
                    {formatDate(row?.createdAt ?? row?.targetDate ?? row?.predictionDate)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={translatePatternState(row?.patternState)}
                      sx={{ fontWeight: 900 }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: theme.palette.text.primary, whiteSpace: "nowrap" }}>
                    {translateMode(row?.mode)}
                  </TableCell>
                  <TableCell sx={{ color: theme.palette.text.secondary, minWidth: 280 }}>
                    {row?.summary || "Chưa có dữ liệu"}
                  </TableCell>
                  <TableCell sx={{ color: theme.palette.text.primary }}>{row?.weightDecisions?.length ?? 0}</TableCell>
                  <TableCell sx={{ color: theme.palette.text.primary }}>
                    {formatFactor(row?.boostDecision?.boostCapUsed)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box
          sx={{
            p: 3,
            borderRadius: 2,
            border: `1px dashed ${alpha(theme.palette.text.secondary, 0.28)}`,
            textAlign: "center",
            color: theme.palette.text.secondary,
            backgroundColor: "#F8FAFC",
          }}
        >
          <Typography>Chưa có lịch sử luồng quyết định.</Typography>
        </Box>
      )}
    </SystemSectionCard>
  );
}
