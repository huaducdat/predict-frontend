import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
export default function Header() {
  const navigate = useNavigate();
  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
        color: "gray",
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* Logo + Name */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: "8px",
              background: "linear-gradient(135deg, #6a5cff, #00c6ff)",
            }}
          />
          <Typography variant="h6">Prediction App</Typography>
        </Box>

        {/* Navigation */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            wordBreak: "break-word",
            whiteSpace: "normal",
          }}
        >
          <Button color="inherit" onClick={() => navigate("/")}>
            Home
          </Button>
          <Button color="inherit" onClick={() => navigate("/input")}>
            Input Number
          </Button>
          <Button color="inherit" onClick={() => navigate("/prediction")}>
            Predict
          </Button>
          <Button color="inherit" onClick={() => navigate("/history")}>
            History
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
