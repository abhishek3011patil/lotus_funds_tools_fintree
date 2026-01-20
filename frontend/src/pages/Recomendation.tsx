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
} from "@mui/material";
import { useState } from "react";

/**
 * Unified control styling
 */
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


  const panelBg = action === "BUY" ? "#eef9ee" : "#fee2e2";
  const panelBorder = action === "BUY" ? "#7ac77a" : SELL_COLOR;

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
        }}
      >
        <Typography variant="h6" fontWeight={600} mb={2}>
          New Recommendation
        </Typography>

        {/* TOP CONTROLS */}
        <Box sx={{ display: "flex", gap: 2, mb: 3, justifyContent: "space-between" }}>
         <ToggleButtonGroup
  size="small"
  exclusive
  value={action}
  onChange={(_, val) => val && setAction(val)}
>
  <ToggleButton
    value="BUY"
    sx={{
      fontWeight: 600,
      ...getActionStyles(action, "BUY"),
    }}
  >
    BUY
  </ToggleButton>

  <ToggleButton
    value="SELL"
    sx={{
      fontWeight: 600,
      ...getActionStyles(action, "SELL"),
    }}
  >
    SELL
  </ToggleButton>
      </ToggleButtonGroup>
    <ToggleButtonGroup
  size="small"
  exclusive
  
  
>
  <ToggleButton
    value="Cash"
    sx={{
      fontWeight: 600
     
    }}
  >
    Cash
  </ToggleButton>
   <ToggleButton
    value="Futures"
    sx={{
      fontWeight: 600
    }}
  >
    Futures
  </ToggleButton>
   <ToggleButton
    value="Option Calls"
    sx={{
      fontWeight: 600
    }}
  >
    Option Calls
  </ToggleButton>

  <ToggleButton
    value="Option Puts"
    sx={{
      fontWeight: 600
    }}
  >
    Option Puts
  </ToggleButton>
    </ToggleButtonGroup>

         
        </Box>

        {/* ROW 1 */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(3, 1fr)",
            },
            gap: 2,
          }}
        >
          <FormControl size="small">
            <InputLabel shrink>Call Type *</InputLabel>
            <Select
              value={callType}
              label="Call Type *"
              onChange={(e) => setCallType(e.target.value)}
              sx={controlSx}
            >
              <MenuItem value="">Select</MenuItem>
              <MenuItem value="F1">F1</MenuItem>
              <MenuItem value="Swing">Swing</MenuItem>
              <MenuItem value="Investment">Investment</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel shrink>Symbol *</InputLabel>
            <OutlinedInput
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              sx={controlSx}
            />
          </FormControl>

          <FormControl size="small">
            <InputLabel shrink>Lot *</InputLabel>
            <OutlinedInput
              type="number"
              value={lot}
              onChange={(e) => setLot(e.target.value)}
              sx={controlSx}
            />
          </FormControl>
        </Box>

        {/* ROW 2 */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(3, 1fr)",
            },
            gap: 2,
            mt: 2,
          }}
        >
          <FormControl size="small">
            <InputLabel shrink>Entry *</InputLabel>
            <OutlinedInput
              type="number"
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              sx={controlSx}
            />
          </FormControl>

          <FormControl size="small">
            <InputLabel shrink>Target *</InputLabel>
            <OutlinedInput
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              sx={controlSx}
            />
          </FormControl>

          <FormControl size="small">
            <InputLabel shrink>Stop Loss *</InputLabel>
            <OutlinedInput
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              sx={controlSx}
            />
          </FormControl>
        </Box>

        {/* TEXT AREAS */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "1fr 1fr",
            },
            gap: 2,
            mt: 2,
          }}
        >
          <FormControl>
            <InputLabel shrink>Rationale *</InputLabel>
            <OutlinedInput
              multiline
              minRows={3}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              sx={{ backgroundColor: "#fff" }}
            />
          </FormControl>

          <Box>
            <FormControl fullWidth>
              <InputLabel shrink>Analyst’s Remark *</InputLabel>
              <OutlinedInput
                multiline
                minRows={3}
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                sx={{ backgroundColor: "#fff" }}
              />
            </FormControl>

            <Button component="label" size="small" sx={{ mt: 1 }}>
              Choose File
              <input hidden type="file" />
            </Button>
          </Box>
        </Box>

        {/* ACTION */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
          <Button variant="contained" disabled>
            Generate Recommendation
          </Button>
        </Box>
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
