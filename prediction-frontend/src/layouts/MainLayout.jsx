import { Box } from "@mui/material";
import Header from "../components/Header";

export default function MainLayout({ children }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 8% 0%, rgba(96,165,250,0.18), transparent 28%), linear-gradient(180deg, #F4F7FB 0%, #F8FAFC 56%, #EEF4FF 100%)",
      }}
    >
      <Header />
      <Box sx={{ px: { xs: 1.5, md: 3 }, py: { xs: 2, md: 3 } }}>{children}</Box>
    </Box>
  );
}
