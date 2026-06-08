import { Box, Typography, Button } from "@mui/material";
import { useState } from "react";
import { vi } from "../i18n/vi";

function RecentFrequencyCard({ data }) {
  const [expanded, setExpanded] = useState(false);

  const fullList = Array.isArray(data?.["-1"])
    ? data["-1"].filter((item) => item && typeof item === "object")
    : [];
  const list = expanded ? fullList : fullList.slice(0, 6);
  const maxScore = Number(fullList[0]?.score) || 1;

  const formatScore = (score) => {
    const value = Number(score);
    return Number.isFinite(value) ? Number(value.toFixed(3)) : "--";
  };

  const formatNumber = (n) => {
    const value = Number(n);
    return Number.isFinite(value) ? String(value).padStart(2, "0") : "--";
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
          mb: 1.5,
        }}
      >
        <Typography variant="body1" sx={{ fontWeight: "bold" }}>
          {vi.predictor.FREQ}
        </Typography>

        {fullList.length > 6 && (
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

      <Box>
        {list.length === 0 ? (
          <Typography variant="body2" sx={{ color: "#64748B" }}>
            {vi.common.noData || "Chua co du lieu"}
          </Typography>
        ) : (
          list.map((item, index) => {
            const score = Number(item.score);
            const percent = Number.isFinite(score)
              ? Math.min(100, Math.max(0, (score / maxScore) * 100))
              : 0;

            return (
              <Box key={`${item.number ?? "unknown"}-${index}`} sx={{ mb: 1.5 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontFamily: "Courier New",
                    fontSize: 14,
                  }}
                >
                  <span>
                    #{index + 1} - {formatNumber(item.number)}
                  </span>
                  <span style={{ opacity: 0.7 }}>
                    {formatScore(item.score)}
                  </span>
                </Box>

                <Box
                  sx={{
                    mt: 0.5,
                    height: 4,
                    width: "100%",
                    background: "#E2E8F0",
                    borderRadius: 2,
                  }}
                >
                  <Box
                    sx={{
                      height: "100%",
                      width: `${percent}%`,
                      borderRadius: 2,
                      background:
                        index < 3
                          ? "linear-gradient(90deg, #ff9800, #ff5722)"
                          : "linear-gradient(90deg, #00e5ff, #00bcd4)",
                    }}
                  />
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
}

export default RecentFrequencyCard;
