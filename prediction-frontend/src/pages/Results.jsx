import { useEffect, useState } from "react";
import { getAllResults, getResultsByDate } from "../api/resultApi";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Stack,
  Alert,
} from "@mui/material";

function Results() {
  const [data, setData] = useState([]);
  const [date, setDate] = useState("");
  const [error, setError] = useState("");

  const loadAll = async () => {
    try {
      const res = await getAllResults();
      setData(res);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadByDate = async () => {
    try {
      const res = await getResultsByDate(date);
      setData(res);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      {/* Title */}
      <Typography variant="h4" gutterBottom>
        Result Data
      </Typography>

      {/* Filter */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="Date"
          placeholder="YYYY-MM-DD"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          size="small"
        />

        <Button variant="contained" onClick={loadByDate}>
          Filter
        </Button>

        <Button variant="outlined" onClick={loadAll}>
          Reset
        </Button>
      </Stack>

      {/* Error */}
      {error && <Alert severity="error">{error}</Alert>}

      {/* Data */}
      <Stack spacing={2} sx={{ mt: 2 }}>
        {data.map((r) => (
          <Card key={r.id} sx={{ borderRadius: 3, py: 3, px: 2 }}>
            <CardContent>
              <Typography variant="subtitle1">
                <b>Date:</b> {r.date}
              </Typography>

              <Typography variant="subtitle1">
                <b>Single:</b> {r.singleNumber}
              </Typography>

              <Typography variant="body2" sx={{ mt: 1 }}>
                <b>Numbers:</b> {r.numbers.join(", ")}
              </Typography>
            </CardContent>
            {/* DUPLICATE INFO */}
            {(() => {
              const countMap = {};

              r.numbers.forEach((n) => {
                countMap[n] = (countMap[n] || 0) + 1;
              });

              const duplicates = Object.entries(countMap).filter(
                ([_, count]) => count > 1,
              );

              if (duplicates.length === 0) return null;

              return (
                <Typography
                  variant="body2"
                  sx={{ mt: 1, color: "orange", fontWeight: 500 }}
                >
                  <b>Số lặp:</b>{" "}
                  {duplicates
                    .map(([num, count]) => `${num}(x${count})`)
                    .join(", ")}
                </Typography>
              );
            })()}
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
export default Results;
