import {Box,Button,MenuItem,Paper,Select,Typography,ToggleButton,ToggleButtonGroup,TextField,Switch,Slider,Autocomplete} from "@mui/material";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import { useRef, useState } from "react";
import { STOCK_DATA } from "../assets/stocks";

const BUY_COLOR = "#22c55e";
const SELL_COLOR = "#ef4444";

const getActionStyles = (current: "BUY" | "SELL", button: "BUY" | "SELL") => {
  const isActive = current === button;
  if (!isActive) return {};
  const color = button === "BUY" ? BUY_COLOR : SELL_COLOR;
  return {
    "&.Mui-selected": {
      backgroundColor: color,
      color: "#fff",
      "&:hover": { backgroundColor: color },
    },
  };
};

const NewRecommendation = () => {
  const [exchangeType, setExchangeType] = useState("NSE");
  const [action, setAction] = useState<"BUY" | "SELL">("BUY");
  const [exchange, setExchange] = useState("STOCK");
  const [callType, setCallType] = useState("Cash");
  const [entry, setEntry] = useState("");
  const [target, setTarget] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [rationale, setRationale] = useState("");
  const [tradeType, setTradeType] = useState("Intraday");
  const [month, setMonth] = useState("Jan");
  const [date, setDate] = useState(27);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [holdingPeriod, setHoldingPeriod] = useState(0);
  const [radioValue, setRadioValue] = useState(""); // For Short/Long term options

  const panelBg = action === "BUY" ? "#eef9ee" : "#fee2e2";
  const panelBorder = action === "BUY" ? "#7ac77a" : SELL_COLOR;

  const transparentInputSx = {
    backgroundColor: "transparent",
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#b6c3b6" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#9fb19f" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#6fa66f" },
  };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "3fr 1.5fr" },
        gap: 2,
        height: { lg: "100vh", xs: "auto" },
        p: { xs: 1, sm: 1.5 },
        boxSizing: "border-box",
        overflowY: "auto",
      }}
    >
      {/* LEFT PANEL */}
      <Paper
      sx={{
        p: { xs: 1.5, sm: 2 },
        backgroundColor: panelBg,
        border: `1px solid ${panelBorder}`,
        borderRadius: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: { xs: "flex-start", lg: "space-between" },
        height: { xs: "auto", lg: "85%" },
        gap: { xs: 1, lg: 0 },
        }}
        >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: { xs: "0.9rem", sm: "1.1rem" } }}>
            New Recommendation
          </Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={exchangeType}
            onChange={(_, val) => val && setExchangeType(val)}
            sx={{
              backgroundColor: "#eef2f7",
              "& .MuiToggleButtonGroup-grouped": {
                border: "none", px: 1.5, py: 0.5, fontSize: "0.7rem", fontWeight: 700,
                "&.Mui-selected": { backgroundColor: "#4f6bed", color: "#fff" },
              },
            }}
          >
            <ToggleButton value="NSE">NSE</ToggleButton>
            <ToggleButton value="BSE">BSE</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Action & Call Type Row */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
            <ToggleButtonGroup size="small" exclusive value={action} onChange={(_, val) => val && setAction(val)}>
              <ToggleButton value="BUY" sx={{ fontWeight: 700, px: 2, fontSize: "0.7rem", ...getActionStyles(action, "BUY") }}>BUY</ToggleButton>
              <ToggleButton value="SELL" sx={{ fontWeight: 700, px: 2, fontSize: "0.7rem", ...getActionStyles(action, "SELL") }}>SELL</ToggleButton>
            </ToggleButtonGroup>

            <Box sx={{ overflowX: "auto", maxWidth: "100%" }}>
              <ToggleButtonGroup
                size="small" exclusive value={callType} onChange={(_, val) => val && setCallType(val)}
                sx={{
                  backgroundColor: "#eef2f7", whiteSpace: "nowrap",
                  "& .MuiToggleButtonGroup-grouped": {
                    border: "none", px: 1, fontSize: "0.65rem", fontWeight: 700,
                    "&.Mui-selected": { backgroundColor: "#4f6bed", color: "#fff" },
                  },
                }}
              >
                <ToggleButton value="Cash">CASH</ToggleButton>
                <ToggleButton value="Futures">FUTURES</ToggleButton>
                <ToggleButton value="Option Call">OPT CALL</ToggleButton>
                <ToggleButton value="Option Put">OPT PUT</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        </Box>

        {/* Stock & Trade Type Row */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, gap: 1 }}>
          {/* STOCK / INDEX GROUP */}
          <ToggleButtonGroup
          size="small"
          exclusive
          value={exchange}
          onChange={(_, val) => val && setExchange(val)}
          sx={{
            backgroundColor: "#eef2f7",
            "& .MuiToggleButtonGroup-grouped": {
            border: "none",
            px: 1.5,
            fontSize: "0.65rem",
            fontWeight: 700,
            color: "#6b7280",
            "&.Mui-selected": {
              backgroundColor: "#4f6bed",
              color: "#fff",           
            "&:hover": {
              backgroundColor: "#3b51c5", 
               },
              },
            },
          }}
          >
            <ToggleButton value="STOCK">STOCK</ToggleButton>
            <ToggleButton value="INDEX">INDEX</ToggleButton>
          </ToggleButtonGroup>

  {/* TRADE TYPE GROUP */}
  <Box sx={{ overflowX: "auto" }}>
    <ToggleButtonGroup
      size="small"
      exclusive
      value={tradeType}
      onChange={(_, val) => val && setTradeType(val)}
      sx={{
        backgroundColor: "#eef2f7",
        whiteSpace: "nowrap",
        "& .MuiToggleButtonGroup-grouped": {
          border: "none",
          px: 1,
          fontSize: "0.65rem",
          fontWeight: 700,
          color: "#6b7280",
          "&.Mui-selected": {
            backgroundColor: "#4f6bed", 
            color: "#fff",
            "&:hover": {
              backgroundColor: "#3b51c5",
            },
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
</Box>

        {/* Script Row */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
          <Box sx={{ position: 'relative', display: 'flex', flexGrow: 1 }}>
  {/* GHOST LAYER: Only shows when you have a suggestion and haven't finished typing it */}
  {suggestion && suggestion.toLowerCase().startsWith(inputValue.toLowerCase()) && (
    <Box sx={{
        position: 'absolute', 
        top: 9, 
        left: 14,
        color: 'rgba(0, 0, 0, 0.3)', 
        pointerEvents: 'none',
        fontSize: '1rem', 
        whiteSpace: 'pre', 
        zIndex: 0
      }}>
      <span style={{ color: 'transparent' }}>{inputValue}</span>
      {suggestion.slice(inputValue.length)}
    </Box>
  )}

  <Autocomplete
    freeSolo
    // Only open the dropdown if there are 2 or more matches
    open={(() => {
        const matches = STOCK_DATA[exchangeType as keyof typeof STOCK_DATA]?.filter(
          (s) => s.toLowerCase().startsWith(inputValue.toLowerCase())
        ) || [];
        return inputValue.length > 0 && matches.length > 1;
    })()}
    
    options={STOCK_DATA[exchangeType as keyof typeof STOCK_DATA] || []}
    inputValue={inputValue}
    sx={{ 
        flexGrow: 1, 
        zIndex: 1, 
        '& .MuiOutlinedInput-root': { backgroundColor: 'transparent' } 
    }}
    
    onInputChange={(event, newInputValue) => {
      setInputValue(newInputValue);
      
      const currentMatches = STOCK_DATA[exchangeType as keyof typeof STOCK_DATA]?.filter(
        (s) => s.toLowerCase().startsWith(newInputValue.toLowerCase())
      ) || [];

      // If matches exist, the first one is our "Ghost"
      if (newInputValue.length > 0 && currentMatches.length > 0) {
        setSuggestion(currentMatches[0]);
      } else {
        setSuggestion("");
      }
    }}

    onKeyDown={(event) => {
      // TAB KEY: Fills the ghost suggestion immediately
      if (event.key === 'Tab' && suggestion) {
        setInputValue(suggestion);
        setSuggestion("");
        event.preventDefault(); 
      }
    }}

    renderInput={(params) => (
      <TextField 
        {...params} 
        size="small"
        placeholder={inputValue ? "" : "Script Name/Symbol"} 
        variant="outlined" 
      />
    )}
  />
</Box>
          <Box sx={{ display: "flex", gap: 1, flexGrow: { xs: 1, sm: 0 } }}>
            <Select size="small" value={month} onChange={(e) => setMonth(e.target.value)} sx={{ flexGrow: 1, minWidth: 70, height: 32, fontSize: '0.8rem' }}>
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </Select>
            <Select size="small" value={date} onChange={(e) => setDate(e.target.value as number)} sx={{ flexGrow: 1, minWidth: 60, height: 32, fontSize: '0.8rem' }}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </Select>
          </Box>
        </Box>

        {/* Prices Row */}
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1, mb: 1 }}>
          <TextField label="Entry" size="small" type="number" value={entry} onChange={(e) => setEntry(e.target.value)} sx={{...transparentInputSx, flex: 1}} />
          <TextField label="Target" size="small" type="number" value={target} onChange={(e) => setTarget(e.target.value)} sx={{...transparentInputSx, flex: 1}} />
          <TextField label="Stop Loss" size="small" type="number" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} sx={{...transparentInputSx, flex: 1}} />
        </Box>

        {/* Switched Options Row */}
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, justifyContent: "space-between", mb: 1, gap: 1.5 }}>
          {["Range", "Secondary Target", "Stop Loss 2"].map((label) => (
            <Box key={label} sx={{ textAlign: 'center', flex: 1, border: { xs: '1px solid rgba(0,0,0,0.05)', md: 'none' }, borderRadius: 1, p: { xs: 0.5, md: 0 } }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: 'center', gap: 0.5, mb: 0.2 }}>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700 }}>{label}</Typography>
                <Switch size="small" />
              </Box>
              <Box sx={{ display: "flex", gap: 0.5, justifyContent: 'center' }}>
                <Button size="small" variant="outlined" 
                sx={{ py: 0, fontSize: '0.6rem', flex: 1, height: 24, color: "#9ca3af", borderColor: "#e5e7eb", backgroundColor: "#e1e6eaf7", textTransform: "none",
                  "&:hover": { backgroundColor: "#f3f4f6", borderColor: "#d1d5db"}}}> Disabled </Button>
                <Button size="small" variant="outlined" sx={{ py: 0, fontSize: '0.6rem', flex: 1, height: 24, color: "#9ca3af",borderColor: "#e5e7eb",backgroundColor: "#e1e6eaf7",textTransform: "none",
                "&:hover": {backgroundColor: "#f3f4f6",borderColor: "#d1d5db"}}}> Disabled </Button>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Slider & Rationale */}
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700 }}>Holding Period (Days)</Typography>
            <Slider size="small" value={holdingPeriod} onChange={(_, v) => setHoldingPeriod(v as number)} step={1} min={0} max={360} valueLabelDisplay="auto" />
          </Box>
          <TextField label="Rationale" size="small" multiline rows={1} value={rationale} onChange={(e) => setRationale(e.target.value)} sx={{ flex: 1 }} />
        </Box>

        {/* Remarks & Upload */}
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5, mb: 2 }}>
          <TextField multiline rows={2} placeholder="Research Analyst's Remarks" sx={{ flexGrow: 1 }} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: { xs: "100%", sm: 160 } }}>
            <Button size="small" variant="outlined" startIcon={<CloudUploadOutlinedIcon />} onClick={() => fileInputRef.current?.click()} sx={{ fontSize: '0.7rem', py: 1, backgroundColor: "#c6c4cb", color: "#fff" }}>
              Upload Media
            </Button>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Is this an Algo Powered Recommendation?</Typography>
              <Switch size="small" />
            </Box>
          </Box>
        </Box>

        <Button variant="contained" fullWidth sx={{ py: 1.5, fontWeight: 700, borderRadius: 2 }}>
          Generate & Publish
        </Button>
      </Paper>

      {/* RIGHT PANEL */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Paper sx={{ p: 2 }}>
          <Typography fontWeight={700} sx={{ fontSize: "0.9rem" }}>Active Recommendations</Typography>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography fontWeight={700} sx={{ fontSize: "0.9rem" }}>Watchlist</Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default NewRecommendation;