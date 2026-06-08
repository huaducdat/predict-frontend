import { useEffect, useState } from "react";
import { getResultsByDate } from "../api/resultApi";
import { Card, CardContent, Typography, Box } from "@mui/material";
import { vi } from "../i18n/vi";

function PredictionSourceResultCard({ date }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date) return;

    const load = async () => {
      try {
        setLoading(true);
        const res = await getResultsByDate(date);
        setResult(res || null);
      } catch (e) {
        console.error("Load source result error:", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [date]);

  if (!date) return null;

  if (loading) {
    return (
      <Typography sx={{ mt: 2, opacity: 0.6 }}>
        {vi.common.loading}
      </Typography>
    );
  }

  if (!result) {
    return (
      <Typography sx={{ mt: 2, color: "orange" }}>
        {vi.common.noSourceData}
      </Typography>
    );
  }

  const formatNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? String(num).padStart(2, "0") : "--";
  };

  const numbers = Array.isArray(result.numbers) ? result.numbers : [];

  return (
    <Card
      sx={{
        mt: 3,
        borderRadius: 3,
        backdropFilter: "blur(10px)",
        background: "linear-gradient(135deg, #111, #222)",
        color: "white",
      }}
    >
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {vi.prediction.sourceResult}
        </Typography>

        <Typography sx={{ fontSize: 13, opacity: 0.6 }}>
          {result.date}
        </Typography>

        <Box
          sx={{
            mt: 2,
            textAlign: "center",
            background: "black",
            borderRadius: 2,
            py: 2,
          }}
        >
          <Typography variant="h3" sx={{ fontWeight: "bold", letterSpacing: 2 }}>
            {formatNumber(result.singleNumber)}
          </Typography>

          <Typography sx={{ fontSize: 12, opacity: 0.6 }}>
            {vi.prediction.specialNumber}
          </Typography>
        </Box>

        <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
          {numbers.map((n, i) => (
            <Box
              key={i}
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                background: "#333",
                fontSize: 13,
              }}
            >
              {formatNumber(n)}
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

export default PredictionSourceResultCard;
