import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { vi } from "../i18n/vi";

export default function Home() {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        position: "relative",
        height: "80vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        overflow: "hidden",
        borderRadius: "15px",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: `url("/HeroBG.png")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(3px)",
          transform: "scale(1.1)",
          zIndex: 0,
          opacity: 0.05,
        }}
      />

      <Box
        sx={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.03)",
          zIndex: 1,
        }}
      />

      <Box sx={{ position: "relative", zIndex: 2 }}>
        <Typography
          variant="h2"
          sx={{
            fontWeight: "bold",
            background: "linear-gradient(90deg, #6a5cff, #00c6ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {vi.home.title}
        </Typography>

        <Typography variant="h6" sx={{ mt: 2, opacity: 0.8 }}>
          {vi.home.subtitle}
        </Typography>

        <Box sx={{ mt: 4, display: "flex", gap: 3, justifyContent: "center", flexWrap: "wrap" }}>
          <Button
            variant="contained"
            size="large"
            sx={{
              px: 4,
              background: "linear-gradient(135deg, #6a5cff, #00c6ff)",
            }}
            onClick={() => navigate("/input")}
          >
            {vi.home.input}
          </Button>

          <Button
            variant="outlined"
            size="large"
            sx={{
              px: 4,
              borderColor: "#6a5cff",
              color: "#6a5cff",
            }}
            onClick={() => navigate("/prediction")}
          >
            {vi.home.prediction}
          </Button>

          <Button
            variant="outlined"
            size="large"
            sx={{
              px: 4,
              borderColor: "#00c6ff",
              color: "#00c6ff",
            }}
            onClick={() => navigate("/history")}
          >
            {vi.home.savedData}
          </Button>

          <Button variant="contained" onClick={() => navigate("/bet")}>
            {vi.home.bet}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
