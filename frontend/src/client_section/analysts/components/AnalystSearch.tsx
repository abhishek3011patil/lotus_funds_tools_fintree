import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { InputAdornment, TextField } from "@mui/material";

interface AnalystSearchProps {
  value: string;
  onChange: (value: string) => void;
  marketplaceType?: "analysts" | "brokers";
}

const AnalystSearch = ({ value, onChange, marketplaceType = "analysts" }: AnalystSearchProps) => (
  <TextField
    fullWidth
    value={value}
    onChange={(event) => onChange(event.target.value)}
    placeholder={marketplaceType === "brokers" ? "Search by broker, category or SEBI number" : "Search by analyst, expertise, market or SEBI number"}
    aria-label={marketplaceType === "brokers" ? "Search brokers" : "Search research analysts"}
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
