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
  Pagination,
} from "@mui/material";

import StreakGrid from "../components/StreakGrid";
import { rebuildStreaks } from "../api/streakApi";
import { vi } from "../i18n/vi";

const formatNumber = (n) => n?.toString().padStart(2, "0");

function ResultCard({ data, onDelete }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{data.date}</Typography>

        <Typography>
          {vi.results.single}: {formatNumber(data.singleNumber)}
        </Typography>

        <Typography>
          {data.numbers?.map((n) => formatNumber(n)).join(", ")}
        </Typography>

        <Button color="error" onClick={() => onDelete(data.date)}>
          {vi.results.delete}
        </Button>
      </CardContent>
    </Card>
  );
}

function StreakHighlightCard({ result, streakMap }) {
  if (!result) return null;

  const allNumbers = Array.from(
    new Set([...(result.numbers || []), result.singleNumber]),
  );

  const streakNumbers = allNumbers
    .filter((n) => {
      const s = streakMap[n];
      return s && s.currentStreak > 0;
    })
    .map((n) => {
      const s = streakMap[n];
      return {
        number: n,
        current: s.currentStreak,
        max: s.maxStreak,
      };
    })
    .sort((a, b) => b.current - a.current);

  if (streakNumbers.length === 0) return null;

  return (
    <Card sx={{ border: "1px solid #ddd", background: "#fff" }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight="bold" mb={1}>
          {vi.results.streak} ({result.date})
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {streakNumbers.map((item) => {
            const isHot = item.current >= 4;
            const isWarm = item.current >= 2;

            return (
              <Box
                key={item.number}
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "12px",
                  fontSize: 13,
                  fontFamily: "Courier New",
                  border: "1px solid #ccc",
                  background: isHot ? "#ffe5e5" : isWarm ? "#fff3cd" : "#f5f5f5",
                  color: isHot ? "red" : isWarm ? "#b36b00" : "#666",
                  fontWeight: isHot ? "bold" : "normal",
                }}
              >
                {formatNumber(item.number)} ({item.current}/{item.max})
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}

function RepeatInDayCard({ result }) {
  if (!result) return null;

  const countMap = {};
  (result.numbers || []).forEach((n) => {
    if (n === null || n === undefined) return;
    countMap[n] = (countMap[n] || 0) + 1;
  });

  const repeated = Object.entries(countMap)
    .filter(([_, count]) => count >= 2)
    .map(([number, count]) => ({
      number: Number(number),
      count,
    }))
    .sort((a, b) => b.count - a.count || a.number - b.number);

  if (repeated.length === 0) {
    return (
      <Card sx={{ border: "1px solid #ddd", background: "#fff" }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="bold">
            {vi.results.repeat} ({result.date})
          </Typography>
          <Typography fontSize={13} color="text.secondary">
            {vi.results.noRepeat}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ border: "1px solid #ddd", background: "#fff" }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight="bold" mb={1}>
          {vi.results.repeat} ({result.date})
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {repeated.map((item) => {
            const isHot = item.count >= 3;

            return (
              <Box
                key={item.number}
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "12px",
                  fontSize: 13,
                  fontFamily: "Courier New",
                  border: "1px solid #ccc",
                  background: isHot ? "#ffe5e5" : "#f0f0f0",
                  color: isHot ? "red" : "#333",
                  fontWeight: isHot ? "bold" : "normal",
                }}
              >
                {formatNumber(item.number)} x{item.count}
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}

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

  const loadByDate = async () => {
    try {
      const res = await getResultsByDate(date);
      setData(Array.isArray(res) ? res : [res]);
      setIsFilterMode(true);
    } catch (err) {
      setError(err.message);
    }
  };

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

  const handleDelete = async (targetDate) => {
    if (!window.confirm(`${vi.results.delete} ${targetDate}?`)) return;

    try {
      await deleteResultByDate(targetDate);
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

  const buildTimeline = (items) => {
    if (!Array.isArray(items)) return [];

    const sorted = [...items].sort((a, b) => new Date(b.date) - new Date(a.date));
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

  return (
    <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="h4" fontWeight="bold">
          {vi.results.title}
        </Typography>

        <StreakGrid data={Object.values(streakMap)} />
      </Box>

      <Button
        variant="contained"
        color="warning"
        onClick={handleRebuild}
        disabled={rebuilding}
      >
        {rebuilding ? vi.results.rebuilding : vi.results.rebuild}
      </Button>

      <Stack direction="row" spacing={2}>
        <TextField
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          size="small"
        />

        <Button variant="contained" onClick={loadByDate}>
          {vi.common.filter}
        </Button>

        <Button variant="outlined" onClick={() => loadPage(1)}>
          {vi.common.reset}
        </Button>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      {isFilterMode &&
        data.map((item) => (
          <Box key={item.date} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <ResultCard data={item} onDelete={handleDelete} />
            <RepeatInDayCard result={item} />
          </Box>
        ))}

      {!isFilterMode && data.length > 0 && page === 1 && (
        <StreakHighlightCard result={data[0]} streakMap={streakMap} />
      )}

      {!isFilterMode &&
        buildTimeline(data).map((item, idx) => {
          if (item.type === "missing_range") {
            return (
              <Card key={idx}>
                <CardContent>
                  <Typography color="orange">
                    {vi.results.missing}: {item.start} → {item.end}
                  </Typography>
                </CardContent>
              </Card>
            );
          }

          return (
            <Box key={item.value.id} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <ResultCard data={item.value} onDelete={handleDelete} />
              <RepeatInDayCard result={item.value} />
            </Box>
          );
        })}

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
