import { Box } from "@mui/material";
import Header from "../components/Header";

export default function MainLayout({ children }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        ackground: "linear-gradient(135deg, #1e1e2f, #121212)",
        padding: 2,
      }}
    >
      <Header />
      <Box sx={{ p: 3 }}>{children}</Box>
    </Box>
  );
}
