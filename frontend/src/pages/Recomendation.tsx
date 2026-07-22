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
   Checkbox,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
   Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Chip,
  Divider,
  CircularProgress,
 
} from "@mui/material";

import RecommendationsPanel from "../components/page_Mainapp/RecommendationsPanel";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";

import AdditionalPriceSection, {
  type AdditionalPriceField,
  type AdditionalToggleField,
} from "../components/page_Mainapp/AdditionalPriceSection";

import {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useReducer,
  startTransition,
  type ChangeEvent,
  type MouseEvent,
} from "react";
import { FormHelperText } from "@mui/material";

import { useExpiryDates } from "../hooks/useExpiryDates";
import { useStockAutocomplete } from "../hooks/useStockAutocomplete";
import {
  UNDERLYING_STUDIES,
  getRecentStudies,
} from "../assets/UnderlyingStudy";
import type { StudyOption } from "../assets/UnderlyingStudy";
import PriceSection, {
  type MainPriceField,
} from "../components/page_Mainapp/PriceSection";
import axios from "axios";
import RemarksField from "../components/page_Mainapp/RemarksField";


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


const FLAT_STUDY_OPTIONS = UNDERLYING_STUDIES.flatMap((g) =>
  g.options.map((opt) => ({
    ...opt,
    group: g.group,
  }))
);



