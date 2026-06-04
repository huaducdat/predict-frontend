import { Box, Typography, Stack, Button } from "@mui/material";
import { useState } from "react";
import { vi } from "../i18n/vi";

function RepeatCard({ data }) {
  const [expanded, setExpanded] = useState(false);

  if (!data || !data["-1"]) return null;

  const fullList = data["-1"];
  const list = expanded ? fullList : fullList.slice(0, 5); // 🔥 mặc định top 5

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
      {/* HEADER */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6">{vi.predictor.REP}</Typography>

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
      </Box>

      {/* LIST */}
      <Stack spacing={1}>
        {list.map((item, index) => (
          <Box
            key={item.number}
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
            {/* NUMBER */}
            <Typography
              sx={{
                fontFamily: "Courier New",
                fontWeight: "bold",
              }}
            >
              #{index + 1} — {item.number.toString().padStart(2, "0")}
            </Typography>

            {/* SCORE */}
            <Typography sx={{ opacity: 0.8 }}>
              {item.score.toFixed(2)}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

export default RepeatCard;
