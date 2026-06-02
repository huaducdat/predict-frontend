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
import PatternReportWidget from "./PatternReportWidget";
import { vi } from "../i18n/vi";

export default function Header() {
  const navigate = useNavigate();
  const theme = useTheme();

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
    { label: vi.menu.home, path: "/" },
    { label: vi.menu.input, path: "/input" },
    { label: vi.menu.prediction, path: "/prediction" },
    { label: vi.menu.intelligence, path: "/intelligence" },
    { label: "Đánh Giá Hệ Thống", path: "/system-evaluation" },
    { label: "Luồng quyết định", path: "/decision-trace" },
    { label: vi.menu.history, path: "/history" },
    { label: vi.menu.bet, path: "/bet" },
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
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: "8px",
              background: "linear-gradient(135deg, #6a5cff, #00c6ff)",
            }}
          />
          <Typography variant="h6">{vi.app.name}</Typography>
        </Box>

        {isMobile ? (
          <>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <PatternReportWidget dense />

              <IconButton onClick={handleMenuOpen} color="inherit">
                <MenuIcon />
              </IconButton>
            </Box>

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
                {vi.menu.logout}
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              alignItems: "center",
              minWidth: 0,
            }}
          >
            <PatternReportWidget />

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
              {vi.menu.logout}
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
