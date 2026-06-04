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
import { formatDeltaPercent, formatFactor, formatPercent, translateDirection } from "./format";

function directionSx(direction, theme) {
  const value = String(direction || "NEUTRAL").toUpperCase();
  if (value === "UP") {
    return {
      color: theme.palette.success.dark,
      backgroundColor: alpha(theme.palette.success.main, 0.14),
      border: `1px solid ${alpha(theme.palette.success.main, 0.32)}`,
    };
  }
  if (value === "DOWN") {
    return {
      color: theme.palette.error.dark,
      backgroundColor: alpha(theme.palette.error.main, 0.14),
      border: `1px solid ${alpha(theme.palette.error.main, 0.32)}`,
    };
  }
  return {
    color: theme.palette.grey[700],
    backgroundColor: alpha(theme.palette.grey[500], 0.14),
    border: `1px solid ${alpha(theme.palette.grey[500], 0.26)}`,
  };
}

export default function WeightDecisionTable({ rows }) {
  const theme = useTheme();
  const items = Array.isArray(rows) ? rows : [];

  return (
    <SystemSectionCard
      title="Điều chỉnh trọng số"
      subtitle="Trọng số nền nhân hệ số hiệu suất và hệ số mẫu, sau đó chuẩn hóa thành trọng số cuối."
    >
      {items.length > 0 ? (
        <TableContainer
          sx={{
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            overflowX: "auto",
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                {[
                  "Bộ dự đoán",
                  "Trọng số nền",
                  "Hệ số hiệu suất",
                  "Hệ số mẫu",
                  "Hiệu lực thô",
                  "Hiệu lực cuối",
                  "Độ lệch",
                  "Hướng",
                  "Giải thích",
                ].map((head) => (
                  <TableCell
                    key={head}
                    sx={{ color: "#0F172A", fontWeight: 900, backgroundColor: "#EEF4FF" }}
                  >
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row?.predictorKey}>
                  <TableCell sx={{ color: "#0F172A", fontWeight: 900 }}>{row?.predictorKey}</TableCell>
                  <TableCell sx={{ color: "#334155", fontFamily: "'Courier New', monospace" }}>{formatPercent(row?.baseWeight)}</TableCell>
                  <TableCell sx={{ color: "#334155", fontFamily: "'Courier New', monospace" }}>{formatFactor(row?.performanceFactor)}</TableCell>
                  <TableCell sx={{ color: "#334155", fontFamily: "'Courier New', monospace" }}>{formatFactor(row?.patternFactor)}</TableCell>
                  <TableCell sx={{ color: "#334155", fontFamily: "'Courier New', monospace" }}>{formatPercent(row?.rawEffectiveWeight)}</TableCell>
                  <TableCell sx={{ color: "#1D4ED8", fontWeight: 950, fontFamily: "'Courier New', monospace" }}>
                    {formatPercent(row?.effectiveWeight)}
                  </TableCell>
                  <TableCell sx={{ color: row?.deltaPercent > 0 ? "#15803D" : row?.deltaPercent < 0 ? "#B91C1C" : "#475569", fontWeight: 900, fontFamily: "'Courier New', monospace" }}>
                    {formatDeltaPercent(row?.deltaPercent)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={translateDirection(row?.direction)}
                      sx={{ fontWeight: 900, ...directionSx(row?.direction, theme) }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: "#475569", minWidth: 220 }}>
                    {row?.explanation || "Chưa có giải thích"}
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
            border: `1px dashed ${theme.palette.divider}`,
            textAlign: "center",
            color: theme.palette.text.secondary,
          }}
        >
          <Typography>Chưa có dữ liệu điều chỉnh trọng số.</Typography>
        </Box>
      )}
    </SystemSectionCard>
  );
}
