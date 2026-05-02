import {
  Box,
  Typography,
  CircularProgress,
  Button,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { loadGlobal } from "../api/timeWeightApi";

function TimeWeightGlobalCard({ date }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState("");

  // ===== FORMAT SCORE =====
  const formatScore = (score) => {
    return Number(score.toFixed(3)); // 🔥 fix chính
  };

  // ===== NORMALIZE =====
  const normalize = (raw) => {
    const result = {};

    Object.entries(raw || {}).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        result[k] = v;
      } else if (v && typeof v === "object") {
        result[k] = Object.entries(v).map(([num, score]) => ({
          number: Number(num),
          score: Number(score),
        }));
      } else {
        result[k] = [];
      }
    });

    return result;
  };

  // ===== FETCH =====
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await loadGlobal();

      const clean = normalize(res);
      setData(clean);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (date && visible && !data) {
      fetchData();
    }
  }, [date, visible]);

  // ===== FILTER =====
  let entries = data ? Object.entries(data) : [];

  if (search !== "") {
    entries = entries.filter(([source]) => source === search);
  }

  const list = expanded ? entries : entries.slice(0, 20);

  return (
    <Box>
      <Button
        variant="contained"
        size="small"
        onClick={() => setVisible(!visible)}
        sx={{ mb: 1 }}
      >
        {visible ? "Ẩn Global" : "Xem Global"}
      </Button>

      {visible && (
        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            backdropFilter: "blur(10px)",
            background: "linear-gradient(135deg, #1a1a1a, #2a2a2a)",
            color: "white",
          }}
        >
          <Typography sx={{ mb: 2, fontWeight: "bold" }}>
            🧠 Time Weight Global
          </Typography>

          {/* SEARCH */}
          <TextField
            size="small"
            placeholder="Nhập số (00-99)..."
            value={search}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              if (val.length <= 2) setSearch(val);
            }}
            sx={{
              mb: 2,
              input: { color: "white" },
              fieldset: { borderColor: "#555" },
            }}
          />

          {loading && <CircularProgress />}

          {!loading && data && (
            <>
              {list.map(([source, targets]) => {
                const sorted = targets
                  .slice()
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 3);

                return (
                  <Box
                    key={source}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 1,
                      gap: 1,
                    }}
                  >
                    {/* SOURCE */}
                    <Box
                      sx={{
                        width: 40,
                        textAlign: "center",
                        fontWeight: "bold",
                        background: "#333",
                        borderRadius: 1,
                        py: 0.5,
                      }}
                    >
                      {source.toString().padStart(2, "0")}
                    </Box>

                    {/* TARGETS */}
                    <Box sx={{ display: "flex", gap: 1 }}>
                      {sorted.map((t) => (
                        <Box
                          key={t.number}
                          sx={{
                            px: 1.2,
                            py: 0.4,
                            borderRadius: 1,
                            background: "rgba(255,255,255,0.1)",
                            fontSize: 12,
                          }}
                        >
                          {t.number.toString().padStart(2, "0")} (
                          {formatScore(t.score)})
                        </Box>
                      ))}
                    </Box>
                  </Box>
                );
              })}

              {search === "" && (
                <Button
                  size="small"
                  onClick={() => setExpanded(!expanded)}
                  sx={{ mt: 1 }}
                >
                  {expanded ? "Thu gọn" : "Xem thêm"}
                </Button>
              )}

              {search !== "" && entries.length === 0 && (
                <Typography sx={{ mt: 1, opacity: 0.7 }}>
                  Không tìm thấy số
                </Typography>
              )}
            </>
          )}
        </Box>
      )}
    </Box>
  );
}

export default TimeWeightGlobalCard;