const NewRecommendation = () => {
    const [raDetails, setRaDetails] = useState<any>(null);


const fetchRAMessageProfile = async () => {
  try {
    const token = localStorage.getItem("token");

    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/research/ra/message-profile`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setRaDetails(res.data.data);
  } catch (error) {
    console.error("Failed to fetch RA message profile:", error);
  }
};

  const getMissingFields = () => {
  const missing: string[] = [];

  if (!inputValue.trim()) missing.push("Script Name/Symbol");
  if (!form.action) missing.push("Action");
  if (!form.exchangeType) missing.push("Exchange Type");
  if (!form.exchange) missing.push("Market Type");
  if (!form.callType) missing.push("Call Type");
  if (!form.tradeType) missing.push("Trade Type");

  if (!form.entry) missing.push("Entry");
  if (!form.target) missing.push("Target");
  if (!form.stopLoss) missing.push("Stop Loss");

  if (form.callType !== "Cash" && !form.expiry) {
    missing.push("Expiry");
  }

  if (!form.rationale?.trim()) missing.push("Rationale");
  if (!form.underlyingStudy.length) missing.push("Underlying Study");

  if (form.rangeEnabled) {
    if (!form.entryLow) missing.push("Lower Entry");
    if (!form.entryUpper) missing.push("Upper Entry");
  }

  if (form.secondaryTargetEnabled) {
    if (!form.target2) missing.push("Target 2");
    if (!form.target3) missing.push("Target 3");
  }

  if (form.stopLoss2Enabled) {
    if (!form.stopLoss2) missing.push("Stop Loss 2");
    if (!form.stopLoss3) missing.push("Stop Loss 3");
  }

  return missing;
};

  //console.log("RENDER");
  const [underlyingStudyInput, setUnderlyingStudyInput] = useState("");
  const [recentStudyOptions, setRecentStudyOptions] = useState<StudyOption[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isErrataMode, setIsErrataMode] = useState(false);
  const [errataSourceId, setErrataSourceId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [isSubmitting, setIsSubmitting] = useState(false);

const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
const [versionHistory, setVersionHistory] = useState<any[]>([]);
const [historyLoading, setHistoryLoading] = useState(false);


const submittingRef = useRef(false);


const handleFileChange = (
  event: ChangeEvent<HTMLInputElement>
) =>  {
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
    underlyingStudy: StudyOption[];
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
    underlyingStudy: [],
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

  // Reset uploaded media
  setSelectedFile(null);

  if (fileInputRef.current) {
    fileInputRef.current.value = "";
  }
};


const handleSubmit = async () => {
  if (submittingRef.current) return;

  submittingRef.current = true;
  setIsSubmitting(true);

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login again");
      return;
    }

    if (!raDetails) {
      alert("RA profile details are still loading. Please try again.");
      return;
    }

    const finalDisplayName =
      suggestion &&
      suggestion
        .toLowerCase()
        .startsWith(inputValue.trim().toLowerCase())
        ? suggestion.trim()
        : inputValue.trim();

    if (!finalDisplayName) {
      alert("Stock name is required");
      return;
    }

    const formatExpiry = (date: string) => {
      const d = new Date(date);
      const day = d.getDate();

      const suffix =
        day % 10 === 1 && day !== 11
          ? "st"
          : day % 10 === 2 && day !== 12
            ? "nd"
            : day % 10 === 3 && day !== 13
              ? "rd"
              : "th";

      return `${day}${suffix} ${d.toLocaleString("en-IN", {
        month: "long",
        year: "numeric",
      })}`;
    };

    const raFullName = [
      raDetails?.salutation,
      raDetails?.first_name,
      raDetails?.middle_name,
      raDetails?.surname,
    ]
      .filter(Boolean)
      .join(" ");

    const disclaimer =
      raDetails?.additional_comments ||
      "Investment in securities market are subject to market risks. Read all related documents carefully before investing.";

    /*
     * =========================================================
     * ERRATA FLOW
     * =========================================================
     */
    if (isErrataMode) {
      if (!errataSourceId) {
        alert("Original research call ID is missing");
        return;
      }

      const trimmedRemark = form.remark.trim();

      if (!trimmedRemark) {
        alert("Research Analyst Remark is required for Errata");
        return;
      }

      const updates = {
        entry_price: form.entry || undefined,

        entry_price_low: form.rangeEnabled
          ? form.entryLow || undefined
          : undefined,

        entry_price_upper: form.rangeEnabled
          ? form.entryUpper || undefined
          : undefined,

        target_price: form.target || undefined,

        target_price_2: form.secondaryTargetEnabled
          ? form.target2 || undefined
          : undefined,

        target_price_3: form.secondaryTargetEnabled
          ? form.target3 || undefined
          : undefined,

        stop_loss: form.stopLoss || undefined,

        stop_loss_2: form.stopLoss2Enabled
          ? form.stopLoss2 || undefined
          : undefined,

        stop_loss_3: form.stopLoss2Enabled
          ? form.stopLoss3 || undefined
          : undefined,

        holding_period: form.holdingPeriod || undefined,
        rationale: form.rationale || undefined,

        underlying_study:
          form.underlyingStudy
            .map((study) => study.label)
            .join(", ") || undefined,

        research_remarks: trimmedRemark,
      };

      const errataMessage = `
ERRATA / CORRECTION

Published On: ${new Date().toLocaleString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })}

Stock Name: ${finalDisplayName}

${form.action} ${form.exchange} ${form.callType} Expiry: ${
        form.expiry ? formatExpiry(form.expiry) : "N/A"
      }

Call Type: ${form.tradeType}

Entry: ${
        form.rangeEnabled
          ? `${form.entryLow} - ${form.entryUpper}`
          : form.entry
      }

Target: ${form.target}${
        form.secondaryTargetEnabled
          ? `
T2: ${form.target2}
T3: ${form.target3}`
          : ""
      }

SL: ${form.stopLoss}${
        form.stopLoss2Enabled
          ? `
SL 2: ${form.stopLoss2}
SL 3: ${form.stopLoss3}`
          : ""
      }

Reason:
${trimmedRemark}

DISCLAIMER CUM DISCLOSURE:

${disclaimer}

Research Analyst: ${raFullName || "N/A"} (${
        raDetails?.org_name || "N/A"
      })
SEBI Registration No: ${raDetails?.sebi_reg_no || "N/A"}
Contact No: ${raDetails?.mobile || "N/A"}
Email ID: ${raDetails?.email || "N/A"}

Read Full Disclaimer / Disclosure at:
https://lotusfunds.com/disclaimer&disclosure
`.trim();

      const errataResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/research/calls/errata`,
        {
          call_id: errataSourceId,
          updates,
          errata_reason: trimmedRemark,
          message_text: errataMessage,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("ERRATA API RESPONSE:", errataResponse.data);

      try {
        const telegramStatus = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/telegram/status`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!telegramStatus.data?.connected) {
          alert("Errata created, but Telegram is not connected");

          await fetchRecommendations();
          resetForm();
          return;
        }

        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/telegram/send-ra-message`,
          {
            message: errataMessage,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        alert("Errata Created ✅");
      } catch (telegramError: any) {
        console.error(
          "ERRATA TELEGRAM ERROR:",
          telegramError?.response?.data || telegramError
        );

        alert("Errata created, but Telegram sending failed");
      }

      await fetchRecommendations();
      resetForm();

      return;
    }

    /*
     * =========================================================
     * NORMAL PUBLISH FLOW
     * =========================================================
     */

    const publishMessage = `
Published On: ${new Date().toLocaleString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })}

${form.action} ${form.exchange} ${form.callType} Expiry: ${
      form.expiry ? formatExpiry(form.expiry) : "N/A"
    }

Stock Name: ${finalDisplayName}

Call Type: ${form.tradeType}

Entry: ${
      form.rangeEnabled
        ? `${form.entryLow} - ${form.entryUpper}`
        : form.entry
    }

Target: ${form.target}${
      form.secondaryTargetEnabled
        ? `
T2: ${form.target2}
T3: ${form.target3}`
        : ""
    }

SL: ${form.stopLoss}${
      form.stopLoss2Enabled
        ? `
SL 2: ${form.stopLoss2}
SL 3: ${form.stopLoss3}`
        : ""
    }

Holding Period: ${form.holdingPeriod || "N/A"}

Rationale: ${form.rationale}

Underlying Study: ${
      form.underlyingStudy
        .map((study) => study.label)
        .join(", ") || "N/A"
    }

Remarks: ${form.remark || "N/A"}

DISCLAIMER CUM DISCLOSURE:

${disclaimer}

Research Analyst: ${raFullName || "N/A"} (${
      raDetails?.org_name || "N/A"
    })
SEBI Registration No: ${raDetails?.sebi_reg_no || "N/A"}
Contact No: ${raDetails?.mobile || "N/A"}
Email ID: ${raDetails?.email || "N/A"}

Read Full Disclaimer / Disclosure at:
https://lotusfunds.com/disclaimer&disclosure
`.trim();

    const payload = {
      status: "PUBLISHED",
      message_text: publishMessage,

      exchange_type: form.exchangeType,
      market_type: form.exchange,

      symbol:
        form.symbol && form.symbol !== "SYM"
          ? form.symbol
          : finalDisplayName.slice(0, 30),

      display_name: finalDisplayName,
      action: form.action,
      call_type: form.callType,
      trade_type: form.tradeType,
      expiry_date: form.expiry || null,

      entry_price: form.entry || null,

      entry_price_low: form.rangeEnabled
        ? form.entryLow || null
        : null,

      entry_price_upper: form.rangeEnabled
        ? form.entryUpper || null
        : null,

      target_price: form.target || null,

      target_price_2: form.secondaryTargetEnabled
        ? form.target2 || null
        : null,

      target_price_3: form.secondaryTargetEnabled
        ? form.target3 || null
        : null,

      stop_loss: form.stopLoss || null,

      stop_loss_2: form.stopLoss2Enabled
        ? form.stopLoss2 || null
        : null,

      stop_loss_3: form.stopLoss2Enabled
        ? form.stopLoss3 || null
        : null,

      holding_period: form.holdingPeriod || null,
      rationale: form.rationale || null,

      underlying_study:
        form.underlyingStudy
          .map((study) => study.label)
          .join(", ") || null,

      is_algo: false,
      has_vested_interest: false,
      research_remarks: form.remark.trim() || null,
    };

    const formData = new FormData();

    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    Object.entries(payload).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });

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

    try {
      const telegramStatus = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/telegram/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!telegramStatus.data?.connected) {
        alert("Research call created, but Telegram is not connected");

        await fetchRecommendations();
        resetForm();
        return;
      }

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/telegram/send-ra-message`,
        {
          message: publishMessage,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (telegramError: any) {
      console.error(
        "PUBLISH TELEGRAM ERROR:",
        telegramError?.response?.data || telegramError
      );

      alert("Research call created, but Telegram sending failed");

      await fetchRecommendations();
      resetForm();
      return;
    }

    await fetchRecommendations();
    resetForm();

    alert("Research Call Created ✅");
  } catch (err: any) {
    console.error(
      "SUBMIT ERROR:",
      err?.response?.data || err
    );

    alert(
      err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error submitting call"
    );
  } finally {
    submittingRef.current = false;
    setIsSubmitting(false);
  }
};






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
  newValue: StudyOption[]
) => {
  dispatch({
    type: "SET_FIELD",
    field: "underlyingStudy",
    value: newValue,
  });

  if (!newValue.length) return;

  setRecentStudyOptions((prev) => {
    const existingValues = prev.map((p) => p.value);

    const selectedValues = newValue.map((v) => v.value);

    const mergedValues = [
      ...selectedValues,
      ...existingValues.filter((v) => !selectedValues.includes(v)),
    ].slice(0, 10);

    window.localStorage.setItem(
      "recentUnderlyingStudies",
      JSON.stringify(mergedValues)
    );

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
    fetchRAMessageProfile();

  }, []);


  const formatIndianDateTime = (
    value: string | Date
  ) => {
    const date = new Date(value);
  
    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }
  
    return date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };
  
  const formatExpiryDate = (
    value?: string | null
  ) => {
    if (!value) return "N/A";
  
    const date = new Date(value);
  
    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }
  
    return date.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // 1. EXIT FUNCTION (Removes the item from the list)

const handleExit = useCallback(
  async (
    item: any,
    exitPrice: number,
    exitRemark: string
  ) => {
     const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Please login again");
  }

  if (!raDetails) {
    throw new Error("RA message profile is still loading");
  }

  if (!Number.isFinite(exitPrice) || exitPrice <= 0) {
    throw new Error("Please enter a valid exit price");
  }

  const trimmedExitRemark = exitRemark.trim();

  if (!trimmedExitRemark) {
    throw new Error("Exit remark is required");
  }

  const entryPrice = Number(
    item.entry?.ideal ??
      item.entry_price ??
      item.entry?.low ??
      item.entry_price_low
  );

  if (!Number.isFinite(entryPrice) || entryPrice <= 0) {
    throw new Error("Original entry price is not available");
  }

  const action = String(item.action || "").toUpperCase();

  if (action !== "BUY" && action !== "SELL") {
    throw new Error("Invalid recommendation action");
  }

  const pnl =
    action === "SELL"
      ? entryPrice - exitPrice
      : exitPrice - entryPrice;


  const formattedPnl =
    pnl > 0
      ? `Profit ${pnl.toFixed(2)}`
      : pnl < 0
        ? `Loss ${Math.abs(pnl).toFixed(2)}`
        : "No Profit / No Loss";

  const stockName =
    item.display_name ||
    item.name ||
    item.symbol ||
    "N/A";

  const marketType =
    item.instrument ||
    item.market_type ||
    "STOCK";

  const callType = item.call_type || "Cash";

  const disclaimer =
    item.disclaimer_snapshot ||
    raDetails.additional_comments ||
    "Investment in securities market are subject to market risks. Read all related documents carefully before investing.";

  const raFullName =
    raDetails.full_name ||
    [
      raDetails.salutation,
      raDetails.first_name,
      raDetails.middle_name,
      raDetails.surname,
    ]
      .filter(Boolean)
      .join(" ") ||
    "N/A";

  const organizationName =
    raDetails.org_name || "Lotus Funds";



const exitHeader 
  = "EXIT Recommendation";

  const exitMessage = `
  ${exitHeader}
