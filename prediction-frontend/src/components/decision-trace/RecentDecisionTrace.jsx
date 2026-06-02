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
    <SystemSectionCard title="Lịch sử luồng quyết định" subtitle="20 decision trace gần nhất nếu backend có dữ liệu.">
      {sourceRows.length > 0 ? (
        <TableContainer
          sx={{
            maxHeight: 540,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
          }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {["Thời gian", "Mẫu", "Chế độ", "Tóm tắt", "Số dòng trọng số", "Giới hạn tăng cường"].map((head) => (
                  <TableCell
                    key={head}
                    sx={{ color: "white", fontWeight: 900, backgroundColor: "#10131b" }}
                  >
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sourceRows.map((row, index) => (
                <TableRow key={`${row?.id ?? row?.createdAt ?? index}-${index}`}>
                  <TableCell sx={{ color: "white", whiteSpace: "nowrap" }}>
                    {formatDate(row?.createdAt ?? row?.targetDate ?? row?.predictionDate)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={translatePatternState(row?.patternState)}
                      sx={{ fontWeight: 900 }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: "white", whiteSpace: "nowrap" }}>
                    {translateMode(row?.mode)}
                  </TableCell>
                  <TableCell sx={{ color: "rgba(255,255,255,0.76)", minWidth: 280 }}>
                    {row?.summary || "Chưa có dữ liệu"}
                  </TableCell>
                  <TableCell sx={{ color: "white" }}>{row?.weightDecisions?.length ?? 0}</TableCell>
                  <TableCell sx={{ color: "white" }}>
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
            border: `1px dashed ${alpha(theme.palette.common.white, 0.16)}`,
            textAlign: "center",
            color: "rgba(255,255,255,0.72)",
          }}
        >
          <Typography>Chưa có lịch sử luồng quyết định.</Typography>
        </Box>
      )}
    </SystemSectionCard>
  );
}
