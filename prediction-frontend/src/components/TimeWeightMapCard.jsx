import { Box, Typography, Button } from "@mui/material";
import { useState } from "react";

function TimeWeightMapCard({ data }) {
  const [expanded, setExpanded] = useState(false);

  if (!data) return null;

  const list = data?.["-1"] || [];

  const visibleList = expanded ? list : list.slice(0, 12);

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
        <Typography sx={{ fontWeight: "bold" }}>🔗 Time Weight</Typography>

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
              key={item.number}
              sx={{
                px: 1,
                py: 0.8,
                borderRadius: 2,
                background: "rgba(255,255,255,0.05)",
                fontFamily: "Courier New",
                fontSize: 12,
                display: "flex",
                justifyContent: "space-between",
                transition: "0.2s",

                "&:hover": {
                  background: "rgba(255,255,255,0.1)",
                },
              }}
            >
              {/* 🔥 rank */}
              <span style={{ opacity: 0.5, width: 20 }}>#{index + 1}</span>

              {/* 🔥 number */}
              <span style={{ fontWeight: "bold" }}>
                {item.number.toString().padStart(2, "0")}
              </span>

              {/* 🔥 score */}
              <span style={{ opacity: 0.7 }}>{item.score.toFixed(2)}</span>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default TimeWeightMapCard;