Exit Message Published On : ${formatIndianDateTime(new Date())}

EXIT ${marketType} ${callType} Expiry: ${formatExpiryDate(
  item.expiry_date
)}

Stock Name: ${stockName}

Call Type : Exit

Exit Price : ${exitPrice}

Entry Price : ${entryPrice}

PnL : ${formattedPnl}

Recommendation Published On : ${formatIndianDateTime(
    item.created_at
  )}

Remarks: ${trimmedExitRemark}

DISCLAIMER CUM DISCLOSURE:

${disclaimer}

Research Analyst: ${raFullName} (${organizationName})
SEBI Registration No: ${raDetails.sebi_reg_no || "N/A"}
Contact No: ${raDetails.mobile || "N/A"}
Email ID: ${raDetails.email || "N/A"}

Read Full Disclaimer / Disclosure at:
https://lotusfunds.com/disclaimer&disclosure
`.trim();

  const response = await axios.patch(
    `${import.meta.env.VITE_API_URL}/api/research/calls/${item.id}/exit`,
    {
      exit_price: exitPrice,
      exit_remark: trimmedExitRemark,
      message_text: exitMessage,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  setRecommendations((previous) =>
    previous.map((recommendation) =>
      recommendation.id === item.id
        ? {
            ...recommendation,
            status: "CLOSED",
            exit_price: exitPrice,
            exit_remark: trimmedExitRemark,
            closed_at:
              response.data?.data?.closed_at ||
              response.data?.closed_at ||
              new Date().toISOString(),
          }
        : recommendation
    )
  );

  try {
    const telegramStatus = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/telegram/status`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!telegramStatus.data?.connected) {
      alert(
        "Research call exited and WhatsApp queued, but Telegram is not connected"
      );
      return;
    }

    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/telegram/send-ra-message`,
      {
        message: exitMessage,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    alert(
      "Research call exited. WhatsApp queued and Telegram sending started ✅"
    );
  } catch (telegramError: any) {
    console.error(
      "EXIT TELEGRAM ERROR:",
      telegramError?.response?.data || telegramError
    );

    alert(
      telegramError?.response?.data?.message ||
        "Research call exited and WhatsApp queued, but Telegram sending failed"
    );
  }
  },
  [raDetails]
);


const handleViewHistory = useCallback(async (item: any) => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login again");
      return;
    }

    setHistoryDialogOpen(true);
    setHistoryLoading(true);
    setVersionHistory([]);

    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/research/calls/${item.id}/versions`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setVersionHistory(res.data?.versions || []);
  } catch (err: any) {
    console.error(
      "VERSION HISTORY ERROR:",
      err?.response?.data || err
    );

    alert(
      err?.response?.data?.message ||
        "Failed to load version history"
    );

    setHistoryDialogOpen(false);
  } finally {
    setHistoryLoading(false);
  }
}, []);


      const handleActionChange = useCallback(
  (_: React.MouseEvent<HTMLElement>, value: "BUY" | "SELL" | null) => {
    if (!value) return;

    const nextTradeType =
      value === "BUY" && form.tradeType === "STBT"
        ? "BTST"
        : value === "SELL" && form.tradeType === "BTST"
          ? "STBT"
          : form.tradeType;

    dispatch({
      type: "SET_FORM",
      payload: {
        action: value,
        tradeType: nextTradeType,
      },
    });
  },
  [form.tradeType]
);


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
 remark: "",
       underlyingStudy: item.underlying_study
  ? item.underlying_study.split(",").map((study: string) => ({
      label: study.trim(),
      value: study.trim().toLowerCase().replace(/\s+/g, "_"),
    }))
  : [],
      };

      dispatch({ type: "SET_FORM", payload: formUpdate });
      setIsErrataMode(true);
      setErrataSourceId(item.id);
      setDirectValue(item.name || item.symbol || "");
    });

    window.scrollTo({ top: 0 });
  }, [setDirectValue]);
  // Temporary
  const [wasValidated, setWasValidated] = useState(false);


const validateAndPublish = async (
  event: MouseEvent<HTMLButtonElement>
) => {
  event.preventDefault();

  if (isSubmitting) return;

  setWasValidated(true);

  const missingFields = getMissingFields();

if (missingFields.length > 0) {
  alert(`Please fill required fields:\n\n${missingFields.join(", ")}`);
  return;
}

 const priceErr =
  getPriceError("entry", form) ||
  getPriceError("target", form) ||
  getPriceError("stopLoss", form) ||
  getPriceError("entryLow", form) ||
  getPriceError("entryUpper", form) ||
  getPriceError("target2", form) ||
  getPriceError("target3", form) ||
  getPriceError("stopLoss2", form) ||
  getPriceError("stopLoss3", form);


  if (priceErr) {
    const priceRow = document.getElementById("prices-row");
    if (priceRow) {
      priceRow.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return;
  }

  await handleSubmit();
  setWasValidated(false);
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
        underlyingStudy: [
  {
    label: "RSI + Volume Confirmation",
    value: "rsi_volume",
  },
],
          rangeEnabled: true,
          secondaryTargetEnabled: true,
          stopLoss2Enabled: true,
          remark: "Strong breakout with volume confirmation.",
        }
      });
      setDirectValue("A.F. Enterprises Ltd");
      console.log("Form Populated ✅");
    };
  },
  [setDirectValue]
);




  //instiate
