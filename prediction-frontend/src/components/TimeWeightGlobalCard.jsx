// src/components/TimeWeightGlobalCard.jsx
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await loadGlobal(date);
      setData(res);
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

  // ===== FILTER LOGIC =====
  let entries = data ? Object.entries(data) : [];

  if (search !== "") {
    entries = entries.filter(([source]) =>
      source === search
    );
  }

  const list = expanded ? entries : entries.slice(0, 20);

  return (
    <Box>
      {/* TOGGLE */}
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

          {/* 🔍 SEARCH */}
          <TextField
            size="small"
            placeholder="Nhập số (00-99)..."
            value={search}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, ""); // chỉ số
              if (val.length <= 2) setSearch(val);
            }}
            sx={{
              mb: 2,
              input: { color: "white" },
              fieldset: { borderColor: "#555" },
            }}
          />

          {/* LOADING */}
          {loading && <CircularProgress />}

          {/* DATA */}
          {!loading && data && (
            <>
              {list.map(([source, targets]) => (
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
                    {targets.map((t, i) => (
                      <Box
                        key={i}
                        sx={{
                          px: 1.2,
                          py: 0.4,
                          borderRadius: 1,
                          background: "rgba(255,255,255,0.1)",
                          fontSize: 12,
                        }}
                      >
                        {t.number.toString().padStart(2, "0")} (
                        {t.score.toFixed(1)})
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}

              {/* EXPAND chỉ khi không search */}
              {search === "" && (
                <Button
                  size="small"
                  onClick={() => setExpanded(!expanded)}
                  sx={{ mt: 1 }}
                >
                  {expanded ? "Thu gọn" : "Xem thêm"}
                </Button>
              )}

              {/* không có kết quả */}
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