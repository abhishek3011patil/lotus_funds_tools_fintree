import {
  Autocomplete,
  Box,
  Button,
  FormControl,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from "@mui/material";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import { useRef, useState, useEffect, useMemo } from "react";

import { startTransition } from "react";
import { useExpiryDates } from "../hooks/useExpiryDates";
import { useStockAutocomplete } from "../hooks/useStockAutocomplete";
import {
  UNDERLYING_STUDIES,
  getRecentStudies,
} from "../assets/UnderlyingStudy";
import type { StudyOption } from "../assets/UnderlyingStudy";
import axios from "axios";
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
const rootGridSx = {
  display: "grid",
  gridTemplateColumns: "3fr 1.5fr",
  gap: 2,
  height: "auto",
  boxSizing: "border-box",
};

const FLAT_STUDY_OPTIONS = UNDERLYING_STUDIES.flatMap((g) =>
  g.options.map((opt) => ({
    ...opt,
    group: g.group,
  }))
);


const NewRecommendation = () => {
  console.log("RENDER");
  const [exchangeType, setExchangeType] = useState("NSE");
  const [action, setAction] = useState<"BUY" | "SELL">("BUY");
  const [exchange, setExchange] = useState("STOCK");
  const [callType, setCallType] = useState("Cash");
  const [entry, setEntry] = useState("");
  const [target, setTarget] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [rationale, setRationale] = useState("Overbought Condition");
  const [tradeType, setTradeType] = useState("Intraday");
  const [underlyingStudyValue, setUnderlyingStudyValue] = useState<StudyOption | null>(null);
  const [underlyingStudyInput, setUnderlyingStudyInput] = useState("");
  const [recentStudyOptions, setRecentStudyOptions] = useState<StudyOption[]>([]);
  // 🔹 Symbol
  const [symbol, setSymbol] = useState("SYM");
  const [display_name, setDisplay_name] = useState();
  // 🔹 Entry Range
  const [entryLow, setEntryLow] = useState("");
  const [entryUpper, setEntryUpper] = useState("");

  // 🔹 Secondary Targets
  const [target2, setTarget2] = useState("");
  const [target3, setTarget3] = useState("");

  // 🔹 Secondary Stoploss
  const [stopLoss2, setStopLoss2] = useState("");
  const [stopLoss3, setStopLoss3] = useState("");

  // 🔹 Holding Period
  const [holdingPeriod, setHoldingPeriod] = useState(1);

  // 🔹 Remarks
  const [remark, setRemark] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [radioValue, setRadioValue] = useState("");
  const [expiry, setExpiry] = useState<string>("");

  const [isErrataMode, setIsErrataMode] = useState(false);
  const [errataSourceId, setErrataSourceId] = useState<string | null>(null);

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
  const resetForm = () => {
    setExchangeType("NSE");
    setExchange("STOCK");
    setAction("BUY");
    setCallType("Cash");
    setTradeType("Intraday");

    setEntry("");
    setTarget("");
    setStopLoss("");
    setTarget2("");
    setTarget3("");
    setStopLoss2("");
    setStopLoss3("");

    setRationale("");
    setUnderlyingStudyValue(null);
    setExpiry("");
    setRemark("");
    setRadioValue("");

    setIsErrataMode(false);
    setErrataSourceId(null);

    setDirectValue("");
  };


  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login again");
        return;
      }

      const finalDisplayName =
        suggestion &&
          suggestion.toLowerCase().startsWith(inputValue.toLowerCase())
          ? suggestion
          : inputValue;

      const payload = {
        exchange_type: exchangeType,
        market_type: exchange,
        symbol: "SYM",
        display_name: finalDisplayName,
        action,
        call_type: callType,
        trade_type: tradeType,
        expiry_date: expiry || null,
        entry_price: entry || null,
        entry_price_low: null,
        entry_price_upper: null,
        target_price: target || null,
        target_price_2: null,
        target_price_3: null,
        stop_loss: stopLoss || null,
        stop_loss_2: null,
        stop_loss_3: null,
        holding_period: 1,
        rationale,
        underlying_study: underlyingStudyValue?.label || null,
        is_algo: false,
        has_vested_interest: false,
        research_remarks: null
      };

      let res;

      if (isErrataMode && errataSourceId) {

        // Build only fields that are allowed to be updated
        const updates = {
          entry_price: entry || undefined,
          target_price: target || undefined,
          stop_loss: stopLoss || undefined,
          target_price_2: target2 || undefined,
          target_price_3: target3 || undefined,
          stop_loss_2: stopLoss2 || undefined,
          stop_loss_3: stopLoss3 || undefined,
          entry_price_low: entryLow || undefined,
          entry_price_upper: entryUpper || undefined,
          holding_period: holdingPeriod || undefined,
          rationale: rationale || undefined,
          underlying_study: underlyingStudyValue?.label || undefined,
          research_remarks: remark || undefined,
        };

        res = await axios.post(
          import.meta.env.VITE_API_URL + "/api/research/calls/errata",
          {
            call_id: errataSourceId,
            updates,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );


        alert("Errata Created ✅");

      } else {
        // ✅ NORMAL CREATE
        res = await axios.post(
          import.meta.env.VITE_API_URL + "/api/research/calls",
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        alert("Research Call Created ✅");
      }

      const createdCall = res.data.data || res.data;

      // Update list with new version
      setRecommendations((prev) => [
        {
          ...createdCall,
          name: createdCall.display_name,
        },
        ...prev.filter((c) => c.id !== errataSourceId),
      ]);

      // Reset errata mode
      setIsErrataMode(false);
      setErrataSourceId(null);

    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Error submitting call");
    }
    await fetchRecommendations();
    resetForm();
  };



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

  const autocomplete = useStockAutocomplete(exchangeType as "NSE" | "BSE");

  const {
    inputValue,
    suggestion,
    setDirectValue,
    matches,
    handleInputChange,
    handleKeyDown,
  } = isErrataMode
      ? {
        inputValue: autocomplete.inputValue,
        suggestion: "",
        setDirectValue: autocomplete.setDirectValue,
        matches: [],
        handleInputChange: () => { },
        handleKeyDown: () => { },
      }
      : autocomplete;

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

    const recent = recentStudyOptions.map((o) => ({
      ...o,
      group: "Recently Selected",
    }));

    const base = FLAT_STUDY_OPTIONS.filter(
      (opt) => !recentValues.has(opt.value)
    );

    return [...recent, ...base];
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
    if (!expiryDates.length) {
      setExpiry("");
      return;
    }

    const first = expiryDates[0].toISOString();

    setExpiry(prev => (prev !== first ? first : prev));

  }, [expiryDates]);

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const DATA_SOURCE =
    import.meta.env.VITE_API_URL + "/api/research/calls/my";

  const fetchRecommendations = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await fetch(DATA_SOURCE, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Unauthorized or failed request");
      }

      const data = await response.json();

      setRecommendations(Array.isArray(data) ? data : [data]);

    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  // 1. EXIT FUNCTION (Removes the item from the list)
  const handleExit = async (id: string) => {
    if (!window.confirm("Are you sure you want to exit this recommendation?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const DATA_SOURCE =
        import.meta.env.VITE_API_URL + "/api/research/calls";
      const response = await fetch(`${DATA_SOURCE}/${id}/exit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to exit recommendation");
      }

      // 🔥 Refetch updated list from backend
      await fetchRecommendations();

    } catch (error) {
      console.error("Exit failed:", error);
    }
  };

  // 2. MODIFY FUNCTION (Loads data back into the form)
  const handleModify = (item: any) => {
    startTransition(() => {
      setIsErrataMode(true);
      setErrataSourceId(item.id);

      setDirectValue(item.name || item.symbol || "");

      if (item.underlying_study) {
        setUnderlyingStudyValue({
          label: item.underlying_study,
          value: item.underlying_study.toLowerCase().replace(/\s+/g, "_"),
        });
      } else {
        setUnderlyingStudyValue(null);
      }

      setExchangeType(item.exchange);
      setExchange(item.instrument);
      setAction(item.action);
      setCallType(item.call_type);
      setTradeType(item.trade_type);

      setEntry(item.entry?.ideal?.toString() || "");
      setTarget(item.targets?.[0]?.toString() || "");
      setStopLoss(item.stop_losses?.[0]?.toString() || "");

      setTarget2(item.target_price_2?.toString() || "");
      setTarget3(item.target_price_3?.toString() || "");
      setStopLoss2(item.stop_loss_2?.toString() || "");
      setStopLoss3(item.stop_loss_3?.toString() || "");

      setRationale(item.rationale || "");
      setExpiry(item.expiry_date || "");
    });

    window.scrollTo({ top: 0 });
  };
  // Temporary
  const [wasValidated, setWasValidated] = useState(false);
  const validateAndPublish = (event) => {
    event.preventDefault();
    setWasValidated(true);

    // Check standard inputs via form
    const form = event.currentTarget.closest('form');
    const isFormValid = form.checkValidity();

    // Check our Radio manually
    const isRadioValid = radioValue !== "";

    if (isFormValid && isRadioValid) {
      handlePublish();
      setWasValidated(false);
    }
  };


  /// populate 
  useEffect(() => {
    (window as any).populateForm = () => {
      setExchangeType("NSE");
      setExchange("STOCK");
      setAction("BUY");
      setCallType("Cash");
      setTradeType("Intraday");

      setEntry("250");
      setTarget("270");
      setStopLoss("240");

      setExpiry("2026-03-28");

      setRationale("Breakout above resistance");
      setUnderlyingStudyValue({
        label: "RSI + Volume Confirmation",
        value: "rsi_volume"
      });

      console.log("Form Populated ✅");
    };
  }, []);


  //instiate
  const token = localStorage.getItem("token");
  const handleInitiate = async (item: any) => {
    try {
      const token = localStorage.getItem("token");

      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/research/calls/${item.id}/publish`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setRecommendations((prev) =>
        prev.map((rec) =>
          rec.id === item.id
            ? { ...rec, status: "PUBLISHED" }
            : rec
        )
      );

    } catch (error) {
      console.error("Publish failed:", error);
    }
  };

  const activeRecommendations = useMemo(
    () => recommendations.filter((item) => item.status === "PUBLISHED"),
    [recommendations]
  );

  const watchlistRecommendations = useMemo(
    () => recommendations.filter((item) => item.status === "DRAFT"),
    [recommendations]
  );


  const handleTrack = async () => {

    const finalDisplayName =
      typeof suggestion === "object" && suggestion !== null
        ? suggestion.display_name
        : inputValue.trim();

    try {
      const payload = {
        status: "DRAFT",   // 👈 Add this line

        exchange_type: exchangeType,
        market_type: exchange,
        symbol: "SYM",
        display_name: finalDisplayName,
        action,
        call_type: callType,
        trade_type: tradeType,
        expiry_date: expiry || null,
        entry_price: entry || null,
        entry_price_low: null,
        entry_price_upper: null,
        target_price: target || null,
        target_price_2: null,
        target_price_3: null,
        stop_loss: stopLoss || null,
        stop_loss_2: null,
        stop_loss_3: null,
        holding_period: 1,
        rationale,
        underlying_study: underlyingStudyValue?.label || null,
        is_algo: false,
        has_vested_interest: false,
        research_remarks: null
      };

      const res = await axios.post(
        import.meta.env.VITE_API_URL + "/api/research/calls",
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      // Update state instantly
      setRecommendations(prev => [
        {
          ...payload,
          id: res.data.id,
          created_at: res.data.created_at,
          status: "DRAFT"
        },
        ...prev
      ]);

    } catch (err) {
      console.error("Track failed:", err);
    }
  };

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
        component="form"
        noValidate
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
          "& .MuiTextField-root": {
            "& .MuiOutlinedInput-root": {
              ...(wasValidated && {
                "& input:invalid": {
                  "& ~ .MuiOutlinedInput-notchedOutline": {
                    borderColor: "red !important",
                    borderWidth: "2px",
                  }
                }
              })
            }
          }
        }}
      >
        {isErrataMode && (
          <Box
            sx={{
              backgroundColor: "#fff3cd",
              border: "1px solid #ffeeba",
              color: "#856404",
              px: 2,
              py: 1,
              borderRadius: 1,
              mb: 1,
              fontSize: "0.75rem",
              fontWeight: 600
            }}
          >
            You are creating an ERRATA for Call ID: {errataSourceId}
          </Box>
        )}
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
              disabled={isErrataMode}
              freeSolo
              options={matches}
              inputValue={inputValue}
              onInputChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onChange={(_, newValue) => {
                if (typeof newValue === "string" && newValue) {
                  setDirectValue(newValue);
                }
              }}
              isOptionEqualToValue={(option, value) => option === value}
              sx={{
                flexGrow: 1,
                zIndex: 1,
                "& .MuiOutlinedInput-root": { backgroundColor: "transparent" },
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
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
          <TextField required label="Entry" size="small" type="number" value={entry} onChange={handlePriceChange(setEntry)} sx={{ ...transparentInputSx, flex: 1 }} />
          <TextField required label="Target" size="small" type="number" value={target} onChange={handlePriceChange(setTarget)} sx={{ ...transparentInputSx, flex: 1 }} />
          <TextField required label="Stop Loss" size="small" type="number" value={stopLoss} onChange={handlePriceChange(setStopLoss)} sx={{ ...transparentInputSx, flex: 1 }} />
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
            <FormControl
              fullWidth
              error={wasValidated && !radioValue && tradeType !== "Intraday"}
              sx={{ mt: 1 }}
            >
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
              {/* This shows the red text below the radios if empty */}
              {wasValidated && !radioValue && tradeType !== "Intraday" && (
                <FormHelperText sx={{ fontSize: '0.6rem', mt: 0 }}>Please select a holding period</FormHelperText>
              )}
            </FormControl>
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
                required
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
          <TextField required multiline rows={2} placeholder="Research Analyst's Remarks" sx={{ flexGrow: 1 }} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: { xs: "100%", sm: 160 } }}>
            <input
              required
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

        <Box
          sx={{
            display: "flex",
            gap: 2,
            mt: 2,
            justifyContent: "flex-start", // change to "space-between" if needed
          }}
        >
          <Button
            variant="contained"
            onClick={handleSubmit}
          >
            {isErrataMode ? "Create Errata" : "Publish Call"}
          </Button>

          <Button
            variant="outlined"
            onClick={handleTrack}   // <-- create this function
          >
            Track
          </Button>
        </Box>

      </Paper>

      {/* RIGHT PANEL */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* UPDATED ACTIVE RECOMMENDATIONS PAPER */}
        <Paper sx={{ p: 2, overflow: 'hidden', borderRadius: 2 }}>
          {/* Header Section: Title + Counter */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2
          }}>
            <Typography fontWeight={700} sx={{ fontSize: "0.9rem" }}>
              Active Recommendations
            </Typography>

            <Box
              sx={{
                backgroundColor: '#f0f2f5', // Light grey background for the badge
                color: '#000',
                borderRadius: '6px',
                px: 1.5,
                py: 0.2,
                fontSize: '0.75rem',
                fontWeight: 700,
                border: '1px solid #e0e0e0'
              }}
            >
              {activeRecommendations.length}
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontSize: '0.65rem', color: '#999', fontWeight: 700, px: 1, backgroundColor: '#fff' }}>
                      Published Date
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.65rem', color: '#999', fontWeight: 700, px: 1, backgroundColor: '#fff' }}>
                      Recommendation
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.65rem', color: '#999', fontWeight: 700, px: 1, backgroundColor: '#fff' }}>
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeRecommendations.length > 0 ? (
                    activeRecommendations.map((item) => {
                      const dateObj = new Date(item.created_at);

                      return (
                        <TableRow
                          key={item.id}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: '#fcfcfc' } }}
                        >
                          {/* Column 1: Date & Time */}
                          <TableCell sx={{ px: 1, py: 1.5 }}>
                            <Typography sx={{ fontSize: '0.65rem', color: '#666', fontWeight: 500 }}>
                              {dateObj.toLocaleDateString()}
                            </Typography>

                            <Typography sx={{ fontSize: '0.65rem', color: '#999' }}>
                              {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Typography>

                            {/* 🔥 Modified Label */}
                            {item.version_type === "ERRATA" && (
                              <Typography
                                sx={{
                                  fontSize: '0.6rem',
                                  fontWeight: 700,
                                  color: '#d97706',
                                  mt: 0.3
                                }}
                              >
                                Modified
                              </Typography>
                            )}
                          </TableCell>

                          {/* Column 2: Recommendation Details */}
                          <TableCell sx={{ px: 1, py: 1.5 }}>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: item.action === 'BUY' ? '#2e7d32' : '#d32f2f' }}>
                              {item.action} {item.instrument} {item.call_type?.toUpperCase()}
                            </Typography>
                            <Typography sx={{ fontSize: '0.65rem', color: '#333', fontWeight: 600 }}>
                              {item.name} • {item.trade_type}
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#999', mt: 0.5, display: 'block' }}>
                              @{item.entry?.ideal} | TP {item.targets?.join(', ')} | SL {item.stop_losses?.[0]}
                            </Typography>
                          </TableCell>

                          {/* Column 3: Action Buttons */}
                          <TableCell align="right" sx={{ px: 1, py: 1.5 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Button
                                size="small"
                                onClick={() => handleModify(item)}
                                sx={{
                                  fontSize: '0.6rem',
                                  textTransform: 'none',
                                  color: '#757575',
                                  minWidth: 'auto',
                                  p: 0,
                                  textAlign: 'right',
                                  justifyContent: 'flex-end',
                                  '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
                                }}
                              >
                                Modify/Errata
                              </Button>
                              <Button
                                size="small"
                                onClick={() => handleExit(item.id)}
                                sx={{
                                  fontSize: '0.65rem',
                                  textTransform: 'none',
                                  color: '#6200ea',
                                  fontWeight: 800,
                                  minWidth: 'auto',
                                  p: 0,
                                  textAlign: 'right',
                                  justifyContent: 'flex-end',
                                  '&:hover': { backgroundColor: 'transparent', color: '#4500a0' }
                                }}
                              >
                                Exit
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 4, color: '#999', fontSize: '0.8rem' }}>
                        No active recommendations.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
        <Paper sx={{ p: 2, overflow: 'hidden', borderRadius: 2, mt: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2
            }}
          >
            <Typography fontWeight={700} sx={{ fontSize: "0.9rem" }}>
              Watchlist
            </Typography>

            <Box
              sx={{
                backgroundColor: '#f0f2f5',
                color: '#000',
                borderRadius: '6px',
                px: 1.5,
                py: 0.2,
                fontSize: '0.75rem',
                fontWeight: 700,
                border: '1px solid #e0e0e0'
              }}
            >
              {watchlistRecommendations.length}
            </Box>
          </Box>

          <TableContainer sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.65rem', color: '#999', fontWeight: 700, px: 1, backgroundColor: '#fff' }}>
                    Published Date
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.65rem', color: '#999', fontWeight: 700, px: 1, backgroundColor: '#fff' }}>
                    Recommendation
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.65rem', color: '#999', fontWeight: 700, px: 1, backgroundColor: '#fff' }}>
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {watchlistRecommendations.length > 0 ? (
                  watchlistRecommendations.map((item) => {
                    const dateObj = new Date(item.created_at);

                    return (
                      <TableRow
                        key={item.id}
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 },
                          '&:hover': { backgroundColor: '#fcfcfc' }
                        }}
                      >
                        <TableCell sx={{ px: 1, py: 1.5 }}>
                          <Typography sx={{ fontSize: '0.65rem', color: '#666', fontWeight: 500 }}>
                            {dateObj.toLocaleDateString()}
                          </Typography>
                          <Typography sx={{ fontSize: '0.65rem', color: '#999' }}>
                            {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ px: 1, py: 1.5 }}>
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: item.action === 'BUY' ? '#2e7d32' : '#d32f2f' }}>
                            {item.action} {item.instrument} {item.call_type?.toUpperCase()}
                          </Typography>

                          <Typography sx={{ fontSize: '0.65rem', color: '#333', fontWeight: 600 }}>
                            {item.display_name} • {item.trade_type}
                          </Typography>

                          <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#999', mt: 0.5, display: 'block' }}>
                            @{item.entry?.ideal} | TP {item.targets?.join(', ')} | SL {item.stop_losses?.[0]}
                          </Typography>
                        </TableCell>

                        {/* 🔥 Only Change Is Here */}
                        <TableCell align="right" sx={{ px: 1, py: 1.5 }}>
                          <Button
                            size="small"
                            onClick={() => handleInitiate(item)}
                            disabled={item.status !== "DRAFT"}
                            sx={{
                              fontSize: '0.65rem',
                              textTransform: 'none',
                              color: '#1976d2',
                              fontWeight: 700,
                              minWidth: 'auto',
                              p: 0,
                              textAlign: 'right',
                              justifyContent: 'flex-end',
                              '&:hover': {
                                backgroundColor: 'transparent',
                                color: '#0d47a1'
                              }
                            }}
                          >
                            Initiate
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4, color: '#999', fontSize: '0.8rem' }}>
                      No watchlist items.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

      </Box>
    </Box>
  );
};

export default NewRecommendation;