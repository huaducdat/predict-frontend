import {
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  Paper,
  Stack,
} from "@mui/material";
import { useEffect, useState } from "react";

import BetRow from "../components/BetRow";
import {
  getLastUnit,
  checkExists,
  saveBet,
  loadBet,
} from "../api/betApi";

import BetHistoryDialog from "../components/BetHistoryDialog";
import { vi } from "../i18n/vi";

function BetPage() {
  const [date, setDate] = useState("");
  const [unit, setUnit] = useState("");
  const [unitDisplay, setUnitDisplay] = useState("");
  const [rows, setRows] = useState([{ number: "", point: "" }]);
  const [openHistory, setOpenHistory] = useState(false);

  const formatVND = (value) => {
    if (!value || isNaN(value)) return "0 ₫";
    return Number(value).toLocaleString("vi-VN") + " ₫";
  };

  useEffect(() => {
    const init = async () => {
      const last = await getLastUnit();
      setUnit(last);
      setUnitDisplay(formatVND(last));
    };
    init();
  }, []);

  useEffect(() => {
    if (!date) return;

    const fetchData = async () => {
      try {
        const data = await loadBet(date);
        const betMap = data?.bets || data || {};

        if (!betMap || Object.keys(betMap).length === 0) {
          setRows([{ number: "", point: "" }]);
          return;
        }

        if (data?.unitValue) {
          setUnit(data.unitValue);
          setUnitDisplay(formatVND(data.unitValue));
        }

        setRows(
          Object.entries(betMap).map(([number, point]) => ({
            number,
            point,
          })),
        );
      } catch (e) {
        console.error(e);
        setRows([{ number: "", point: "" }]);
      }
    };

    fetchData();
  }, [date]);

  const addRow = () => {
    setRows([...rows, { number: "", point: "" }]);
  };

  const removeRow = (i) => {
    setRows(rows.filter((_, idx) => idx !== i));
  };

  const updateRow = (i, field, value) => {
    const newRows = [...rows];
    newRows[i][field] = value;
    setRows(newRows);
  };

  const validate = () => {
    const nums = rows.map((r) => r.number);

    if (new Set(nums).size !== nums.length) {
      alert(vi.bet.duplicatedNumber);
      return false;
    }

    for (let r of rows) {
      if (!r.number || r.number < 0 || r.number > 99) {
        alert(vi.bet.invalidNumber);
        return false;
      }
      if (!r.point || r.point <= 0) {
        alert(vi.bet.invalidPoint);
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const exists = await checkExists(date);

    if (exists) {
      const ok = window.confirm(vi.bet.overwriteConfirm);
      if (!ok) return;
    }

    const bets = {};
    rows.forEach((r) => {
      bets[r.number] = Number(r.point);
    });

    await saveBet({
      date,
      unitValue: Number(unit),
      bets,
    });

    alert(vi.bet.saved);
  };

  const totalPoint = rows.reduce((sum, r) => sum + Number(r.point || 0), 0);
  const totalMoney = totalPoint * (Number(unit) || 0);

  return (
    <Box sx={{ maxWidth: 620, mx: "auto", mt: 5, px: 2 }}>
      <Paper
        sx={{
          p: 3,
          borderRadius: 4,
          backdropFilter: "blur(12px)",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(240,240,255,0.7))",
        }}
      >
        <BetHistoryDialog
          open={openHistory}
          onClose={() => setOpenHistory(false)}
        />

        <Button onClick={() => setOpenHistory(true)} sx={{ mb: 2 }}>
          {vi.bet.history}
        </Button>

        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
          {vi.bet.title}
        </Typography>

        <Stack spacing={2} sx={{ mb: 2 }}>
          <TextField
            type="date"
            fullWidth
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <TextField
            label={vi.bet.unitPrice}
            fullWidth
            value={unitDisplay}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "");
              setUnit(raw);
              setUnitDisplay(raw);
            }}
            onBlur={() => setUnitDisplay(formatVND(unit))}
            onFocus={() => setUnitDisplay(unit)}
          />
        </Stack>

        <Divider sx={{ my: 2 }} />

        {rows.map((row, i) => (
          <BetRow
            key={i}
            row={row}
            index={i}
            onChange={updateRow}
            onRemove={removeRow}
          />
        ))}

        <Button onClick={addRow} sx={{ mt: 1 }}>
          {vi.bet.addNumber}
        </Button>

        <Divider sx={{ my: 3 }} />

        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            background: "linear-gradient(135deg, #f5f7ff, #eef1ff)",
          }}
        >
          <Typography>
            {vi.bet.totalPoint}: <b>{totalPoint}</b>
          </Typography>

          <Typography>
            {vi.bet.totalBet}: <b style={{ color: "#1976d2" }}>{formatVND(totalMoney)}</b>
          </Typography>

          <Typography sx={{ fontSize: 12, color: "#777" }}>
            {vi.bet.formula}
          </Typography>
        </Box>

        <Button variant="contained" fullWidth onClick={handleSave} sx={{ mt: 3 }}>
          {vi.common.save}
        </Button>
      </Paper>
    </Box>
  );
}

export default BetPage;
