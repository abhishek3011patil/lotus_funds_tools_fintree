import {
  Box,
  Button,
  MenuItem,
  Paper,
  Select,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  OutlinedInput,
  TextField,
  Switch,
  Slider
} from "@mui/material";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import { useRef, useState } from "react";

/* Unified control styling */
const controlSx = {
  backgroundColor: "#fff",
  "& .MuiOutlinedInput-root": {
    minHeight: 40,
  },
};

const BUY_COLOR = "#22c55e";   // green
const SELL_COLOR = "#ef4444"; // equivalent red (Tailwind red-500)

const getActionStyles = (current: "BUY" | "SELL", button: "BUY" | "SELL") => {
  const isActive = current === button;
  if (!isActive) return {};

  const color = button === "BUY" ? BUY_COLOR : SELL_COLOR;

  return {
    "&.Mui-selected": {
      backgroundColor: color,
      color: "#fff",
      "&:hover": {
        backgroundColor: color,
      },
    },
  };
};

const NewRecommendation = () => {
  const [exchangeType, setExchangeType] = useState("");
  const [action, setAction] = useState<"BUY" | "SELL">("BUY");
  const [exchange, setExchange] = useState("");
  const [callType, setCallType] = useState("");
  const [symbol, setSymbol] = useState("");
  const [lot, setLot] = useState("");
  const [entry, setEntry] = useState("");
  const [target, setTarget] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [rationale, setRationale] = useState("");
  const [remark, setRemark] = useState("");
  const [tradeType, setTradeType] = useState("");
  const [month, setMonth] = useState("Jan");
  const [date, setDate] = useState(27);
  const [holdingPeriod, setHoldingPeriod] = useState(5);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const panelBg = action === "BUY" ? "#eef9ee" : "#fee2e2";
  const panelBorder = action === "BUY" ? "#7ac77a" : SELL_COLOR;

  const transparentInputSx = {
  backgroundColor: "transparent",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#b6c3b6", // same soft border as script name
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#9fb19f",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#6fa66f",
  },
};
  
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          lg: "3fr 1.5fr",
        },
        gap: 3,
      }}
    >
      {/* LEFT PANEL */}
      <Paper
        sx={{
          p: 3,
          backgroundColor: panelBg,
          border: `1px solid ${panelBorder}`,
          borderRadius: 2,
        }}>
        <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,}}>
            <Typography variant="h6" fontWeight={600}>
              New Recommendation
            </Typography>
    <ToggleButtonGroup
  size="small"
  exclusive
  value={exchangeType}
  onChange={(_, val) => val && setExchangeType(val)}
  sx={{
    backgroundColor: "#eef2f7",
    borderRadius: 1.5,
    p: 0.5,
    "& .MuiToggleButtonGroup-grouped": {
      border: "none",
      borderRadius: 1,
      px: 2,
      fontWeight: 600,
      color: "#6b7280",
      "&.Mui-selected": {
        backgroundColor: "#4f6bed",
        color: "#fff",
        "&:hover": {
          backgroundColor: "#4f6bed",
        },
      },
    },
  }}
>
  <ToggleButton value="NSE">NSE</ToggleButton>
  <ToggleButton value="BSE">BSE</ToggleButton>
</ToggleButtonGroup>

</Box>
{/* Add width="100%" and justifyContent="space-between" here */}
<Box display="flex" justifyContent="space-between" alignItems="center" width="100%" sx={{mb:2}}>
  
  <ToggleButtonGroup
    size="small"
    exclusive
    value={action}
    onChange={(_, val) => val && setAction(val)}
  >
    <ToggleButton value="BUY" sx={{ fontWeight: 600, px: 3, ...getActionStyles(action, "BUY") }}>
      BUY
    </ToggleButton>
    <ToggleButton value="SELL" sx={{ fontWeight: 600, px: 3, ...getActionStyles(action, "SELL") }}>
      SELL
    </ToggleButton>
  </ToggleButtonGroup>

  <ToggleButtonGroup
    size="small"
    exclusive
    value={callType}
    onChange={(_, val) => val && setCallType(val)}
    sx={{
      backgroundColor: "#eef2f7",
      borderRadius: 1.5,
      p: 0.5,
      "& .MuiToggleButtonGroup-grouped": {
        border: "none",
        borderRadius: 1,
        px: 2,
        fontWeight: 600,
        color: "#6b7280",
        "&.Mui-selected": {
          backgroundColor: "#4f6bed",
          color: "#fff",
          "&:hover": { backgroundColor: "#4f6bed" },
        },
      },
    }}
  >
    <ToggleButton value="Cash">CASH</ToggleButton>
    <ToggleButton value="Futures">FUTURES</ToggleButton>
    <ToggleButton value="Option Call">OPTION CALL</ToggleButton>
    <ToggleButton value="Option Put">OPTION PUT</ToggleButton>
  </ToggleButtonGroup>
  
