import { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  Stack,
  CircularProgress,
} from "@mui/material";
import { createResult } from "../api/resultApi";
import { dispatchPatternStateUpdated } from "../events/patternStateEvents";
import { vi } from "../i18n/vi";

export default function Input() {
  const [numbers, setNumbers] = useState([]);
  const [special, setSpecial] = useState(null);
  const [date, setDate] = useState("");
  const [mode, setMode] = useState("special");
  const [loading, setLoading] = useState(false);

  const allNumbers = Array.from({ length: 100 }, (_, i) =>
    i.toString().padStart(2, "0"),
  );

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

  const removeNumber = (index) => {
    setNumbers((prev) => prev.filter((_, i) => i !== index));
  };

  const countMap = numbers.reduce((acc, num) => {
    acc[num] = (acc[num] || 0) + 1;
    return acc;
  }, {});

  const resetForm = () => {
    setNumbers([]);
    setSpecial(null);
    setDate("");
    setMode("special");
  };

  const handleSubmit = async () => {
    try {
      if (!date) return alert(vi.input.chooseDate);
      if (numbers.length !== 26) return alert(vi.input.needNormalNumbers);
      if (!special) return alert(vi.input.needSpecialNumber);

      setLoading(true);

      const fullNumbers = [...numbers, special]
        .map((n) => parseInt(n))
        .sort((a, b) => a - b);

      await createResult({
        date,
        singleNumber: parseInt(special),
        numbers: fullNumbers,
        force: false,
      });

      dispatchPatternStateUpdated();
      alert(vi.input.saved);
      resetForm();
    } catch (err) {
      if (err.message === "DATE_ALREADY_EXISTS") {
        const ok = window.confirm(vi.input.duplicateConfirm);

        if (ok) {
          try {
            await createResult({
              date,
              singleNumber: parseInt(special),
              numbers: [...numbers, special].map((n) => parseInt(n)),
              force: true,
            });

            dispatchPatternStateUpdated();
            alert(vi.input.overwriteSaved);
            resetForm();
          } catch (e) {
            console.error(e);
            alert(vi.input.overwriteError);
          }
        }
      } else {
        console.error(err);
        alert(vi.input.errorPrefix + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h4" mb={3}>
        {vi.input.title}
      </Typography>

      <TextField
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        sx={{ mb: 3 }}
      />

      <Stack direction="row" spacing={2} mb={3}>
        <Button
          variant={mode === "normal" ? "contained" : "outlined"}
          onClick={() => setMode("normal")}
        >
          {vi.input.addNormal}
        </Button>

        <Button
          variant={mode === "special" ? "contained" : "outlined"}
          onClick={() => setMode("special")}
        >
          {vi.input.chooseSpecial}
        </Button>
      </Stack>

      <Box mb={2}>
        <Typography variant="body1" component="span">
          {vi.input.specialNumber}:{" "}
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

      <Box mb={3}>
        <Typography variant="h5">
          {vi.input.selectedList}:
          <Typography sx={{ mb: 2 }}>
            {vi.input.normalCount}: {numbers.length}/26
          </Typography>
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
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

      <Box mt={4} sx={{ display: "flex", flexDirection: "row", gap: 3 }}>
        <Button variant="outlined" size="large" onClick={resetForm}>
          {vi.common.reset}
        </Button>

        <Button
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={loading || !date || numbers.length !== 26 || special === null}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? vi.common.saving : vi.input.saveResult}
        </Button>
      </Box>
    </Box>
  );
}
