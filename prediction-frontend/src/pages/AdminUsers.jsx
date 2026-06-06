import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

import { resetPassword } from "../api/authApi";
import { getUsers } from "../api/userApi";

function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [passwords, setPasswords] = useState({});
  const [visible, setVisible] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingUser, setSavingUser] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    setError("");

    try {
      setUsers(await getUsers());
    } catch (err) {
      setError(err.response?.data?.message || "Khong tai duoc danh sach user.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const handleReset = async (username) => {
    setMessage("");
    setError("");
    setSavingUser(username);

    try {
      await resetPassword(username, passwords[username] || "");
      setMessage(`Da reset mat khau cho ${username}.`);
      setPasswords((prev) => ({ ...prev, [username]: "" }));
    } catch (err) {
      setError(err.response?.data?.message || "Reset mat khau that bai.");
    } finally {
      setSavingUser("");
    }
  };

  return (
    <Box sx={{ maxWidth: 1040, mx: "auto" }}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #E2E8F0" }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              Admin User Management
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Reset mat khau user ma khong hien thi mat khau hien tai.
            </Typography>
          </Box>

          {message && <Alert severity="success">{message}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900 }}>Username</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Created at</TableCell>
                  <TableCell sx={{ fontWeight: 900, width: 360 }}>New password</TableCell>
                  <TableCell sx={{ fontWeight: 900 }} align="right">
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.username}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        type={visible[user.username] ? "text" : "password"}
                        value={passwords[user.username] || ""}
                        onChange={(event) =>
                          setPasswords((prev) => ({
                            ...prev,
                            [user.username]: event.target.value,
                          }))
                        }
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  aria-label={visible[user.username] ? "Hide password" : "Show password"}
                                  edge="end"
                                  onClick={() =>
                                    setVisible((prev) => ({
                                      ...prev,
                                      [user.username]: !prev[user.username],
                                    }))
                                  }
                                  onMouseDown={(event) => event.preventDefault()}
                                >
                                  {visible[user.username] ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="contained"
                        size="small"
                        disabled={savingUser === user.username}
                        onClick={() => handleReset(user.username)}
                        sx={{ textTransform: "none", fontWeight: 800 }}
                      >
                        {savingUser === user.username ? "Dang reset..." : "Reset"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {!loading && users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Khong co user.
                    </TableCell>
                  </TableRow>
                )}

                {loading && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Dang tai...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </Paper>
    </Box>
  );
}
