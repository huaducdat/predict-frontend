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

// ===== FORMAT =====
const formatNumber = (n) => n?.toString().padStart(2, "0");

// ===== CARD COMPONENT =====
function ResultCard({ data, onDelete }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{data.date}</Typography>

        <Typography>
          Single: {formatNumber(data.singleNumber)}
        </Typography>

        <Typography>
          {data.numbers?.map((n) => formatNumber(n)).join(", ")}
        </Typography>

        <Button
          color="error"
          onClick={() => onDelete(data.date)}
        >
          Delete
        </Button>
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

      // fix array/object
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
          <ResultCard
            key={item.date}
            data={item}
            onDelete={handleDelete}
          />
        ))}

      {/* NORMAL MODE */}
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
    </Box>
  );
}

export default Results;