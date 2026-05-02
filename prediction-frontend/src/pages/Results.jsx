import { useEffect, useState } from "react";
import {
  getResultsByDate,
  getLatestStreaks,
  getPagedResults,
  deleteResultByDate,
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
import { rebuildStreaks } from "../api/streakApi";
import { Pagination } from "@mui/material";

// ===== FORMAT =====
const formatNumber = (n) => n?.toString().padStart(2, "0");

// ===== RESULT CARD =====
function ResultCard({ data, onDelete }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{data.date}</Typography>

        <Typography>Single: {formatNumber(data.singleNumber)}</Typography>

        <Typography>
          {data.numbers?.map((n) => formatNumber(n)).join(", ")}
        </Typography>

        <Button color="error" onClick={() => onDelete(data.date)}>
          Delete
        </Button>
      </CardContent>
    </Card>
  );
}

// ===== 🔥 STREAK HIGHLIGHT CARD =====
function StreakHighlightCard({ result, streakMap }) {
  if (!result) return null;

  const allNumbers = [
    ...(result.numbers || []),
    result.singleNumber,
  ];

  const streakNumbers = allNumbers
    .map((n) => {
      const s = streakMap[n];
      if (!s || s.currentStreak <= 0) return null;

      return {
        number: n,
        current: s.currentStreak,
        max: s.maxStreak,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.current - a.current);

  if (streakNumbers.length === 0) return null;

  return (
    <Card sx={{ border: "1px solid #ddd", background: "#fff" }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight="bold" mb={1}>
          🔥 Streak ({result.date})
        </Typography>

        {/* 🔥 HIỂN THỊ NGANG */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          {streakNumbers.map((item, idx) => (
            <Box
              key={idx}
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: "12px",
                fontSize: 13,
                fontFamily: "Courier New",
                border: "1px solid #ccc",
                background:
                  item.current >= 4
                    ? "#ffe5e5"
                    : item.current >= 2
                    ? "#fff3cd"
                    : "#f5f5f5",
                color:
                  item.current >= 4
                    ? "red"
                    : item.current >= 2
                    ? "#b36b00"
                    : "#666",
              }}
            >
              {formatNumber(item.number)} ({item.current}/{item.max})
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}



// ===== MAIN =====
function Results() {
  const [data, setData] = useState([]);
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const [streakMap, setStreakMap] = useState({});
  const [isFilterMode, setIsFilterMode] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rebuilding, setRebuilding] = useState(false);

  const handleChangePage = (event, value) => {
    setPage(value);
    loadPage(value);
  };

  // ===== LOAD STREAK =====
  const loadStreaks = async () => {
    try {
      const res = await getLatestStreaks();
      const map = {};
      res.forEach((item) => {
        map[item.number] = item;
      });
      setStreakMap(map);
    } catch (err) {
      console.error(err);
    }
  };

  // ===== LOAD BY DATE =====
  const loadByDate = async () => {
    try {
      const res = await getResultsByDate(date);
      const result = Array.isArray(res) ? res : [res];

      setData(result);
      setIsFilterMode(true);
    } catch (err) {
      setError(err.message);
    }
  };

  // ===== LOAD PAGE =====
  const loadPage = async (p) => {
    try {
      const res = await getPagedResults(p);

      setData(res.content);
      setPage(res.page);
      setTotalPages(res.totalPages);
      setIsFilterMode(false);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadPage(1);
    loadStreaks();
  }, []);

  // ===== DELETE =====
  const handleDelete = async (date) => {
    if (!window.confirm(`Xóa ngày ${date}?`)) return;

    try {
      await deleteResultByDate(date);

      if (isFilterMode) {
        setIsFilterMode(false);
        loadPage(1);
      } else {
        loadPage(page);
      }

      loadStreaks();
    } catch (e) {
      setError(e.message);
    }
  };

  // ===== REBUILD =====
  const handleRebuild = async () => {
    try {
      setRebuilding(true);

      await rebuildStreaks();
      await loadPage(page);
      await loadStreaks();
    } catch (err) {
      setError(err.message);
    } finally {
      setRebuilding(false);
    }
  };

  // ===== TIMELINE =====
  const buildTimeline = (data) => {
    if (!Array.isArray(data)) return [];

    const sorted = [...data].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    const result = [];

    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];
      result.push({ type: "data", value: current });

      if (i === sorted.length - 1) break;

      const next = sorted[i + 1];

      const d1 = new Date(current.date);
      const d2 = new Date(next.date);

      const diffDays = (d1 - d2) / (1000 * 60 * 60 * 24);

      if (diffDays > 1) {
        const start = new Date(d2);
        start.setDate(start.getDate() + 1);

        const end = new Date(d1);
        end.setDate(end.getDate() - 1);

        result.push({
          type: "missing_range",
          start: start.toISOString().slice(0, 10),
          end: end.toISOString().slice(0, 10),
        });
      }
    }

    return result;
  };

  // ===== UI =====
  return (
    <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
      {/* HEADER */}
      <Box>
        <Typography variant="h4" fontWeight="bold">
          Number Streak Dashboard
        </Typography>

        <StreakGrid data={Object.values(streakMap)} />
      </Box>

      {/* REBUILD */}
      <Button
        variant="contained"
        color="warning"
        onClick={handleRebuild}
        disabled={rebuilding}
      >
        {rebuilding ? "Rebuilding..." : "Rebuild Streak"}
      </Button>

      {/* FILTER */}
      <Stack direction="row" spacing={2}>
        <TextField
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          size="small"
        />

        <Button variant="contained" onClick={loadByDate}>
          Filter
        </Button>

        <Button variant="outlined" onClick={() => loadPage(1)}>
          Reset
        </Button>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      {/* FILTER MODE */}
      {isFilterMode &&
        data.map((item) => (
          <ResultCard key={item.date} data={item} onDelete={handleDelete} />
        ))}

      {/* NORMAL MODE */}
      {!isFilterMode && data.length > 0 && page === 1 && (
        <StreakHighlightCard
          result={data[0]}
          streakMap={streakMap}
        />
      )}

      {!isFilterMode &&
        buildTimeline(data).map((item, idx) => {
          if (item.type === "missing_range") {
            return (
              <Card key={idx}>
                <CardContent>
                  <Typography color="orange">
                    Missing: {item.start} → {item.end}
                  </Typography>
                </CardContent>
              </Card>
            );
          }

          return (
            <ResultCard
              key={item.value.id}
              data={item.value}
              onDelete={handleDelete}
            />
          );
        })}

      {/* PAGINATION */}
      {!isFilterMode && totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handleChangePage}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
}

export default Results;