// const handleInitiate = useCallback(async (item: any) => {
//   try {
//     const token = localStorage.getItem("token");

//     if (!token) {
//       alert("Please login again");
//       return;
//     }

//     const telegramStatus = await axios.get(
//       `${import.meta.env.VITE_API_URL}/api/telegram/status`,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );

//     if (!telegramStatus.data.connected) {
//       alert("Please connect Telegram first");
//       return;
//     }



//       const getEntry = () => {
//       if (!item.entry) return "-";

//       if (item.entry.low && item.entry.high) {
//         return `${item.entry.low} - ${item.entry.high}`;
//       }

//       return item.entry.ideal || "-";
//     };

//      const formatExpiry = (date: string) => {
//   const d = new Date(date);

//   const day = d.getDate();
//   const suffix =
//     day % 10 === 1 && day !== 11
//       ? "st"
//       : day % 10 === 2 && day !== 12
//       ? "nd"
//       : day % 10 === 3 && day !== 13
//       ? "rd"
//       : "th";

//   return `${day}${suffix} ${d.toLocaleString("en-IN", {
//     month: "long",
//     year: "numeric",
//   })}`;
// };



// const raFullName = [
//   raDetails?.salutation,
//   raDetails?.first_name,
//   raDetails?.middle_name,
//   raDetails?.surname,
// ]
//   .filter(Boolean)
//   .join(" ");

// const disclaimer =
//   raDetails?.additional_comments ||
//   "Investment in securities market are subject to market risks. Read all related documents carefully before investing.";


//    const publishMessage = `
// Published On : ${new Date().toLocaleString("en-IN", {
//   day: "numeric",
//   month: "long",
//   year: "numeric",
//   hour: "numeric",
//   minute: "2-digit",
//   second: "2-digit",
//   hour12: true,
// })}

// ${item.action || "N/A"} ${item.exchange || "N/A"} ${item.call_type || "N/A"} Expiry: ${
//   item.expiry_date ? formatExpiry(item.expiry_date) : "N/A"
// }

// Stock Name: ${item.name || item.symbol || "N/A"}

// Call Type  : ${item.trade_type || "N/A"}

// Entry  : ${getEntry()}

// Target  : ${item.targets?.[0] || "-"}${
//   item.targets?.[1] || item.targets?.[2]
//     ? `
// T2  : ${item.targets?.[1] || "-"}
// T3  : ${item.targets?.[2] || "-"}`
//     : ""
// }

// SL  : ${item.stop_losses?.[0] || "-"}${
//   item.stop_losses?.[1] || item.stop_losses?.[2]
//     ? `
// SL 2  : ${item.stop_losses?.[1] || "-"}
// SL 3  : ${item.stop_losses?.[2] || "-"}`
//     : ""
// }

// Holding Period: ${item.holding_period || "N/A"}

// Rationale: ${item.rationale || "N/A"}
// Underlying Study: ${item.underlying_study || "N/A"}
// Remarks: ${item.remarks || "N/A"}

// DISCLAIMER CUM DISCLOSURE:

// ${disclaimer}

// Research Analyst: ${raFullName || "N/A"} (${raDetails?.org_name || "N/A"})
// SEBI Registration No: ${raDetails?.sebi_reg_no || "N/A"}
// Contact No: ${raDetails?.mobile || "N/A"}
// Email ID: ${raDetails?.email || "N/A"}

// Read Full Disclaimer / Disclosure at:
// https://lotusfunds.com/disclaimer&disclosure
// `.trim();



//    await axios.patch(
//   `${import.meta.env.VITE_API_URL}/api/research/calls/${item.id}/publish`,
//   {
//     message_text: publishMessage,
//   },
//   {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   }
// );

//     setRecommendations((prev) =>
//       prev.map((rec) =>
//         rec.id === item.id
//           ? { ...rec, status: "PUBLISHED" }
//           : rec
//       )
//     );

  

//     console.log("TELEGRAM MESSAGE:", publishMessage);

    

//     await axios.post(
//       `${import.meta.env.VITE_API_URL}/api/telegram/send-ra-message`,
//       {
//         message: publishMessage,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );

//     alert("Call initiated successfully ✅");
//   } catch (err: any) {
//     console.error(err);

//     alert(
//       err?.response?.data?.message ||
//       "Something went wrong"
//     );
//   }
// }, [raDetails]);



// const handleTrack = async () => {
//       if (submittingRef.current) return;

//   submittingRef.current = true;
//   setIsSubmitting(true);
//   try {
//     const token = localStorage.getItem("token");

//     if (!token) {
//       alert("Please login again");
//       return;
//     }
//     const missingFields = getMissingFields();

// if (missingFields.length > 0) {
//   alert(`Please fill required fields:\n\n${missingFields.join(", ")}`);
//   return;
// }

//     const finalDisplayName = (
//       typeof suggestion === "string"
//         ? suggestion
//         : (suggestion as any)?.display_name ?? inputValue
//     ).trim();


//         const priceErr =
//   getPriceError("entry", form) ||
//   getPriceError("target", form) ||
//   getPriceError("stopLoss", form) ||
//   getPriceError("entryLow", form) ||
//   getPriceError("entryUpper", form) ||
//   getPriceError("target2", form) ||
//   getPriceError("target3", form) ||
//   getPriceError("stopLoss2", form) ||
//   getPriceError("stopLoss3", form);

// if (priceErr) {
//   const priceRow = document.getElementById("prices-row");

//   if (priceRow) {
//     priceRow.scrollIntoView({
//       behavior: "smooth",
//       block: "center",
//     });
//   }

//   return;
// }

//     // 🔹 Base payload
//     const payload = {
//       status: "DRAFT",

//       exchange_type: form.exchangeType,
//       market_type: form.exchange,
//       symbol: form.symbol || finalDisplayName,
//       display_name: finalDisplayName,

//       action: form.action,
//       call_type: form.callType,
//       trade_type: form.tradeType,
//       expiry_date: form.expiry || null,

//       // 🔹 Entry
//       entry_price: form.entry || null,
//       entry_price_low: form.rangeEnabled ? form.entryLow || null : null,
//       entry_price_upper: form.rangeEnabled ? form.entryUpper || null : null,

//       // 🔹 Targets
//       target_price: form.target || null,
//       target_price_2: form.secondaryTargetEnabled
//         ? form.target2 || null
//         : null,
//       target_price_3: form.secondaryTargetEnabled
//         ? form.target3 || null
//         : null,

//       // 🔹 Stop Loss
//       stop_loss: form.stopLoss || null,
//       stop_loss_2: form.stopLoss2Enabled
//         ? form.stopLoss2 || null
//         : null,
//       stop_loss_3: form.stopLoss2Enabled
//         ? form.stopLoss3 || null
//         : null,

//       // ⚠️ FIXED KEY
//       holding_period: form.holdingPeriod || null,

