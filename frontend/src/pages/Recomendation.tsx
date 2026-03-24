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
} from "@mui/material";
import RecommendationsPanel from "../components/page_Mainapp/RecommendationsPanel";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import { useRef, useState, useEffect, useMemo, useCallback, useReducer } from "react";
import { FormHelperText } from "@mui/material";
import { startTransition } from "react";
import { useExpiryDates } from "../hooks/useExpiryDates";
import { useStockAutocomplete } from "../hooks/useStockAutocomplete";
import {
  UNDERLYING_STUDIES,
  getRecentStudies,
} from "../assets/UnderlyingStudy";
import type { StudyOption } from "../assets/UnderlyingStudy";
import axios from "axios";
import React from "react";
const BUY_COLOR = "#22c55e";
const SELL_COLOR = "#ef4444";


const MemoRecommendationsPanel = React.memo(RecommendationsPanel);


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
  const [underlyingStudyInput, setUnderlyingStudyInput] = useState("");
  const [recentStudyOptions, setRecentStudyOptions] = useState<StudyOption[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isErrataMode, setIsErrataMode] = useState(false);
  const [errataSourceId, setErrataSourceId] = useState<string | null>(null);


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

  type RecommendationForm = {
    exchangeType: "NSE" | "BSE";
    action: "BUY" | "SELL";
    exchange: "STOCK" | "INDEX";
    callType: "Cash" | "Futures" | "Option Call" | "Option Put";
    tradeType: "Intraday" | "BTST" | "STBT" | "Short Term" | "Long Term";
    symbol: string;
    display_name: string;
    entry: string;
    entryLow: string;
    entryUpper: string;
    target: string;
    target2: string;
    target3: string;
    stopLoss: string;
    stopLoss2: string;
    stopLoss3: string;
    expiry: string;
    holdingPeriod: string;
    rationale: string;
    remark: string;
    underlyingStudy: StudyOption | null;
    rangeEnabled: boolean;
    secondaryTargetEnabled: boolean;
    stopLoss2Enabled: boolean;
  };

  const initialForm: RecommendationForm = {
    exchangeType: "NSE",
    action: "BUY",
    exchange: "STOCK",
    callType: "Cash",
    tradeType: "Intraday",
    symbol: "SYM",
    display_name: "",
    entry: "",
    entryLow: "",
    entryUpper: "",
    target: "",
    target2: "",
    target3: "",
    stopLoss: "",
    stopLoss2: "",
    stopLoss3: "",
    expiry: "",
    holdingPeriod: "",
    rationale: "Overbought Condition",
    remark: "",
    underlyingStudy: null,
    rangeEnabled: false,
    secondaryTargetEnabled: false,
    stopLoss2Enabled: false,
  };

  type FormAction =
    | {
      type: "SET_FIELD";
      field: keyof RecommendationForm;
      value: RecommendationForm[keyof RecommendationForm];
    }
    | { type: "SET_FORM"; payload: Partial<RecommendationForm> }
    | { type: "RESET" };

  function formReducer(
    state: RecommendationForm,
    action: FormAction
  ): RecommendationForm {
    switch (action.type) {
      case "SET_FIELD":
        return { ...state, [action.field]: action.value };
      case "SET_FORM":
        return { ...state, ...action.payload };
      case "RESET":
        return initialForm;
      default:
        return state;
    }
  }

  const [form, dispatch] = useReducer(formReducer, initialForm);

  const panelBg = form.action === "BUY" ? "#eef9ee" : "#fee2e2";
  const panelBorder = form.action === "BUY" ? "#7ac77a" : SELL_COLOR;

  const resetForm = () => {
    dispatch({ type: "RESET" });
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
        exchange_type: form.exchangeType,
        market_type: form.exchange,
        symbol: "SYM",
        display_name: finalDisplayName,
        action: form.action,
        call_type: form.callType,
        trade_type: form.tradeType,
        expiry_date: form.expiry || null,
        entry_price: form.entry || null,
        entry_price_low: form.entryLow || null,
        entry_price_upper: form.entryUpper || null,
        target_price: form.target || null,
        target_price_2: form.target2 || null,
        target_price_3: form.target3 || null,
        stop_loss: form.stopLoss || null,
        stop_loss_2: form.stopLoss2 || null,
        stop_loss_3: form.stopLoss3 || null,
        holding_period: form.holdingPeriod || null,
        rationale: form.rationale,
        underlying_study: form.underlyingStudy?.label || null,
        is_algo: false,
        has_vested_interest: false,
        research_remarks: form.remark || undefined
      };

      let res;

      if (isErrataMode && errataSourceId) {

        // Build only fields that are allowed to be updated
        const updates = {
          entry_price: form.entry || undefined,
          target_price: form.target || undefined,
          stop_loss: form.stopLoss || undefined,
          target_price_2: form.target2 || undefined,
          target_price_3: form.target3 || undefined,
          stop_loss_2: form.stopLoss2 || undefined,
          stop_loss_3: form.stopLoss3 || undefined,
          entry_price_low: form.entryLow || undefined,
          entry_price_upper: form.entryUpper || undefined,
          holding_period: form.holdingPeriod || undefined,
          rationale: form.rationale || undefined,
          underlying_study: form.underlyingStudy?.label || undefined,
          research_remarks: form.remark || undefined,
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

        // 📤 Send Telegram notification after successful creation
        try {
          await axios.post(
            import.meta.env.VITE_API_URL + "/api/telegram/send",
            {
              ra_user_id: res.data?.id || res.data?.data?.ra_user_id,
              action: form.action,
              symbol: finalDisplayName,
              callType: form.callType,
              tradeType: form.tradeType,
              entry: form.entry,
              target: form.target,
              stopLoss: form.stopLoss,
              rationale: form.rationale,
              holding: form.holdingPeriod,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          console.log("✅ Telegram notification sent");
        } catch (telegramErr: any) {
          console.error("⚠️ Telegram send failed:", telegramErr?.response?.data || telegramErr?.message);
        }
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


  const handleToggle = useCallback(
    (field: keyof RecommendationForm) => {
      dispatch({ type: "SET_FIELD", field, value: !form[field] });
    },
    [form]
  );

  const handlePriceChange = useCallback(
    (field: keyof RecommendationForm) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val.includes("-")) return;

        dispatch({ type: "SET_FIELD", field, value: val });
      },
    []
  );

  // hooks 
  const expiryDates = useExpiryDates(
    form.callType as any,
    form.exchangeType as any
  );

  const autocomplete = useStockAutocomplete(form.exchangeType as "NSE" | "BSE");

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
    dispatch({ type: "SET_FIELD", field: "underlyingStudy", value: newValue });
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
      dispatch({ type: "SET_FIELD", field: "expiry", value: "" });
      return;
    }

    const first = expiryDates[0].toISOString();

    if (form.expiry !== first) {
      dispatch({ type: "SET_FIELD", field: "expiry", value: first });
    }
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
  const handleExit = useCallback(async (id: string) => {
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
  }, []);

  // 2. MODIFY FUNCTION (Loads data back into the form)
  const handleModify = useCallback((item) => {
    startTransition(() => {
      const formUpdate: Partial<RecommendationForm> = {
        rangeEnabled: Boolean(item.entry?.low || item.entry?.high),
        secondaryTargetEnabled: Boolean(item.targets?.[1] || item.targets?.[2]),
        stopLoss2Enabled: Boolean(item.stop_losses?.[1] || item.stop_losses?.[2]),
        exchangeType: item.exchange,
        exchange: item.instrument,
        action: item.action,
        callType: item.call_type,
        tradeType: item.trade_type,
        expiry: item.expiry_date || "",
        entry: item.entry?.ideal?.toString() || "",
        target: item.targets?.[0]?.toString() || "",
        stopLoss: item.stop_losses?.[0]?.toString() || "",
        holdingPeriod: item.holding_period?.toString() || "",
        entryLow: item.entry?.low?.toString() || "",
        entryUpper: item.entry?.high?.toString() || "",
        target2: item.targets?.[1]?.toString() || "",
        target3: item.targets?.[2]?.toString() || "",
        stopLoss2: item.stop_losses?.[1]?.toString() || "",
        stopLoss3: item.stop_losses?.[2]?.toString() || "",
        rationale: item.rationale || "",
        remark: item.research_remarks || item.remark || "",
        underlyingStudy: item.underlying_study ? {
          label: item.underlying_study,
          value: item.underlying_study.toLowerCase().replace(/\s+/g, "_"),
        } : null,
      };

      dispatch({ type: "SET_FORM", payload: formUpdate });
      setIsErrataMode(true);
      setErrataSourceId(item.id);
      setDirectValue(item.name || item.symbol || "");
    });

    window.scrollTo({ top: 0 });
  }, []);
  // Temporary
  const [wasValidated, setWasValidated] = useState(false);
  const validateAndPublish = (event) => {
    event.preventDefault();
    setWasValidated(true);

    // Check standard inputs via form
    const formEl = event.currentTarget.closest('form');
    const isFormValid = formEl.checkValidity();

    // Check our Radio manually
    const isRadioValid = form.holdingPeriod !== "";

    if (isFormValid && isRadioValid) {
      handleSubmit();
      setWasValidated(false);
    }
  };


  /// populate 
  useEffect(() => {
    (window as any).populateForm = () => {
      dispatch({
        type: "SET_FORM",
        payload: {
          exchangeType: "NSE",
          exchange: "STOCK",
          action: "BUY",
          callType: "Cash",
          tradeType: "Short Term",
          symbol: "SYM",
          entry: "250",
          entryLow: "240",
          entryUpper: "260",
          target: "270",
          target2: "285",
          target3: "300",
          stopLoss: "230",
          stopLoss2: "220",
          stopLoss3: "210",
          expiry: "2026-03-28",
          holdingPeriod: "30 Days",
          rationale: "Break Out Play",
          underlyingStudy: {
            label: "RSI + Volume Confirmation",
            value: "rsi_volume",
          },
          rangeEnabled: true,
          secondaryTargetEnabled: true,
          stopLoss2Enabled: true,
          remark: "Strong breakout with volume confirmation.",
        }
      });
      setDirectValue("A.F. Enterprises Ltd");
      console.log("Form Populated ✅");
    };
  }, []);


  //instiate
  const token = localStorage.getItem("token");
  const handleInitiate = useCallback(async (item: any) => {
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

      // 📤 Send Telegram notification after publishing draft
      try {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/telegram/send`,
          {
            ra_user_id: item.id,
            action: item.action,
            symbol: item.name || item.symbol,
            callType: item.call_type,
            tradeType: item.trade_type,
            entry: item.entry?.ideal || item.entry,
            target: item.targets?.[0] || item.target_price,
            stopLoss: item.stop_losses?.[0] || item.stop_loss,
            rationale: item.rationale || "",
            holding: item.holding_period || "",
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("✅ Telegram notification sent after publish");
      } catch (telegramErr: any) {
        console.error("⚠️ Telegram send failed:", telegramErr?.response?.data || telegramErr?.message);
      }

    } catch (error) {
      console.error("Publish failed:", error);
    }
  }, []);



  const handleTrack = async () => {
    try {
      const finalDisplayName =
        typeof suggestion === "object" && suggestion !== null
          ? suggestion.display_name
          : inputValue.trim();

      const payload = {
        status: "DRAFT",

        exchange_type: form.exchangeType,
        market_type: form.exchange,
        symbol: form.symbol || finalDisplayName,
        display_name: finalDisplayName,

        action: form.action,
        call_type: form.callType,
        trade_type: form.tradeType,
        expiry_date: form.expiry || null,

        // 🔹 Entry
        entry_price: form.entry || null,
        entry_price_low: form.rangeEnabled ? form.entryLow || null : null,
        entry_price_upper: form.rangeEnabled ? form.entryUpper || null : null,

        // 🔹 Targets
        target_price: form.target || null,
        target_price_2: form.secondaryTargetEnabled
          ? form.target2 || null
          : null,
        target_price_3: form.secondaryTargetEnabled
          ? form.target3 || null
          : null,

        // 🔹 Stop Loss
        stop_loss: form.stopLoss || null,
        stop_loss_2: form.stopLoss2Enabled
          ? form.stopLoss2 || null
          : null,
        stop_loss_3: form.stopLoss2Enabled
          ? form.stopLoss3 || null
          : null,

        holding_period: form.holdingPeriod || null,

        rationale: form.rationale,
        underlying_study: form.underlyingStudy?.label || null,

        is_algo: false,
        has_vested_interest: false,
        research_remarks: form.remark || null,
      };

      console.log("TRACK PAYLOAD:", payload);

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/research/calls`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // 🔥 IMPORTANT: Refetch because backend does not return full object
      await fetchRecommendations();

      // Optional: Reset form after tracking
      // resetForm();

    } catch (err: any) {
      console.error("Track failed:", err?.response?.data || err);
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
            value={form.exchangeType}
            onChange={(_, val) => val && dispatch({ type: "SET_FIELD", field: "exchangeType", value: val })}
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
            <ToggleButtonGroup size="small" exclusive value={form.action} onChange={(_, val) => val && dispatch({ type: "SET_FIELD", field: "action", value: val })}>
              <ToggleButton value="BUY" sx={{ fontWeight: 700, px: 2, fontSize: "0.7rem", ...getActionStyles(form.action, "BUY") }}>BUY</ToggleButton>
              <ToggleButton value="SELL" sx={{ fontWeight: 700, px: 2, fontSize: "0.7rem", ...getActionStyles(form.action, "SELL") }}>SELL</ToggleButton>
            </ToggleButtonGroup>

            <Box sx={{ overflowX: "auto", maxWidth: "100%" }}>
              <ToggleButtonGroup
                size="small" exclusive value={form.callType} onChange={(_, val) => val && dispatch({ type: "SET_FIELD", field: "callType", value: val })}
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
            value={form.exchange}
            onChange={(_, val) => val && dispatch({ type: "SET_FIELD", field: "exchange", value: val })}
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
              value={form.tradeType}
              onChange={(_, val) => val && dispatch({ type: "SET_FIELD", field: "tradeType", value: val })}
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
                disabled={["Futures", "Option Call", "Option Put"].includes(form.callType)}
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
              value={form.expiry}
              onChange={(e) => dispatch({ type: "SET_FIELD", field: "expiry", value: e.target.value })}
              disabled={form.callType === "Cash"}
              displayEmpty
              sx={{
                flexGrow: 1,
                minWidth: 160,
                height: 32,
                fontSize: "0.8rem",
              }}
            >
              {form.callType === "Cash" && (
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
          <TextField required label="Entry" size="small" type="number" value={form.entry} onChange={handlePriceChange("entry")} sx={{ ...transparentInputSx, flex: 1 }} />
          <TextField required label="Target" size="small" type="number" value={form.target} onChange={handlePriceChange("target")} sx={{ ...transparentInputSx, flex: 1 }} />
          <TextField required label="Stop Loss" size="small" type="number" value={form.stopLoss} onChange={handlePriceChange("stopLoss")} sx={{ ...transparentInputSx, flex: 1 }} />
        </Box>

        {/* Switched Options Row */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            mb: 1,
            gap: { xs: 2, md: 1.5 },
          }}
        >
          {[
            { label: "Range", field: "rangeEnabled" as const, p1: "Lower Entry", p2: "Upper Entry", v1: "entryLow" as const, v2: "entryUpper" as const },
            { label: "Secondary Target", field: "secondaryTargetEnabled" as const, p1: "T2", p2: "T3", v1: "target2" as const, v2: "target3" as const },
            { label: "Stop Loss 2", field: "stopLoss2Enabled" as const, p1: "SL2", p2: "SL3", v1: "stopLoss2" as const, v2: "stopLoss3" as const },
          ].map((cfg) => {
            const isActive = form[cfg.field];

            return (
              <Box
                key={cfg.label}
                sx={{
                  textAlign: "center",
                  flex: 1,
                  border: { xs: "1px solid rgba(0,0,0,0.1)", md: "none" },
                  borderRadius: 1,
                  p: 1,
                }}
              >
                {/* Header */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    mb: 1,
                  }}
                >
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 700 }}>
                    {cfg.label}
                  </Typography>
                  <Switch
                    size="small"
                    checked={isActive}
                    onChange={() => handleToggle(cfg.field)}
                  />
                </Box>

                {/* Inputs */}
                <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                  {isActive ? (
                    <>
                      <TextField
                        value={form[cfg.v1]}
                        onChange={handlePriceChange(cfg.v1)}
                        placeholder={cfg.p1}
                        size="small"
                        variant="outlined"
                        sx={{
                          flex: 1,
                          "& .MuiInputBase-input": {
                            py: 1,
                            fontSize: "0.7rem",
                            textAlign: "center",
                          },
                        }}
                      />
                      <TextField
                        value={form[cfg.v2]}
                        onChange={handlePriceChange(cfg.v2)}
                        placeholder={cfg.p2}
                        size="small"
                        variant="outlined"
                        sx={{
                          flex: 1,
                          "& .MuiInputBase-input": {
                            py: 1,
                            fontSize: "0.7rem",
                            textAlign: "center",
                          },
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <Button
                        size="small"
                        variant="outlined"
                        sx={{
                          py: 0,
                          fontSize: "0.6rem",
                          flex: 1,
                          height: 24,
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
                          py: 0,
                          fontSize: "0.6rem",
                          flex: 1,
                          height: 24,
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
              error={wasValidated && !form.holdingPeriod && form.tradeType !== "Intraday"}
              sx={{ mt: 1 }}
            >
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, mb: 0.5 }}>Holding Period</Typography>

              {/* Intraday Logic */}
              {form.tradeType === "Intraday" && (
                <RadioGroup row value="0">
                  <FormControlLabel value="0" control={<Radio size="small" color="primary" />} label={<Typography sx={{ fontSize: '0.65rem' }}>0</Typography>} checked={true} />
                </RadioGroup>
              )}

              {/* BTST/STBT Logic */}
              {(form.tradeType === "BTST" || form.tradeType === "STBT") && (
                <RadioGroup row value={form.holdingPeriod} onChange={(e) => dispatch({ type: "SET_FIELD", field: "holdingPeriod", value: e.target.value })}>
                  <FormControlLabel value="0" control={<Radio size="small" color="primary" />} label={<Typography sx={{ fontSize: '0.65rem' }}>0</Typography>} />
                  <FormControlLabel value="1" control={<Radio size="small" color="primary" />} label={<Typography sx={{ fontSize: '0.65rem' }}>1</Typography>} />
                </RadioGroup>
              )}

              {/* Short Term Logic */}
              {form.tradeType === "Short Term" && (
                <RadioGroup row value={form.holdingPeriod} onChange={(e) => dispatch({ type: "SET_FIELD", field: "holdingPeriod", value: e.target.value })}>
                  <FormControlLabel value="7 Days" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.65rem' }}>Upto 7 Days</Typography>} />
                  <FormControlLabel value="30 Days" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.65rem' }}>Upto 30 Days</Typography>} />
                  <FormControlLabel value="90 Days" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.65rem' }}>Upto 90 Days</Typography>} />
                </RadioGroup>
              )}

              {/* Long Term Logic */}
              {form.tradeType === "Long Term" && (
                <RadioGroup row value={form.holdingPeriod} onChange={(e) => dispatch({ type: "SET_FIELD", field: "holdingPeriod", value: e.target.value })}>
                  <FormControlLabel value="6 Months" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.65rem' }}>Upto 6 Months</Typography>} />
                  <FormControlLabel value="1 Year" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.65rem' }}>Upto 1 Year</Typography>} />
                  <FormControlLabel value="5 Years" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '0.65rem' }}>Upto 5 Years</Typography>} />
                </RadioGroup>
              )}
              {/* This shows the red text below the radios if empty */}
              {wasValidated && !form.holdingPeriod && form.tradeType !== "Intraday" && (
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
                value={form.rationale}
                onChange={(_, val) => val && dispatch({ type: "SET_FIELD", field: "rationale", value: val })}
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
              form.underlyingStudy
                ? {
                  ...form.underlyingStudy,
                  group:
                    UNDERLYING_STUDIES.find((g) =>
                      g.options.some((o) => o.value === form.underlyingStudy?.value)
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
          <TextField
            required
            multiline
            rows={2}
            placeholder="Research Analyst's Remarks"
            value={form.remark}
            onChange={(e) => dispatch({ type: "SET_FIELD", field: "remark", value: e.target.value })}
            sx={{ flexGrow: 1 }}
          />

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

      <MemoRecommendationsPanel
        loading={loading}
        recommendations={recommendations}
        onModify={handleModify}
        onExit={handleExit}
        onInitiate={handleInitiate}
      />

      {/* RIGHT PANEL */}

    </Box>
  );
};

export default NewRecommendation;