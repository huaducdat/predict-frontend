// src/components/PairGlobalCard.jsx

import {
  Box,
  Typography,
  CircularProgress,
  Button,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { loadPairGlobal } from "../api/pairGlobal";

function PairGlobalCard() {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await loadPairGlobal();
      setData(res);
      console.log(res);
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

  // 🔍 search theo pair hoặc number
  useEffect(() => {
    if (!search) {
      setFiltered(data);
      return;
    }

    const s = search.trim();

    const result = data.filter((item) => {
      const [a, b] = item.pair.split("-");

      // 🔥 CASE 1: nhập 1 số (vd: 12)
      if (s.length <= 2) {
        return a.includes(s) || b.includes(s);
      }

      // 🔥 CASE 2: nhập 4 số (vd: 1221)
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
        backdropFilter: "blur(10px)",
        background: "linear-gradient(135deg, #1a1a1a, #2a2a2a)",
        color: "white",
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
          🔗 Pair Global
        </Typography>

        <Typography sx={{ fontSize: 12 }}>{open ? "▲" : "▼"}</Typography>
      </Box>
      {open && (
        <>
          {/* SEARCH */}
          <TextField
            size="small"
            placeholder="Tìm pair hoặc số..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            sx={{
              mb: 2,
              input: { color: "white" },
            }}
          />

          {/* LIST */}
          {list.map((item, idx) => (
            <Box
              key={idx}
              sx={{
                mb: 1,
                p: 1,
                borderRadius: 2,
                background: "rgba(255,255,255,0.05)",
              }}
            >
              {/* Pair */}
              <Typography sx={{ fontWeight: "bold", mb: 0.5 }}>
                {item.pair}
              </Typography>

              {/* Targets */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {item.targets.slice(0, 5).map((t, i) => (
                  <Box
                    key={i}
                    sx={{
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      background: "#000",
                      fontSize: 12,
                    }}
                  >
                    {t.number.toString().padStart(2, "0")} ({t.score.toFixed(1)}
                    )
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </>
      )}
    </Box>
  );
}

export default PairGlobalCard;