</Box>
  <Box display="flex" justifyContent="space-between" alignItems="center" width="100%" sx={{mb:2}}>
  <ToggleButtonGroup
    size="small"
    exclusive
    value={exchange}
    onChange={(_, val) => val && setExchange(val)}
    sx={{
      backgroundColor: "#eef2f7",
      borderRadius: 1.5,
      p: 0.5,
      "& .MuiToggleButtonGroup-grouped": {
        border: "none",
        borderRadius: 1,
        px: 2,
        fontWeight: 600,
        color: "#6b7280",
        "&.Mui-selected": {
          backgroundColor: "#4f6bed",
          color: "#fff",
          "&:hover": {
            backgroundColor: "#4f6bed",
          },
        },
      },
    }} >
    <ToggleButton value="STOCK">STOCK</ToggleButton>
    <ToggleButton value="INDEX">INDEX</ToggleButton>
  </ToggleButtonGroup>

  <ToggleButtonGroup
    size="small"
    exclusive
    value={tradeType}
    onChange={(_, val) => val && setTradeType(val)}
    sx={{
      backgroundColor: "#eef2f7",
      borderRadius: 1.5,
      p: 0.5,
      "& .MuiToggleButtonGroup-grouped": {
        border: "none",
        borderRadius: 1,
        px: 2,
        fontWeight: 600,
        color: "#6b7280",
        "&.Mui-selected": {
          backgroundColor: "#4f6bed",
          color: "#fff",
          "&:hover": { backgroundColor: "#4f6bed" },
        },
      },
    }}
  >
    <ToggleButton value="Intraday">Intraday</ToggleButton>
    <ToggleButton value="BTST">BTST</ToggleButton>
    <ToggleButton value="STBT">STBT</ToggleButton>
    <ToggleButton value="Short Term">Short Term</ToggleButton>
    <ToggleButton value="Long Term">Long Term</ToggleButton>
  </ToggleButtonGroup>
</Box>
        {/* ROW 1 */}
        <Box display="flex" justifyContent="space-between" alignItems="center" width="100%" sx={{mb:2}}>
          
            <TextField placeholder="Script Name/Symbol/Instrument" variant="outlined" sx={{flexGrow: 1, maxWidth: "60%" }}></TextField>
            <Box
      sx={{
        display: "flex",
        gap: 1.5,
        alignItems: "center",
      }}
    >
      {/* Month Dropdown */}
      <Select
        size="small"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        sx={{ minWidth: 80 }}
      >
        {[
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        ].map((m) => (
          <MenuItem key={m} value={m}>
            {m}
          </MenuItem>
        ))}
      </Select>

      {/* Date Dropdown */}
      <Select
        size="small"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        sx={{ minWidth: 60 }}
      >
        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
          <MenuItem key={d} value={d}>
            {d}
          </MenuItem>
        ))}
      </Select>
    </Box>
</Box>  
        {/* ROW 2 */}
        <Box
  sx={{
    display: "flex",
    gap: 2,
    alignItems: "center",
  }}
>
  <FormControl size="small" sx={{ minWidth: 120 }}>
  <InputLabel>Entry Price</InputLabel>
  <OutlinedInput
    type="number"
    value={entry}
    onChange={(e) => setEntry(e.target.value)}
    sx={transparentInputSx}
  />
</FormControl>

<FormControl size="small" sx={{ minWidth: 120 }}>
  <InputLabel>Target</InputLabel>
  <OutlinedInput
    type="number"
    value={target}
    onChange={(e) => setTarget(e.target.value)}
    sx={transparentInputSx}
  />
