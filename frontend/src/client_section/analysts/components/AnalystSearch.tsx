import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { InputAdornment, TextField } from "@mui/material";

interface AnalystSearchProps {
  value: string;
  onChange: (value: string) => void;
}

const AnalystSearch = ({ value, onChange }: AnalystSearchProps) => (
  <TextField
    fullWidth
    value={value}
    onChange={(event) => onChange(event.target.value)}
    placeholder="Search by analyst, expertise, market or SEBI number"
    aria-label="Search research analysts"
    slotProps={{
      input: {
        startAdornment: (
          <InputAdornment position="start">
            <SearchRoundedIcon sx={{ color: "#64748B" }} />
          </InputAdornment>
        ),
      },
    }}
    sx={{
      maxWidth: 640,
      "& .MuiOutlinedInput-root": {
        borderRadius: "14px",
        backgroundColor: "#FFFFFF",
      },
    }}
  />
);

export default AnalystSearch;
