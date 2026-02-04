import {
  Autocomplete,
  Box,
  Button,
  FormControlLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import { useRef, useState, useEffect, useMemo } from "react";
import { STOCK_DATA } from "../assets/stocks";
import { useExpiryDates } from "../hooks/useExpiryDates";
import { useStockAutocomplete } from "../hooks/useStockAutocomplete";
import {
  UNDERLYING_STUDIES,
  getRecentStudies,
} from "../assets/UnderlyingStudy";
import type { StudyOption } from "../assets/UnderlyingStudy";

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
  const [underlyingStudyValue, setUnderlyingStudyValue] =
    useState<StudyOption | null>(null);
  const [underlyingStudyInput, setUnderlyingStudyInput] = useState("");
  const [recentStudyOptions, setRecentStudyOptions] = useState<StudyOption[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [radioValue, setRadioValue] = useState("");
  const [expiry, setExpiry] = useState<string>("");

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

  const handlePriceChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.includes("-")) return;
    setter(val);
  };

  // hooks 
  const expiryDates = useExpiryDates(
    callType as any,
    exchangeType as any
  );

  const {
    inputValue,
    suggestion,
    options,
    open,
    handleInputChange,
    handleKeyDown,
  } = useStockAutocomplete(exchangeType as "NSE" | "BSE");

  // =============================
  // Underlying Study helpers
  // =============================
  type StudyAutocompleteOption = StudyOption & { group: string };

  // Load recent selections from localStorage (if any)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem("recentUnderlyingStudies");
      if (!stored) return;
      const values: string[] = JSON.parse(stored);
      setRecentStudyOptions(getRecentStudies(values));
    } catch {
      // ignore malformed storage
    }
  }, []);

  // Build options with 4 logical groups, including "Recently Selected"
  const studyOptions: StudyAutocompleteOption[] = useMemo(() => {
    const recentValues = new Set(recentStudyOptions.map((o) => o.value));

    const recent: StudyAutocompleteOption[] = recentStudyOptions.map((o) => ({
      ...o,
      group: "Recently Selected",
    }));

    const groupedBase: StudyAutocompleteOption[] = UNDERLYING_STUDIES.flatMap(
      (g) =>
        g.options
          .filter((opt) => !recentValues.has(opt.value))
          .map((opt) => ({
            ...opt,
            group: g.group,
          }))
    );

    return [...recent, ...groupedBase];
  }, [recentStudyOptions]);

  const handleUnderlyingStudyChange = (
    _: unknown,
    newValue: StudyOption | null
  ) => {
    setUnderlyingStudyValue(newValue);
    if (!newValue) return;

    // update "recently selected" list (max 10, most recent first)
    setRecentStudyOptions((prev) => {
      const existingValues = prev.map((p) => p.value);
      const mergedValues = [
        newValue.value,
        ...existingValues.filter((v) => v !== newValue.value),
      ].slice(0, 10);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "recentUnderlyingStudies",
          JSON.stringify(mergedValues)
        );
      }

      return getRecentStudies(mergedValues);
    });
  };

  useEffect(() => {
    if (expiryDates.length > 0) {
      setExpiry(expiryDates[0].toISOString());
    } else {
      setExpiry("");
    }
  }, [expiryDates]);




  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "3fr 1.5fr" },
        gap: { xs: 2, md: 1.5 },
        height: "auto",
        p: { xs: 1, sm: 1.5 },
        boxSizing: "border-box",
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
          minHeight: "100%",
          gap: 1.5,
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
                    border: "none", m: 0.2, px: 1, fontSize: "0.65rem", fontWeight: 700,
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
                  "&.Mui-disabled": {
                    color: "#9ca3af",
                    backgroundColor: "#e5e7eb",
                  },
                },
              }}
            >
              <ToggleButton value="Intraday">Intraday</ToggleButton>
              <ToggleButton value="BTST">BTST</ToggleButton>
              <ToggleButton value="STBT">STBT</ToggleButton>
              <ToggleButton value="Short Term">Short Term</ToggleButton>
              <ToggleButton
                value="Long Term"
                disabled={["Futures", "Option Call", "Option Put"].includes(callType)}
              >
                Long Term
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* Script Row */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
          <Box sx={{ position: 'relative', display: 'flex', flexGrow: 1 }}>
            {suggestion && suggestion.toLowerCase().startsWith(inputValue.toLowerCase()) && (
              <Box
                sx={{
                  position: "absolute",
                  top: 9,
                  left: 14,
                  color: "rgba(0, 0, 0, 0.3)",
                  pointerEvents: "none",
                  fontSize: "1rem",
                  whiteSpace: "pre",
                  zIndex: 0,
                }}
              >
                <span style={{ color: "transparent" }}>{inputValue}</span>
                {suggestion.slice(inputValue.length)}
              </Box>
            )}

            <Autocomplete
              freeSolo
              open={open}
              options={options}
              inputValue={inputValue}
              onInputChange={handleInputChange}
              onKeyDown={handleKeyDown}
              sx={{
                flexGrow: 1,
                zIndex: 1,
                "& .MuiOutlinedInput-root": { backgroundColor: "transparent" },
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
            <Select
              size="small"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              disabled={callType === "Cash"}
              displayEmpty
              sx={{
                flexGrow: 1,
                minWidth: 160,
                height: 32,
                fontSize: "0.8rem",
              }}
            >
              {callType === "Cash" && (
                <MenuItem value="">
                  No Expiry
                </MenuItem>
              )}

              {expiryDates.map((d) => (
                <MenuItem key={d.toISOString()} value={d.toISOString()}>
                  {d.toDateString()}
                </MenuItem>
              ))}
            </Select>
          </Box>

        </Box>

        {/* Prices Row */}
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1, mb: 1 }}>
          <TextField label="Entry" size="small" type="number" value={entry} onChange={handlePriceChange(setEntry)} sx={{ ...transparentInputSx, flex: 1 }} />
          <TextField label="Target" size="small" type="number" value={target} onChange={handlePriceChange(setTarget)} sx={{ ...transparentInputSx, flex: 1 }} />
          <TextField label="Stop Loss" size="small" type="number" value={stopLoss} onChange={handlePriceChange(setStopLoss)} sx={{ ...transparentInputSx, flex: 1 }} />
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
                        sx={{
                          py: 0, fontSize: '0.6rem', flex: 1, height: 24, color: "#9ca3af", borderColor: "#e5e7eb", backgroundColor: "#e1e6eaf7", textTransform: "none",
                          "&:hover": { backgroundColor: "#f3f4f6", borderColor: "#d1d5db" }
                        }}> Disabled </Button>
                      <Button size="small" variant="outlined" sx={{
                        py: 0, fontSize: '0.6rem', flex: 1, height: 24, color: "#9ca3af", borderColor: "#e5e7eb", backgroundColor: "#e1e6eaf7", textTransform: "none",
                        "&:hover": { backgroundColor: "#f3f4f6", borderColor: "#d1d5db" }
                      }}> Disabled </Button>
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
    flexDirection: "column", // Stack sections vertically
    gap: 1.5, 
    mb: 1 
  }}
