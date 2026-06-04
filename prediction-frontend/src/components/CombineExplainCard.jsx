import {
  Box,
  Typography,
  CircularProgress,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { loadCombineExplain } from "../api/combineExplainApi";
import { vi } from "../i18n/vi";

function CombineExplainCard() {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔥 FORMAT %
  const formatPercent = (score) => {
    return Number((score * 100).toFixed(3));
  };

  const formatNumber = (n) => n.toString().padStart(2, "0");

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

  if (loading) {
    return <CircularProgress />;
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
      <Typography variant="h6" mb={2}>
        {vi.prediction.combineExplain}
      </Typography>

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

      {/* LIST */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: 1,
        }}
      >
        {filtered.slice(0, 20).map((item) => {
          const reasons = item.reasons?.slice(0, 2) || [];

          return (
            <Box
              key={item.number}
              sx={{
                p: 1.5,
                borderRadius: 2,
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                textAlign: "center",
              }}
            >
              {/* NUMBER */}
              <Typography sx={{ fontWeight: "bold" }}>
                {formatNumber(item.number)}
              </Typography>

              {/* SCORE */}
              <Typography sx={{ fontSize: 12 }}>
                {formatPercent(item.score)}%
              </Typography>

              {/* REASONS */}
              {reasons.length > 0 && (
                <Typography
                  sx={{
                    fontSize: 10,
                    color: "#475569",
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
