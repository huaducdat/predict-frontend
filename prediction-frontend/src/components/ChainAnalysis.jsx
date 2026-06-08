import { Box, Card, CardContent, Typography, Stack } from "@mui/material";
import { vi } from "../i18n/vi";

function ChainAnalysis({ chains }) {
  const safeChains = Array.isArray(chains)
    ? chains.filter((chain) => chain && typeof chain === "object")
    : [];

  if (safeChains.length === 0) return null;

  const formatPercent = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? (num * 100).toFixed(0) : "--";
  };

  const formatNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? String(num).padStart(2, "0") : "--";
  };

  const formatScore = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(2) : "--";
  };

  return (
    <Card sx={{ borderRadius: 3, marginTop: 3 }}>
      <CardContent>
        <Typography variant="h6">{vi.chain.title}</Typography>

        <Stack spacing={3} sx={{ mt: 2 }}>
          {[...safeChains].reverse().map((chain, chainIndex) => {
            const numbers = Array.isArray(chain.topNumbers)
              ? chain.topNumbers
              : Array.isArray(chain.numbers)
              ? chain.numbers
              : [];

            return (
              <Box key={chain.chainId ?? chainIndex}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  {chain.chainName || "--"} ({formatPercent(chain.chainWeight)}%)
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  {numbers
                    .filter((n) => n && typeof n === "object")
                    .slice(0, 12)
                    .map((n, index) => {
                      const score = Number(n.score);
                      return (
                        <Box
                          key={`${n.number ?? "unknown"}-${index}`}
                          sx={{
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 2,
                            fontSize: 13,
                            whiteSpace: "nowrap",
                            background:
                              score > 0.8
                                ? "gold"
                                : score > 0.5
                                  ? "#444"
                                  : "#111",
                            color: score > 0.8 ? "#000" : "#fff",
                          }}
                        >
                          {index + 1}. {formatNumber(n.number)} ({formatScore(n.score)})
                        </Box>
                      );
                    })}
                </Box>
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default ChainAnalysis;
