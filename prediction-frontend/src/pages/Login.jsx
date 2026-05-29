import { useState } from "react";
import { login } from "../api/authApi";
import { useNavigate } from "react-router-dom";

import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
} from "@mui/material";

import { Visibility, VisibilityOff } from "@mui/icons-material";
import { vi } from "../i18n/vi";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const token = await login(username, password);
      localStorage.setItem("token", token);
      navigate("/");
    } catch (e) {
      alert(vi.auth.loginFail);
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #f4f6f8, #e9edf2)",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 4,
          width: 340,
          borderRadius: 4,
          background: "white",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <Typography variant="overline" sx={{ color: "#888", letterSpacing: 1 }}>
          {vi.auth.access}
        </Typography>

        <Typography variant="h5" sx={{ mb: 1, fontWeight: "bold" }}>
          {vi.auth.loginTitle}
        </Typography>

        <Typography variant="body2" sx={{ mb: 3, color: "#666" }}>
          {vi.auth.loginSubtitle}
        </Typography>

        <TextField
          fullWidth
          label={vi.auth.username}
          size="small"
          sx={{ mb: 2 }}
          onChange={(e) => setUsername(e.target.value)}
        />

        <TextField
          fullWidth
          label={vi.auth.password}
          type={showPass ? "text" : "password"}
          size="small"
          sx={{ mb: 3 }}
          onChange={(e) => setPassword(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPass(!showPass)}>
                  {showPass ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Button
          fullWidth
          variant="contained"
          onClick={handleLogin}
          sx={{
            py: 1,
            borderRadius: 3,
            textTransform: "none",
            fontWeight: "bold",
            background: "linear-gradient(135deg, #4a4a4a, #2a2a2a)",
            "&:hover": {
              background: "linear-gradient(135deg, #2a2a2a, #000)",
            },
          }}
        >
          {vi.auth.login}
        </Button>
      </Paper>
    </Box>
  );
}

export default Login;
