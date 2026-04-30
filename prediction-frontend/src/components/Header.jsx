import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";

import { useState } from "react";

export default function Header() {
  const navigate = useNavigate();
  const theme = useTheme();

  // 🔥 detect mobile
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (e) => {
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path) => {
    navigate(path);
    handleMenuClose();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Input Number", path: "/input" },
    { label: "Predict", path: "/prediction" },
    { label: "History", path: "/history" },
    { label: "Bet", path: "/bet" },
  ];

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
        {/* LEFT */}
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

        {/* RIGHT */}
        {isMobile ? (
          <>
            {/* 🔥 MOBILE MENU BUTTON */}
            <IconButton onClick={handleMenuOpen} color="inherit">
              <MenuIcon />
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
            >
              {navItems.map((item) => (
                <MenuItem
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                >
                  {item.label}
                </MenuItem>
              ))}

              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                color="inherit"
                onClick={() => navigate(item.path)}
                sx={{ textTransform: "none" }}
              >
                {item.label}
              </Button>
            ))}

            <Button
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
              variant="contained"
              sx={{
                borderRadius: 3,
                textTransform: "none",
                px: 2,
                background: "linear-gradient(135deg, #4a4a4a, #2a2a2a)",
                "&:hover": {
                  background: "linear-gradient(135deg, #2a2a2a, #000)",
                },
              }}
            >
              Logout
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}