//       rationale: form.rationale,
//       underlying_study: form.underlyingStudy.map((s) => s.label).join(", ") || null,

//       is_algo: false,
//       has_vested_interest: false,
//       research_remarks: form.remark || null,
//     };

//     // =========================================================
//     // ✅ CONVERT TO FORMDATA
//     // =========================================================
//     const formData = new FormData();

//     // 🔹 attach file if exists
//     if (selectedFile) {
//       formData.append("file", selectedFile);
//     }

//     // 🔹 append all fields
//     Object.entries(payload).forEach(([key, value]) => {
//       if (value !== null && value !== undefined) {
//         formData.append(key, value as any);
//       }
//     });

//     console.log("TRACK FORM DATA READY");

//     // =========================================================
//     // ✅ API CALL
//     // =========================================================
//     await axios.post(
//       `${import.meta.env.VITE_API_URL}/api/research/calls`,
//       formData,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "multipart/form-data",
//         },
//       }
//     );
//     await fetchRecommendations();

//     // Optional reset
//      resetForm();

//     alert("Draft Saved ✅");

//     // 🔥 Refresh list
    

//  } catch (err: any) {
//   console.error("Track failed:", err?.response?.data || err);

//   alert(
//     err?.response?.data?.message ||
//       err?.response?.data?.error ||
//       "Track failed"
//   );
// }finally {
//     submittingRef.current = false;
//     setIsSubmitting(false);
//   }
  
// };

const handleInitiate = useCallback(
  async (item: any) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login again");
        return;
      }

      if (!raDetails) {
        alert("RA message profile is not loaded");
        return;
      }

      const telegramStatus = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/telegram/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!telegramStatus.data.connected) {
        alert("Please connect Telegram first");
        return;
      }

      const getEntry = () => {
        if (!item.entry) return "-";

        if (item.entry.low && item.entry.high) {
          return `${item.entry.low} - ${item.entry.high}`;
        }

        return item.entry.ideal || "-";
      };

      const formatExpiry = (date: string) => {
        const d = new Date(date);
        const day = d.getDate();

        const suffix =
          day % 10 === 1 && day !== 11
            ? "st"
            : day % 10 === 2 && day !== 12
            ? "nd"
            : day % 10 === 3 && day !== 13
            ? "rd"
            : "th";

        return `${day}${suffix} ${d.toLocaleString("en-IN", {
          month: "long",
          year: "numeric",
        })}`;
      };

      const raFullName = [
        raDetails.salutation,
        raDetails.first_name,
        raDetails.middle_name,
        raDetails.surname,
      ]
        .filter(Boolean)
        .join(" ");

      const disclaimer =
        raDetails.additional_comments ||
        "Investment in securities market are subject to market risks. Read all related documents carefully before investing.";

      const publishMessage = `
Published On : ${new Date().toLocaleString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })}

${item.action || "N/A"} ${item.exchange || "N/A"} ${
        item.call_type || "N/A"
      } Expiry: ${
        item.expiry_date
          ? formatExpiry(item.expiry_date)
          : "N/A"
      }

Stock Name: ${item.name || item.symbol || "N/A"}

Call Type: ${item.trade_type || "N/A"}

Entry: ${getEntry()}

Target: ${item.targets?.[0] || "-"}${
        item.targets?.[1] || item.targets?.[2]
          ? `
T2: ${item.targets?.[1] || "-"}
T3: ${item.targets?.[2] || "-"}`
          : ""
      }

SL: ${item.stop_losses?.[0] || "-"}${
        item.stop_losses?.[1] || item.stop_losses?.[2]
          ? `
SL 2: ${item.stop_losses?.[1] || "-"}
SL 3: ${item.stop_losses?.[2] || "-"}`
          : ""
      }

Holding Period: ${item.holding_period || "N/A"}

Rationale: ${item.rationale || "N/A"}
Underlying Study: ${item.underlying_study || "N/A"}
Remarks: ${item.remarks || "N/A"}

DISCLAIMER CUM DISCLOSURE:

${disclaimer}

Research Analyst: ${raFullName || "N/A"} (${
        raDetails.org_name || "N/A"
      })
SEBI Registration No: ${raDetails.sebi_reg_no || "N/A"}
Contact No: ${raDetails.mobile || "N/A"}
Email ID: ${raDetails.email || "N/A"}

Read Full Disclaimer / Disclosure at:
https://lotusfunds.com/disclaimer&disclosure
`.trim();

      console.log("FINAL PUBLISH MESSAGE:", publishMessage);

      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/research/calls/${item.id}/publish`,
        {
          message_text: publishMessage,
        },
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

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/telegram/send-ra-message`,
        {
          message: publishMessage,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Call initiated successfully ✅");
    } catch (err: any) {
      console.error(
        "Initiate failed:",
        err?.response?.data || err
      );

      alert(
        err?.response?.data?.message ||
          "Something went wrong"
      );
    }
  },
  [raDetails]
);


const handleTrack = async () => {
  if (submittingRef.current) return;

  submittingRef.current = true;
  setIsSubmitting(true);

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login again");
      return;
    }

    const missingFields = getMissingFields();

    if (missingFields.length > 0) {
      alert(
        `Please fill required fields:\n\n${missingFields.join(", ")}`
      );
      return;
    }

    /*
     * suggestion and inputValue are strings from useStockAutocomplete.
     * Use the completed suggestion when it matches the typed text.
     * Otherwise use exactly what the user typed.
     */
    

    const priceErr =
      getPriceError("entry", form) ||
      getPriceError("target", form) ||
      getPriceError("stopLoss", form) ||
      getPriceError("entryLow", form) ||
      getPriceError("entryUpper", form) ||
      getPriceError("target2", form) ||
      getPriceError("target3", form) ||
      getPriceError("stopLoss2", form) ||
      getPriceError("stopLoss3", form);

    if (priceErr) {
      const priceRow = document.getElementById("prices-row");

      if (priceRow) {
        priceRow.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }

      return;
    }

    const underlyingStudy = Array.isArray(form.underlyingStudy)
      ? form.underlyingStudy
          .map((study) => study.label)
          .filter(Boolean)
          .join(", ")
      : "";

    /*
     * Do not use form.symbol here because its initial value is "SYM".
     * Until the autocomplete hook returns a separate symbol field,
     * use the selected/displayed stock name for both fields.
     */

    const finalDisplayName =
  suggestion &&
  suggestion.toLowerCase().startsWith(inputValue.trim().toLowerCase())
    ? suggestion.trim()
    : inputValue.trim();

if (!finalDisplayName) {
  alert("Stock name is required");
  return;
}

