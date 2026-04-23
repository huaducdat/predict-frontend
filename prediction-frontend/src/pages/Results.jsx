import { useEffect, useState } from "react";
import {
  getAllResults,
  getResultsByDate,
  getLatestStreaks,
  getPagedResults,
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

function Results() {
  const [data, setData] = useState([]);
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const [streakMap, setStreakMap] = useState({});
  const [isFilterMode, setIsFilterMode] = useState(false);

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

  // const loadAll = async () => {
  //   try {
  //     const res = await getAllResults();
  //     setData(res);
  //     setIsFilterMode(false);
  //   } catch (err) {
  //     setError(err.message);
  //   }
  // };

  const loadByDate = async () => {
    try {
      const res = await getResultsByDate(date);
      setData(res);
      setIsFilterMode(true);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadPage(1);
    loadStreaks();
  }, []);

  // 🔥 BUILD TIMELINE (detect missing dates)
  const buildTimeline = (data) => {
    if (!Array.isArray(data)) return [];

    // 🔥 sort mới -> cũ
    const sorted = [...data].sort(
      (a, b) => new Date(b.date) - new Date(a.date),
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

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const [rebuilding, setRebuilding] = useState(false);
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

  return (
    <Box sx={{ p: 3, gap: 3, display: "flex", flexDirection: "column" }}>
      {/* HEADER */}
      <Box>
        <Typography variant="h4" fontWeight="bold">
          Number Streak Dashboard
        </Typography>
        <Typography color="text.secondary">
          Theo dõi current streak và max streak
        </Typography>

        <StreakGrid data={Object.values(streakMap)} />
      </Box>
      {/**Rebuild Streak BTN */}
      <div style={{alignItems:"center", display:"flex", flexDirection:'column'}}>
        <Button
          variant="contained"
          color="warning"
          onClick={handleRebuild}
          disabled={rebuilding}
          sx={{ width: 300, alignSelf: "center" }}
        >
          {rebuilding ? "Rebuilding..." : "Rebuild Streak"}
        </Button>
        <p style={{textAlign:'center'}}>
          Don't click on if you no need update or Streak data is not correct. Everytime input new dât Streak auto update!<br></br>
          (Không ấn nút này nếu dữ liệu Nhịp không sai lệch hoặc cần phải cập nhật dữ liệu mới - mỗi lần nạp dữ liệu mới đã tự động làm mới rồi.)
        </p>
      </div>

      {/* FILTER */}
      <Typography variant="h4">Result Data</Typography>

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

      {/* DATA */}
      <Stack spacing={2} sx={{ mt: 2 }}>
        {/* FILTER MODE */}
        {isFilterMode && data && (
          <Card sx={{ borderRadius: 3, py: 3, px: 2 }}>
            <CardContent>
              <Typography variant="h6">
                🔍 Result for {data?.date || data[0]?.date}
              </Typography>

              <Typography sx={{ mt: 1 }}>
                <b>Single:</b> {data.singleNumber}
              </Typography>

              <Typography sx={{ mt: 1 }}>
                <b>Numbers:</b> {data.numbers?.join(", ")}
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* NORMAL MODE */}
        {!isFilterMode &&
          buildTimeline(data).map((item, index) => {
            // 🔥 CASE: missing days
            if (item.type === "missing_range") {
              const isSingle = item.start === item.end;

              return (
                <Card
                  key={"missing-" + item.start}
                  sx={{
                    borderRadius: 3,
                    py: 2,
                    px: 2,
                    bgcolor: "#fff3e0",
                    border: "2px dashed orange",
                  }}
                >
                  <Typography color="orange" fontWeight={600}>
                    ⚠ Missing:{" "}
                    {isSingle ? item.start : `${item.start} → ${item.end}`}
                  </Typography>
                </Card>
              );
            }

            // 🔥 CASE: normal data
            const r = item.value;
            const isFirst = index === 0;

            return (
              <Card key={r.id} sx={{ borderRadius: 3, py: 3, px: 2 }}>
                <CardContent>
                  <Typography>
                    <b>Date:</b> {r.date}
                  </Typography>

                  <Typography>
                    <b>Single:</b> {r.singleNumber}
                  </Typography>

                  <Typography sx={{ mt: 1 }}>
                    <b>Numbers:</b> {r.numbers?.join(", ")}
                  </Typography>
                </CardContent>

                {/* DUPLICATE */}
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
                    <Typography sx={{ mt: 1, color: "orange" }}>
                      <b>Số lặp:</b>{" "}
                      {duplicates
                        .map(([num, count]) => `${num}(x${count})`)
                        .join(", ")}
                    </Typography>
                  );
                })()}

                {/* STREAK */}
                {isFirst && Object.keys(streakMap).length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography sx={{ fontWeight: 600 }}>
                      Streak (current / max)
                    </Typography>

                    <Typography sx={{ mt: 0.5 }}>
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
      {/**PAGINATION */}
      <Box
        sx={{
          mt: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <Button
          variant="outlined"
          disabled={page === 1}
          onClick={() => loadPage(page - 1)}
        >
          Prev
        </Button>

        <Typography fontWeight={600}>
          Page {page} / {totalPages}
        </Typography>

        <Button
          variant="outlined"
          disabled={page === totalPages}
          onClick={() => loadPage(page + 1)}
        >
          Next
        </Button>

        <TextField
          type="number"
          size="small"
          placeholder="Go"
          sx={{ width: 80 }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const val = Number(e.target.value);
              if (val >= 1 && val <= totalPages) {
                loadPage(val);
              }
            }
          }}
        />
      </Box>
    </Box>
  );
}

export default Results;
