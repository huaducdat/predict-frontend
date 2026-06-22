import { useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router-dom";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";

import { getMe } from "../api/authApi";
import { vi } from "../i18n/vi";
import PatternReportWidget from "./PatternReportWidget";

const DOMAIN_MENUS = [
  {
    key: "prediction",
    label: "Prediction",
    items: [
      { label: "Prediction", path: "/prediction" },
      { label: "Performance Cards", path: "/system-intelligence/performance-cards" },
      { label: "Prediction Intelligence", path: "/intelligence" },
      { label: "Meta Intelligence", path: "/system-intelligence/audit" },
      { label: "Shadow Ranking", path: "/system-intelligence/shadow-ranking" },
      { label: "System Evaluation", path: "/system-evaluation" },
      { label: "Pattern Report", path: "/pattern-report" },
    ],
  },
  {
    key: "adaptive",
    label: "Adaptive",
    items: [
      { label: "Adaptive Dashboard", path: "/adaptive" },
      { label: "Adaptive Prediction", path: "/adaptive-prediction" },
      { label: "Adaptive Performance", path: "/adaptive-performance" },
      { label: "Adaptive Intelligence", path: "/adaptive-intelligence" },
      { label: "Adaptive Shadow Ranking", path: "/adaptive-shadow" },
    ],
  },
  {
    key: "special",
    label: "Special",
    items: [
      { label: "Special Dashboard", path: "/special" },
      { label: "Special Prediction", path: "/special-prediction" },
      { label: "Special Performance Cards", path: "/special-prediction/performance-cards" },
      { label: "Special Intelligence", path: "/special-prediction/intelligence" },
      { label: "Special Analytics", path: "/special-prediction/analytics" },
    ],
  },
];

function pathOnly(path) {
  return path.split("#")[0];
}

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileAnchor, setMobileAnchor] = useState(null);
  const [domainMenu, setDomainMenu] = useState({ key: null, anchor: null });
  const [accountAnchor, setAccountAnchor] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    getMe().then(setUser).catch((err) => console.error("Load current user error:", err));
  }, []);

  const accountItems = useMemo(() => {
    const items = [{ label: "Tai khoan", path: "/account" }];
    if (user?.role === "ADMIN") items.push({ label: "Quan ly user", path: "/admin/users" });
    return items;
  }, [user?.role]);

  const isActive = (path) => {
    const target = pathOnly(path);
    if (target === "/") return location.pathname === "/";
    return location.pathname === target || location.pathname.startsWith(`${target}/`);
  };

  const isDomainActive = (menu) => menu.items.some((item) => isActive(item.path));

  const closeMenus = () => {
    setMobileAnchor(null);
    setDomainMenu({ key: null, anchor: null });
    setAccountAnchor(null);
  };

  const handleNavigate = (path) => {
    closeMenus();
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    closeMenus();
    navigate("/login");
  };

  const domainButtonSx = (active) => ({
    minWidth: 0,
    px: 1.5,
    color: active ? "#0F172A" : "#475569",
    backgroundColor: active ? "#EAF2FF" : "transparent",
    border: active ? "1px solid #93C5FD" : "1px solid transparent",
    textTransform: "none",
    fontWeight: active ? 950 : 800,
    "&:hover": { backgroundColor: "rgba(37,99,235,0.08)", color: "#1D4ED8" },
  });

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        top: 0,
        zIndex: theme.zIndex.appBar,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid #E2E8F0",
        color: "#0F172A",
      }}
    >
      <Toolbar sx={{ minHeight: 68, gap: 2, px: { xs: 2, md: 3 } }}>
        <Button
          onClick={() => navigate("/")}
          sx={{ minWidth: 0, p: 0, textTransform: "none", color: "#0F172A" }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2, background: "linear-gradient(135deg, #2563EB, #0F766E)" }} />
            <Typography variant="h6" sx={{ fontWeight: 950, whiteSpace: "nowrap" }}>
              {vi.app.name}
            </Typography>
          </Box>
        </Button>

        <Box sx={{ flex: 1 }} />

        {isMobile ? (
          <>
            <PatternReportWidget dense />
            <Tooltip title="Navigation">
              <IconButton onClick={(event) => setMobileAnchor(event.currentTarget)} aria-label="Open navigation">
                <MenuIcon />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={mobileAnchor}
              open={Boolean(mobileAnchor)}
              onClose={closeMenus}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              slotProps={{ paper: { sx: { minWidth: 280, maxHeight: "calc(100vh - 88px)" } } }}
            >
              {DOMAIN_MENUS.map((menu, menuIndex) => (
                <Box key={menu.key}>
                  {menuIndex > 0 ? <Divider /> : null}
                  <MenuItem disabled sx={{ opacity: "1 !important", color: "#0F172A", fontWeight: 950 }}>
                    {menu.label}
                  </MenuItem>
                  {menu.items.map((item) => (
                    <MenuItem
                      key={`${menu.key}-${item.label}`}
                      selected={isActive(item.path)}
                      onClick={() => handleNavigate(item.path)}
                      sx={{ pl: 3 }}
                    >
                      {item.label}
                    </MenuItem>
                  ))}
                </Box>
              ))}
              <Divider />
              {accountItems.map((item) => (
                <MenuItem key={item.path} selected={isActive(item.path)} onClick={() => handleNavigate(item.path)}>
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
          <>
            <PatternReportWidget />
            {DOMAIN_MENUS.map((menu) => (
              <Box key={menu.key}>
                <Button
                  endIcon={<KeyboardArrowDownIcon />}
                  onClick={(event) => setDomainMenu({ key: menu.key, anchor: event.currentTarget })}
                  sx={domainButtonSx(isDomainActive(menu))}
                >
                  {menu.label}
                </Button>
                <Menu
                  anchorEl={domainMenu.anchor}
                  open={domainMenu.key === menu.key}
                  onClose={closeMenus}
                  anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                  transformOrigin={{ vertical: "top", horizontal: "left" }}
                >
                  {menu.items.map((item) => (
                    <MenuItem
                      key={`${menu.key}-${item.label}`}
                      selected={isActive(item.path)}
                      onClick={() => handleNavigate(item.path)}
                    >
                      {item.label}
                    </MenuItem>
                  ))}
                </Menu>
              </Box>
            ))}
            <Tooltip title="Account">
              <IconButton
                onClick={(event) => setAccountAnchor(event.currentTarget)}
                aria-label="Open account menu"
                sx={{ color: isActive("/account") || isActive("/admin/users") ? "#1D4ED8" : "#475569" }}
              >
                <AccountCircleOutlinedIcon />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={accountAnchor}
              open={Boolean(accountAnchor)}
              onClose={closeMenus}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              {accountItems.map((item) => (
                <MenuItem key={item.path} selected={isActive(item.path)} onClick={() => handleNavigate(item.path)}>
                  {item.label}
                </MenuItem>
              ))}
              <Divider />
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1 }} />
                {vi.menu.logout}
              </MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