const finalSymbol = String(
  form.symbol && form.symbol !== "SYM"
    ? form.symbol
    : finalDisplayName
)
  .trim()
  .slice(0, 30);

    const payload = {
      status: "DRAFT",

      exchange_type: form.exchangeType,
      market_type: form.exchange,

     symbol: finalSymbol.slice(0, 30),
  display_name: finalDisplayName,

      action: form.action,
      call_type: form.callType,
      trade_type: form.tradeType,
      expiry_date: form.expiry || null,

      entry_price: form.entry || null,

      entry_price_low: form.rangeEnabled
        ? form.entryLow || null
        : null,

      entry_price_upper: form.rangeEnabled
        ? form.entryUpper || null
        : null,

      target_price: form.target || null,

      target_price_2: form.secondaryTargetEnabled
        ? form.target2 || null
        : null,

      target_price_3: form.secondaryTargetEnabled
        ? form.target3 || null
        : null,

      stop_loss: form.stopLoss || null,

      stop_loss_2: form.stopLoss2Enabled
        ? form.stopLoss2 || null
        : null,

      stop_loss_3: form.stopLoss2Enabled
        ? form.stopLoss3 || null
        : null,

      holding_period: form.holdingPeriod || null,
      rationale: form.rationale || null,
      underlying_study: underlyingStudy || null,

      is_algo: false,
      has_vested_interest: false,

      research_remarks: form.remark || null,
    };

    console.log("TRACK PAYLOAD:", payload);

    const formData = new FormData();

    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    Object.entries(payload).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });

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

    await fetchRecommendations();

    resetForm();

    alert("Draft Saved ✅");
  } catch (err: any) {
    console.error(
      "Track failed:",
      err?.response?.data || err
    );

    alert(
      err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Track failed"
    );
  } finally {
    submittingRef.current = false;
    setIsSubmitting(false);
  }
};




 

const validateAndTrack = (event: MouseEvent<HTMLButtonElement>) => {
  event.preventDefault();
  setWasValidated(true);

 const priceErr =
  getPriceError("entry", form) ||
  getPriceError("target", form) ||
  getPriceError("stopLoss", form) ||
  getPriceError("entryLow", form) ||
  getPriceError("entryUpper", form) ||
  getPriceError("target2", form) ||
  getPriceError("target3", form) ||
  getPriceError("stopLoss2", form) ||
  getPriceError("stopLoss3", form);

  if (priceErr) {
    const priceRow = document.getElementById("prices-row");
    if (priceRow) {
      priceRow.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return;
  }

  handleTrack();
};

  // Add this helper function outside or inside your component
const getPriceError = (field: string, currentForm: any): string | null => {
  const action = currentForm.action;

  const entry = parseFloat(currentForm.entry) || 0;
  const target = parseFloat(currentForm.target) || 0;
  const stopLoss = parseFloat(currentForm.stopLoss) || 0;

  const entryLow = parseFloat(currentForm.entryLow) || 0;
  const entryUpper = parseFloat(currentForm.entryUpper) || 0;

  const target2 = parseFloat(currentForm.target2) || 0;
  const target3 = parseFloat(currentForm.target3) || 0;

  const stopLoss2 = parseFloat(currentForm.stopLoss2) || 0;
  const stopLoss3 = parseFloat(currentForm.stopLoss3) || 0;

  // RANGE: Lower Entry < Upper Entry
  if (
    currentForm.rangeEnabled &&
    (field === "entryLow" || field === "entryUpper") &&
    entryLow &&
    entryUpper &&
    entryLow >= entryUpper
  ) {
    return "Lower Entry must be less than Upper Entry";
  }

  // BUY LOGIC
  if (action === "BUY") {
    // Entry < Target
    if (field === "target" && entry && target && target <= entry) {
      return "Target must be greater than Entry";
    }

    // Entry > Stop Loss
    if (field === "stopLoss" && entry && stopLoss && stopLoss >= entry) {
      return "Stop Loss must be less than Entry";
    }

    // Entry < Target < T2 < T3
    if (
      currentForm.secondaryTargetEnabled &&
      (field === "target" || field === "target2" || field === "target3") &&
      entry &&
      target &&
      target2 &&
      target3 &&
      !(entry < target && target < target2 && target2 < target3)
    ) {
      return "For BUY: Entry < Target < T2 < T3";
    }

    // Entry > SL > SL2 > SL3
    if (
      currentForm.stopLoss2Enabled &&
      (field === "stopLoss" || field === "stopLoss2" || field === "stopLoss3") &&
      entry &&
      stopLoss &&
      stopLoss2 &&
      stopLoss3 &&
      !(entry > stopLoss && stopLoss > stopLoss2 && stopLoss2 > stopLoss3)
    ) {
      return "For BUY: Entry > SL > SL2 > SL3";
    }
  }

  // SELL LOGIC
  if (action === "SELL") {
    // Entry > Target
    if (field === "target" && entry && target && target >= entry) {
      return "Target must be less than Entry";
    }

    // Entry < Stop Loss
    if (field === "stopLoss" && entry && stopLoss && stopLoss <= entry) {
      return "Stop Loss must be greater than Entry";
    }

    // Entry > Target > T2 > T3
    if (
      currentForm.secondaryTargetEnabled &&
      (field === "target" || field === "target2" || field === "target3") &&
      entry &&
      target &&
      target2 &&
      target3 &&
      !(entry > target && target > target2 && target2 > target3)
    ) {
      return "For SELL: Entry > Target > T2 > T3";
    }

    // Entry < SL < SL2 < SL3
    if (
      currentForm.stopLoss2Enabled &&
      (field === "stopLoss" || field === "stopLoss2" || field === "stopLoss3") &&
      entry &&
      stopLoss &&
      stopLoss2 &&
      stopLoss3 &&
      !(entry < stopLoss && stopLoss < stopLoss2 && stopLoss2 < stopLoss3)
    ) {
      return "For SELL: Entry < SL < SL2 < SL3";
    }
  }

  return null;
};


const commitMainPrice = useCallback(
  (
    field: MainPriceField,
    value: string
  ) => {
    dispatch({
      type: "SET_FIELD",
      field,
      value,
    });
  },
  []
);

const getMainPriceError = useCallback(
  (
    field: MainPriceField,
    values: {
      entry: string;
      target: string;
      stopLoss: string;
    }
  ) => {
    return getPriceError(field, {
      ...form,
      ...values,
    });
  },
  [
    form.action,
    form.rangeEnabled,
    form.entryLow,
    form.entryUpper,
    form.secondaryTargetEnabled,
    form.target2,
    form.target3,
    form.stopLoss2Enabled,
    form.stopLoss2,
    form.stopLoss3,
  ]
);

const commitRemark = useCallback(
  (value: string) => {
    dispatch({
      type: "SET_FIELD",
      field: "remark",
      value,
    });
  },
  []
);

const commitAdditionalPrice = useCallback(
  (
    field: AdditionalPriceField,
    value: string
  ) => {
    dispatch({
      type: "SET_FIELD",
      field,
      value,
    });
  },
  []
);
const toggleAdditionalSection = useCallback(
  (field: AdditionalToggleField) => {
    const nextValue =
      field === "rangeEnabled"
        ? !form.rangeEnabled
        : field === "secondaryTargetEnabled"
          ? !form.secondaryTargetEnabled
          : !form.stopLoss2Enabled;

    dispatch({
      type: "SET_FIELD",
      field,
      value: nextValue,
    });
  },
  [
    form.rangeEnabled,
    form.secondaryTargetEnabled,
    form.stopLoss2Enabled,
  ]
);

const getAdditionalPriceError = useCallback(
  (
    field: AdditionalPriceField,
    values: Record<
      AdditionalPriceField,
      string
    >
  ) => {
    return getPriceError(field, {
      ...form,
      ...values,
    });
  },
  [
    form.action,
    form.entry,
    form.target,
    form.stopLoss,
    form.rangeEnabled,
    form.secondaryTargetEnabled,
    form.stopLoss2Enabled,
  ]
);


const selectedStudyValues = useMemo(
  () =>
    form.underlyingStudy.map((selected) => ({
      ...selected,
      group:
        UNDERLYING_STUDIES.find((group) =>
          group.options.some(
            (option) => option.value === selected.value
          )
        )?.group ?? "Fundamental & General Analysis",
    })),
  [form.underlyingStudy]
);

const updateField = useCallback(
  <K extends keyof RecommendationForm>(
    field: K,
    value: RecommendationForm[K]
  ) => {
    dispatch({
      type: "SET_FIELD",
      field,
      value,
    });
  },
  []
);

const additionalPriceValues = useMemo(
  () => ({
    entryLow: form.entryLow,
    entryUpper: form.entryUpper,
    target2: form.target2,
    target3: form.target3,
    stopLoss2: form.stopLoss2,
    stopLoss3: form.stopLoss3,
  }),
  [
    form.entryLow,
    form.entryUpper,
    form.target2,
    form.target3,
    form.stopLoss2,
    form.stopLoss3,
  ]
);

const additionalPriceToggles = useMemo(
  () => ({
    rangeEnabled: form.rangeEnabled,
    secondaryTargetEnabled: form.secondaryTargetEnabled,
    stopLoss2Enabled: form.stopLoss2Enabled,
  }),
  [
    form.rangeEnabled,
    form.secondaryTargetEnabled,
    form.stopLoss2Enabled,
  ]
);

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
        <Box
  sx={{
    display: "flex",
    flexDirection: {
      xs: "column", // phone
      sm: "row",    // tablet & laptop
    },
    alignItems: {
      xs: "stretch",
      sm: "center",
    },
    justifyContent: "space-between",
    gap: {
      xs: 1,
      sm: 0,
    },
    mb: 1,
  }}
>

          <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: { xs: "0.9rem", sm: "1.1rem" } }}>
            New Recommendation
          </Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={form.exchangeType}
           onChange={(_, value) => {
  if (value) {
    updateField("exchangeType", value);
  }
}}
           sx={{
  width: {
    xs: "100%", // phone
    sm: "auto", // tablet & laptop unchanged
  },
  backgroundColor: "#eef2f7",

  "& .MuiToggleButtonGroup-grouped": {
    border: "none",
    px: 1.5,
    py: 0.5,
    fontSize: "0.7rem",
    fontWeight: 700,

    flex: {
      xs: 1,      // phone: NSE and BSE take equal width
      sm: "unset" // laptop stays exactly as it is now
    },

    "&.Mui-selected": {
      backgroundColor: "#4f6bed",
      color: "#fff",
    },
  },
}}
          >
            <ToggleButton value="NSE">NSE</ToggleButton>
            <ToggleButton value="BSE">BSE</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Action & Call Type Row */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 1 }}>
          <Box
  sx={{
    display: "flex",
    flexDirection: {
      xs: "column",
      sm: "row",
    },
    alignItems: {
      xs: "stretch",
      sm: "center",
    },
    justifyContent: "space-between",
    gap: 1,
  }}
