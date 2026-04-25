import { useEffect, useState } from "react";
import { Box, Typography, Paper } from "@mui/material";
import { getPredictData } from "../api/predictApi";
import PositionCard from "../components/PositionCard";
import PairCard from "../components/PairCard";
import { Divider } from "@mui/material";
import GapCard from "../components/GapCard";
import RepeatCard from "../components/RepeatCard";
import StreakCard from "../components/StreakCard";
import RecentFrequencyCard from "../components/RecentFrequencyCard";
import TimeWeightMapCard from "../components/TimeWeightMapCard";

function Prediction() {
  const [data, setData] = useState({});
  const positionData = data.POSITION;
  const gapData = data.GAP;
  const pairData = data.PAIR_TO_NEXT;
  const recentFreq = data.RECENT_FREQUENCY;
  const repeatData = data.REPEAT;
  const streakData = data.STREAK_CONTINUE;
  const timeweightData = data.TIME_WEIGHTED_COUNT;

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getPredictData(); // ✅ đúng function
        console.log("DATA:", res);
        setData(res);
      } catch (e) {
        console.error(e);
      }
    };

    load();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        sx={{
          mb: 3,
          fontFamily: "Courier New",
          fontWeight: "bold",
        }}
      >
        Prediction
      </Typography>

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
        <Divider
          sx={{
            my: 2,
            borderColor: "rgba(255, 255, 255, 0.22)",
          }}
        />
        <PairCard data={pairData} />
        <Divider
          sx={{
            my: 2,
            borderColor: "rgba(255, 255, 255, 0.22)",
          }}
        />
        <TimeWeightMapCard data={timeweightData} />
        <Divider
          sx={{
            my: 2,
            borderColor: "rgba(255, 255, 255, 0.22)",
          }}
        />
        <StreakCard data={streakData} />
        <Divider
          sx={{
            my: 2,
            borderColor: "rgba(255, 255, 255, 0.22)",
          }}
        />
        <RepeatCard data={repeatData} />
        <Divider
          sx={{
            my: 2,
            borderColor: "rgba(255, 255, 255, 0.22)",
          }}
        />
        <GapCard data={gapData} />
        <Divider
          sx={{
            my: 2,
            borderColor: "rgba(255, 255, 255, 0.22)",
          }}
        />
        <PositionCard data={positionData} />
      </Paper>
    </Box>
  );
}

export default Prediction;
