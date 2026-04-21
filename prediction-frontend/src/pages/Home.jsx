import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
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
      {/* Background Image */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: `url("/HeroBG.png")`, // bỏ ảnh vào public/
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(3px)",
          transform: "scale(1.1)", // tránh bị hở viền khi blur
          zIndex: 0,
          opacity: 0.05,
        }}
      />

      {/* Dark Overlay */}
      <Box
        sx={{
          position: "absolute",
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.03)",
          zIndex: 1,
        }}
      />

      {/* Content */}
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
          Prediction System
        </Typography>

        <Typography variant="h6" sx={{ mt: 2, opacity: 0.8 }}>
          Dự đoán số theo ngày – nhanh, gọn, chính xác
        </Typography>

        <Box sx={{ mt: 4, display: "flex", gap: 3, justifyContent: "center" }}>
          <Button
            variant="contained"
            size="large"
            sx={{
              px: 4,
              background: "linear-gradient(135deg, #6a5cff, #00c6ff)",
            }}
            onClick={() => navigate("/input")}
          >
            Nhập số
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
            Xem dự đoán
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
