import { Box, Typography, Paper, Button, Stack, Divider } from "@mui/material";
import { runPredict, loadPredict } from "../api/predictApi";
import { useState, useEffect } from "react";

import PositionCard from "../components/PositionCard";
import PairCard from "../components/PairCard";
import GapCard from "../components/GapCard";
import RepeatCard from "../components/RepeatCard";
import StreakCard from "../components/StreakCard";
import RecentFrequencyCard from "../components/RecentFrequencyCard";
import TimeWeightMapCard from "../components/TimeWeightMapCard";
import PredictionSourceResultCard from "../components/PredictionSourceResultCard";
import TimeWeightGlobalCard from "../components/TimeWeightGlobalCard";

function Prediction() {
  const [data, setData] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🚀 RUN
  const handleRun = async () => {
    try {
      setLoading(true);
      await runPredict();
      await handleLoad();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 📦 LOAD
  const handleLoad = async () => {
    try {
      setLoading(true);
      const res = await loadPredict();
      console.log(res);
      setData(res.data); // predictor
      setMeta(res); // meta
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 AUTO LOAD
  useEffect(() => {
    handleLoad();
  }, []);

  // 🧠 SAFE ACCESS
  const positionData = data?.POSITION;
  const gapData = data?.GAP;
  const pairData = data?.PAIR_TO_NEXT;
  const recentFreq = data?.RECENT_FREQUENCY;
  const repeatData = data?.REPEAT;
  const streakData = data?.STREAK_CONTINUE;
  const timeweightData = data?.TIME_WEIGHTED_COUNT;

  // ⚠️ CHECK OLD DATA
  const isOld =
    meta && new Date(meta.date).toDateString() !== new Date().toDateString();

  return (
    <Box sx={{ p: 3 }}>
      {/* 🔥 HEADER */}
      <Typography
        variant="h4"
        sx={{
          mb: 1,
          fontFamily: "Courier New",
          fontWeight: "bold",
        }}
      >
        Prediction Engine
      </Typography>

      {/* 📅 META */}
      {meta && (
        <Typography
          sx={{
            mb: 2,
            fontSize: 13,
            fontFamily: "Courier New",
            opacity: 0.7,
            color: isOld ? "orange" : "white",
          }}
        >
          📅 {meta.date} | ⏱ {new Date(meta.createdAt).toLocaleString()}
          {isOld && "  ⚠️ OLD DATA"}
        </Typography>
      )}

      {meta && <PredictionSourceResultCard date={meta.date} />}

      {/* 🔥 CONTROL */}
      <Stack direction="row" spacing={2} sx={{ mb: 3, marginTop: 2 }}>
        <Button variant="contained" onClick={handleRun} disabled={loading}>
          🚀 Run
        </Button>

        <Button variant="outlined" onClick={handleLoad} disabled={loading}>
          📦 Reload
        </Button>
      </Stack>

      {/* ⏳ LOADING */}
      {loading && <Typography sx={{ mb: 2 }}>Loading...</Typography>}

      {/* ❌ NO DATA */}
      {!loading && !data && <Typography>No data available</Typography>}

      {/* 🔥 MAIN CARD */}
      {data && (
        <Paper
          sx={{
            p: 2,
            borderRadius: 3,
            backdropFilter: "blur(10px)",
            background: "linear-gradient(135deg, #1a1a1a, #2a2a2a)",
            color: "white",
          }}
        >
          <RecentFrequencyCard data={recentFreq} />
          <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.2)" }} />

          <PairCard data={pairData} />
          <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.2)" }} />

          <TimeWeightGlobalCard date={meta.date} />
          <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.2)" }} />

          <TimeWeightMapCard data={timeweightData} />
          <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.2)" }} />

          <StreakCard data={streakData} />
          <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.2)" }} />

          <RepeatCard data={repeatData} />
          <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.2)" }} />

          <GapCard data={gapData} />
          <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.2)" }} />

          <PositionCard data={positionData} />
        </Paper>
      )}
    </Box>
  );
}

export default Prediction;
