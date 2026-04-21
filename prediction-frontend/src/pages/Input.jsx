import { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  Stack,
} from "@mui/material";

export default function Input() {
  const [numbers, setNumbers] = useState([]);
  const [special, setSpecial] = useState(null);
  const [date, setDate] = useState("");
  const [mode, setMode] = useState("normal"); // normal | special

  const allNumbers = Array.from({ length: 100 }, (_, i) =>
    i.toString().padStart(2, "0"),
  );

  // 👉 CLICK
  const handleClick = (num) => {
    if (mode === "special") {
      setSpecial(num);
      return;
    }

    setNumbers((prev) => {
      if (prev.length >= 26) return prev;
      return [...prev, num];
    });
  };

  // 👉 REMOVE
  const removeNumber = (index) => {
    setNumbers((prev) => prev.filter((_, i) => i !== index));
  };

  // 👉 COUNT MAP
  const countMap = numbers.reduce((acc, num) => {
    acc[num] = (acc[num] || 0) + 1;
    return acc;
  }, {});

  // 👉 SUBMIT
  const handleSubmit = () => {
    if (!date) return alert("Chọn ngày");
    if (numbers.length !== 27) return alert("Phải đủ 27 số");
    if (!special) return alert("Chưa chọn số đặc biệt");

    console.log({
      date,
      singleNumber: special,
      numbers,
    });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* TITLE */}
      <Typography variant="h4" mb={3}>
        Nhập kết quả
      </Typography>

      {/* DATE */}
      <TextField
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        sx={{ mb: 3 }}
      />

      {/* MODE */}
      <Stack direction="row" spacing={2} mb={3}>
        <Button
          variant={mode === "normal" ? "contained" : "outlined"}
          onClick={() => setMode("normal")}
        >
          Thêm số
        </Button>

        <Button
          variant={mode === "special" ? "contained" : "outlined"}
          onClick={() => setMode("special")}
        >
          Chọn số đặc biệt
        </Button>
      </Stack>

      {/* SPECIAL */}
      <Box mb={2}>
        <Typography>
          Số đặc biệt:{" "}
          <Paper
            sx={{
              display: "inline-block",
              mt: 1,
              px: 3,
              py: 1.5,
              borderRadius: "20px",
              background: "#000",
              color: "gold",
              fontWeight: "bold",
              textAlign: "center",
              minWidth: 60,
            }}
          >
            {special || "--"}
          </Paper>
        </Typography>
      </Box>

      {/* SELECTED LIST */}
      <Box mb={3}>
        <Typography variant="h5" >
          Danh sách đã chọn:{" "}
          <Typography sx={{ mb: 2 }}>Số thường: {numbers.length}/26</Typography>
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            mt: 1,
          }}
        >
          {numbers.map((num, index) => (
            <Paper
              key={index}
              onClick={() => removeNumber(index)}
              sx={{
                px: 2,
                py: 1,
                cursor: "pointer",
                background:
                  num === special
                    ? "linear-gradient(135deg, gold, orange)"
                    : "rgba(0, 0, 0, 0.1)",
              }}
            >
              {num}
            </Paper>
          ))}
        </Box>
      </Box>

      {/* GRID */}
      <Grid container spacing={1}>
        {allNumbers.map((num) => {
          const count = countMap[num] || 0;

          return (
            <Grid item xs={2} sm={1} key={num}>
              <Paper
                onClick={() => handleClick(num)}
                sx={{
                  width: "30px",
                  textAlign: "center",
                  py: 1.5,
                  cursor: "pointer",
                  background:
                    num === special
                      ? "linear-gradient(135deg, gold, orange)"
                      : count > 0
                        ? "linear-gradient(135deg, #6a5cff, #00c6ff)"
                        : "rgba(255,255,255,0.05)",
                  "&:hover": {
                    background: "rgba(255,255,255,0.2)",
                  },
                }}
              >
                {num}
                {count > 0 && <Box sx={{ fontSize: 12 }}>x{count}</Box>}
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* SUBMIT */}
      <Box mt={4} sx={{ display: "flex", flexDirection: "row", gap: 3 }}>
        <Button
          variant="outlined"
          size="large"
          onClick={() => {
            setNumbers([]);
            setSpecial(null);
            setDate("");
          }}
        >
          Reset
        </Button>
        <Button variant="contained" size="large" onClick={handleSubmit}>
          Lưu dự đoán
        </Button>
      </Box>
    </Box>
  );
}
