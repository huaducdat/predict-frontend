import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  Stack,
  Button,
} from "@mui/material";
import { useEffect, useState } from "react";
import { getAllSessions } from "../api/betApi";
import { useNavigate } from "react-router-dom";

const PAGE_SIZE = 10;

function BetHistoryDialog({ open, onClose }) {
  const [list, setList] = useState([]);
  const [page, setPage] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      const data = await getAllSessions();

      const sorted = data.sort((a, b) =>
        b.date.localeCompare(a.date)
      );

      setList(sorted);
      setPage(0);
    };

    load();
  }, [open]);

  const formatVND = (value) =>
    Number(value || 0).toLocaleString("vi-VN") + " ₫";

  // ===== PAGINATION =====
  const start = page * PAGE_SIZE;
  const current = list.slice(start, start + PAGE_SIZE);
  const totalPage = Math.ceil(list.length / PAGE_SIZE);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      scroll="paper"
        disableRestoreFocus // 🔥 THÊM DÒNG NÀY
    >
      <DialogTitle>📊 Lịch sử cược</DialogTitle>

      <DialogContent
        sx={{
          maxHeight: "70vh",
          overflowY: "auto",
        }}
      >
        {/* LIST */}
        <Stack spacing={1}>
          {current.map((item, i) => {
            const totalMoney =
              item.totalPoint * item.unitValue;

            return (
              <Box
                key={i}
                onClick={() => {
                  if (!item.date) {
                    console.error("DATE lỗi:", item);
                    return;
                  }

                  onClose(); // 🔥 đóng dialog
                  navigate(`/bet/${item.date}`); // 🔥 chuyển trang
                }}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  cursor: "pointer",
                  background:
                    "linear-gradient(135deg, #f5f7ff, #eef1ff)",
                  "&:hover": {
                    background: "#e3e8ff",
                  },
                }}
              >
                <Typography>
                  📅 <b>{item.date}</b>
                </Typography>

                <Typography>
                  🔢 {item.totalPoint} điểm
                </Typography>

                <Typography>
                  💰 {formatVND(totalMoney)}
                </Typography>
              </Box>
            );
          })}
        </Stack>

        {/* PAGINATION */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mt: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            {/* LEFT */}
            <Box
              onClick={() => page > 0 && setPage(page - 1)}
              sx={{
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                cursor: page === 0 ? "default" : "pointer",
                background: page === 0 ? "#eee" : "#f5f7ff",
              }}
            >
              ‹
            </Box>

            {/* TEXT */}
            <Box
              sx={{
                width: 80,
                textAlign: "center",
                fontWeight: 600,
                color: "#555",
              }}
            >
              {page + 1} / {totalPage || 1}
            </Box>

            {/* RIGHT */}
            <Box
              onClick={() =>
                page < totalPage - 1 &&
                setPage(page + 1)
              }
              sx={{
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                cursor:
                  page >= totalPage - 1
                    ? "default"
                    : "pointer",
                background:
                  page >= totalPage - 1
                    ? "#eee"
                    : "#f5f7ff",
              }}
            >
              ›
            </Box>
          </Box>
        </Box>

        {/* CLOSE */}
        <Button fullWidth sx={{ mt: 2 }} onClick={onClose}>
          Đóng
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default BetHistoryDialog;