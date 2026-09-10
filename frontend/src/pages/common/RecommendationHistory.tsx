import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  Stack,
  Snackbar,
  Alert,
  Dialog,
DialogTitle,
DialogContent,
DialogActions,
TextField,
} from "@mui/material";
import LoadingPage from "../../common/LoadingPage";


import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import TuneIcon from "@mui/icons-material/Tune";

import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TableExportMenu from "../../components/common/TableExportMenu";
import {
  formatExportDate,
  type TableExportColumn,
} from "../../utils/tableExport.utils";

interface HistoryRecord {
  dateTime: string;
  action: string;
  exchange: string;
  type: string;
  category: string;
  instrument: string;
  symbol: string;
  expiry: string | null;
  entry: number | string;
  exit_price: number | string;
  status: string;
  profitLoss: number;
  researcherName?: string;
  researcher?: string;
  researcher_name?: string;
  createdBy?: string;
  created_by?: string;
  username?: string;
  version_type?: string;

}

interface ApiHistoryRecord {
  date_time?: string;
  action?: string;
  exchange?: string;
  type?: string;
  category?: string;
  instrument?: string;
  symbol?: string;
  expiry?: string | null;
  entry?: number | string;
  exit_price?: number | string;
  status?: string;
  profit_loss?: number | null;
  researcher_name?: string;
  expiry_date?: string | null;
  version_type?: string;
   researcherName?: string;
}

// Added Prop Interface
interface RecommendationHistoryProps {
  statusFilter?: string;
  enableAddNotification?: boolean;
  searchQuery?: string;
  showAllRAs?: boolean;
  enableExport?: boolean;
  exportFileBaseName?: string;
  actionFilter?: string;
fromDate?: string;
toDate?: string;
sortBy?: string;
}

const CLIENT_HISTORY_STORAGE_KEY = "clientRecommendationHistory";
const CLIENT_HISTORY_EVENT = "client-recommendation-history-added";
const CLIENT_HISTORY_PENDING_NOTIFICATION_KEY = "clientHistoryPendingNotification";

export default function RecommendationHistory({
  statusFilter = "ALL",
  enableAddNotification = false,
  searchQuery = "",
  showAllRAs = false,
  enableExport = false,
  exportFileBaseName = "ra-recommendation-history",

  actionFilter = "ALL",
  fromDate = "",
  toDate = "",
  sortBy = "latest",
}: RecommendationHistoryProps) {
  const mapApiRowToHistory = (row: ApiHistoryRecord): HistoryRecord => ({
    dateTime: row.date_time || "",
    action: row.action || "-",
    exchange: row.exchange || "-",
    type: row.type || "-",
    category: row.category || "-",
    instrument: row.instrument || "-",
    symbol: row.symbol || "-",
    expiry: row.expiry || row.expiry_date || null,
    entry: row.entry ?? "-",
    exit_price: row.exit_price ?? "-",
      version_type: row.version_type,
    status: row.status || "-",
    profitLoss: Number(row.profit_loss ?? 0),
    researcher_name: row.researcher_name,

    researcherName: row.researcherName,
  });

  // State
  const [data, setData] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationText, setNotificationText] = useState("New recommendation added to history.");
  const [filterData, setFilterData] = useState<HistoryRecord[]>([]);
  const [allResearchers, setAllResearchers] = useState<string[]>([]);

  // Filters
  const [dateFilter, setDateFilter] = useState("All");
  const [typesOfCall, settypesOfCall] = useState("All");
  const [outcomeFilter, setOutcomeFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedActionFilter, setSelectedActionFilter] = useState("ALL");
  
  //Advance Filters
  const [advancedFilterOpen, setAdvancedFilterOpen] = useState(false);

  const [advancedExchange, setAdvancedExchange] = useState("All");
const [advancedCategory, setAdvancedCategory] = useState("All");
const [advancedInstrument, setAdvancedInstrument] = useState("");
const [advancedSymbol, setAdvancedSymbol] = useState("");
const [advancedStatus, setAdvancedStatus] = useState("All");
const [advancedResearcher, setAdvancedResearcher] = useState("");
const [advancedVersionType, setAdvancedVersionType] = useState("All");

const [minProfitLoss, setMinProfitLoss] = useState("");
const [maxProfitLoss, setMaxProfitLoss] = useState("");

const [minEntry, setMinEntry] = useState("");
const [maxEntry, setMaxEntry] = useState("");

const [minExit, setMinExit] = useState("");
const [maxExit, setMaxExit] = useState("");

const [advancedSortBy, setAdvancedSortBy] = useState("latest");

const [advancedDateField, setAdvancedDateField] =
  useState<"published" | "expiry">("published");

const [advancedFromDate, setAdvancedFromDate] = useState<Dayjs | null>(null);
const [advancedToDate, setAdvancedToDate] = useState<Dayjs | null>(null);


const getResearcherName = (row: HistoryRecord) => {
  return (
    row.researcherName ||
    row.researcher ||
    row.researcher_name ||
    row.createdBy ||
    row.created_by ||
    row.username ||
    "-"
  );
};
// ================= ADVANCED FILTER OPTIONS =================

const exchangeOptions = useMemo(
  () =>
    [...new Set(
      filterData
        .map((item) => item.exchange)
        .filter(
          (value) => value && value !== "-"
        )
    )].sort(),
  [filterData]
);

const typeOptions = useMemo(
  () =>
    [...new Set(
      filterData
        .map((item) => item.type)
        .filter(
          (value) => value && value !== "-"
        )
    )].sort(),
  [filterData]
);

const categoryOptions = useMemo(
  () =>
    [...new Set(
      filterData
        .map((item) => item.category)
        .filter(
          (value) => value && value !== "-"
        )
    )].sort(),
  [filterData]
);

