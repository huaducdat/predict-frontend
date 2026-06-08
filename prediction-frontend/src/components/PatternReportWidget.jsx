import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  ButtonBase,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import { getLatestPatternReport, getPatternState } from "../api/patternApi";
import { PATTERN_STATE_UPDATED_EVENT } from "../events/patternStateEvents";
import { vi } from "../i18n/vi";

const STATE_LABELS = {
  STABLE: vi.patternState.STABLE,
  SHIFTING: vi.patternState.SHIFTING,
  VOLATILE: vi.patternState.VOLATILE,
  INSUFFICIENT_DATA: vi.patternState.INSUFFICIENT_DATA,
};

const DEFAULT_SUMMARY = {
  STABLE: vi.pattern.widgetStable,
  SHIFTING: vi.pattern.widgetShifting,
  VOLATILE: vi.pattern.widgetVolatile,
  INSUFFICIENT_DATA: vi.pattern.noPatternReport,
};

const PATTERN_REPORT_MODE_STORAGE_KEY = "patternReportMode";
const PATTERN_REPORT_MODE_CHANGED_EVENT = "pattern-report-mode-changed";

function normalizePayload(payload) {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) {
    return data[0] ?? null;
  }

  if (typeof data === "string") {
    return { state: data };
  }

  if (data && typeof data === "object") {
    return data;
  }

  return null;
}

function readFirst(source, keys) {
  if (!source || typeof source !== "object") return undefined;

  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return undefined;
}

function normalizeState(rawState) {
  const state = String(rawState || "INSUFFICIENT_DATA").toUpperCase();
  return STATE_LABELS[state] ? state : "INSUFFICIENT_DATA";
}

function isUsableReport(report) {
  if (!report || typeof report !== "object") return false;

  return [
    "state",
    "summary",
    "message",
    "mode",
    "boostCap",
    "boost_cap",
    "boost",
    "createdAt",
    "created_at",
    "recentOverlap",
    "activeOverlap",
    "baselineShift",
    "newNumberRatio",
    "groupShiftScore",
    "repeatRatio",
    "entropy",
    "reasons",
    "reasonList",
    "effectiveWeights",
    "effective_weights",
    "weights",
    "metrics",
  ].some((key) => report[key] !== undefined && report[key] !== null);
}

