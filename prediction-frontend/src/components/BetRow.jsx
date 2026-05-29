import { Stack, TextField, IconButton } from "@mui/material";
import { vi } from "../i18n/vi";

function BetRow({ row, index, onChange, onRemove }) {

  const handleNumberChange = (value) => {
    let num = value.replace(/\D/g, "");

    if (num.length > 2) num = num.slice(0, 2);

    onChange(index, "number", num);
  };

  const handlePointChange = (value) => {
    let point = value.replace(/\D/g, "");
    onChange(index, "point", point);
  };

  return (
    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
      
      <TextField
        label={vi.bet.number}
        value={row.number}
        onChange={(e) => handleNumberChange(e.target.value)}
        sx={{ width: 100 }}
      />

      <TextField
        label={vi.bet.point}
        value={row.point}
        onChange={(e) => handlePointChange(e.target.value)}
        sx={{ width: 120 }}
      />

      <IconButton
        onClick={() => onRemove(index)}
        sx={{ color: "#d32f2f" }}
      >
        ❌
      </IconButton>
    </Stack>
  );
}

export default BetRow;
