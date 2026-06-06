import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

import { changePassword, getMe } from "../api/authApi";

function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function Account() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setUser(await getMe());
      } catch (err) {
        setError(err.response?.data?.message || "Khong tai duoc thong tin tai khoan.");
      }
    };

    void load();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);

    try {
      const res = await changePassword(currentPassword, newPassword);
      setMessage(res.message || "Doi mat khau thanh cong. Vui long dang nhap lai.");
      setCurrentPassword("");
      setNewPassword("");
      localStorage.removeItem("token");
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      setError(err.response?.data?.message || "Doi mat khau that bai.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 760, mx: "auto" }}>
      <Stack spacing={2.5}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #E2E8F0" }}>
          <Typography variant="h5" sx={{ fontWeight: 900, mb: 2 }}>
            Tai khoan
          </Typography>

          <Stack spacing={1}>
            <Typography variant="body2">
              <strong>Username:</strong> {user?.username || "--"}
            </Typography>
            <Typography variant="body2">
              <strong>Role:</strong> {user?.role || "--"}
            </Typography>
            <Typography variant="body2">
              <strong>Created at:</strong> {formatDate(user?.createdAt)}
            </Typography>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #E2E8F0" }}>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
            Doi mat khau
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {message && <Alert severity="success">{message}</Alert>}
              {error && <Alert severity="error">{error}</Alert>}

              <TextField
                label="Mat khau hien tai"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowCurrent((value) => !value)} edge="end">
                        {showCurrent ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Mat khau moi"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                fullWidth
                helperText="Toi thieu 6 ky tu"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNew((value) => !value)} edge="end">
                        {showNew ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                disabled={saving}
                sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 800 }}
              >
                {saving ? "Dang luu..." : "Doi mat khau"}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
}
