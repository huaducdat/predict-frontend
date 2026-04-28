import {
  Box,
  Typography,
  CircularProgress,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { loadCombineExplain } from "../api/combineExplainApi";

function CombineExplainCard() {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // ===== LOAD =====
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await loadCombineExplain();

      setData(res || []);
      setFiltered(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ===== SEARCH =====
  useEffect(() => {
    if (!search) {
      setFiltered(data);
    } else {
      setFiltered(
        data.filter((item) =>
          item.number.toString().includes(search)
        )
      );
    }
  }, [search, data]);

  // ===== LOADING =====
  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 3,
        backdropFilter: "blur(10px)",
        background: "linear-gradient(135deg, #1a1a1a, #2a2a2a)",
        color: "white",
        mt: 2,
      }}
    >
      {/* HEADER */}
      <Typography variant="h6" mb={2}>
        🧠 Combine Explain
      </Typography>

      {/* SEARCH */}
      <TextField
        size="small"
        placeholder="Search number..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{
          mb: 2,
          input: { color: "white" },
          width: "100%",
        }}
      />

      {/* LIST */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: 1,
        }}
      >
        {filtered.slice(0, 20).map((item, index) => {

          const reasons = item.reasons?.slice(0, 2) || [];

          return (
            <Box
              key={item.number}
              sx={{
                p: 1.5,
                borderRadius: 2,
                background: "#333",
                textAlign: "center",
              }}
            >
              {/* NUMBER */}
              <Typography sx={{ fontWeight: "bold" }}>
                {item.number.toString().padStart(2, "0")}
              </Typography>

              {/* SCORE */}
              <Typography sx={{ fontSize: 12 }}>
                {(item.score * 100).toFixed(2)}%
              </Typography>

              {/* REASONS */}
              {reasons.length > 0 && (
                <Typography
                  sx={{
                    fontSize: 10,
                    color: "#bbb",
                    mt: 0.5,
                  }}
                >
                  {reasons.join(" + ")}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default CombineExplainCard;