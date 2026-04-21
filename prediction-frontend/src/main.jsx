import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseLine from "@mui/material/CssBaseline";
const theme = createTheme({
  palette: {
    primary: {
      main: "#6a5cff",
    },
    secondary: {
      main: "#00c6ff",
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: "Courier New, monospace",
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <ThemeProvider theme={theme}>
    <CssBaseLine />
    <App />
  </ThemeProvider>,
);