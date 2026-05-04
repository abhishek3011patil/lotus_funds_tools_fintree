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
  InputAdornment, 
  Tooltip
} from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);


  const transparentInputSx = {
    backgroundColor: "transparent",
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#b6c3b6" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#9fb19f" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#6fa66f" },
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    setSelectedFile(file);   // ✅ store it
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

  const getRAIdFromToken = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;

    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id; // ✅ THIS is your RA ID
  } catch {
    return null;
  }
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

    // 🔹 Base payload (same as before)
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
      holding: form.holdingPeriod || "0",
      rationale: form.rationale,
      underlying_study: form.underlyingStudy?.label || null,
      is_algo: false,
      has_vested_interest: false,
      research_remarks: form.remark || undefined
    };

    let res;

    // =========================================================
    // ✅ ERRATA FLOW (NO FILE HERE)
    // =========================================================
    if (isErrataMode && errataSourceId) {
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
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Errata Created ✅");
    }

    // =========================================================
    // ✅ NORMAL CREATE (WITH FILE)
    // =========================================================
    else {
      const formData = new FormData();

      // 🔹 attach file
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      // 🔹 attach all fields
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value as any);
        }
      });

      res = await axios.post(
        import.meta.env.VITE_API_URL + "/api/research/calls",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert("Research Call Created ✅");

      // =========================================================
      // ✅ TELEGRAM SEND (UNCHANGED)
      // =========================================================
      try {
        const now = new Date();

        const message = `
Date & Time : ${now.toLocaleString()}

*${form.action}* *${finalDisplayName}*
Call Type : ${form.exchange} ${form.callType} ${form.tradeType}

${
  form.rangeEnabled
    ? `Entry: ${form.entryLow} - ${form.entryUpper}`
    : `Entry: ${form.entry}`
}

Target: ${form.target}

${
  form.secondaryTargetEnabled
    ? `Target 2: ${form.target2}
Target 3: ${form.target3}`
    : ""
}

SL: ${form.stopLoss}

${
  form.stopLoss2Enabled
    ? `SL 2: ${form.stopLoss2}
SL 3: ${form.stopLoss3}`
    : ""
}

Expiry: ${form.expiry || "N/A"}
Holding Period: ${form.holdingPeriod || "N/A"}

Rationale: ${form.rationale}
Underlying Study: ${form.underlyingStudy?.label || "N/A"}
`;

        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/telegram/send-ra-message`,
          { message },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("✅ Telegram sent ONLY to this RA clients");
      } catch (telegramErr: any) {
        console.error(
          "⚠️ Telegram failed:",
          telegramErr?.response?.data || telegramErr?.message
        );
      }
    }

    // =========================================================
    // ✅ REFRESH + RESET
    // =========================================================
    await fetchRecommendations();
    resetForm();

  } catch (err: any) {
    console.error(err);
    alert(err?.response?.data?.message || "Error submitting call");
  }
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
  if (form.tradeType === "Intraday") {
    dispatch({ type: "SET_FIELD", field: "holdingPeriod", value: "0" });
  }
}, [form.tradeType]);

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
  const validateAndPublish = (event: React.MouseEvent<HTMLButtonElement>) => {
  event.preventDefault();
  setWasValidated(true);

  const priceErr = getPriceError("entry", form) || 
                   getPriceError("target", form) || 
                   getPriceError("stopLoss", form);
  if (!priceErr) {
    console.log("✅ Price logic passed, submitting...");
    handleSubmit(); 
    setWasValidated(false);
  } else {
    console.log("❌ Price logic failed");
    const priceRow = document.getElementById("prices-row");
    if (priceRow) {
      priceRow.scrollIntoView({ behavior: "smooth", block: "center" });
    }
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
  const telegramRes = await axios.post(
    `${import.meta.env.VITE_API_URL}/api/telegram/send-ra-message`,
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

  console.log("✅ Telegram Response:", telegramRes.data);

} catch (err: any) {
  console.error("❌ Telegram FULL ERROR:", err);
}
    } catch (error) {
      console.error("Publish failed:", error);
    }
  }, []);


  const handleTrack = async () => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login again");
      return;
    }

    const finalDisplayName =
      typeof suggestion === "object" && suggestion !== null
        ? suggestion.display_name
        : inputValue.trim();

    // 🔹 Base payload
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

      // ⚠️ FIXED KEY
      holding_period: form.holdingPeriod || null,

      rationale: form.rationale,
      underlying_study: form.underlyingStudy?.label || null,

      is_algo: false,
      has_vested_interest: false,
      research_remarks: form.remark || null,
    };

    // =========================================================
    // ✅ CONVERT TO FORMDATA
    // =========================================================
    const formData = new FormData();

    // 🔹 attach file if exists
    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    // 🔹 append all fields
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value as any);
      }
    });

    console.log("TRACK FORM DATA READY");

    // =========================================================
    // ✅ API CALL
    // =========================================================
    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/research/calls`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    alert("Draft Saved ✅");

    // 🔥 Refresh list
    await fetchRecommendations();

    // Optional reset
    // resetForm();

  } catch (err: any) {
    console.error("Track failed:", err?.response?.data || err);
    alert(err?.response?.data?.message || "Track failed");
  }
};

  // Add this helper function outside or inside your component