>
<ToggleButtonGroup
  size="small"
  exclusive
  value={form.action}
  onChange={handleActionChange}
  sx={{
    width: {
      xs: "100%",
      sm: "auto",
    },

    "& .MuiToggleButtonGroup-grouped": {
      flex: {
        xs: 1,
        sm: "unset",
      },
    },
  }}
>
              <ToggleButton value="BUY" sx={{ fontWeight: 700, px: 2, fontSize: "0.7rem", ...getActionStyles(form.action, "BUY") }}>BUY</ToggleButton>
              <ToggleButton value="SELL" sx={{ fontWeight: 700, px: 2, fontSize: "0.7rem", ...getActionStyles(form.action, "SELL") }}>SELL</ToggleButton>
            </ToggleButtonGroup>

            <Box
  sx={{
    width: {
      xs: "100%",
      sm: "auto",
    },
    overflowX: {
      xs: "auto",
      sm: "visible",
    },
    "&::-webkit-scrollbar": {
      display: "none",
    },
    scrollbarWidth: "none",
  }}
>
              <ToggleButtonGroup
                size="small" exclusive value={form.callType} onChange={(_, value) => {
  if (value) {
    updateField("callType", value);
  }
}}
              sx={{
  backgroundColor: "#eef2f7",

  display: {
    xs: "inline-flex",
    sm: "flex",
  },

  width: {
    xs: "max-content",
    sm: "auto",
  },

  whiteSpace: "nowrap",

  "& .MuiToggleButtonGroup-grouped": {
    border: "none",

    flex: {
      xs: "0 0 auto",
      sm: 1,
    },

    minWidth: {
      xs: 95,
      sm: 0,
    },

    px: 1.5,
    py: 0.8,

    fontSize: "0.65rem",
    fontWeight: 700,

    "&.Mui-selected": {
      backgroundColor: "#4f6bed",
      color: "#fff",
    },
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
            onChange={(_, value) => {
  if (value) {
    updateField("exchange", value);
  }
}}
sx={{
  width: {
    xs: "100%",
    md: "auto",
  },

  backgroundColor: "#eef2f7",

  "& .MuiToggleButtonGroup-grouped": {
    border: "none",

    flex: {
      xs: 1,
      md: "unset",
    },

    px: 1.5,
    py: 0.8,

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
          <Box sx={{
  width: {
    xs: "100%",
    md: "auto",
  },

  overflowX: {
    xs: "auto",
    md: "visible",
  },

  "&::-webkit-scrollbar": {
    display: "none",
  },

  scrollbarWidth: "none",
}}>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={form.tradeType}
              onChange={(_, value) => {
  if (value) {
    updateField("tradeType", value);
  }
}}
              sx={{
  backgroundColor: "#eef2f7",

  display: {
    xs: "inline-flex",
    md: "flex",
  },

  width: {
    xs: "max-content",
    md: "100%",
  },

  borderRadius: 1.5,

  "& .MuiToggleButtonGroup-grouped": {
    border: "none",

    flex: {
      xs: "0 0 auto",
      md: 1,
    },

    minWidth: {
      xs: 95,
      md: 0,
    },

    px: 2,
    py: 0.8,

    fontSize: {
      xs: "0.68rem",
      md: "0.7rem",
    },

    fontWeight: 700,
    whiteSpace: "nowrap",
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
             <ToggleButton
  value="BTST"
  disabled={form.action === "SELL"}
>
  BTST
</ToggleButton>

<ToggleButton
  value="STBT"
  disabled={form.action === "BUY"}
>
  STBT
</ToggleButton>
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
        <Box
  sx={{
    display: "flex",
    flexDirection: { xs: "column", sm: "row" }, // mobile = column, desktop = row
    gap: 1,
    mb: 1,
    width: "100%",
  }}
>
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
<PriceSection
  values={{
    entry: form.entry,
    target: form.target,
    stopLoss: form.stopLoss,
  }}
  wasValidated={wasValidated}
  onCommit={commitMainPrice}
  getError={getMainPriceError}
/>

        {/* Switched Options Row */}
  <AdditionalPriceSection
   values={additionalPriceValues}
  toggles={additionalPriceToggles}
  wasValidated={wasValidated}
  onToggle={toggleAdditionalSection}
  onCommit={commitAdditionalPrice}
  getError={getAdditionalPriceError}
/>

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
                onChange={(_, value) => {
  if (value) {
    updateField("rationale", value);
  }
}}
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
<Autocomplete<StudyAutocompleteOption, true, false, false>
  multiple
  disableCloseOnSelect
  size="small"
  fullWidth
  options={studyOptions}
 value={selectedStudyValues}
  inputValue={underlyingStudyInput}
  onInputChange={(_, newInput) => setUnderlyingStudyInput(newInput)}
  onChange={handleUnderlyingStudyChange}
  getOptionLabel={(option) => option.label}
  groupBy={(option) => option.group}
  isOptionEqualToValue={(option, value) => option.value === value.value}
  renderOption={(props, option, { selected }) => (
    <li {...props}>
      <Checkbox
        size="small"
        checked={selected}
        sx={{ mr: 1 }}
      />
      {option.label}
    </li>
  )}
  renderInput={(params) => (
    <TextField
      required
      {...params}
      placeholder={
        form.underlyingStudy.length
          ? ""
          : "Select one or more underlying studies"
      }
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
/>
        </Box>

        {/* Remarks & Upload */}
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5, mb: 2 }}>
        <Box
  sx={{
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  }}
>
  <RemarksField
    value={form.remark}
    onCommit={commitRemark}
  />

  {isErrataMode && (
    <Typography
      sx={{
        fontSize: "0.65rem",
        color: "text.secondary",
        mt: 0.5,
      }}
    >
      This remark is required and will be saved as the Errata reason.
    </Typography>
  )}
</Box>

<Box
  sx={{
    display: "flex",
    flexDirection: "column",
    gap: 1,
    minWidth: { xs: "100%", sm: 180 },
  }}
>
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
    flexDirection: {
      xs: "column", // Phone
      sm: "row",    // Tablet & Laptop
    },
    gap: 1.5,
    mt: 2,
    width: "100%",
    justifyContent: "flex-start",
  }}
>
   <Button
  type="button"
  disabled={isSubmitting}
  variant="contained"
  onClick={validateAndPublish}
 sx={{
  fontWeight: 700,
  px: 4,
  width: {
    xs: "100%",
    sm: "auto",
  },
}}
>
  {isSubmitting
    ? isErrataMode
      ? "Creating Errata..."
      : "Publishing..."
    : isErrataMode
      ? "Create Errata"
      : "Publish Call"}
</Button>

<Button
  type="button"
  disabled={isSubmitting || isErrataMode}
  variant="outlined"
  onClick={validateAndTrack}
  sx={{
    width: {
      xs: "100%",
      sm: "auto",
    },
  }}
>
  {isSubmitting ? "Saving Draft..." : "Track"}
</Button>


<Button
  type="button"
  variant="outlined"
  disabled={isSubmitting}
  onClick={resetForm}
  sx={{
    width: {
      xs: "100%",
      sm: "auto",
    },
  }}
>
  Reset
</Button>



        </Box>

      </Paper>

 <RecommendationsPanel
  loading={loading}
  recommendations={recommendations}
  onModify={handleModify}
  onExit={handleExit}
  onInitiate={handleInitiate}
  onViewHistory={handleViewHistory}
/>
      {/* RIGHT PANEL */}

     <Dialog
  open={historyDialogOpen}
  onClose={() => setHistoryDialogOpen(false)}
  fullWidth
  maxWidth="sm"
>
  <DialogTitle>
    Recommendation Version History
  </DialogTitle>

  <DialogContent dividers>
    {historyLoading ? (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          py: 4,
        }}
      >
        <CircularProgress size={28} />
      </Box>
    ) : versionHistory.length === 0 ? (
      <Typography color="text.secondary">
        No version history found.
      </Typography>
    ) : (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {versionHistory.map((version) => (
          <Paper
            key={version.id}
            variant="outlined"
            sx={{
              p: 2,
              borderColor: version.is_latest
                ? "primary.main"
                : "divider",
              backgroundColor: version.is_latest
                ? "action.hover"
                : "background.paper",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 1,
                mb: 1,
              }}
            >
              <Typography fontWeight={700}>
                Version {version.version_number}
              </Typography>

              <Box sx={{ display: "flex", gap: 1 }}>
                <Chip
                  size="small"
                  label={version.version_type}
                  color={
                    version.version_type === "ERRATA"
                      ? "warning"
                      : "default"
                  }
                />

                {version.is_latest && (
                  <Chip
                    size="small"
                    label="Latest"
                    color="primary"
                  />
                )}
              </Box>
            </Box>

            <Typography variant="body2">
              <strong>Stock:</strong>{" "}
              {version.display_name || version.symbol || "N/A"}
            </Typography>

            <Typography variant="body2">
              <strong>Action:</strong> {version.action || "N/A"}
            </Typography>

            <Typography variant="body2">
              <strong>Entry:</strong>{" "}
              {version.entry_price ||
                (version.entry_price_low &&
                version.entry_price_upper
                  ? `${version.entry_price_low} - ${version.entry_price_upper}`
                  : "N/A")}
            </Typography>

            <Typography variant="body2">
              <strong>Target:</strong>{" "}
              {version.target_price || "N/A"}
            </Typography>

            <Typography variant="body2">
              <strong>Stop Loss:</strong>{" "}
              {version.stop_loss || "N/A"}
            </Typography>

            <Typography variant="body2">
              <strong>Status:</strong>{" "}
              {version.status || "N/A"}
            </Typography>

            {version.errata_reason && (
              <>
                <Divider sx={{ my: 1 }} />

                <Typography variant="body2">
                  <strong>Errata Reason:</strong>{" "}
                  {version.errata_reason}
                </Typography>
              </>
            )}

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1 }}
            >
              Created:{" "}
              {new Date(version.created_at).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
              })}
            </Typography>
          </Paper>
        ))}
      </Box>
    )}
  </DialogContent>

<DialogActions>
  <Button onClick={() => setHistoryDialogOpen(false)}>
    Close
  </Button>
</DialogActions>
</Dialog> 

      </Box>
  );
};

export default NewRecommendation;