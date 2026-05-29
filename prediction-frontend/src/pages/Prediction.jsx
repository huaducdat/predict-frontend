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
import PairGlobalCard from "../components/PairGlobalCard";
import WeightControlMini from "../components/WeightControlMini";
import CombineResultCard from "../components/CombineResultCard";
import CombineExplainCard from "../components/CombineExplainCard";
import { vi } from "../i18n/vi";

function Prediction() {
  const [data, setData] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const handleLoad = async () => {
    try {
      setLoading(true);
      const res = await loadPredict();
      setData(res.data);
      setMeta(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleLoad();
  }, []);

  const positionData = data?.POSITION;
  const gapData = data?.GAP;
  const pairData = data?.PAIR_TO_NEXT;
  const recentFreq = data?.RECENT_FREQUENCY;
  const repeatData = data?.REPEAT;
  const streakData = data?.STREAK_CONTINUE;
  const timeweightData = data?.TIME_WEIGHTED_COUNT;

  const isOld =
    meta && new Date(meta.date).toDateString() !== new Date().toDateString();

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        sx={{
          mb: 1,
          fontFamily: "Courier New",
          fontWeight: "bold",
        }}
      >
        {vi.prediction.title}
      </Typography>

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
          {vi.common.date}: {meta.date} | {new Date(meta.createdAt).toLocaleString("vi-VN")}
          {isOld && ` - ${vi.prediction.oldData}`}
        </Typography>
      )}

      {meta && <PredictionSourceResultCard date={meta.date} />}

      <CombineResultCard />
      <WeightControlMini />
      <CombineExplainCard />

      <Stack direction="row" spacing={2} sx={{ mb: 3, marginTop: 2 }}>
        <Button variant="contained" onClick={handleRun} disabled={loading}>
          {vi.common.run}
        </Button>

        <Button variant="outlined" onClick={handleLoad} disabled={loading}>
          {vi.common.reload}
        </Button>
      </Stack>

      {loading && <Typography sx={{ mb: 2 }}>{vi.common.loading}</Typography>}

      {!loading && !data && <Typography>{vi.prediction.noData}</Typography>}

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

          <PairGlobalCard />
          <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.2)" }} />

          <PairCard data={pairData?.["-1"]} />
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
