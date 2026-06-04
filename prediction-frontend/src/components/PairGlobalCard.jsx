import {
  Box,
  Typography,
  CircularProgress,
  Button,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { loadPairGlobal } from "../api/pairGlobal";
import { vi } from "../i18n/vi";

function PairGlobalCard() {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  // 🔥 FORMAT SCORE CHUẨN TOÀN HỆ
  const formatScore = (score) => {
    return Number(score.toFixed(3));
  };

  const formatNumber = (n) => n.toString().padStart(2, "0");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await loadPairGlobal();
      setData(res);
      setFiltered(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔍 SEARCH
  useEffect(() => {
    if (!search) {
      setFiltered(data);
      return;
    }

    const s = search.trim();

    const result = data.filter((item) => {
      const [a, b] = item.pair.split("-");

      if (s.length <= 2) {
        return a.includes(s) || b.includes(s);
      }

      if (s.length === 4) {
        const x = s.slice(0, 2);
        const y = s.slice(2, 4);
        return (a === x && b === y) || (a === y && b === x);
      }

      return false;
    });

    setFiltered(result);
  }, [search, data]);

  if (loading) return <CircularProgress />;
  if (!data || data.length === 0) return null;

  const list = expanded ? filtered : filtered.slice(0, 20);

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 3,
        background: "#FFFFFF",
        color: "#0F172A",
        border: "1px solid #E2E8F0",
        boxShadow: "0 14px 36px rgba(37, 99, 235, 0.08)",
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: open ? 1.5 : 0,
          cursor: "pointer",
        }}
        onClick={() => setOpen(!open)}
      >
        <Typography variant="body1" sx={{ fontWeight: "bold" }}>
          {vi.predictor.PAIR}
        </Typography>

        <Typography sx={{ fontSize: 12 }}>{open ? "▲" : "▼"}</Typography>
      </Box>

      {open && (
        <>
          {/* SEARCH */}
          <TextField
            size="small"
            placeholder={vi.common.searchPairOrNumber}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            sx={{
              mb: 2,
              input: { color: "#0F172A" },
            }}
          />

          {/* LIST */}
          {list.map((item) => (
            <Box
              key={item.pair} // ✅ không dùng index
              sx={{
                mb: 1,
                p: 1,
                borderRadius: 2,
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
              }}
            >
              {/* Pair */}
              <Typography sx={{ fontWeight: "bold", mb: 0.5 }}>
                {item.pair}
              </Typography>

              {/* Targets */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {item.targets.slice(0, 5).map((t) => (
                  <Box
                    key={t.number}
                    sx={{
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      background: "#EEF4FF",
                      color: "#1D4ED8",
                      border: "1px solid #BFDBFE",
                      fontSize: 12,
                    }}
                  >
                    {formatNumber(t.number)} ({formatScore(t.score)})
                  </Box>
                ))}
              </Box>
            </Box>
          ))}

          {/* EXPAND */}
          {search === "" && (
            <Button
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{ mt: 1 }}
            >
              {expanded ? vi.common.collapse : vi.common.viewMore}
            </Button>
          )}
        </>
      )}
    </Box>
  );
}

export default PairGlobalCard;