>
  {/* TOP PART: Holding Period */}
  <Box sx={{ width: "100%" }}>
    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, mb: 0.5 }}>Holding Period</Typography>
    
    {/* Intraday Logic */}
    {tradeType === "Intraday" && (
      <RadioGroup row value="0">
        <FormControlLabel value="0" control={<Radio size="small" color="primary" />} label={<Typography sx={{ fontSize: '0.65rem' }}>0</Typography>} checked={true} />
      </RadioGroup>
    )}

    {/* BTST/STBT Logic */}
    {(tradeType === "BTST" || tradeType === "STBT") && (
      <RadioGroup row value={radioValue} onChange={(e) => setRadioValue(e.target.value)}>
        <FormControlLabel value="0" control={<Radio size="small" color="primary" />} label={<Typography sx={{ fontSize: '0.65rem' }}>0</Typography>} />
        <FormControlLabel value="1" control={<Radio size="small" color="primary" />} label={<Typography sx={{ fontSize: '0.65rem' }}>1</Typography>} />
      </RadioGroup>
    )}

    {/* Short Term Logic */}
    {tradeType === "Short Term" && (
      <RadioGroup row value={radioValue} onChange={(e) => setRadioValue(e.target.value)}>
        <FormControlLabel value="7 Days" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.65rem' }}>Upto 7 Days</Typography>} />
        <FormControlLabel value="30 Days" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.65rem' }}>Upto 30 Days</Typography>} />
        <FormControlLabel value="90 Days" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.65rem' }}>Upto 90 Days</Typography>} />
      </RadioGroup>
    )}

    {/* Long Term Logic */}
    {tradeType === "Long Term" && (
      <RadioGroup row value={radioValue} onChange={(e) => setRadioValue(e.target.value)}>
        <FormControlLabel value="6 Months" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.65rem' }}>Upto 6 Months</Typography>} />
        <FormControlLabel value="1 Year" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.65rem' }}>Upto 1 Year</Typography>} />
        <FormControlLabel value="5 Years" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.65rem' }}>Upto 5 Years</Typography>} />
      </RadioGroup>
    )}
  </Box>

  {/* BOTTOM PART: Rationale (Now appears under Holding Period) */}
  <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 0.5 }}>
    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700 }}>Rationale</Typography>
    <Box sx={{ width: "100%" }}>
      <ToggleButtonGroup
              size="small"
              exclusive
              value={rationale}
              onChange={(_, val) => val && setRationale(val)}
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
        <ToggleButton value="Overbought Condition">OVERBOUGHT</ToggleButton>
        <ToggleButton value="Oversold Condition">OVERSOLD</ToggleButton>
        <ToggleButton value="Momentum Play">MOMENTUM</ToggleButton>
        <ToggleButton value="Break Out Play">BREAK OUT</ToggleButton>
        <ToggleButton value="Break Down Play">BREAK DOWN</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  </Box>
</Box>

        {/* Underlying Study */}
        <Box sx={{ mb: 1 }}>
          <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, mb: 0.5 }}>
            Underlying Study
          </Typography>

          <Autocomplete<StudyAutocompleteOption, false, false, false>
            size="small"
            fullWidth
            options={studyOptions}
            value={
              underlyingStudyValue
                ? {
                    ...underlyingStudyValue,
                    group:
                      UNDERLYING_STUDIES.find((g) =>
                        g.options.some((o) => o.value === underlyingStudyValue.value)
                      )?.group ?? "Fundamental & General Analysis",
                  }
                : null
            }
            inputValue={underlyingStudyInput}
            onInputChange={(_, newInput) => setUnderlyingStudyInput(newInput)}
            onChange={handleUnderlyingStudyChange}
            getOptionLabel={(option) => option.label}
            groupBy={(option) => option.group}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select or search underlying study"
                variant="outlined"
              />
            )}
            renderGroup={(params) => (
              <Box key={params.key}>
                <Typography
                  sx={{
                    px: 1.5,
                    pt: 1,
                    pb: 0.25,
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: "#6b7280",
                  }}
                >
                  {params.group}
                </Typography>
                {params.children}
              </Box>
            )}
            isOptionEqualToValue={(option, value) => option.value === value.value}
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
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Vested Interest?</Typography>
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

