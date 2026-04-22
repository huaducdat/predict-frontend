import { Box, Card, CardContent, Typography } from "@mui/material";

function StreakGrid({ data = [] }) {
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

  return (
    <Box
      sx={{
        mt: 2,
        overflowX: "auto",
        pb: 1,

        "&::-webkit-scrollbar": {
          height: 6,
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "#bbb",
          borderRadius: 10,
        },
      }}
    >
      <Box
        sx={{
          display: "grid",

          // 🔥 KEY: 2 hàng
          gridTemplateRows: "repeat(2, auto)",

          // 🔥 đổ item theo cột (quan trọng)
          gridAutoFlow: "column",

          // 🔥 mỗi ô rộng cố định
          gridAutoColumns: "90px",

          gap: 2,

          minWidth: "max-content", // để scroll hoạt động
        }}
      >
        {numbers.map((item) => {
          const active = item.currentStreak > 0;

          return (
            <Card
              key={item.number}
              sx={{
                borderRadius: 3,
                textAlign: "center",
                border: active
                  ? "2px solid #2e7d32"
                  : "1px solid #ddd",
                bgcolor: active ? "#e8f5e9" : "#fafafa",
              }}
            >
              <CardContent sx={{ py: 2 }}>
                <Typography fontWeight="bold">
                  {String(item.number).padStart(2, "0")}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    mt: 1,
                    color: active ? "success.main" : "text.secondary",
                    fontWeight: 600,
                  }}
                >
                  🔥 {item.currentStreak}
                </Typography>

                <Typography variant="body2" color="text.secondary">
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