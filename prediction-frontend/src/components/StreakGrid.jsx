import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";

function StreakGrid({ data = [], onSelect }) {
  const streakMap = new Map(data.map((item) => [item.number, item]));

  const numbers = Array.from({ length: 100 }, (_, i) => {
    return (
      streakMap.get(i) || {
        number: i,
        currentStreak: 0,
        maxStreak: 0,
      }
    );
  });

  const getStyle = (streak) => {
    if (streak >= 4) {
      return {
        border: "2px solid #d32f2f",
        bgcolor: "#ffebee",
        color: "#d32f2f",
      };
    }
    if (streak >= 2) {
      return {
        border: "2px solid #2e7d32",
        bgcolor: "#e8f5e9",
        color: "#2e7d32",
      };
    }
    if (streak === 1) {
      return {
        border: "1px solid #81c784",
        bgcolor: "#f1f8e9",
        color: "#558b2f",
      };
    }
    return {
      border: "1px solid #ddd",
      bgcolor: "#fafafa",
      color: "#999",
    };
  };

  return (
    <Box sx={{ mt: 2, overflowX: "auto", pb: 1, background:"#00000010", padding: 1, borderRadius: 1,}}>
      <Box
        sx={{
          display: "grid",
          gridTemplateRows: "repeat(2, auto)",
          gridAutoFlow: "column",
          gridAutoColumns: "90px",
          gap: 2,
          minWidth: "max-content",
        }}
      >
        {numbers.map((item) => {
          const style = getStyle(item.currentStreak);

          return (
            <Card
              key={item.number}
              onClick={() => onSelect?.(item.number)}
              sx={{
                borderRadius: 3,
                textAlign: "center",
                transition: "0.2s",
                cursor: "pointer",
                ...style,
                "&:hover": {
                  transform: "translateY(-3px)",
                  boxShadow: 3,
                },
              }}
            >
              <CardContent sx={{ py: 2 }}>
                <Typography fontWeight="bold">
                  {String(item.number).padStart(2, "0")}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ mt: 1, fontWeight: 700, color: style.color }}
                >
                  🔥 {item.currentStreak}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  max {item.maxStreak}
                </Typography>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}

export default StreakGrid;