const instrumentOptions = useMemo(
  () =>
    [...new Set(
      filterData
        .map((item) => item.instrument)
        .filter(
          (value) => value && value !== "-"
        )
    )].sort(),
  [filterData]
);

const symbolOptions = useMemo(() => {
  const filtered =
    !advancedInstrument
      ? data
      : data.filter(
          (item) =>
            item.instrument === advancedInstrument
        );

  return [...new Set(
    filtered
      .map((item) => item.symbol)
      .filter(
        (value) => value && value !== "-"
      )
  )].sort();
}, [data, advancedInstrument]);


const researcherOptions = useMemo(
  () => allResearchers,
  [allResearchers]
);

const statusOptions = useMemo(
  () =>
    [...new Set(
      filterData
        .map((item) => item.status)
        .filter(
          (value) => value && value !== "-"
        )
    )].sort(),
  [filterData]
);

const versionTypeOptions = useMemo(
  () =>
    [...new Set(
      filterData
        .map((item) => item.version_type)
        .filter(
          (value) => value && value !== "-"
        )
    )].sort(),
  [filterData]
);

  // Pagination
const [page, setPage] = useState(1);
const rowsPerPage = 10;
  


const [dateFieldFilter, setDateFieldFilter] = useState<"published" | "expiry">("published");
const [customFromDate, setCustomFromDate] = useState<Dayjs | null>(null);
const [customToDate, setCustomToDate] = useState<Dayjs | null>(null);
const [customDateOpen, setCustomDateOpen] = useState(false);

  // Fetch data
  useEffect(() => {
    const fetchHistory = async () => {
      let localHistory: HistoryRecord[] = [];
      
      try {
        const stored = window.localStorage.getItem(CLIENT_HISTORY_STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : [];
        localHistory = Array.isArray(parsed) ? parsed : [];
      } catch {
        localHistory = [];
      }

      try {
        const token = window.localStorage.getItem("token");

        if (!token) {
          throw new Error("No auth token found");
        }

     const historyPath = showAllRAs ? "/api/history/all" : "/api/history/my";
  const params = new URLSearchParams({
  page: String(page),
  limit: "10",
});

const res = await fetch(
  `${import.meta.env.VITE_API_URL}${historyPath}?${params.toString()}`,
  {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  }
);

        if (!res.ok) {
          throw new Error(`Performance API failed with status ${res.status}`);
        }

        const apiRows = await res.json();
        const mappedRows = Array.isArray(apiRows)
          ? apiRows.map((row) => mapApiRowToHistory(row))
          : [];

        setData([...localHistory, ...mappedRows]);
      } catch (apiErr) {
        console.error("Error fetching performance history API:", apiErr);

        try {
          const res = await fetch("/recommendationHistory.json");
          const json = await res.json();
          const fetchedHistory = json.recommendationHistory || [];
          setData([...localHistory, ...fetchedHistory]);
        } catch (jsonErr) {
          console.error("Error fetching fallback recommendation history:", jsonErr);
          setData(localHistory);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [page, searchQuery, showAllRAs]);

useEffect(() => {
  const fetchAllResearchers = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) return;

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/researchers`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error(
          `Researchers API failed with status ${res.status}`
        );
      }

      const rows = await res.json();

      if (!Array.isArray(rows)) {
        setAllResearchers([]);
        return;
      }

      const names = rows
        .map((row) =>
          String(
            row.name ||
            row.username ||
            row.email ||
            ""
          ).trim()
        )
        .filter(Boolean);

      setAllResearchers([...new Set(names)].sort());
    } catch (error) {
      console.error(
        "Error fetching all researchers:",
        error
      );
    }
  };

  fetchAllResearchers();
}, []);

  useEffect(() => {
  const fetchAllHistoryForFilters = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) return;

      const historyPath = showAllRAs
        ? "/api/history/all"
        : "/api/history/my";

      const allRows: HistoryRecord[] = [];

      let currentPage = 1;
      const limit = 100;

      while (true) {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(limit),
        });

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}${historyPath}?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error(
            `Filter data API failed with status ${res.status}`
          );
        }

        const apiRows = await res.json();

        if (!Array.isArray(apiRows) || apiRows.length === 0) {
          break;
        }

        const mappedRows = apiRows.map(
          (row: ApiHistoryRecord) =>
            mapApiRowToHistory(row)
        );

        allRows.push(...mappedRows);

        // If fewer records than the limit are returned,
        // this is the last page.
        if (apiRows.length < limit) {
          break;
        }

        currentPage++;
      }

      setFilterData(allRows);

      console.log(
        "Total records loaded for filters:",
        allRows.length
      );

    } catch (error) {
      console.error(
        "Error fetching all history for filters:",
        error
      );
    }
  };

  fetchAllHistoryForFilters();
}, [showAllRAs]);

  useEffect(() => {
  setPage(1);
}, [searchQuery]);

  useEffect(() => {
    if (!enableAddNotification) return;

    const handleHistoryAdded = (event: Event) => {
      const customEvent = event as CustomEvent<{
        historyRecord?: HistoryRecord;
        symbol?: string;
      }>;

      if (customEvent.detail?.historyRecord) {
        setData((prev) => [customEvent.detail.historyRecord as HistoryRecord, ...prev]);
      }

      const symbolText = customEvent.detail?.symbol
        ? ` (${customEvent.detail.symbol})`
        : "";
      setNotificationText(`New recommendation added to history${symbolText}.`);
      setNotificationOpen(true);
    };

    window.addEventListener(CLIENT_HISTORY_EVENT, handleHistoryAdded as EventListener);

    return () => {
      window.removeEventListener(CLIENT_HISTORY_EVENT, handleHistoryAdded as EventListener);
    };
  }, [enableAddNotification]);

  useEffect(() => {
    if (!enableAddNotification) return;

    const showPendingNotification = () => {
      try {
        const pendingSymbol = window.localStorage.getItem(CLIENT_HISTORY_PENDING_NOTIFICATION_KEY);
        if (pendingSymbol) {
          setNotificationText(`New recommendation added to history (${pendingSymbol}).`);
          setNotificationOpen(true);
          window.localStorage.removeItem(CLIENT_HISTORY_PENDING_NOTIFICATION_KEY);
        }
      } catch {
        // no-op
      }
    };

    const timerId = window.setTimeout(showPendingNotification, 50);
    return () => window.clearTimeout(timerId);
  }, [enableAddNotification]);

  // Apply filters
 const filteredData = useMemo(() => {
  let result = [...filterData];

 // ================= GLOBAL ADVANCED SEARCH =================
if (searchQuery.trim()) {
  const rawSearch = searchQuery.trim().toLowerCase();

  // Remove commas from search input
  const normalizedSearch = rawSearch
    .replace(/,/g, "")
    .replace(/\s+/g, " ");

  const normalizeValue = (value: unknown) => {
    if (value === null || value === undefined) return "";

    return String(value)
      .toLowerCase()
      .trim()
      .replace(/,/g, "")
      .replace(/\s+/g, " ");
  };

  result = result.filter((item) => {
    const searchableValues = [
      item.dateTime,
      item.action,
      item.exchange,
      item.type,
      item.category,
      item.instrument,
      item.symbol,
      item.expiry,

      // Numeric fields
      item.entry,
      item.exit_price,
      item.profitLoss,

      item.status,

      // Researcher fields
      item.researcherName,
      item.researcher,
      item.researcher_name,
      item.createdBy,
      item.created_by,
      item.username,

      // Version
      item.version_type,
    ];

    return searchableValues.some((value) => {
      const normalizedValue = normalizeValue(value);

      return normalizedValue.includes(normalizedSearch);
    });
  });
}
  // ================= OTHER FILTERS =================


    // --- CONDITION FOR DASHBOARD ---
if (statusFilter !== "ALL") {
  const normalizedStatusFilter = statusFilter.toLowerCase();

  if (normalizedStatusFilter === "active") {
    result = result.filter(
      (item) => item.status.toLowerCase() !== "closed"
    );
  } else {
    result = result.filter(
      (item) => item.status.toLowerCase() === normalizedStatusFilter
    );
  }
}

    if (typesOfCall !== "All") {
      result = result.filter((item) => item.type.toLowerCase() === typesOfCall);
    }
    if (categoryFilter !== "All") {
      result = result.filter((item) => item.category === categoryFilter);
    }
if (selectedActionFilter !== "ALL") {
  result = result.filter(
    (item) => item.action.toUpperCase() === selectedActionFilter
  );
}

// FROM DATE FILTER
if (fromDate) {
  result = result.filter((item) => {
    if (!item.dateTime) return false;

    const itemDate = dayjs(item.dateTime).format("YYYY-MM-DD");

    return itemDate >= fromDate;
  });
}
// TO DATE FILTER
if (toDate) {
  result = result.filter((item) => {
    if (!item.dateTime) return false;

    const itemDate = dayjs(item.dateTime).format("YYYY-MM-DD");

    return itemDate <= toDate;
  });
}
if (sortBy === "latest") {
  result.sort(
    (a, b) =>
      new Date(b.dateTime).getTime() -
      new Date(a.dateTime).getTime()
  );
}

if (sortBy === "oldest") {
  result.sort(
    (a, b) =>
      new Date(a.dateTime).getTime() -
      new Date(b.dateTime).getTime()
  );
}
    if (outcomeFilter !== "All") {
      result = result.filter((item) =>
        outcomeFilter === "Profit" ? item.profitLoss > 0 : item.profitLoss < 0
      );
    }
   if (dateFilter !== "All") {
  const today = dayjs().format("YYYY-MM-DD");

  result = result.filter((item) => {
    const rawDate =
      dateFieldFilter === "expiry" ? item.expiry : item.dateTime;

    if (!rawDate) return false;

    const itemDate = dayjs(rawDate).format("YYYY-MM-DD");

    if (dateFilter === "Today") {
      return itemDate === today;
    }

    if (dateFilter === "Last 7 Days") {
      const sevenDaysAgo = dayjs().subtract(7, "day").format("YYYY-MM-DD");
      return itemDate >= sevenDaysAgo && itemDate <= today;
    }

    if (dateFilter === "Custom") {
      if (!customFromDate || !customToDate) return true;

      const fromDate = customFromDate.format("YYYY-MM-DD");
      const toDate = customToDate.format("YYYY-MM-DD");

      return itemDate >= fromDate && itemDate <= toDate;
    }

    return true;
  });
}

// ================= ADVANCED FILTERS =================

// Exchange
if (advancedExchange !== "All") {
  result = result.filter(
    (item) =>
      item.exchange.toLowerCase() ===
      advancedExchange.toLowerCase()
  );
}

// Category
if (advancedCategory !== "All") {
  result = result.filter(
    (item) =>
      item.category.toLowerCase() ===
      advancedCategory.toLowerCase()
  );
}

// Instrument
if (advancedInstrument) {
  result = result.filter(
    (item) =>
      item.instrument.toLowerCase() ===
      advancedInstrument.toLowerCase()
  );
}

// Symbol
if (advancedSymbol) {
  result = result.filter(
    (item) =>
      item.symbol.toLowerCase() ===
      advancedSymbol.toLowerCase()
  );
}

// Status
if (advancedStatus !== "All") {
  result = result.filter(
    (item) =>
      item.status.toLowerCase() ===
      advancedStatus.toLowerCase()
  );
}

// Researcher
// Researcher
if (advancedResearcher) {
  const selectedResearcher = advancedResearcher
    .trim()
    .toLowerCase();

  result = result.filter(
    (item) =>
      getResearcherName(item)
        .trim()
        .toLowerCase() === selectedResearcher
  );
}

// Version Type
if (advancedVersionType !== "All") {
  result = result.filter(
    (item) =>
      (item.version_type || "")
        .toLowerCase() ===
      advancedVersionType.toLowerCase()
  );
}

// Minimum P/L
if (minProfitLoss !== "") {
  result = result.filter(
    (item) =>
      item.profitLoss >= Number(minProfitLoss)
  );
}

// Maximum P/L
if (maxProfitLoss !== "") {
  result = result.filter(
    (item) =>
      item.profitLoss <= Number(maxProfitLoss)
  );
}

// Minimum Entry
if (minEntry !== "") {
  result = result.filter(
    (item) =>
      Number(item.entry) >= Number(minEntry)
  );
}

// Maximum Entry
if (maxEntry !== "") {
  result = result.filter(
    (item) =>
      Number(item.entry) <= Number(maxEntry)
  );
}

// Minimum Exit
if (minExit !== "") {
  result = result.filter(
    (item) =>
      Number(item.exit_price) >= Number(minExit)
  );
}

// Maximum Exit
if (maxExit !== "") {
  result = result.filter(
    (item) =>
      Number(item.exit_price) <= Number(maxExit)
  );
}


// Advanced Date
if (advancedFromDate || advancedToDate) {
  result = result.filter((item) => {

    const rawDate =
      advancedDateField === "expiry"
        ? item.expiry
        : item.dateTime;

    if (!rawDate) return false;

    const itemDate = dayjs(rawDate);

    if (
      advancedFromDate &&
      itemDate.isBefore(
        advancedFromDate,
        "day"
      )
    ) {
      return false;
    }

    if (
      advancedToDate &&
      itemDate.isAfter(
        advancedToDate,
        "day"
      )
    ) {
      return false;
    }

    return true;
  });
}


// Advanced Sort
if (advancedSortBy === "latest") {
  result.sort(
    (a, b) =>
      new Date(b.dateTime).getTime() -
      new Date(a.dateTime).getTime()
  );
}

if (advancedSortBy === "oldest") {
  result.sort(
    (a, b) =>
      new Date(a.dateTime).getTime() -
      new Date(b.dateTime).getTime()
  );
}

if (advancedSortBy === "profitHigh") {
  result.sort(
    (a, b) =>
      b.profitLoss - a.profitLoss
  );
}

if (advancedSortBy === "profitLow") {
  result.sort(
    (a, b) =>
      a.profitLoss - b.profitLoss
  );
}

    return result;
}, [
  data,
  filterData,
  statusFilter,
  selectedActionFilter,
  searchQuery, 
  actionFilter,
  fromDate,
  toDate,
  sortBy,
  typesOfCall,
  categoryFilter,
  outcomeFilter,
  dateFilter,
  dateFieldFilter,
  customFromDate,
  customToDate,
   // Advanced filters
  advancedExchange,
  advancedCategory,
  advancedInstrument,
  advancedSymbol,
  advancedStatus,
  advancedResearcher,
  advancedVersionType,

  minProfitLoss,
  maxProfitLoss,

  minEntry,
  maxEntry,

  minExit,
  maxExit,

  advancedDateField,
  advancedFromDate,
  advancedToDate,

  advancedSortBy,
]);



const totalPages = Math.ceil(filteredData.length / rowsPerPage);

const hasNextPage = page < totalPages;

const paginatedData = filteredData.slice(
  (page - 1) * rowsPerPage,
  page * rowsPerPage
);

const handleReset = () => {
  setDateFilter("All");
  setDateFieldFilter("published");
  setCustomFromDate(null);
  setCustomToDate(null);
  setCustomDateOpen(false);
  settypesOfCall("All");
  setSelectedActionFilter("ALL");
  setOutcomeFilter("All");
  setCategoryFilter("All");

  // Advanced filters
  setAdvancedExchange("All");
  setAdvancedCategory("All");
  setAdvancedInstrument("");
  setAdvancedSymbol("");
  setAdvancedStatus("All");
  setAdvancedResearcher("");
  setAdvancedVersionType("All");

  setMinProfitLoss("");
  setMaxProfitLoss("");

  setMinEntry("");
  setMaxEntry("");

  setMinExit("");
  setMaxExit("");

  setAdvancedDateField("published");
  setAdvancedFromDate(null);
  setAdvancedToDate(null);

  setAdvancedSortBy("latest");

  setCustomDateOpen(false);
  setAdvancedFilterOpen(false);
  setPage(1);
};

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return (
      <Box>
        <Typography fontSize="0.75rem" color="text.secondary">
          {d.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })}
        </Typography>
        <Typography fontSize="0.75rem" color="text.secondary">
          {d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true })}
        </Typography>
      </Box>
    );
  };


  const historySelectStyle = {
    fontSize: "0.75rem",
    fontWeight: 500,
    minWidth: 140,
    px: 2,
    ".MuiSelect-select": { py: 1.5, pr: "32px !important" },
    "& .MuiSvgIcon-root": { right: 8 },
  };

  const historyHeadStyle = {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#666",
    backgroundColor: "#fff",
    borderBottom: "1px solid #F0F0F0",
    py: 2,
  };

  const historyBodyStyle = {
    fontSize: "0.75rem",
    py: 1.5,
    borderBottom: "1px solid #FAFAFA",
  };

  const historyPageButtonStyle = {
    border: "1px solid #E9E9EE",
    borderRadius: "4px",
    p: 0.5,
    "&:disabled": { opacity: 0.5 },
  };

  const exportColumns: TableExportColumn<HistoryRecord>[] = [
    {
      header: "Created Date",
      getValue: (row) => formatExportDate(row.dateTime),
    },
    { header: "Action", getValue: (row) => row.action },
    { header: "Exchange", getValue: (row) => row.exchange },
    { header: "Call Type", getValue: (row) => row.type },
    { header: "Category", getValue: (row) => row.category },
    {
      header: "Instrument",
      getValue: (row) => row.instrument,
    },
    { header: "Symbol", getValue: (row) => row.symbol },
    {
      header: "Expiry Date",
      getValue: (row) => formatExportDate(row.expiry),
    },
    {
      header: "Entry Price",
      getValue: (row) => row.entry,
    },
    {
      header: "Exit Price",
      getValue: (row) => row.exit_price,
    },
    { header: "Status", getValue: (row) => row.status },
    {
      header: "Profit/Loss",
      getValue: (row) => row.profitLoss,
    },
    {
      header: "Researcher Name",
      getValue: (row) => getResearcherName(row),
    },
  ];

  return (
    <Box sx={{ mt: 4 }}>
      <Paper
        sx={{
          p: 0,
          borderRadius: "0.25rem",
          border: "1px solid #E9E9EE",
          boxShadow: "none",
          overflow: "hidden",
        }}
      >
        {/* Header */}
       <Box
  sx={{
    display: "flex",
    flexDirection: { xs: "column", md: "row" }, // 🔥 key change
    alignItems: { xs: "flex-start", md: "center" },
    justifyContent: "space-between",
    gap: { xs: 2, md: 0 }, // spacing for mobile
    p: 2,
    borderBottom: "1px solid #F0F0F0",
  }}
>
          <Typography fontSize="1.25rem" fontWeight={700}>
           {statusFilter === "ACTIVE"
  ? "Active Recommendations"
  : "Recommendation History"}
          </Typography>

          {/* Condition: Only show Filters on Performance page */}
          {statusFilter === "ALL" && (
  <Box
    sx={{
      p: { xs: 0, md: 2 },
      backgroundColor: "#fff",
      width: "100%",
    }}
  >
    {/* FILTER CONTAINER */}
    <Box
      sx={{
        border: "1px solid #E9E9EE",
        borderRadius: "0.5rem",
        overflow: "hidden",
        width: { xs: "100%", md: "fit-content" },
        maxWidth: "100%",
        ml: { md: "auto" },
      }}
    >

      {/* FILTER TITLE */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 2,
          py: 1,
          backgroundColor: "#F8F9FA",
          borderBottom: "1px solid #E9E9EE",
        }}
      >
        <FilterAltOutlinedIcon
          sx={{
            fontSize: "1.1rem",
            color: "#666",
            mr: 1,
          }}
        />

        <Typography
          fontSize="0.75rem"
          color="#666"
          fontWeight={600}
        >
          Filter By
        </Typography>
      </Box>


      {/* QUICK FILTERS */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >

        {/* DATE */}
        <Box
          sx={{
            borderRight: "1px solid #E9E9EE",
            borderBottom: {
              xs: "1px solid #E9E9EE",
              md: "none",
            },
            flex: {
              xs: "1 1 50%",
              md: "0 0 auto",
            },
          }}
        >
          <Select
            value={dateFilter}
            onChange={(e) => {
              const value = e.target.value;

              setDateFilter(value);
              setPage(1);

              if (value === "Custom") {
                setCustomDateOpen(true);
              }
            }}
            displayEmpty
            size="small"
            variant="standard"
            disableUnderline
            sx={{
              ...historySelectStyle,
              width: "100%",
              minWidth: { md: "130px" },
            }}
          >
            <MenuItem value="All">Date</MenuItem>
            <MenuItem value="Today">Today</MenuItem>
            <MenuItem value="Last 7 Days">
              Last 7 Days
            </MenuItem>
            <MenuItem value="Custom">
              Custom
            </MenuItem>
          </Select>
        </Box>


        {/* TYPE OF CALL */}
        <Box
          sx={{
            borderRight: "1px solid #E9E9EE",
            borderBottom: {
              xs: "1px solid #E9E9EE",
              md: "none",
            },
            flex: {
              xs: "1 1 50%",
              md: "0 0 auto",
            },
          }}
        >
          <Select
            value={typesOfCall}
            onChange={(e) => {
              settypesOfCall(e.target.value);
              setPage(1);
            }}
            displayEmpty
            size="small"
            variant="standard"
            disableUnderline
            sx={{
              ...historySelectStyle,
              width: "100%",
              minWidth: { md: "150px" },
            }}
          >
            <MenuItem value="All">
              Type of Calls
            </MenuItem>

            <MenuItem value="cash">
              Cash
            </MenuItem>

            <MenuItem value="futures">
              Futures
            </MenuItem>

            <MenuItem value="options call">
              Options Call
            </MenuItem>

            <MenuItem value="options put">
              Options Put
            </MenuItem>
          </Select>
        </Box>


        {/* ACTION */}
        <Box
          sx={{
            borderRight: "1px solid #E9E9EE",
            flex: {
              xs: "1 1 50%",
              md: "0 0 auto",
            },
          }}
        >
          <Select
            value={selectedActionFilter}
            onChange={(e) => {
              setSelectedActionFilter(e.target.value);
              setPage(1);
            }}
            displayEmpty
            size="small"
            variant="standard"
            disableUnderline
            sx={{
              ...historySelectStyle,
              width: "100%",
              minWidth: { md: "120px" },
            }}
          >
            <MenuItem value="ALL">
              Action
            </MenuItem>

            <MenuItem value="BUY">
              BUY
            </MenuItem>

            <MenuItem value="SELL">
              SELL
            </MenuItem>
          </Select>
        </Box>


        {/* OUTCOME */}
        <Box
          sx={{
            borderRight: "1px solid #E9E9EE",
            flex: {
              xs: "1 1 50%",
              md: "0 0 auto",
            },
          }}
        >
          <Select
            value={outcomeFilter}
            onChange={(e) => {
              setOutcomeFilter(e.target.value);
              setPage(1);
            }}
            displayEmpty
            size="small"
            variant="standard"
            disableUnderline
            sx={{
              ...historySelectStyle,
              width: "100%",
              minWidth: { md: "120px" },
            }}
          >
            <MenuItem value="All">
              Outcome
            </MenuItem>

            <MenuItem value="Profit">
              Profit
            </MenuItem>

            <MenuItem value="Loss">
              Loss
            </MenuItem>
          </Select>
        </Box>


        {/* ADVANCED FILTER BUTTON */}
        <Button
          startIcon={<TuneIcon />}
          onClick={() => setAdvancedFilterOpen(true)}
          sx={{
            textTransform: "none",
            color: "#444",
            fontWeight: 600,
            fontSize: "0.75rem",
            px: 2,
            py: 1.5,
            whiteSpace: "nowrap",

            "&:hover": {
              backgroundColor: "#F8F9FA",
            },
          }}
        >
          Advanced Filters
        </Button>


        {/* RESET */}
        <Button
          startIcon={
            <RestartAltIcon
              sx={{ fontSize: "1rem" }}
            />
          }
          onClick={handleReset}
          sx={{
            textTransform: "none",
            color: "#ff4d4d",
            fontWeight: 600,
            fontSize: "0.75rem",
            px: 2,
            py: 1.5,
            whiteSpace: "nowrap",

            "&:hover": {
              backgroundColor:
                "rgba(255, 77, 77, 0.05)",
            },
          }}
        >
          Reset
        </Button>


        {/* EXPORT */}
        {enableExport && (
          <TableExportMenu
            rows={paginatedData}
            columns={exportColumns}
            fileBaseName={exportFileBaseName}
            printTitle="RA Recommendation History"
            loading={loading}
          />
        )}

      </Box>
    </Box>
  </Box>
)}
        </Box>

        {/* Table - Kept Exactly As You Had It */}
        <TableContainer>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={historyHeadStyle}>Date & Time</TableCell>
                <TableCell sx={historyHeadStyle}>Action</TableCell>
                <TableCell sx={historyHeadStyle}>Exchange</TableCell>
                <TableCell sx={historyHeadStyle}>Type</TableCell>
                <TableCell sx={historyHeadStyle}>Category</TableCell>
                <TableCell sx={historyHeadStyle}>Instrument</TableCell>
                <TableCell sx={historyHeadStyle}>Symbol</TableCell>
                <TableCell sx={historyHeadStyle}>Expiry</TableCell>
                <TableCell sx={historyHeadStyle}>Entry</TableCell>
                <TableCell sx={historyHeadStyle}>Exit</TableCell>
                <TableCell sx={historyHeadStyle}>STATUS</TableCell>
                <TableCell align="right" sx={historyHeadStyle}>Profit / Loss</TableCell>
                <TableCell sx={historyHeadStyle}>Researcher Name</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={13} align="center" sx={{ py: 4 }}>
                    <LoadingPage
                      title="Loading"
                      subtitle="Fetching recommendation history..."
                      fullScreen={false}
                      size={44}
                    />
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} align="center" sx={{ py: 4 }}>
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, idx) => (
                  <TableRow key={idx} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                    <TableCell sx={historyBodyStyle}>{formatDateTime(row.dateTime)}</TableCell>
                    <TableCell sx={historyBodyStyle}>
                      <Box
                        sx={{
                          display: "inline-block",
                          px: 1.5,
                          py: 0.5,
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          backgroundColor:
                            row.action.toUpperCase() === "BUY"
                              ? "#DCFCE7"
                              : row.action.toUpperCase() === "SELL"
                                ? "#FEE2E2"
                                : "#F3F4F6",
                          color:
                            row.action.toUpperCase() === "BUY"
                              ? "#166534"
                              : row.action.toUpperCase() === "SELL"
                                ? "#991B1B"
                                : "#374151",
                        }}
                      >
                        {row.action}
                      </Box>
                    </TableCell>
                    <TableCell sx={historyBodyStyle}>{row.exchange}</TableCell>
                    <TableCell sx={historyBodyStyle}>{row.type}</TableCell>
                    <TableCell sx={historyBodyStyle}>{row.category}</TableCell>
                    <TableCell sx={historyBodyStyle}>{row.instrument}</TableCell>
                    <TableCell sx={historyBodyStyle}>
                      <Typography fontWeight={600} fontSize="0.75rem">
                        {row.symbol}
                      </Typography>
                    </TableCell>
                    {/* <TableCell sx={historyBodyStyle}>{row.expiry || "-"}</TableCell> */}
                    <TableCell sx={historyBodyStyle}> {row.expiry ? new Date(row.expiry).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", }) : "-"} </TableCell>
                    
                    <TableCell sx={historyBodyStyle}>{row.entry}</TableCell>
                    <TableCell sx={historyBodyStyle}>{row.exit_price}</TableCell>
                    <TableCell sx={historyBodyStyle}>
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 0.5,
      flexWrap: "wrap",
    }}
  >
    <Box
      sx={{
        display: "inline-block",
        px: 1.5,
        py: 0.5,
        borderRadius: "4px",
        fontSize: "0.75rem",
        fontWeight: 700,
        textTransform: "capitalize",
        backgroundColor:
          row.status.toLowerCase() === "active"
            ? "#DCFCE7"
            : row.status.toLowerCase() === "published"
            ? "#DCFCE7"
            : row.status.toLowerCase() === "closed"
            ? "#FEF9C3"
            : "#F3F4F6",
        color:
          row.status.toLowerCase() === "active"
            ? "#166534"
            : row.status.toLowerCase() === "published"
            ? "#166534"
            : row.status.toLowerCase() === "closed"
            ? "#854D0E"
            : "#374151",
      }}
    >
      {row.status}
    </Box>

 {row.version_type?.toUpperCase() === "ERRATA" && (
  <Box
    sx={{
      display: "inline-block",
      px: 1,
      py: 0.5,
      borderRadius: "4px",
      fontSize: "0.7rem",
      fontWeight: 700,
      backgroundColor: "#f4d9a3",
      color: "#ea0909",
    }}
  >
    ERRATA
  </Box>
)}
  </Box>
</TableCell>
                    <TableCell align="right" sx={historyBodyStyle}>
                      <Box
                        sx={{
                          display: "inline-block",
                          backgroundColor: row.profitLoss >= 0 ? "#DCFCE7" : "#FEE2E2",
                          color: row.profitLoss >= 0 ? "#166534" : "#991B1B",
                          px: 1.5,
                          py: 0.5,
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                        }}
                      >
                        {row.profitLoss >= 0 ? `+ ${row.profitLoss.toLocaleString()}` : `- ${Math.abs(row.profitLoss).toLocaleString()}`}
                      </Box>
                    </TableCell>
                    <TableCell sx={historyBodyStyle}>{getResearcherName(row)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box
          display="flex"
          justifyContent="flex-end"
          alignItems="center"
          sx={{ p: 2, borderTop: "1px solid #F0F0F0", gap: 2 }}
        >
   <Typography fontSize="0.75rem" color="text.secondary">
  Page {page} of {totalPages || 1} • {filteredData.length} records
</Typography>
          <Stack direction="row" spacing={1}>
            <IconButton
              size="small"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              sx={historyPageButtonStyle}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              onClick={() => {
  if (hasNextPage) {
    setPage((p) => p + 1);
  }
}}
              disabled={!hasNextPage}
              sx={historyPageButtonStyle}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>
      </Paper>
<Dialog
  open={customDateOpen}
  onClose={() => setCustomDateOpen(false)}
  maxWidth="xs"
  fullWidth
>
  <DialogTitle>Custom Date Filter</DialogTitle>

  <DialogContent>
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
        <Select
          value={dateFieldFilter}
          onChange={(e) =>
            setDateFieldFilter(e.target.value as "published" | "expiry")
          }
          size="small"
          fullWidth
        >
          <MenuItem value="published">Published Date</MenuItem>
          <MenuItem value="expiry">Expiry Date</MenuItem>
        </Select>

        <DatePicker
          label="From Date"
          value={customFromDate}
          onChange={(newValue) => setCustomFromDate(newValue)}
          format="DD/MM/YYYY"
          slotProps={{
            textField: {
              size: "small",
              fullWidth: true,
            },
          }}
        />

        <DatePicker
          label="To Date"
          value={customToDate}
          onChange={(newValue) => setCustomToDate(newValue)}
          format="DD/MM/YYYY"
          minDate={customFromDate || undefined}
          slotProps={{
            textField: {
              size: "small",
              fullWidth: true,
            },
          }}
        />
      </Box>
    </LocalizationProvider>
  </DialogContent>

  

  <DialogActions>
    
    <Button
      onClick={() => {
        setDateFilter("All");
        setCustomFromDate(null);
        setCustomToDate(null);
        setCustomDateOpen(false);
      }}
    >
      Clear
    </Button>

    <Button onClick={() => setCustomDateOpen(false)}>
      Cancel
    </Button>

    <Button
      variant="contained"
      onClick={() => {
        setDateFilter("Custom");
        setPage(1);
        setCustomDateOpen(false);
      }}
      disabled={!customFromDate || !customToDate}
    >
      Apply
    </Button>
  </DialogActions>
</Dialog>
<Dialog
  open={advancedFilterOpen}
  onClose={() => setAdvancedFilterOpen(false)}
  maxWidth="md"
  fullWidth
>
  <DialogTitle>
    Advanced Filters
  </DialogTitle>

  <DialogContent dividers>
    <LocalizationProvider dateAdapter={AdapterDayjs}>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
          },
          gap: 2,
          mt: 1,
        }}
      >

        {/* DATE FIELD */}
        <Select
          value={advancedDateField}
          onChange={(e) =>
            setAdvancedDateField(
              e.target.value as "published" | "expiry"
            )
          }
          size="small"
          fullWidth
        >
          <MenuItem value="published">
            Published Date
          </MenuItem>

          <MenuItem value="expiry">
            Expiry Date
          </MenuItem>
        </Select>


        {/* FROM DATE */}
        <DatePicker
          label="From Date"
          value={advancedFromDate}
          onChange={(value) =>
            setAdvancedFromDate(value)
          }
          format="DD/MM/YYYY"
          slotProps={{
            textField: {
              size: "small",
              fullWidth: true,
            },
          }}
        />


        {/* TO DATE */}
        <DatePicker
          label="To Date"
          value={advancedToDate}
          onChange={(value) =>
            setAdvancedToDate(value)
          }
          minDate={
            advancedFromDate || undefined
          }
          format="DD/MM/YYYY"
          slotProps={{
            textField: {
              size: "small",
              fullWidth: true,
            },
          }}
        />


        {/* EXCHANGE */}
        <Select
  value={advancedExchange}
  onChange={(e) => {
    setAdvancedExchange(e.target.value);
    setPage(1);
  }}
          size="small"
          fullWidth
        >
          <MenuItem value="All">
            Exchange
          </MenuItem>

          <MenuItem value="NSE">
            NSE
          </MenuItem>

          <MenuItem value="BSE">
            BSE
          </MenuItem>
        </Select>


        {/* CATEGORY */}
        <Select
          value={advancedCategory}
          onChange={(e) =>
            setAdvancedCategory(e.target.value)
          }
          size="small"
          fullWidth
        >
          <MenuItem value="All">
            Category
          </MenuItem>

          <MenuItem value="Intraday">
            Intraday
          </MenuItem>

          <MenuItem value="Short Term">
            Short Term
          </MenuItem>

          <MenuItem value="Long Term">
            Long Term
          </MenuItem>
        </Select>


       {/* INSTRUMENT */}
<Select
  value={advancedInstrument}
  onChange={(e) => {
    setAdvancedInstrument(e.target.value);
    setAdvancedSymbol("");
    setPage(1);
  }}
  size="small"
  fullWidth
  displayEmpty
>
  <MenuItem value="">
    Instrument
  </MenuItem>

  {instrumentOptions.map((instrument) => (
    <MenuItem key={instrument} value={instrument}>
      {instrument}
    </MenuItem>
  ))}
</Select>


{/* SYMBOL */}
<Select
  value={advancedSymbol}
  onChange={(e) => {
    setAdvancedSymbol(e.target.value);
    setPage(1);
  }}
  size="small"
  fullWidth
  displayEmpty
>
  <MenuItem value="">
    Symbol
  </MenuItem>

  {symbolOptions.map((symbol) => (
    <MenuItem key={symbol} value={symbol}>
      {symbol}
    </MenuItem>
  ))}
</Select>


        {/* STATUS */}
        <Select
          value={advancedStatus}
          onChange={(e) =>
            setAdvancedStatus(e.target.value)
          }
          size="small"
          fullWidth
        >
          <MenuItem value="All">
            Status
          </MenuItem>

          <MenuItem value="Active">
            Active
          </MenuItem>

          <MenuItem value="Published">
            Published
          </MenuItem>

          <MenuItem value="Closed">
            Closed
          </MenuItem>
        </Select>


        {/* RESEARCHER */}
     <Select
  value={advancedResearcher}
  onChange={(e) =>
    setAdvancedResearcher(e.target.value)
  }
  size="small"
  fullWidth
  displayEmpty
>
  <MenuItem value="">
    Researcher
  </MenuItem>

  {researcherOptions.map((researcher) => (
    <MenuItem key={researcher} value={researcher}>
      {researcher}
    </MenuItem>
  ))}
</Select>


        {/* VERSION TYPE */}
        <Select
          value={advancedVersionType}
          onChange={(e) =>
            setAdvancedVersionType(e.target.value)
          }
          size="small"
          fullWidth
        >
          <MenuItem value="All">
            Version Type
          </MenuItem>

          <MenuItem value="NORMAL">
            Normal
          </MenuItem>

          <MenuItem value="ERRATA">
            Errata
          </MenuItem>
        </Select>


        {/* MIN P/L */}
        <TextField
          label="Minimum P/L"
          type="number"
          value={minProfitLoss}
          onChange={(e) =>
            setMinProfitLoss(e.target.value)
          }
          size="small"
          fullWidth
        />


        {/* MAX P/L */}
        <TextField
          label="Maximum P/L"
          type="number"
          value={maxProfitLoss}
          onChange={(e) =>
            setMaxProfitLoss(e.target.value)
          }
          size="small"
          fullWidth
        />


        {/* MIN ENTRY */}
        <TextField
          label="Minimum Entry"
          type="number"
          value={minEntry}
          onChange={(e) =>
            setMinEntry(e.target.value)
          }
          size="small"
          fullWidth
        />


        {/* MAX ENTRY */}
        <TextField
          label="Maximum Entry"
          type="number"
          value={maxEntry}
          onChange={(e) =>
            setMaxEntry(e.target.value)
          }
          size="small"
          fullWidth
        />


        {/* MIN EXIT */}
        <TextField
          label="Minimum Exit"
          type="number"
          value={minExit}
          onChange={(e) =>
            setMinExit(e.target.value)
          }
          size="small"
          fullWidth
        />


        {/* MAX EXIT */}
        <TextField
          label="Maximum Exit"
          type="number"
          value={maxExit}
          onChange={(e) =>
            setMaxExit(e.target.value)
          }
          size="small"
          fullWidth
        />


        {/* SORT BY */}
        <Select
          value={advancedSortBy}
          onChange={(e) =>
            setAdvancedSortBy(e.target.value)
          }
          size="small"
          fullWidth
        >
          <MenuItem value="latest">
            Latest
          </MenuItem>

          <MenuItem value="oldest">
            Oldest
          </MenuItem>

          <MenuItem value="profitHigh">
            Profit/Loss: High to Low
          </MenuItem>

          <MenuItem value="profitLow">
            Profit/Loss: Low to High
          </MenuItem>
        </Select>

      </Box>

    </LocalizationProvider>
  </DialogContent>


  <DialogActions>

    <Button
      onClick={() => {
        setAdvancedExchange("All");
        setAdvancedCategory("All");
        setAdvancedInstrument("");
        setAdvancedSymbol("");
        setAdvancedStatus("All");
        setAdvancedResearcher("");
        setAdvancedVersionType("All");

        setMinProfitLoss("");
        setMaxProfitLoss("");

        setMinEntry("");
        setMaxEntry("");

        setMinExit("");
        setMaxExit("");

        setAdvancedDateField("published");
        setAdvancedFromDate(null);
        setAdvancedToDate(null);

        setAdvancedSortBy("latest");

        setPage(1);
      }}
    >
      Clear
    </Button>


    <Button
      onClick={() =>
        setAdvancedFilterOpen(false)
      }
    >
      Cancel
    </Button>


    <Button
      variant="contained"
      onClick={() => {
        setPage(1);
        setAdvancedFilterOpen(false);
      }}
    >
      Apply Filters
    </Button>

  </DialogActions>
</Dialog>
      <Snackbar
        open={notificationOpen}
        autoHideDuration={4000}
        onClose={() => setNotificationOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{
          mt: { xs: 8, sm: 9 },
          mr: { xs: 1, sm: 2 },
          width: { xs: "calc(100% - 16px)", sm: "auto" },
          maxWidth: { xs: "calc(100% - 16px)", sm: 420 },
        }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setNotificationOpen(false)}
          sx={{ width: "100%", alignItems: "center" }}
        >
          {notificationText}
        </Alert>
      </Snackbar>
    </Box>
  );
}