function formatNumber(value, digits = 2) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "--";
  return num.toFixed(digits);
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("vi-VN", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function readStoredPatternMode() {
  if (typeof window === "undefined") return "SHORT_TERM";
  return window.localStorage.getItem(PATTERN_REPORT_MODE_STORAGE_KEY) || "SHORT_TERM";
}

function devLog(label, payload) {
  if (!import.meta.env.DEV) return;
  console.debug(`[${new Date().toISOString()}] ${label}`, payload ?? "");
}

function PatternReportWidget({ dense = false, mode: modeProp }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  const [currentMode, setCurrentMode] = useState(modeProp || readStoredPatternMode());
  const [stateSnapshot, setStateSnapshot] = useState(null);
  const [latestReport, setLatestReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPatternState = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const canUpdate = () => mountedRef.current && requestIdRef.current === requestId;

    if (canUpdate()) {
      setLoading(true);
      setError("");
    }

    try {
      let nextStateSnapshot = null;
      let nextLatestReport = null;

      try {
        nextStateSnapshot = normalizePayload(await getPatternState());
      } catch (stateErr) {
        console.error("Load pattern state error:", stateErr);
      }

      try {
        nextLatestReport = normalizePayload(await getLatestPatternReport(currentMode));
      } catch (latestErr) {
        console.error("Load latest pattern report metadata error:", latestErr);
      }

      if (import.meta.env.DEV) {
        devLog("PATTERN STATE REFRESH", nextStateSnapshot);
        devLog("PATTERN REPORT REFRESH", {
          mode: currentMode,
          payload: nextLatestReport,
        });
        console.debug("[PatternReportWidget] state payload", nextStateSnapshot);
        console.debug("[PatternReportWidget] latest report payload", {
          mode: currentMode,
          payload: nextLatestReport,
        });
      }

      if (canUpdate()) {
        setStateSnapshot(isUsableReport(nextStateSnapshot) ? nextStateSnapshot : null);
        setLatestReport(isUsableReport(nextLatestReport) ? nextLatestReport : null);
        if (!isUsableReport(nextStateSnapshot) && !isUsableReport(nextLatestReport)) {
          setError(vi.pattern.loadError);
        }
      }
    } catch (err) {
      console.error("Load pattern report error:", err);
      if (canUpdate()) setError(vi.pattern.loadError);
    } finally {
      if (canUpdate()) setLoading(false);
    }
  }, [currentMode]);

  useEffect(() => {
    mountedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPatternState();

    if (typeof window !== "undefined") {
      window.addEventListener(PATTERN_STATE_UPDATED_EVENT, loadPatternState);
    }

    return () => {
      mountedRef.current = false;
      if (typeof window !== "undefined") {
        window.removeEventListener(PATTERN_STATE_UPDATED_EVENT, loadPatternState);
      }
    };
  }, [loadPatternState]);

  useEffect(() => {
    if (modeProp) {
      setCurrentMode(modeProp);
      return undefined;
    }

    const handleModeChanged = () => {
      setCurrentMode(readStoredPatternMode());
    };

    if (typeof window !== "undefined") {
      window.addEventListener(PATTERN_REPORT_MODE_CHANGED_EVENT, handleModeChanged);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(PATTERN_REPORT_MODE_CHANGED_EVENT, handleModeChanged);
      }
    };
  }, [modeProp]);

  const state = normalizeState(readFirst(stateSnapshot, ["state", "status", "patternState"]));
  const summary =
    readFirst(latestReport, ["summary", "message", "title", "description"]) ??
    readFirst(stateSnapshot, ["summary", "message", "title", "description"]) ??
    DEFAULT_SUMMARY[state] ??
    vi.common.noData;
  const boostCap = readFirst(latestReport, [
    "boostCap",
    "boost_cap",
    "boost",
    "boostLimit",
  ]);
  const reportMode = readFirst(latestReport, ["mode", "patternMode", "reportMode"]) ?? currentMode;
  const createdAt = readFirst(latestReport, [
    "createdAt",
    "created_at",
    "timestamp",
    "generatedAt",
  ]);

  const label = STATE_LABELS[state] ?? vi.patternState.INSUFFICIENT_DATA;
  const metaParts = [];

  if (boostCap !== undefined && boostCap !== null && boostCap !== "") {
    metaParts.push(`Tăng cường ${formatNumber(boostCap, 2)}`);
  }

  if (reportMode) {
    metaParts.push(vi.mode[String(reportMode).toUpperCase()] ?? String(reportMode).toUpperCase());
  }

  if (createdAt) {
    metaParts.push(formatDate(createdAt));
  }

  const handleOpen = () => {
    navigate("/pattern-report");
  };

  const handleRefresh = async (event) => {
    event.stopPropagation();
    await loadPatternState();
  };

  const tooltipTitle = loading
    ? vi.pattern.widgetLoading
    : error || summary || vi.pattern.widgetDetails;

  return (
    <Stack
      direction="row"
      spacing={0.5}
      sx={{ minWidth: 0, maxWidth: dense ? 180 : 340, alignItems: "center" }}
    >
      <Tooltip title={tooltipTitle} arrow disableInteractive>
        <ButtonBase
          onClick={handleOpen}
          sx={{
            minWidth: 0,
            width: dense ? 112 : 260,
            borderRadius: 999,
            border: `1px solid ${
              state === "STABLE"
                ? alpha(theme.palette.success.main, 0.35)
                : state === "SHIFTING"
                  ? alpha(theme.palette.warning.main, 0.35)
                  : state === "VOLATILE"
                    ? alpha(theme.palette.error.main, 0.35)
                    : alpha(theme.palette.grey[500], 0.28)
            }`,
            background: "rgba(255,255,255,0.92)",
            px: dense ? 1 : 1.25,
            py: dense ? 0.5 : 0.75,
            color: theme.palette.text.primary,
            boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.1)}`,
            textAlign: "left",
            cursor: "pointer",
            transition: "transform 0.2s ease, border-color 0.2s ease",
            "&:hover": {
              transform: "translateY(-1px)",
              borderColor: alpha(theme.palette.secondary.main, 0.55),
            },
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{ minWidth: 0, width: "100%", alignItems: "center" }}
          >
            <Chip
              size="small"
              label={label}
              sx={{
                height: 22,
                fontSize: 11,
                letterSpacing: 0.2,
                fontWeight: 700,
                color:
                  state === "STABLE"
                    ? theme.palette.success.dark
                    : state === "SHIFTING"
                      ? theme.palette.warning.dark
                      : state === "VOLATILE"
                        ? theme.palette.error.dark
                        : theme.palette.grey[700],
                backgroundColor:
                  state === "STABLE"
                    ? alpha(theme.palette.success.main, 0.18)
                    : state === "SHIFTING"
                      ? alpha(theme.palette.warning.main, 0.2)
                      : state === "VOLATILE"
                        ? alpha(theme.palette.error.main, 0.2)
                        : alpha(theme.palette.grey[500], 0.18),
                border: `1px solid ${
                  state === "STABLE"
                    ? alpha(theme.palette.success.main, 0.35)
                    : state === "SHIFTING"
                      ? alpha(theme.palette.warning.main, 0.35)
                      : state === "VOLATILE"
                        ? alpha(theme.palette.error.main, 0.35)
                        : alpha(theme.palette.grey[500], 0.28)
                }`,
                "& .MuiChip-label": {
                  px: 1,
                },
              }}
            />

            {!dense && (
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    fontWeight: 700,
                    lineHeight: 1.1,
                    color: theme.palette.text.primary,
                  }}
                  noWrap
                >
                  {summary}
                </Typography>

                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    lineHeight: 1.1,
                    color: theme.palette.text.secondary,
                  }}
                  noWrap
                >
                  {metaParts.length > 0
                    ? metaParts.join(" · ")
                    : vi.pattern.widgetDetails}
                </Typography>
              </Box>
            )}

            {loading && (
              <CircularProgress size={13} sx={{ color: theme.palette.secondary.light }} />
            )}
          </Stack>
        </ButtonBase>
      </Tooltip>

      <Tooltip title={vi.pattern.refreshTooltip} arrow>
        <span>
          <IconButton
            size="small"
            onClick={handleRefresh}
            disabled={loading}
            sx={{
              color: theme.palette.text.secondary,
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: "#FFFFFF",
              "&:hover": {
                backgroundColor: "#EEF4FF",
              },
            }}
          >
            {loading ? (
              <CircularProgress size={14} sx={{ color: "inherit" }} />
            ) : (
              <RefreshRoundedIcon fontSize="inherit" />
            )}
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}

export default PatternReportWidget;
