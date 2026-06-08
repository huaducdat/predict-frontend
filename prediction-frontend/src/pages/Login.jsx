import { useEffect, useState } from "react";
import { getBootstrapInfo, login } from "../api/authApi";
import { useNavigate } from "react-router-dom";

import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
  Alert,
  Stack,
} from "@mui/material";

import { Visibility, VisibilityOff } from "@mui/icons-material";
import { vi } from "../i18n/vi";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [bootstrapInfo, setBootstrapInfo] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    getBootstrapInfo()
      .then((data) => {
        if (mounted) {
          setBootstrapInfo(data);
        }
      })
      .catch(() => {
        if (mounted) {
          setBootstrapInfo(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

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
      <Stack spacing={2}>
        {bootstrapInfo?.showCredentials ? (
          <Alert
            severity="info"
            variant="outlined"
            sx={{ width: 340, borderRadius: 3, backgroundColor: "#fff" }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Tai khoan mac dinh:
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              huyentran
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Mat khau mac dinh:
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              123456
            </Typography>
            <Typography variant="caption" sx={{ color: "#555" }}>
              Doi mat khau sau lan dang nhap dau tien.
            </Typography>
          </Alert>
        ) : null}

        <Paper
          elevation={0}
          sx={{
            p: 4,
            width: 340,
            borderRadius: 3,
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
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPass ? "An mat khau" : "Hien mat khau"}
                      edge="end"
                      onClick={() => setShowPass(!showPass)}
                      onMouseDown={(event) => event.preventDefault()}
                    >
                      {showPass ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
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
      </Stack>
    </Box>
  );
}

export default Login;
