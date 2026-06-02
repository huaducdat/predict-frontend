import {
  Box,
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
import { formatScore } from "./format";

function hasSourceContribution(row) {
  return row?.sourceContributions && Object.keys(row.sourceContributions).length > 0;
}

export default function NumberContributionTable({ rows }) {
  const theme = useTheme();
  const items = Array.isArray(rows) ? rows : [];
  const hasSources = items.some(hasSourceContribution);

  return (
    <SystemSectionCard
      title="Đóng góp số top"
      subtitle="Các điểm đã lưu cho nhóm số đứng đầu trong kết quả combine."
    >
      {!hasSources && (
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.62)" }}>
          Chưa có dữ liệu đóng góp theo predictor/source.
        </Typography>
      )}

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
                {["Số", "Hạng", "Trước tăng cường", "Sau tăng cường", "Điểm cuối", "Tăng cường", "Ghi chú"].map((head) => (
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
                <TableRow key={`${row?.rank}-${row?.number}`}>
                  <TableCell sx={{ color: "white", fontWeight: 950 }}>
                    {String(row?.number ?? "--").padStart(2, "0")}
                  </TableCell>
                  <TableCell sx={{ color: "white" }}>{row?.rank ?? "Chưa có dữ liệu"}</TableCell>
                  <TableCell sx={{ color: "white" }}>{formatScore(row?.beforeBoostScore)}</TableCell>
                  <TableCell sx={{ color: "white" }}>{formatScore(row?.afterBoostScore)}</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 900 }}>
                    {formatScore(row?.afterSoftmaxScore)}
                  </TableCell>
                  <TableCell sx={{ color: "white" }}>{formatScore(row?.boostContribution)}</TableCell>
                  <TableCell sx={{ color: "rgba(255,255,255,0.72)", minWidth: 240 }}>
                    {row?.note || "Chưa có ghi chú"}
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
          <Typography>Chưa có dữ liệu số top.</Typography>
        </Box>
      )}
    </SystemSectionCard>
  );
}
