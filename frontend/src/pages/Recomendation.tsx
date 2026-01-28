import {Box,Button,MenuItem,Paper,Select,Typography,ToggleButton,ToggleButtonGroup,TextField,Switch,Autocomplete,FormControlLabel,Radio,RadioGroup} from "@mui/material";
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
  const [radioValue, setRadioValue] = useState("");
  
  const panelBg = action === "BUY" ? "#eef9ee" : "#fee2e2";
  const panelBorder = action === "BUY" ? "#7ac77a" : SELL_COLOR;

  const transparentInputSx = {
    backgroundColor: "transparent",
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#b6c3b6" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#9fb19f" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#6fa66f" },
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("Selected file:", file.name);
    }
  };

  const [switches, setSwitches] = useState({
    Range: false,
    "Secondary Target": false,
    "Stop Loss 2": false,
  });
  
  const handleToggle = (label: string) => {
    setSwitches((prev) => ({ ...prev, [label]: !prev[label as keyof typeof switches] }));
  };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "3fr 1.5fr" },
        gap: { xs: 2, md: 1.5 },
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
        height: "auto", 
        minHeight: { xs: "100%", lg: "85%" }, 
        gap: 1.5,
        overflow: "hidden"
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
                  backgroundColor: "#eef2f7",
                  display: "flex",
                  flexWrap: "wrap", 
                  whiteSpace: "nowrap",
                  "& .MuiToggleButtonGroup-grouped": {
                    border: "none",m: 0.2, px: 1, fontSize: "0.65rem", fontWeight: 700,
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

      if (newInputValue.length > 0 && currentMatches.length > 0) {
        setSuggestion(currentMatches[0]);
      } else {
        setSuggestion("");
      }
    }}

    onKeyDown={(event) => {
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
<Box sx={{ 
  display: "flex", 
  flexDirection: { xs: "column", md: "row" }, 
  justifyContent: "space-between", 
  mb: 1, 
  gap: { xs: 2, md: 1.5 }
}}>
  {["Range", "Secondary Target", "Stop Loss 2"].map((label) => {
    const isActive = switches[label as keyof typeof switches];
    let p1 = "Disabled", p2 = "Disabled";
    if (label === "Range") { p1 = "Lower Entry"; p2 = "Upper Entry"; }
    if (label === "Secondary Target") { p1 = "T2"; p2 = "T3"; }
    if (label === "Stop Loss 2") { p1 = "SL2"; p2 = "SL3"; }

    return (
      <Box key={label} sx={{ 
        textAlign: 'center', 
        flex: 1, 
        border: { xs: '1px solid rgba(0,0,0,0.1)', md: 'none' },
        borderRadius: 1, 
        p: 1 
      }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: 'center', gap: 1, mb: 1 }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>{label}</Typography>
          <Switch size="small" checked={isActive} onChange={() => handleToggle(label)} />
        </Box>
        
        <Box sx={{ display: "flex", gap: 1, justifyContent: 'center' }}>
          {isActive ? (
            <>
              <TextField 
                placeholder={p1} size="small" variant="outlined" 
                sx={{ flex: 1, "& .MuiInputBase-input": { py: 1, fontSize: '0.7rem', textAlign: 'center' } }} 
              />
              <TextField 
                placeholder={p2} size="small" variant="outlined" 
                sx={{ flex: 1, "& .MuiInputBase-input": { py: 1, fontSize: '0.7rem', textAlign: 'center' } }} 
              />
            </>
          ) : (
            <>
              <Button size="small" variant="outlined"
              sx={{ py: 0, fontSize: '0.6rem', flex: 1, height: 24, color: "#9ca3af", borderColor: "#e5e7eb", backgroundColor: "#e1e6eaf7", textTransform: "none",
              "&:hover": { backgroundColor: "#f3f4f6", borderColor: "#d1d5db"}}}> Disabled </Button>
              <Button size="small" variant="outlined" sx={{ py: 0, fontSize: '0.6rem', flex: 1, height: 24, color: "#9ca3af",borderColor: "#e5e7eb",backgroundColor: "#e1e6eaf7",textTransform: "none",
                "&:hover": {backgroundColor: "#f3f4f6",borderColor: "#d1d5db"}}}> Disabled </Button>
            </>
          )}
        </Box>
      </Box>
    );
  })}
</Box>

       {/* Holding period & Rationale Container */}
       <Box 
       sx={{ 
        display: "flex", 
        flexDirection: { xs: "column", sm: "row" }, 
        gap: 2, 
        mb: 1,
        alignItems: { xs: "flex-start", sm: "flex-end" }
        }}
        >
          <Box sx={{ width: "100%", flex: 1 }}>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700 }}>Holding Period</Typography>
            {/* Logic for Intraday */}
            {tradeType === "Intraday" && (
              <RadioGroup row value="0">
                <FormControlLabel 
                value="0" 
                control={<Radio size="small" color="primary" />} 
                label={<Typography sx={{ fontSize: '0.65rem' }}>0</Typography>} 
                checked={true}
                />
                </RadioGroup>
              )}
              {/* Logic for BTST/STBT */}
              {(tradeType === "BTST" || tradeType === "STBT") && (
                <RadioGroup row value={radioValue} onChange={(e) => setRadioValue(e.target.value)}>
                  <FormControlLabel value="0" control={<Radio size="small" color="primary" />} label={<Typography sx={{ fontSize: '0.65rem' }}>0</Typography>}/>
                  <FormControlLabel value="1" control={<Radio size="small" color="primary" />} label={<Typography sx={{ fontSize: '0.65rem' }}>1</Typography>}/>
                </RadioGroup>
              )}
              {/* Logic for Short Term */}
              {tradeType === "Short Term" && (
                <RadioGroup row value={radioValue} onChange={(e) => setRadioValue(e.target.value)}>
                  <FormControlLabel value="7 Days" control={<Radio size="small"/>} label={<Typography sx={{fontSize: '0.65rem'}}>Upto 7 Days</Typography>} />
                  <FormControlLabel value="30 Days" control={<Radio size="small"/>} label={<Typography sx={{fontSize: '0.65rem'}}>Upto 30 Days</Typography>} />
                  <FormControlLabel value="90 Days" control={<Radio size="small"/>} label={<Typography sx={{fontSize: '0.65rem'}}>Upto 90 Days</Typography>} />
                </RadioGroup>
              )}

    {/* Logic for Long Term */}
    {tradeType === "Long Term" && (
      <RadioGroup row value={radioValue} onChange={(e) => setRadioValue(e.target.value)}>
        <FormControlLabel value="6 Months" control={<Radio size="small"/>} label={<Typography sx={{fontSize: '0.65rem'}}>Upto 6 Months</Typography>} />
        <FormControlLabel value="1 Year" control={<Radio size="small"/>} label={<Typography sx={{fontSize: '0.65rem'}}>Upto 1 Year</Typography>} />
        <FormControlLabel value="5 Years" control={<Radio size="small"/>} label={<Typography sx={{fontSize: '0.65rem'}}>Upto 5 Years</Typography>} />
      </RadioGroup>
    )}
  </Box>

  <TextField 
    label="Rationale" 
    size="small" 
    multiline 
    rows={1} 
    value={rationale} 
    onChange={(e) => setRationale(e.target.value)} 
    sx={{ width: "100%", flex: 1 }} 
  />
</Box>

        {/* Remarks & Upload */}
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5, mb: 2 }}>
          <TextField multiline rows={2} placeholder="Research Analyst's Remarks" sx={{ flexGrow: 1 }} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: { xs: "100%", sm: 160 } }}>
            <input
    type="file"
    ref={fileInputRef}
    onChange={handleFileChange}
    style={{ display: 'none' }} 
    accept="image/*,video/*,pdf/*"    
  />

  {/* Your Button */}
  <Button 
    size="small" 
    variant="outlined" 
    startIcon={<CloudUploadOutlinedIcon />} 
    onClick={() => fileInputRef.current?.click()} 
    sx={{ 
      fontSize: '0.7rem', 
      py: 1, 
      backgroundColor: "#c6c4cb", 
      color: "#fff",
      '&:hover': { backgroundColor: "#b0afb6" }
    }}
  >
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