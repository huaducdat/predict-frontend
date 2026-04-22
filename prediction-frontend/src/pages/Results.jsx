import { useEffect, useState } from "react";
import {
  getAllResults,
  getResultsByDate,
  getLatestStreaks,
} from "../api/resultApi";
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
import StreakGrid from "../components/StreakGrid";

function Results() {
  const [data, setData] = useState([]);
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const [streakMap, setStreakMap] = useState({});

  const loadStreaks = async () => {
    try {
      const res = await getLatestStreaks();

      // convert array -> map cho nhanh
      const map = {};
      res.forEach((item) => {
        map[item.number] = item;
      });

      setStreakMap(map);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAll = async () => {
    try {
      const res = await getAllResults();
      setData(res);
      setIsFilterMode(false); // 🔥 reset
    } catch (err) {
      setError(err.message);
    }
  };

  const loadByDate = async () => {
    try {
      const res = await getResultsByDate(date);
      setData(res);
      setIsFilterMode(true); // 🔥 bật mode
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadAll();
    loadStreaks();
  }, []);

  const latestId = data.length > 0 ? data[data.length - 1].id : null;

  const [isFilterMode, setIsFilterMode] = useState(false);

  return (
    <Box sx={{ p: 3, gap: 3, display: "flex", flexDirection: "column" }}>
      <Box spacing={2}>
        {" "}
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Number Streak Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Theo dõi current streak và max streak của các số từ 00 đến 99
        </Typography>
        <StreakGrid />
      </Box>

      {/* Title */}
      <Typography variant="h4" gutterBottom>
        Result Data
      </Typography>

      {/* Filter */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          label=""
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          size="small"
          InputLabelProps={{
            shrink: true,
          }}
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
        {isFilterMode && data && (
          <Card sx={{ borderRadius: 3, py: 3, px: 2 }}>
            <CardContent>
              <Typography variant="h6">🔍 Result for {data.date}</Typography>

              <Typography sx={{ mt: 1 }}>
                <b>Single:</b> {data.singleNumber}
              </Typography>

              <Typography sx={{ mt: 1 }}>
                <b>Numbers:</b> {data.numbers?.join(", ")}
              </Typography>
            </CardContent>
          </Card>
        )}
        {!isFilterMode &&
          Array.isArray(data) &&
          data.map((r, index) => {
            const isFirst = index === 0;

            return (
              <Card key={r.id} sx={{ borderRadius: 3, py: 3, px: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1">
                    <b>Date:</b> {r.date}
                  </Typography>

                  <Typography variant="subtitle1">
                    <b>Single:</b> {r.singleNumber}
                  </Typography>

                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <b>Numbers:</b> {r.numbers?.join(", ")}
                  </Typography>
                </CardContent>

                {/* DUPLICATE INFO */}
                {(() => {
                  const countMap = {};

                  r.numbers?.forEach((n) => {
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

                {/* STREAK INFO */}
                {isFirst && streakMap && Object.keys(streakMap).length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Streak: current / max (hiện tại / tiên tục nhiều nhất
                      trong lịch sử)
                    </Typography>

                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {[...new Set(r.numbers || [])].map((n) => {
                        const s = streakMap[n];
                        if (!s) return null;

                        const isHot = s.currentStreak >= 2;

                        return (
                          <span
                            key={n}
                            style={{
                              marginRight: 8,
                              padding: "2px 6px",
                              borderRadius: 6,
                              background: isHot ? "#ffebee" : "#f5f5f5",
                              color: isHot ? "#d32f2f" : "#333",
                              fontWeight: isHot ? 600 : 400,
                              display: "inline-block",
                            }}
                          >
                            {n} ({s.currentStreak}/{s.maxStreak})
                          </span>
                        );
                      })}
                    </Typography>
                  </Box>
                )}
              </Card>
            );
          })}
      </Stack>
    </Box>
  );
}
export default Results;
