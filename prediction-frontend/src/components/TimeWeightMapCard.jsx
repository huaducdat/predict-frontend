import { Box, Typography, Button } from "@mui/material";
import { useState } from "react";
import { vi } from "../i18n/vi";

function TimeWeightMapCard({ data }) {
  const [expanded, setExpanded] = useState(false);

  const list = Array.isArray(data?.["-1"])
    ? data["-1"].filter((item) => item && typeof item === "object")
    : [];
  const visibleList = expanded ? list : list.slice(0, 12);

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
        <Typography sx={{ fontWeight: "bold" }}>{vi.predictor.TIME}</Typography>

        {list.length > 12 && (
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

      {visibleList.length === 0 ? (
        <Typography variant="body2" sx={{ color: "#64748B" }}>
          {vi.common.noData || "Chua co du lieu"}
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 1,
            gridTemplateColumns: {
              xs: "repeat(1, 1fr)",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
              lg: "repeat(4, 1fr)",
            },
          }}
        >
          {visibleList.map((item, index) => {
            return (
              <Box
                key={`${item.number ?? "unknown"}-${index}`}
                sx={{
                  px: 1,
                  py: 0.8,
                  borderRadius: 2,
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  fontFamily: "Courier New",
                  fontSize: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  transition: "0.2s",

                  "&:hover": {
                    background: "#EEF4FF",
                  },
                }}
              >
                <span style={{ opacity: 0.5, width: 20 }}>#{index + 1}</span>

                <span style={{ fontWeight: "bold" }}>
                  {formatNumber(item.number)}
                </span>

                <span style={{ opacity: 0.7 }}>{formatScore(item.score)}</span>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

export default TimeWeightMapCard;
