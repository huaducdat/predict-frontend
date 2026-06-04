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
import { useTheme } from "@mui/material/styles";

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
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          Chưa có intermediate trace theo predictor/source; bảng đang hiển thị điểm cuối đã lưu.
        </Typography>
      )}

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
                {["Số", "Hạng", "Trước tăng cường", "Sau tăng cường", "Điểm cuối", "Tăng cường", "Ghi chú"].map((head) => (
                  <TableCell key={head} sx={{ color: "#0F172A", fontWeight: 900, backgroundColor: "#EEF4FF" }}>
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((row) => (
                <TableRow key={`${row?.rank}-${row?.number}`}>
                  <TableCell sx={{ color: "#1D4ED8", fontWeight: 950, fontFamily: "'Courier New', monospace" }}>
                    {String(row?.number ?? "--").padStart(2, "0")}
                  </TableCell>
                  <TableCell sx={{ color: "#334155" }}>{row?.rank ?? "Chưa có dữ liệu"}</TableCell>
                  <TableCell sx={{ color: "#334155", fontFamily: "'Courier New', monospace" }}>
                    {formatScore(row?.beforeBoostScore)}
                  </TableCell>
                  <TableCell sx={{ color: "#334155", fontFamily: "'Courier New', monospace" }}>
                    {formatScore(row?.afterBoostScore)}
                  </TableCell>
                  <TableCell sx={{ color: "#1D4ED8", fontWeight: 900, fontFamily: "'Courier New', monospace" }}>
                    {formatScore(row?.afterSoftmaxScore)}
                  </TableCell>
                  <TableCell sx={{ color: "#334155", fontFamily: "'Courier New', monospace" }}>
                    {formatScore(row?.boostContribution)}
                  </TableCell>
                  <TableCell sx={{ color: "#475569", minWidth: 240 }}>
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
            border: `1px dashed ${theme.palette.divider}`,
            textAlign: "center",
            color: theme.palette.text.secondary,
          }}
        >
          <Typography>Chưa có dữ liệu số top.</Typography>
        </Box>
      )}
    </SystemSectionCard>
  );
}
