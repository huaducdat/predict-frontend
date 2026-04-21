import { Box, Typography } from "@mui/material"

export default function History() {
  return (
    <Box>
      <Typography variant="h4" mb={2}>
        Dữ liệu đã lưu
      </Typography>

      <Typography>
        (Sau này load từ backend theo ngày)
      </Typography>
    </Box>
  )
}