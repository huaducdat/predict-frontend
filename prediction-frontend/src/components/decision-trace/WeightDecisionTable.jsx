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
      color: theme.palette.success.light,
      backgroundColor: alpha(theme.palette.success.main, 0.14),
      border: `1px solid ${alpha(theme.palette.success.main, 0.32)}`,
    };
  }
  if (value === "DOWN") {
    return {
      color: theme.palette.error.light,
      backgroundColor: alpha(theme.palette.error.main, 0.14),
      border: `1px solid ${alpha(theme.palette.error.main, 0.32)}`,
    };
  }
  return {
    color: theme.palette.grey[300],
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
            border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
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
                    sx={{ color: "white", fontWeight: 900, backgroundColor: "#10131b" }}
                  >
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row?.predictorKey}>
                  <TableCell sx={{ color: "white", fontWeight: 900 }}>{row?.predictorKey}</TableCell>
                  <TableCell sx={{ color: "white" }}>{formatPercent(row?.baseWeight)}</TableCell>
                  <TableCell sx={{ color: "white" }}>{formatFactor(row?.performanceFactor)}</TableCell>
                  <TableCell sx={{ color: "white" }}>{formatFactor(row?.patternFactor)}</TableCell>
                  <TableCell sx={{ color: "white" }}>{formatPercent(row?.rawEffectiveWeight)}</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 900 }}>
                    {formatPercent(row?.effectiveWeight)}
                  </TableCell>
                  <TableCell sx={{ color: "white" }}>{formatDeltaPercent(row?.deltaPercent)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={translateDirection(row?.direction)}
                      sx={{ fontWeight: 900, ...directionSx(row?.direction, theme) }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: "rgba(255,255,255,0.76)", minWidth: 220 }}>
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
            border: `1px dashed ${alpha(theme.palette.common.white, 0.16)}`,
            textAlign: "center",
            color: "rgba(255,255,255,0.72)",
          }}
        >
          <Typography>Chưa có dữ liệu điều chỉnh trọng số.</Typography>
        </Box>
      )}
    </SystemSectionCard>
  );
}
