import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  Stack,
  Button,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect, useState } from "react";
import { getAllSessions, deleteSession } from "../api/betApi";
import { useNavigate } from "react-router-dom";
import { vi } from "../i18n/vi";

const PAGE_SIZE = 10;

function BetHistoryDialog({ open, onClose }) {
  const [list, setList] = useState([]);
  const [page, setPage] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      const data = await getAllSessions();
      setList(data.sort((a, b) => b.date.localeCompare(a.date)));
      setPage(0);
    };

    load();
  }, [open]);

  const formatVND = (value) =>
    Number(value || 0).toLocaleString("vi-VN") + " ₫";

  const start = page * PAGE_SIZE;
  const current = list.slice(start, start + PAGE_SIZE);
  const totalPage = Math.ceil(list.length / PAGE_SIZE);

  const handleDelete = async (date) => {
    if (!window.confirm(`${vi.common.delete} phiên này?`)) return;

    try {
      const res = await deleteSession(date);

      if (!res.success) {
        alert(vi.common.deleteFailed);
        return;
      }

      setList((prev) => prev.filter((x) => x.date !== date));
    } catch (e) {
      alert(vi.common.systemError);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      scroll="paper"
      disableRestoreFocus
    >
      <DialogTitle>{vi.bet.history}</DialogTitle>

      <DialogContent sx={{ maxHeight: "70vh", overflowY: "auto" }}>
        <Stack spacing={1}>
          {current.map((item, i) => {
            const totalMoney = item.totalPoint * item.unitValue;

            return (
              <Box
                key={i}
                sx={{
                  position: "relative",
                  p: 2,
                  borderRadius: 2,
                  cursor: "pointer",
                  background: "linear-gradient(135deg, #f5f7ff, #eef1ff)",
                  "&:hover": {
                    background: "#e3e8ff",
                  },
                }}
                onClick={() => {
                  if (!item.date) return;

                  onClose();
                  navigate(`/bet/${item.date}`);
                }}
              >
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.date);
                  }}
                  sx={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    background: "#fff",
                    border: "1px solid #ddd",
                    "&:hover": {
                      background: "#ffebee",
                      borderColor: "#f44336",
                    },
                  }}
                >
                  <CloseIcon sx={{ fontSize: 16, color: "#f44336" }} />
                </IconButton>

                <Typography>
                  {vi.common.date}: <b>{item.date}</b>
                </Typography>

                <Typography>
                  {vi.bet.totalPoint}: {item.totalPoint}
                </Typography>

                <Typography>
                  {vi.bet.totalBet}: {formatVND(totalMoney)}
                </Typography>
              </Box>
            );
          })}
        </Stack>

        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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
              {"<"}
            </Box>

            <Box sx={{ width: 80, textAlign: "center", fontWeight: 600, color: "#555" }}>
              {page + 1} / {totalPage || 1}
            </Box>

            <Box
              onClick={() => page < totalPage - 1 && setPage(page + 1)}
              sx={{
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                cursor: page >= totalPage - 1 ? "default" : "pointer",
                background: page >= totalPage - 1 ? "#eee" : "#f5f7ff",
              }}
            >
              {">"}
            </Box>
          </Box>
        </Box>

        <Button fullWidth sx={{ mt: 2 }} onClick={onClose}>
          {vi.common.close}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default BetHistoryDialog;