const getPriceError = (field: string, currentForm: any): string | null => {
  const action = currentForm.action;

  // Group 1: Top Switched Row
  const eLow = parseFloat(currentForm.entryLow) || 0;
  const t2 = parseFloat(currentForm.target2) || 0;
  const sl2 = parseFloat(currentForm.stopLoss2) || 0;

  // Group 2: Bottom Switched Row
  const eUpper = parseFloat(currentForm.entryUpper) || 0;
  const t3 = parseFloat(currentForm.target3) || 0;
  const sl3 = parseFloat(currentForm.stopLoss3) || 0;

  // --- BUY LOGIC ---
  if (action === "BUY") {
    // Top Row: SL2 < Lower Entry < T2
    if (field === "entryLow") {
      if (t2 && eLow >= t2) return "Must be < T2";
      if (sl2 && eLow <= sl2) return "Must be > SL2";
    }
    if (field === "target2" && t2 <= eLow && eLow !== 0) return "T2 must be > Lower Entry";
    if (field === "stopLoss2" && sl2 >= eLow && eLow !== 0) return "SL2 must be < Lower Entry";

    // Bottom Row: SL3 < Upper Entry < T3
    if (field === "entryUpper") {
      if (t3 && eUpper >= t3) return "Must be < T3";
      if (sl3 && eUpper <= sl3) return "Must be > SL3";
    }
    if (field === "target3" && t3 <= eUpper && eUpper !== 0) return "T3 must be > Upper Entry";
    if (field === "stopLoss3" && sl3 >= eUpper && eUpper !== 0) return "SL3 must be < Upper Entry";
  } 
  
  // --- SELL LOGIC ---
  else {
    // Top Row: T2 < Lower Entry < SL2
    if (field === "entryLow") {
      if (t2 && eLow <= t2) return "Must be > T2";
      if (sl2 && eLow >= sl2) return "Must be < SL2";
    }
    if (field === "target2" && t2 >= eLow && eLow !== 0) return "T2 must be < Lower Entry";
    if (field === "stopLoss2" && sl2 <= eLow && eLow !== 0) return "SL2 must be > Lower Entry";

    // Bottom Row: T3 < Upper Entry < SL3
    if (field === "entryUpper") {
      if (t3 && eUpper <= t3) return "Must be > T3";
      if (sl3 && eUpper >= sl3) return "Must be < SL3";
    }
    if (field === "target3" && t3 >= eUpper && eUpper !== 0) return "T3 must be < Upper Entry";
    if (field === "stopLoss3" && sl3 <= eUpper && eUpper !== 0) return "SL3 must be > Upper Entry";
  }

  // --- MAIN ROW (Entry, Target, StopLoss) ---
  const entry = parseFloat(currentForm.entry) || 0;
  const t1 = parseFloat(currentForm.target) || 0;
  const sl1 = parseFloat(currentForm.stopLoss) || 0;

  if (action === "BUY") {
    if (field === "target" && t1 <= entry && entry !== 0) return "T1 must be > Entry";
    if (field === "stopLoss" && sl1 >= entry && entry !== 0) return "SL1 must be < Entry";
  } else {
    if (field === "target" && t1 >= entry && entry !== 0) return "T1 must be < Entry";
    if (field === "stopLoss" && sl1 <= entry && entry !== 0) return "SL1 must be > Entry";
  }

  return null;
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
 
    // FIX FOR MOBILE
    width: "100%",
    overflowX: "hidden",       
    "& > *": {
      minWidth: 0, // allows both panels to shrink properly on phone
    },
        
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
          // minHeight: "100%",
          minHeight: "auto",
width: "100%",
maxWidth: "100%",
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
        <Box sx={{ display: "flex",
    flexDirection: { xs: "column", md: "row" }, // only mobile changes
    alignItems: { xs: "flex-start", md: "center" },
    justifyContent: "space-between",
    mb: 1,
    gap: 1,
    width: "100%", }}>
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
          <Box sx={{     width: { xs: "100%", md: "auto" },
    overflowX: { xs: "auto", md: "visible" },
    overflowY: "hidden",
    WebkitOverflowScrolling: "touch",

    "&::-webkit-scrollbar": {
      display: "none",
    },
    scrollbarWidth: "none", }}>
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
<Box 
  id="prices-row" 
  sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1, mb: 1 }}
