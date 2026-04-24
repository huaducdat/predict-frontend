import { Box, Card, CardContent, Typography, Stack } from "@mui/material";

function ChainAnalysis({ chains }) {
  if (!chains || chains.length === 0) return null;

  return (
    <Card sx={{ borderRadius: 3,  marginTop: 3 }}>
      <CardContent>
        <Typography variant="h6">Chain Analysis</Typography>

        <Stack spacing={3} sx={{ mt: 2 }}>
          {[...chains].reverse().map((chain) => (
            <Box key={chain.chainId}>
              {/* HEADER */}
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                {chain.chainName} ({(chain.chainWeight * 100).toFixed(0)}%)
              </Typography>

              {/* NUMBERS */}
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                {(chain.topNumbers || chain.numbers)
                  ?.slice(0, 12)
                  .map((n, index) => (
                    <Box
                      key={n.number}
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 2,
                        fontSize: 13,
                        whiteSpace: "nowrap", // 🔥 không xuống dòng trong box
                        background:
                          n.score > 0.8
                            ? "gold"
                            : n.score > 0.5
                              ? "#444"
                              : "#111",
                        color: n.score > 0.8 ? "#000" : "#fff",
                      }}
                    >
                      {index + 1}. {n.number.toString().padStart(2, "0")} (
                      {n.score.toFixed(2)})
                    </Box>
                  ))}
              </Box>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default ChainAnalysis;
