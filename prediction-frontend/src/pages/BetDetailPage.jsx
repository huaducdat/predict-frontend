import {
  Typography,
  Box,
  Stack,
  TextField,
  Divider,
  Button,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { checkByDate, loadBet } from "../api/betApi";

function BetDetailPage() {
  const { date } = useParams();
  const navigate = useNavigate();

  const [checkData, setCheckData] = useState(null);
  const [betData, setBetData] = useState(null);

  // Giá 1 điểm khi chơi
  const [unit, setUnit] = useState(1000);
  const [originUnit, setOriginUnit] = useState(null);

  // Giá 1 điểm khi trúng
  const [payout, setPayout] = useState(80000);

  useEffect(() => {
    if (!date) return;

    const load = async () => {
      try {
        const check = await checkByDate(date);
        const bet = await loadBet(date);

        setCheckData(check);
        setBetData(bet);

        if (bet?.unitValue) {
          setUnit(bet.unitValue);
          setOriginUnit(bet.unitValue);
        }
      } catch (e) {
        console.error("LOAD ERROR:", e);
      }
    };

    load();
  }, [date]);

  const formatVND = (v) =>
    Number(v || 0).toLocaleString("vi-VN") + " ₫";

  if (!checkData || !betData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Đang tải dữ liệu...</Typography>
      </Box>
    );
  }

  const hitMap = {};
  checkData.items?.forEach((i) => {
    hitMap[i.number] = i.hit;
  });

  const betMap = betData.bets || betData || {};

  const items = Object.entries(betMap)
    .map(([number, point]) => ({
      number: Number(number),
      point: Number(point || 0),
      hit: hitMap[number] || 0,
    }))
    .sort((a, b) => {
      if (b.hit !== a.hit) return b.hit - a.hit;
      return b.point - a.point;
    });

  const totalBet = items.reduce(
    (sum, i) => sum + i.point * unit,
    0
  );

  const totalWin = items.reduce(
    (sum, i) => sum + i.hit * i.point * payout,
    0
  );

  const profit = totalWin - totalBet;

  return (
    <Box sx={{ maxWidth: 760, mx: "auto", p: 3 }}>
      <Button onClick={() => navigate(-1)}>← Quay lại</Button>

      <Typography variant="h6" sx={{ mt: 1, mb: 1 }}>
        📅 {date}
      </Typography>

      {originUnit && (
        <Typography sx={{ mb: 1, color: "#666" }}>
          Giá gốc khi chơi: {formatVND(originUnit)} / điểm
        </Typography>
      )}

      <Typography sx={{ mb: 2 }}>
        Đang tính cược theo: <b>{formatVND(unit)}</b> / điểm
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Giá 1 điểm chơi (₫)"
          value={unit}
          onChange={(e) => setUnit(Number(e.target.value) || 0)}
          fullWidth
        />

        <TextField
          label="Giá 1 điểm thưởng (₫)"
          value={payout}
          onChange={(e) => setPayout(Number(e.target.value) || 0)}
          fullWidth
        />
      </Stack>

      <Box
        sx={{
          p: 1.5,
          mb: 2,
          borderRadius: 2,
          background: "#f5f7ff",
          color: "#555",
          fontSize: 14,
        }}
      >
        <Typography>Cược = Điểm chơi × Giá 1 điểm chơi</Typography>
        <Typography>
          Trúng = Hit × Điểm chơi × Giá 1 điểm thưởng
        </Typography>
        <Typography>Lãi/Lỗ = Tổng trúng - Tổng cược</Typography>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Stack
        direction="row"
        sx={{
          px: 1,
          mb: 1,
          fontWeight: "bold",
          color: "#888",
        }}
      >
        <Box sx={{ width: 60 }}>Số</Box>
        <Box sx={{ width: 80 }}>Điểm</Box>
        <Box sx={{ width: 60 }}>Hit</Box>
        <Box sx={{ flex: 1, textAlign: "right" }}>Tiền trúng</Box>
      </Stack>

      <Stack spacing={1}>
        {items.map((i, idx) => {
          const win = i.hit * i.point * payout;

          return (
            <Box
              key={idx}
              sx={{
                p: 1.5,
                borderRadius: 2,
                background:
                  i.hit > 0
                    ? "linear-gradient(135deg, #e8f5e9, #d7f0da)"
                    : "#f5f5f5",
              }}
            >
              <Stack direction="row" alignItems="center">
                <Box sx={{ width: 60 }}>
                  {String(i.number).padStart(2, "0")}
                </Box>

                <Box sx={{ width: 80 }}>{i.point}</Box>

                <Box
                  sx={{
                    width: 60,
                    color: i.hit > 0 ? "#2e7d32" : "#999",
                    fontWeight: i.hit > 0 ? "bold" : "normal",
                  }}
                >
                  {i.hit}
                </Box>

                <Box
                  sx={{
                    flex: 1,
                    textAlign: "right",
                    color: win > 0 ? "#2e7d32" : "#999",
                    fontWeight: win > 0 ? "bold" : "normal",
                  }}
                >
                  <Typography>{formatVND(win)}</Typography>
                  <Typography sx={{ fontSize: 11, color: "#888" }}>
                    {i.hit} × {i.point} × {payout}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          );
        })}
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Typography>Tổng cược: {formatVND(totalBet)}</Typography>
      <Typography>Trúng: {formatVND(totalWin)}</Typography>

      <Typography
        sx={{
          mt: 1,
          fontWeight: "bold",
          fontSize: 16,
          color: profit >= 0 ? "#2e7d32" : "#d32f2f",
        }}
      >
        Lãi/Lỗ: {formatVND(profit)}
      </Typography>
    </Box>
  );
}

export default BetDetailPage;