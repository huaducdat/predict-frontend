import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Stack,
  Alert,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { runPrediction, getTodayPrediction } from "../api/predictionApi";
import { getStreaks } from "../api/streakApi";
import ChainAnalysis from "../components/ChainAnalysis";

function Prediction() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [streakMap, setStreakMap] = useState({});

  // 🔮 Predict button
  const handlePredict = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await runPrediction();
      console.log("RUN DATA:", res); // 🔥 thêm dòng này
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 📦 Load today prediction
  const loadToday = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getTodayPrediction();

      console.log("TODAY DATA:", res); // 🔥 debug

      // 🔥 check đúng dữ liệu
      if (res && res.full && res.full.length > 0) {
        setData(res);
      } else {
        setData(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  const loadStreaks = async () => {
    try {
      const res = await getStreaks();

      const map = {};
      res.forEach((item) => {
        map[item.number] = item;
      });

      setStreakMap(map);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadToday();
    loadStreaks();
  }, []);

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 4 }}>
      <Stack spacing={3}>
        {/* 🔘 BUTTON */}
        <Button
          variant="contained"
          size="large"
          onClick={handlePredict}
          disabled={loading}
        >
          {data ? "🔄 Predict lại" : "🔮 Predict"}
        </Button>

        {/* ⏳ LOADING */}
        {loading && <CircularProgress />}

        {/* ❌ ERROR */}
        {error && <Alert severity="error">{error}</Alert>}

        {/* 📭 NO DATA */}
        {!loading && loaded && !data && (
          <Alert severity="info">
            Chưa có dự đoán hôm nay — bấm Predict để tạo
          </Alert>
        )}

        {/* 📊 RESULT */}
        {data && (
          <>
            <Alert severity="success">Đã có dự đoán hôm nay ✅</Alert>

            {/* TOP 3 */}
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6">Top 3</Typography>

                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  {data?.top3?.map((n) => {
                    const s = streakMap[n.number];

                    return (
                      <Box
                        key={n.number}
                        sx={{
                          px: 2,
                          py: 1,
                          borderRadius: 2,
                          background: "black",
                          color: "white",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        <div>{n.number.toString().padStart(2, "0")}</div>

                        {s && (
                          <div style={{ fontSize: 12 }}>
                            {s.currentStreak}/{s.maxStreak}
                          </div>
                        )}
                        <div style={{ fontSize: 12 }}>
                          {n.score?.toFixed(2)}
                        </div>
                      </Box>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>

            {/* TOP 15 */}
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6">Top 15</Typography>
                <Grid container spacing={1} sx={{ mt: 2 }}>
                  {data?.top15?.map((n) => {
                    const s = streakMap[n.number];

                    return (
                      <Box
                        key={n.number}
                        sx={{
                          px: 2,
                          py: 1,
                          borderRadius: 2,
                          background: "#00000018",
                          color: "black",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        <div>{n.number.toString().padStart(2, "0")}</div>

                        {s && (
                          <div style={{ fontSize: 12 }}>
                            {s.currentStreak}/{s.maxStreak}
                          </div>
                        )}
                        <div style={{ fontSize: 12 }}>
                          {n.score?.toFixed(2)}
                        </div>
                      </Box>
                    );
                  })}
                </Grid>
              </CardContent>
            </Card>
          </>
        )}
      </Stack>

      {/* 🔥 FULL 100 NUMBERS */}
      {data?.full?.length > 0 && (
        <Card sx={{ borderRadius: 3, mt: 3 }}>
          <CardContent>
            <Typography variant="h6">
              All Numbers chance in 180 days<br></br>(Tỷ lệ ra trong 180 days)
            </Typography>

            <Grid container spacing={1} sx={{ mt: 2 }}>
              {data.full.map((n) => (
                <Grid xs={2} key={n.number}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      textAlign: "center",
                      fontSize: 16,
                      background:
                        n.percentage * 100 > 2
                          ? "gold"
                          : n.percentage * 100 > 1
                            ? "#ddd"
                            : "#f5f5f5",
                    }}
                  >
                    <div>{n.number.toString().padStart(2, "0")}</div>
                    <div style={{ fontSize: 13 }}>
                      {(n.percentage * 100).toFixed(1)}%
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>
                      {n.score?.toFixed(2)}
                    </div>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {data && <ChainAnalysis chains={data.chains} />}
    </Box>
  );
}

export default Prediction;
