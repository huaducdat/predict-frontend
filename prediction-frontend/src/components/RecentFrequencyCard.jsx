import { Box, Typography, Button } from "@mui/material";
import { useState } from "react";
import { vi } from "../i18n/vi";

function RecentFrequencyCard({ data }) {
  const [expanded, setExpanded] = useState(false);

  if (!data || !data["-1"]) return null;

  const fullList = data["-1"];
  const list = expanded ? fullList : fullList.slice(0, 6);

  const maxScore = fullList[0]?.score || 1;

  // 🔥 format chuẩn toàn hệ thống
  const formatScore = (score) => {
    return Number(score.toFixed(3));
  };

  const formatNumber = (n) => n.toString().padStart(2, "0");

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
          mb: 1.5,
        }}
      >
        <Typography variant="body1" sx={{ fontWeight: "bold" }}>
          {vi.predictor.FREQ}
        </Typography>

        <Button
          size="small"
          onClick={() => setExpanded(!expanded)}
          sx={{
            color: "#00e5ff",
            textTransform: "none",
            fontSize: 12,
          }}
        >
          {expanded ? vi.common.collapse : vi.common.viewMore}
        </Button>
      </Box>

      {/* LIST */}
      <Box>
        {list.map((item, index) => {
          const percent = (item.score / maxScore) * 100;

          return (
            <Box key={item.number} sx={{ mb: 1.5 }}>
              {/* TOP LINE */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: "Courier New",
                  fontSize: 14,
                }}
              >
                <span>
                  #{index + 1} — {formatNumber(item.number)}
                </span>
                <span style={{ opacity: 0.7 }}>
                  {formatScore(item.score)}
                </span>
              </Box>

              {/* BAR */}
              <Box
                sx={{
                  mt: 0.5,
                  height: 4,
                  width: "100%",
                  background: "rgba(255,255,255,0.1)",
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
        })}
      </Box>
    </Box>
  );
}

export default RecentFrequencyCard;
