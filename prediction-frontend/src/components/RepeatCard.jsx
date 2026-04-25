import { Box, Typography, Stack, Button } from "@mui/material";
import { useState } from "react";

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
          mb: 2,
        }}
      >
        <Typography variant="h6">🔁 Repeat Predictor</Typography>

        <Button
          size="small"
          onClick={() => setExpanded(!expanded)}
          sx={{
            color: "#00e5ff",
            textTransform: "none",
            fontSize: 12,
          }}
        >
          {expanded ? "Thu gọn" : "Xem thêm"}
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
                  : "rgba(255,255,255,0.05)",

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