import { Box, Typography, Button } from "@mui/material";
import { useState } from "react";

function StreakCard({ data }) {
  const [expanded, setExpanded] = useState(false);

  if (!data || !data["-1"]) return null;

  const fullList = data["-1"];
  const list = expanded ? fullList : fullList.slice(0, 12);

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 3,
        backdropFilter: "blur(10px)",
        background: "linear-gradient(135deg, #1a1a1a, #2a2a2a)",
        color: "white",
        position: "relative",
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
          🔥 Streak
        </Typography>

        <Button
          size="small"
          onClick={() => setExpanded(!expanded)}
          sx={{
            color: "#00e5ff",
            textTransform: "none",
            fontSize: 12,
            minWidth: 0,
            px: 1,
            py: 0.5,
          }}
        >
          {expanded ? "Thu gọn" : "Xem thêm"}
        </Button>
      </Box>

      {/* GRID */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,

          maxHeight: expanded ? 300 : 100,
          overflow: "hidden",
          transition: "all 0.3s ease",
        }}
      >
        {list.map((item) => (
          <Box
            key={item.number}
            sx={{
              minWidth: 40,
              px: 1.2,
              py: 0.8,
              borderRadius: 2,
              textAlign: "center",
              fontFamily: "Courier New",
              fontVariantNumeric: "tabular-nums",
              fontWeight: "bold",
              fontSize: 13,
              background: "linear-gradient(135deg, #00e676, #00c853)",
              color: "#000",
              cursor: "pointer",
              userSelect: "none",
              transition: "0.2s",
              "&:hover": {
                transform: "scale(1.1)",
                background: "linear-gradient(135deg, #00e5ff, #00bcd4)",
              },
            }}
          >
            {/* NUMBER */}
            <div>{item.number.toString().padStart(2, "0")}</div>

            {/* SCORE */}
            <div
              style={{
                fontSize: 10,
                opacity: 0.7,
                marginTop: 2,
              }}
            >
              {item.score.toFixed(2)}
            </div>
          </Box>
        ))}
      </Box>

      {/* FADE khi chưa expand */}
      {!expanded && (
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 30,
            borderRadius: 3,
            background: "linear-gradient(to bottom, transparent, #1a1a1a)",
          }}
        />
      )}
    </Box>
  );
}

export default StreakCard;