>
  {(["entry", "target", "stopLoss"] as const).map((field) => {
    const errorMsg = getPriceError(field, form);
    const label = field === "entry" ? "Entry" : field === "target" ? "Target" : "Stop Loss";

    return (
      <TextField
        key={field}
        required
        label={label}
        size="small"
        type="number"
        value={form[field]}
        onChange={handlePriceChange(field)}
        // Only shows red if validation was attempted and failed
        error={!!errorMsg && wasValidated} 
        sx={{ ...transparentInputSx, flex: 1 }}
        InputProps={{
          endAdornment: errorMsg && wasValidated ? (
            <InputAdornment position="end">
              <Tooltip title={errorMsg} arrow placement="top">
                <ErrorOutlineIcon color="error" sx={{ cursor: "pointer", fontSize: '1.1rem' }} />
              </Tooltip>
            </InputAdornment>
          ) : null,
        }}
      />
    );
  })}
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
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 2,
          p: 1.5,
          backgroundColor: isActive ? "rgba(25, 118, 210, 0.02)" : "transparent",
          transition: "all 0.2s ease",
        }}
      >
        {/* Header with Switch */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            mb: 1.5,
          }}
        >
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: isActive ? "primary.main" : "text.secondary" }}>
            {cfg.label}
          </Typography>
          <Switch
            size="small"
            checked={isActive}
            onChange={() => handleToggle(cfg.field)}
          />
        </Box>

        {/* Inputs Column */}
        <Box 
          sx={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: 1.5, 
            justifyContent: "center",
            alignItems: "center" 
          }}
        >
          {isActive ? (
            <>
              {[
                { id: cfg.v1, placeholder: cfg.p1 },
                { id: cfg.v2, placeholder: cfg.p2 }
              ].map((input) => {
                const errorMsg = getPriceError(input.id, form);
                return (
                  <TextField
                    key={input.id}
                    value={form[input.id]}
                    onChange={handlePriceChange(input.id)}
                    placeholder={input.placeholder}
                    size="small"
                    variant="outlined"
                    error={!!errorMsg && wasValidated}
                    sx={{
                      width: "100%",
                      "& .MuiInputBase-input": {
                        py: 1,
                        fontSize: "0.7rem",
                        textAlign: "center",
                      },
                    }}
                    InputProps={{
                      endAdornment: errorMsg && wasValidated ? (
                        <InputAdornment position="end">
                          <Tooltip title={errorMsg} arrow placement="top">
                            <ErrorOutlineIcon color="error" sx={{ fontSize: '1rem' }} />
                          </Tooltip>
                        </InputAdornment>
                      ) : null,
                    }}
                  />
                );
              })}
            </>
          ) : (
            <>
              {/* Stacked Disabled Placeholders */}
              <Button
                disabled
                fullWidth
                size="small"
                variant="outlined"
                sx={{
                  py: 0.5,
                  fontSize: "0.65rem",
                  height: 32,
                  backgroundColor: "#f9fafb",
                  borderColor: "#f3f4f6",
                  color: "#9ca3af !important",
                  textTransform: "none",
                  borderStyle: "dashed"
                }}
              >
                Disabled
              </Button>
              <Button
                disabled
                fullWidth
                size="small"
                variant="outlined"
                sx={{
                  py: 0.5,
                  fontSize: "0.65rem",
                  height: 32,
                  backgroundColor: "#f9fafb",
                  borderColor: "#f3f4f6",
                  color: "#9ca3af !important",
                  textTransform: "none",
                  borderStyle: "dashed"
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
          <Box sx={{ width: "100%",
    maxWidth: "100%",
    overflowX: { xs: "auto", md: "visible" },
    overflowY: "hidden",
    boxSizing: "border-box",
    pr: { xs: 1, md: 0 },

    "&::-webkit-scrollbar": {
      display: "none",
    },
    scrollbarWidth: "none", }}>
            <FormControl
              fullWidth
              error={wasValidated && !form.holdingPeriod && form.tradeType !== "Intraday"}
              sx={{ mt: 1 }}
            >
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, mb: 0.5 }}>Holding Period</Typography>

              {/* Intraday Logic */}
              {form.tradeType === "Intraday" && (
                <RadioGroup
  row
  value="0"
  onChange={(e) =>
    dispatch({ type: "SET_FIELD", field: "holdingPeriod", value: "0" })
  }
>
                  <FormControlLabel value={form.holdingPeriod} control={<Radio size="small" color="primary" />} label={<Typography sx={{ fontSize: '0.65rem' }}>0</Typography>} checked={form.holdingPeriod === "0"} />
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

  // Mobile only fix
  display: "flex",
  flexWrap: { xs: "wrap", md: "nowrap" },
  width: "100%",

  "& .MuiToggleButtonGroup-grouped": {
    border: "none",

    // 2 buttons per row on phone
    flex: { xs: "0 0 calc(50% - 4px)", md: "unset" },

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
            {selectedFile && (
  <Typography sx={{ fontSize: "0.6rem", color: "green" }}>
    {selectedFile.name}
  </Typography>
)}
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
  onClick={validateAndPublish} // Hits validation first
  sx={{ fontWeight: 700, px: 4 }}
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