import { Box, Typography, Stack, Button } from "@mui/material";
import { useState } from "react";
import { vi } from "../i18n/vi";

function RepeatCard({ data }) {
  const [expanded, setExpanded] = useState(false);

  const fullList = Array.isArray(data?.["-1"])
    ? data["-1"].filter((item) => item && typeof item === "object")
    : [];
  const list = expanded ? fullList : fullList.slice(0, 5);

  const formatNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? String(num).padStart(2, "0") : "--";
  };

  const formatScore = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(2) : "--";
  };

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
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6">{vi.predictor.REP}</Typography>

        {fullList.length > 5 && (
          <Button
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{
              color: "#2563EB",
              textTransform: "none",
              fontSize: 12,
            }}
          >
            {expanded ? vi.common.collapse : vi.common.viewMore}
          </Button>
        )}
      </Box>

      <Stack spacing={1}>
        {list.length === 0 ? (
          <Typography variant="body2" sx={{ color: "#64748B" }}>
            {vi.common.noData || "Chua co du lieu"}
          </Typography>
        ) : (
          list.map((item, index) => (
            <Box
              key={`${item.number ?? "unknown"}-${index}`}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                px: 2,
                py: 1,
                borderRadius: 2,
                background:
                  index < 3
                    ? "linear-gradient(135deg, #ff9800, #ff5722)"
                    : "#F8FAFC",
                transition: "0.2s",
              }}
            >
              <Typography
                sx={{
                  fontFamily: "Courier New",
                  fontWeight: "bold",
                }}
              >
                #{index + 1} - {formatNumber(item.number)}
              </Typography>

              <Typography sx={{ opacity: 0.8 }}>
                {formatScore(item.score)}
              </Typography>
            </Box>
          ))
        )}
      </Stack>
    </Box>
  );
}

export default RepeatCard;