</FormControl>

<FormControl size="small" sx={{ minWidth: 120 }}>
  <InputLabel>Stop Loss</InputLabel>
  <OutlinedInput
    type="number"
    value={stopLoss}
    onChange={(e) => setStopLoss(e.target.value)}
    sx={transparentInputSx}
  />
</FormControl>
</Box>

<Box sx={{ mt: 3 }}>
  <Box sx={{ display: "flex", gap: 4, mb: 3 }}>
  {["Range", "Secondary Target", "Stop Loss 2"].map((label) => (
    <Box key={label}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Typography variant="caption">{label}</Typography>
        <Switch size="small" />
      </Box>

      <Box sx={{ display: "flex", gap: 1 }}>
  <Button
    size="small"
    variant="outlined"
    sx={{
      color: "#9ca3af",           
      borderColor: "#e5e7eb",     
      backgroundColor: "#e1e6eaf7",  
      textTransform: "none",
      "&:hover": {
        backgroundColor: "#f3f4f6",
        borderColor: "#d1d5db",
      },
    }}
  >
    Disabled
  </Button>

  <Button
    size="small"
    variant="outlined"
    sx={{
      color: "#9ca3af",
      borderColor: "#e5e7eb",
      backgroundColor: "#e1e6eaf7",
      textTransform: "none",
      "&:hover": {
        backgroundColor: "#ffffff",
        borderColor: "#d1d5db",
      },
    }}
  >
    Disabled
  </Button>
</Box>

    </Box>
  ))}
</Box>
<Box sx={{ display: "flex", gap: 4, mb: 3 }}>
  {/* Holding Period */}
  <Box sx={{ flex: 1 }}>
    <Typography variant="caption" sx={{ mb: 1, display: "block" }}>
      Holding Period
    </Typography>
    <Slider
  value={holdingPeriod}
  onChange={(_, newValue) => setHoldingPeriod(newValue)}
  step={1}
  min={0}
  max={360}
  valueLabelDisplay="on"
/>
  </Box>

  {/* Rationale */}
  <FormControl size="small" sx={{ minWidth: 220 }}>
    <InputLabel>Rationale</InputLabel>
    <OutlinedInput
              multiline
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
            />
  </FormControl>
</Box>
<Box sx={{ display: "flex", gap: 4, mb: 3 }}>
  {/* Remarks */}
  <TextField
    multiline
    rows={4}
    placeholder="Research Analyst's Remarks"
    sx={{ width: "100%"}}
  />
<Box display="flex" flexDirection="column" gap={2}>
  {/* Right side */}
  <Box sx={{
    gap: 2,
    alignItems: "center",
  }}>
  {/* Hidden file input */}
  <input
    type="file"
    ref={fileInputRef}
    hidden
    accept="image/*,video/*,application/pdf"
    onChange={(e) => {
  const selectedFile = e.target.files?.[0];
  if (selectedFile) {
    setFile(selectedFile);
  }
}}
  />

  {/* Upload button */}
  <Button
    variant="outlined"
    startIcon={<CloudUploadOutlinedIcon />}
    onClick={() => fileInputRef.current?.click()}
    sx={{
      display: "flex",
      textTransform: "none",
      borderColor: "#c7b7ea",
      backgroundColor: "#c6c4cb",
      color: "#ffffff",
      px: 2,
    }}
  >
    Upload Media
  </Button>

  {/* Optional file name display */}
  {file && (
    <Typography variant="caption" sx={{ mt: 0.5, display: "block" }}>
      {file.name}
    </Typography>
  )}
</Box>

    <Box sx={{ alignItems: "center", gap: 1}}>
      <Typography variant="caption">
        Is this an Algo Powered Recommendation?
      </Typography>
      <Switch size="small" />
    </Box>
    </Box>
  </Box>
</Box>
<Button
  variant="contained"
  size="large"
  sx={{ mt: 2, px: 4 }}
>
  Generate & Publish
</Button>
</Paper>

      {/* RIGHT PANEL */}
      <Box>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography fontWeight={600}>Active Recommendations</Typography>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography fontWeight={600}>Watchlist</Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default NewRecommendation;
