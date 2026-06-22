import {
  AppBar,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router-dom";

import LogoutIcon from "@mui/icons-material/Logout";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import MenuIcon from "@mui/icons-material/Menu";

import { useEffect, useMemo, useState } from "react";
import PatternReportWidget from "./PatternReportWidget";
import { vi } from "../i18n/vi";
import { getMe } from "../api/authApi";

const NAV_ITEMS = [
  { label: vi.menu.home, path: "/" },
  { label: "Nhập kết quả", path: "/input" },
  { label: "Dự đoán", path: "/prediction" },
  { label: "Kết quả", path: "/history" },
  { label: "Cược", path: "/bet" },
  { label: "Phân tích predictor", path: "/intelligence" },
  { label: "Báo cáo pattern", path: "/pattern-report" },
  { label: "Luồng quyết định", path: "/decision-trace" },
  { label: "Đánh giá hệ thống", path: "/system-evaluation" },
];

const ADAPTIVE_NAV_ITEMS = [
  { label: "Dashboard", path: "/adaptive" },
  { label: "Prediction", path: "/adaptive-prediction" },
  { label: "Performance", path: "/adaptive-performance" },
  { label: "Intelligence", path: "/adaptive-intelligence" },
  { label: "Shadow Ranking", path: "/adaptive-shadow" },
];

const AUDIT_NAV_ITEMS = [
  { label: "Theo doi hieu suat", path: "/system-intelligence/performance-cards" },
  { label: "Bang audit", path: "/system-intelligence/audit" },
  { label: "Toi uu rank", path: "/system-intelligence/rank-optimization" },
  { label: "Xep hang shadow", path: "/system-intelligence/shadow-ranking" },
  { label: "Dong gop predictor", path: "/system-intelligence/predictor-contribution" },
];

const SPECIAL_NAV_ITEMS = [
  { label: "Special Prediction", path: "/special-prediction" },
  { label: "Special Performance Cards", path: "/special-prediction/performance-cards" },
  { label: "Special Intelligence", path: "/special-prediction/intelligence" },
  { label: "Special Analytics", path: "/special-prediction/analytics" },
];

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [anchorEl, setAnchorEl] = useState(null);
  const [adaptiveAnchorEl, setAdaptiveAnchorEl] = useState(null);
  const [auditAnchorEl, setAuditAnchorEl] = useState(null);
  const [specialAnchorEl, setSpecialAnchorEl] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setUser(await getMe());
      } catch (err) {
        console.error("Load current user error:", err);
      }
    };

    void loadUser();
  }, []);

  const navItems = useMemo(() => {
    const items = [...NAV_ITEMS, { label: "Tai khoan", path: "/account" }];

    if (user?.role === "ADMIN") {
      items.push({ label: "Quan ly user", path: "/admin/users" });
    }

    return items;
  }, [user?.role]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAuditMenuOpen = (event) => {
    setAuditAnchorEl(event.currentTarget);
  };

  const handleAdaptiveMenuOpen = (event) => {
    setAdaptiveAnchorEl(event.currentTarget);
  };

  const handleAdaptiveMenuClose = () => {
    setAdaptiveAnchorEl(null);
  };

  const handleAuditMenuClose = () => {
    setAuditAnchorEl(null);
  };

  const handleSpecialMenuOpen = (event) => {
    setSpecialAnchorEl(event.currentTarget);
  };

  const handleSpecialMenuClose = () => {
    setSpecialAnchorEl(null);
  };

  const handleNavigate = (path) => {
    navigate(path);
    handleMenuClose();
    handleAdaptiveMenuClose();
    handleAuditMenuClose();
    handleSpecialMenuClose();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const isAuditActive = AUDIT_NAV_ITEMS.some((item) => isActive(item.path));
  const isAdaptiveActive = ADAPTIVE_NAV_ITEMS.some((item) => isActive(item.path));
  const isSpecialActive = SPECIAL_NAV_ITEMS.some((item) => isActive(item.path));

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        top: 0,
        zIndex: theme.zIndex.appBar,
        background: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid #E2E8F0",
        color: "#0F172A",
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          minHeight: 72,
          px: { xs: 2, md: 3 },
          py: { xs: 1, md: 1.2 },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, minWidth: 0 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 3,
              background: "linear-gradient(135deg, #2563EB, #0F766E)",
              boxShadow: "0 12px 28px rgba(37,99,235,0.22)",
            }}
          />
          <Typography variant="h6" sx={{ fontWeight: 950, color: "#0F172A", whiteSpace: "nowrap" }}>
            {vi.app.name}
          </Typography>
        </Box>

        {isMobile ? (
          <>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <PatternReportWidget dense />
              <IconButton onClick={handleMenuOpen} sx={{ color: "#0F172A" }}>
                <MenuIcon />
              </IconButton>
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              {navItems.map((item) => (
                <MenuItem
                  key={item.path}
                  selected={isActive(item.path)}
                  onClick={() => handleNavigate(item.path)}
                >
                  {item.label}
                </MenuItem>
              ))}
              <MenuItem disabled sx={{ fontWeight: 900, opacity: "1 !important", color: "#0F172A" }}>
                Adaptive
              </MenuItem>
              {ADAPTIVE_NAV_ITEMS.map((item) => (
                <MenuItem
                  key={item.path}
                  selected={isActive(item.path)}
                  onClick={() => handleNavigate(item.path)}
                  sx={{ pl: 3 }}
                >
                  {item.label}
                </MenuItem>
              ))}
              <MenuItem disabled sx={{ fontWeight: 900, opacity: "1 !important", color: "#0F172A" }}>
                Tri tue he thong
              </MenuItem>
              {AUDIT_NAV_ITEMS.map((item) => (
                <MenuItem
                  key={item.path}
                  selected={isActive(item.path)}
                  onClick={() => handleNavigate(item.path)}
                  sx={{ pl: 3 }}
                >
                  {item.label}
                </MenuItem>
              ))}
              <MenuItem disabled sx={{ fontWeight: 900, opacity: "1 !important", color: "#0F172A" }}>
                Special Prediction
              </MenuItem>
              {SPECIAL_NAV_ITEMS.map((item) => (
                <MenuItem
                  key={item.path}
                  selected={isActive(item.path)}
                  onClick={() => handleNavigate(item.path)}
                  sx={{ pl: 3 }}
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
              flexWrap: "wrap",
              gap: 1,
              alignItems: "center",
              justifyContent: "flex-end",
              minWidth: 0,
              maxWidth: "calc(100vw - 260px)",
            }}
          >
            <PatternReportWidget />

            {navItems.map((item) => (
              <Button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                sx={{
                  textTransform: "none",
                  borderRadius: 999,
                  px: { md: 1.2, lg: 1.55 },
                  py: 0.72,
                  minWidth: 0,
                  color: isActive(item.path) ? "#0F172A" : "#475569",
                  backgroundColor: isActive(item.path) ? "#EAF2FF" : "transparent",
                  border: isActive(item.path) ? "1px solid #93C5FD" : "1px solid transparent",
                  boxShadow: isActive(item.path) ? "0 6px 18px rgba(37,99,235,0.12)" : "none",
                  fontSize: { md: 13, lg: 14 },
                  fontWeight: isActive(item.path) ? 900 : 700,
                  whiteSpace: "nowrap",
                  lineHeight: 1.2,
                  "&:hover": {
                    backgroundColor: "rgba(37,99,235,0.08)",
                    color: "#1D4ED8",
                  },
                }}
              >
                {item.label}
              </Button>
            ))}

            <Button
              onClick={handleAdaptiveMenuOpen}
              endIcon={<KeyboardArrowDownIcon />}
              sx={{
                textTransform: "none",
                borderRadius: 999,
                px: { md: 1.2, lg: 1.55 },
                py: 0.72,
                minWidth: 0,
                color: isAdaptiveActive ? "#0F172A" : "#475569",
                backgroundColor: isAdaptiveActive ? "#EAF2FF" : "transparent",
                border: isAdaptiveActive ? "1px solid #93C5FD" : "1px solid transparent",
                boxShadow: isAdaptiveActive ? "0 6px 18px rgba(37,99,235,0.12)" : "none",
                fontSize: { md: 13, lg: 14 },
                fontWeight: isAdaptiveActive ? 900 : 700,
                whiteSpace: "nowrap",
                lineHeight: 1.2,
                "&:hover": {
                  backgroundColor: "rgba(37,99,235,0.08)",
                  color: "#1D4ED8",
                },
              }}
            >
              Adaptive
            </Button>

            <Menu
              anchorEl={adaptiveAnchorEl}
              open={Boolean(adaptiveAnchorEl)}
              onClose={handleAdaptiveMenuClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              {ADAPTIVE_NAV_ITEMS.map((item) => (
                <MenuItem
                  key={item.path}
                  selected={isActive(item.path)}
                  onClick={() => handleNavigate(item.path)}
                >
                  {item.label}
                </MenuItem>
              ))}
            </Menu>

            <Button
              onClick={handleSpecialMenuOpen}
              endIcon={<KeyboardArrowDownIcon />}
              sx={{
                textTransform: "none",
                borderRadius: 999,
                px: { md: 1.2, lg: 1.55 },
                py: 0.72,
                minWidth: 0,
                color: isSpecialActive ? "#0F172A" : "#475569",
                backgroundColor: isSpecialActive ? "#EAF2FF" : "transparent",
                border: isSpecialActive ? "1px solid #93C5FD" : "1px solid transparent",
                boxShadow: isSpecialActive ? "0 6px 18px rgba(37,99,235,0.12)" : "none",
                fontSize: { md: 13, lg: 14 },
                fontWeight: isSpecialActive ? 900 : 700,
                whiteSpace: "nowrap",
                lineHeight: 1.2,
                "&:hover": {
                  backgroundColor: "rgba(37,99,235,0.08)",
                  color: "#1D4ED8",
                },
              }}
            >
              Special Prediction
            </Button>

            <Menu
              anchorEl={specialAnchorEl}
              open={Boolean(specialAnchorEl)}
              onClose={handleSpecialMenuClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              {SPECIAL_NAV_ITEMS.map((item) => (
                <MenuItem
                  key={item.path}
                  selected={isActive(item.path)}
                  onClick={() => handleNavigate(item.path)}
                >
                  {item.label}
                </MenuItem>
              ))}
            </Menu>

            <Button
              onClick={handleAuditMenuOpen}
              endIcon={<KeyboardArrowDownIcon />}
              sx={{
                textTransform: "none",
                borderRadius: 999,
                px: { md: 1.2, lg: 1.55 },
                py: 0.72,
                minWidth: 0,
                color: isAuditActive ? "#0F172A" : "#475569",
                backgroundColor: isAuditActive ? "#EAF2FF" : "transparent",
                border: isAuditActive ? "1px solid #93C5FD" : "1px solid transparent",
                boxShadow: isAuditActive ? "0 6px 18px rgba(37,99,235,0.12)" : "none",
                fontSize: { md: 13, lg: 14 },
                fontWeight: isAuditActive ? 900 : 700,
                whiteSpace: "nowrap",
                lineHeight: 1.2,
                "&:hover": {
                  backgroundColor: "rgba(37,99,235,0.08)",
                  color: "#1D4ED8",
                },
              }}
            >
              Tri tue he thong
            </Button>

            <Menu
              anchorEl={auditAnchorEl}
              open={Boolean(auditAnchorEl)}
              onClose={handleAuditMenuClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              {AUDIT_NAV_ITEMS.map((item) => (
                <MenuItem
                  key={item.path}
                  selected={isActive(item.path)}
                  onClick={() => handleNavigate(item.path)}
                >
                  {item.label}
                </MenuItem>
              ))}
            </Menu>

            <Button
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
              variant="contained"
              sx={{
                borderRadius: 999,
                textTransform: "none",
                px: { md: 1.45, lg: 1.8 },
                ml: 0.2,
                fontSize: { md: 13, lg: 14 },
                whiteSpace: "nowrap",
                background: "#0F172A",
                boxShadow: "0 12px 28px rgba(15,23,42,0.18)",
                "&:hover": { background: "#1E293B" },
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
