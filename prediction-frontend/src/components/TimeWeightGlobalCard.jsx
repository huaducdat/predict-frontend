import {
  Box,
  Typography,
  CircularProgress,
  Button,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { loadGlobal } from "../api/timeWeightApi";
import { vi } from "../i18n/vi";

function TimeWeightGlobalCard({ date }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState("");

  const formatScore = (score) => {
    const value = Number(score);
    return Number.isFinite(value) ? Number(value.toFixed(3)) : "--";
  };

  const formatNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? String(num).padStart(2, "0") : "--";
  };

  const normalize = (raw) => {
    const result = {};
    const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};

    Object.entries(source).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        result[k] = v.filter((item) => item && typeof item === "object");
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await loadGlobal();

      const clean = normalize(res);
      setData(clean);
    } catch (e) {
      console.error(e);
      setData({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (date && visible && !data) {
      fetchData();
    }
  }, [date, visible]);

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
        {visible ? vi.common.hideGlobal : vi.common.viewGlobal}
      </Button>

      {visible && (
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
          <Typography sx={{ mb: 2, fontWeight: "bold" }}>
            {vi.predictor.TIME}
          </Typography>

          <TextField
            size="small"
            placeholder={vi.common.searchNumber}
            value={search}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              if (val.length <= 2) setSearch(val);
            }}
            sx={{
              mb: 2,
              input: { color: "#0F172A" },
              fieldset: { borderColor: "#CBD5E1" },
            }}
          />

          {loading && <CircularProgress />}

          {!loading && data && (
            <>
              {list.length === 0 && search === "" && (
                <Typography sx={{ mt: 1, opacity: 0.7 }}>
                  {vi.common.noData || "Chua co du lieu"}
                </Typography>
              )}

              {list.map(([source, targets]) => {
                const safeTargets = Array.isArray(targets) ? targets : [];
                const sorted = safeTargets
                  .slice()
                  .filter((item) => item && typeof item === "object")
                  .sort((a, b) => Number(b.score) - Number(a.score))
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
                    <Box
                      sx={{
                        width: 40,
                        textAlign: "center",
                        fontWeight: "bold",
                        background: "#EEF4FF",
                        color: "#1D4ED8",
                        border: "1px solid #BFDBFE",
                        borderRadius: 1,
                        py: 0.5,
                      }}
                    >
                      {formatNumber(source)}
                    </Box>

                    <Box sx={{ display: "flex", gap: 1 }}>
                      {sorted.map((t, index) => (
                        <Box
                          key={`${t?.number ?? "unknown"}-${index}`}
                          sx={{
                            px: 1.2,
                            py: 0.4,
                            borderRadius: 1,
                            background: "#F8FAFC",
                            border: "1px solid #E2E8F0",
                            fontSize: 12,
                          }}
                        >
                          {formatNumber(t?.number)} ({formatScore(t?.score)})
                        </Box>
                      ))}
                    </Box>
                  </Box>
                );
              })}

              {search === "" && entries.length > 20 && (
                <Button
                  size="small"
                  onClick={() => setExpanded(!expanded)}
                  sx={{ mt: 1 }}
                >
                  {expanded ? vi.common.collapse : vi.common.viewMore}
                </Button>
              )}

              {search !== "" && entries.length === 0 && (
                <Typography sx={{ mt: 1, opacity: 0.7 }}>
                  {vi.common.noNumberFound}
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
