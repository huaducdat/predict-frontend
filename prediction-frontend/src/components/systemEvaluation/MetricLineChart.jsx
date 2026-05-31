import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

const WIDTH = 720;
const HEIGHT = 220;
const PADDING = 28;

function normalizeValue(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Math.min(1, Math.max(0, num));
}

function formatPercent(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "--";
  return `${Math.round(num * 100)}%`;
}

function buildPath(points) {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
}

function toPoints(rows, field) {
  const count = Math.max(rows.length - 1, 1);

  return rows
    .map((row, index) => {
      const value = normalizeValue(row[field]);
      if (value === null) return null;

      return {
        x: PADDING + (index / count) * (WIDTH - PADDING * 2),
        y: PADDING + (1 - value) * (HEIGHT - PADDING * 2),
        value,
      };
    })
    .filter(Boolean);
}

export default function MetricLineChart({ title, rows, series }) {
  const theme = useTheme();
  const safeRows = Array.isArray(rows) ? rows : [];
  const latest = safeRows.at(-1);

  return (
    <Box
      sx={{
        p: 1.4,
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
        backgroundColor: alpha(theme.palette.common.white, 0.035),
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
            {title}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {series.map((item) => (
              <Stack key={item.field} direction="row" spacing={0.6} alignItems="center">
                <Box
                  sx={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    backgroundColor: item.color,
                  }}
                />
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.68)" }}>
                  {item.label}: {formatPercent(latest?.[item.field])}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>

        {safeRows.length > 1 ? (
          <Box sx={{ width: "100%", overflow: "hidden" }}>
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" width="100%" height="220">
              {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                const y = PADDING + (1 - tick) * (HEIGHT - PADDING * 2);
                return (
                  <g key={tick}>
                    <line
                      x1={PADDING}
                      x2={WIDTH - PADDING}
                      y1={y}
                      y2={y}
                      stroke="rgba(255,255,255,0.08)"
                    />
                    <text x={4} y={y + 4} fill="rgba(255,255,255,0.45)" fontSize="11">
                      {Math.round(tick * 100)}
                    </text>
                  </g>
                );
              })}

              {series.map((item) => {
                const points = toPoints(safeRows, item.field);
                if (points.length < 2) return null;

                return (
                  <g key={item.field}>
                    <path
                      d={buildPath(points)}
                      fill="none"
                      stroke={item.color}
                      strokeWidth="3"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    {points.map((point, index) => (
                      <circle
                        key={`${item.field}-${index}`}
                        cx={point.x}
                        cy={point.y}
                        r="3.4"
                        fill={item.color}
                        stroke="#10131b"
                        strokeWidth="1.5"
                      />
                    ))}
                  </g>
                );
              })}
            </svg>
          </Box>
        ) : (
          <Box
            sx={{
              minHeight: 220,
              display: "grid",
              placeItems: "center",
              borderRadius: 2,
              border: `1px dashed ${alpha(theme.palette.common.white, 0.16)}`,
              color: "rgba(255,255,255,0.68)",
            }}
          >
            Chưa đủ dữ liệu lịch sử để vẽ biểu đồ.
          </Box>
        )}
      </Stack>
    </Box>
  );
}
