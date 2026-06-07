import {
  Box,
  Typography,
  Button,
  TextField,
  Stack,
  CircularProgress,
} from "@mui/material";
import { useEffect, useState } from "react";
import { loadCombine, runCombine } from "../api/combineApi";
import { dispatchPatternStateUpdated } from "../events/patternStateEvents";
import { vi } from "../i18n/vi";

function CombineResultCard() {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [expanded, setExpanded] = useState(false);

  // 🔥 FORMAT %
  const formatPercent = (score) => {
    return Number((score * 100).toFixed(3));
  };

  const formatNumber = (n) => n.toString().padStart(2, "0");

  // ===== NORMALIZE =====
  const normalizeData = (res) => {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
  };

  // ===== LOAD =====
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await loadCombine();
      const list = normalizeData(res);

      setData(list);
      setFiltered(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ===== RUN =====
  const handleRun = async () => {
    try {
      setLoading(true);
      setMessage("");

      await runCombine();

      dispatchPatternStateUpdated();
      setMessage(
        vi.prediction.combineRunMessage,
      );

      await fetchData();
    } catch (e) {
      console.error(e);
      setMessage(vi.prediction.combineRunFailed);
    } finally {
      setLoading(false);
    }
  };

  // ===== SEARCH =====
  useEffect(() => {
    if (!search) {
      setFiltered(data);
    } else {
      setFiltered(
        data.filter((item) => item.number?.toString().includes(search)),
      );
    }
  }, [search, data]);

  useEffect(() => {
    fetchData();
  }, []);

  const displayList = expanded ? filtered : filtered.slice(0, 10);

  if (!loading && data.length === 0) {
    return (
      <Box sx={{ color: "#0F172A", mt: 2 }}>
        <Typography>{vi.prediction.noCombineData}</Typography>
        <Button onClick={handleRun} sx={{ mt: 1 }}>
          {vi.prediction.runCombine}
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 3,
        background: "#FFFFFF",
        color: "#0F172A",
        border: "1px solid #E2E8F0",
        boxShadow: "0 14px 36px rgba(37, 99, 235, 0.08)",
        mt: 2,
      }}
    >
      {/* HEADER */}
      <Stack direction="row" sx={{ justifyContent: "space-between", mb: 1 }}>
        <Typography variant="h6">{vi.prediction.combineResult}</Typography>

        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={handleRun} disabled={loading}>
            {loading ? vi.common.running : vi.common.run}
          </Button>

          <Button variant="outlined" onClick={() => setExpanded(!expanded)}>
            {expanded ? vi.common.collapse : vi.common.viewMore}
          </Button>
        </Stack>
      </Stack>

      {/* MESSAGE */}
      {message && (
        <Typography sx={{ mb: 2, color: "#ff9800", fontSize: 13 }}>
          {message}
        </Typography>
      )}

      {/* SEARCH */}
      <TextField
        size="small"
        placeholder={vi.common.searchNumber}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{
          mb: 2,
          input: { color: "#0F172A" },
          width: "100%",
        }}
      />

      {/* LOADING */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {/* LIST */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))",
          gap: 1,
        }}
      >
        {displayList.map((item) => {
          const indexInData = data.findIndex((d) => d.number === item.number);

          const isTop1 = indexInData === 0;
          const isTop2 = indexInData === 1;
          const isTop3 = indexInData === 2;
          const isTop10 = indexInData >= 0 && indexInData < 10;

          let bg = "#F8FAFC";
          let label = "";

          if (isTop1) {
            bg = "linear-gradient(135deg, gold, orange)";
            label = "👑";
          } else if (isTop2) {
            bg = "linear-gradient(135deg, #ff5722, #ff9800)";
            label = "🔥";
          } else if (isTop3) {
            bg = "linear-gradient(135deg, #ff9800, #ffb74d)";
            label = "⚡";
          } else if (isTop10) {
            bg = "#FFEDD5";
          }

          return (
            <Box
              key={item.number}
              sx={{
                p: 1,
                borderRadius: 2,
                textAlign: "center",
                background: bg,
                position: "relative",
                transition: "0.2s",
                boxShadow: isTop1 ? "0 0 12px gold" : "none",
                "&:hover": {
                  transform: "scale(1.05)",
                },
              }}
            >
              {label && (
                <Typography
                  sx={{
                    position: "absolute",
                    top: -6,
                    right: 4,
                    fontSize: 12,
                  }}
                >
                  {label}
                </Typography>
              )}

              <Typography sx={{ fontWeight: "bold" }}>
                {formatNumber(item.number)}
              </Typography>

              <Typography sx={{ fontSize: 12 }}>
                {formatPercent(item.score)}%
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default CombineResultCard;
