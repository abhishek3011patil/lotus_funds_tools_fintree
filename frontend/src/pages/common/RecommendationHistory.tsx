import { useState, useEffect, useMemo, type ReactNode } from "react";
import axios from "axios";
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
import { errataBadgeSx, errataRowSx, isErrataVersion } from "../../utils/errataPresentation";
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
import RecommendationMediaButton, { type RecommendationAttachment } from "../../components/common/RecommendationMediaButton";
import ExitRecommendationDialog from "../../components/page_Mainapp/ExitRecommendationDialog";
import {
  formatExportDate,
  type TableExportColumn,
} from "../../utils/tableExport.utils";

export interface HistoryRecord {
  id?: string;
  attachments?: RecommendationAttachment[];
  file_url?: string | null;
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
  published_message_text?: string | null;
  disclaimer_snapshot?: string | null;
  broker_name?: string;
  broker_sebi_registration?: string | null;
  broker_published?: boolean;
  target_price?: number | string | null; target_price_2?: number | string | null; target_price_3?: number | string | null;
  stop_loss?: number | string | null; stop_loss_2?: number | string | null; stop_loss_3?: number | string | null;
  ra_user_id?: string;
  holding_period?: string | null; rationale?: string | null; underlying_study?: string | null; research_remarks?: string | null; errata_reason?: string | null;
  researcher_organization?: string | null; researcher_sebi_registration?: string | null; researcher_contact?: string | null; researcher_email?: string | null;
  broker_disclaimer_template?: string | null; broker_legal_name?: string | null; broker_trade_name?: string | null;
  broker_registration_category?: string | null; broker_membership_code?: string | null; broker_registered_address?: string | null;
  broker_email?: string | null; broker_mobile?: string | null; broker_website?: string | null; broker_authorized_person_name?: string | null;
  broker_authorized_person_designation?: string | null; broker_compliance_officer_name?: string | null; broker_exchanges?: string | null; broker_segments?: string | null;

}

export interface ApiHistoryRecord {
  id?: string;
  attachments?: RecommendationAttachment[];
  file_url?: string | null;
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
  published_message_text?: string | null;
  disclaimer_snapshot?: string | null;
  broker_name?: string;
  broker_sebi_registration?: string | null;
  broker_published?: boolean;
  target_price?: number | string | null; target_price_2?: number | string | null; target_price_3?: number | string | null;
  stop_loss?: number | string | null; stop_loss_2?: number | string | null; stop_loss_3?: number | string | null;
  ra_user_id?: string;
  holding_period?: string | null; rationale?: string | null; underlying_study?: string | null; research_remarks?: string | null; errata_reason?: string | null;
  researcher_organization?: string | null; researcher_sebi_registration?: string | null; researcher_contact?: string | null; researcher_email?: string | null;
  broker_disclaimer_template?: string | null; broker_legal_name?: string | null; broker_trade_name?: string | null;
  broker_registration_category?: string | null; broker_membership_code?: string | null; broker_registered_address?: string | null;
  broker_email?: string | null; broker_mobile?: string | null; broker_website?: string | null; broker_authorized_person_name?: string | null;
  broker_authorized_person_designation?: string | null; broker_compliance_officer_name?: string | null; broker_exchanges?: string | null; broker_segments?: string | null;
}

// Added Prop Interface
interface RecommendationHistoryProps {
  records?: ApiHistoryRecord[];
  showMedia?: boolean;
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
pageSize?: number;
renderRowActions?: (record: HistoryRecord) => ReactNode;
  compactRecommendationView?: boolean;
  enableExitCalls?: boolean;
  showClosedCalls?: boolean;
}

const CLIENT_HISTORY_STORAGE_KEY = "clientRecommendationHistory";
const CLIENT_HISTORY_EVENT = "client-recommendation-history-added";
const CLIENT_HISTORY_PENDING_NOTIFICATION_KEY = "clientHistoryPendingNotification";

export default function RecommendationHistory({
  records,
  showMedia = false,
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
  pageSize = 10,
  renderRowActions,
  compactRecommendationView = false,
  enableExitCalls = false,
  showClosedCalls = false,
}: RecommendationHistoryProps) {
  const [exitCall, setExitCall] = useState<HistoryRecord | null>(null);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    if (!enableExitCalls) return;
    const interval = window.setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, [enableExitCalls]);
  const mapApiRowToHistory = (row: ApiHistoryRecord): HistoryRecord => ({
    id: row.id,
    attachments: row.attachments,
    file_url: row.file_url,
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
    published_message_text: row.published_message_text,
    disclaimer_snapshot: row.disclaimer_snapshot,
    broker_name: row.broker_name,
    broker_sebi_registration: row.broker_sebi_registration,
    broker_published: row.broker_published,
    target_price: row.target_price, target_price_2: row.target_price_2, target_price_3: row.target_price_3,
    stop_loss: row.stop_loss, stop_loss_2: row.stop_loss_2, stop_loss_3: row.stop_loss_3,
    ra_user_id: row.ra_user_id,
    holding_period: row.holding_period, rationale: row.rationale, underlying_study: row.underlying_study,
    research_remarks: row.research_remarks, errata_reason: row.errata_reason,
    researcher_organization: row.researcher_organization, researcher_sebi_registration: row.researcher_sebi_registration,
    researcher_contact: row.researcher_contact, researcher_email: row.researcher_email,
    broker_disclaimer_template: row.broker_disclaimer_template, broker_legal_name: row.broker_legal_name,
    broker_trade_name: row.broker_trade_name, broker_registration_category: row.broker_registration_category,
    broker_membership_code: row.broker_membership_code, broker_registered_address: row.broker_registered_address,
    broker_email: row.broker_email, broker_mobile: row.broker_mobile, broker_website: row.broker_website,
    broker_authorized_person_name: row.broker_authorized_person_name,
    broker_authorized_person_designation: row.broker_authorized_person_designation,
    broker_compliance_officer_name: row.broker_compliance_officer_name, broker_exchanges: row.broker_exchanges,
    broker_segments: row.broker_segments,
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
const rowsPerPage = pageSize;
  


const [dateFieldFilter, setDateFieldFilter] = useState<"published" | "expiry">("published");
const [customFromDate, setCustomFromDate] = useState<Dayjs | null>(null);
const [customToDate, setCustomToDate] = useState<Dayjs | null>(null);
const [customDateOpen, setCustomDateOpen] = useState(false);

  // Fetch data
  useEffect(() => {
    if (records) {
      const rows = records.map(mapApiRowToHistory);
      setData(rows);
      setFilterData(rows);
      setAllResearchers([...new Set(rows.map(row => row.researcher_name || "").filter(Boolean))].sort());
      setLoading(false);
      return;
    }
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
  }, [page, searchQuery, showAllRAs, records]);

useEffect(() => {
  if (records) return;
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
}, [records]);

  useEffect(() => {
  if (records) return;
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
}, [showAllRAs, records]);

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
  if (compactRecommendationView) {
    result = result.filter((item) => !["DRAFT", "WATCHLIST"].includes(item.status.trim().toUpperCase()));
    if (!showClosedCalls) result = result.filter((item) => item.status.trim().toUpperCase() !== "CLOSED");
  }

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
  compactRecommendationView,
  showClosedCalls,
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


  const timeToExpiry = (expiry: string | null) => {
    if (!expiry) return null;
    const [year, month, day] = expiry.slice(0, 10).split("-").map(Number);
    if (!year || !month || !day) return null;
    const expiryEnd = new Date(year, month - 1, day, 23, 59, 59, 999);
    const remainingMinutes = Math.ceil((expiryEnd.getTime() - currentTime) / 60000);
    if (!Number.isFinite(remainingMinutes)) return null;
    if (remainingMinutes < 0) return { expired: true, label: "Expired" };
    const days = Math.floor(remainingMinutes / 1440);
    const hours = Math.floor((remainingMinutes % 1440) / 60);
    const minutes = remainingMinutes % 60;
    return { expired: false, label: `Expires in ${days ? `${days}d ` : ""}${hours}h ${minutes}m` };
  };

  const submitExitCall = async (
    item: { id?: string | number; [key: string]: unknown },
    exitPrice: number,
    exitRemark: string,
    options?: { previewOnly?: boolean; preparedMessage?: string; onPreview?: (message: string) => void },
  ) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Please log in again");
    const profileResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/research/ra/message-profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const profile = profileResponse.data?.data;
    if (!profile) throw new Error("RA message profile is unavailable");

    const call = item as Partial<HistoryRecord>;
    const entryPrice = Number(call.entry);
    if (!Number.isFinite(entryPrice) || entryPrice <= 0) throw new Error("Original entry price is not available");
    const action = String(call.action || "").toUpperCase();
    if (action !== "BUY" && action !== "SELL") throw new Error("Invalid recommendation action");
    const pnl = action === "SELL" ? entryPrice - exitPrice : exitPrice - entryPrice;
    const expiry = call.expiry ? new Date(call.expiry).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }) : "N/A";
    const publishedAt = call.dateTime ? new Date(call.dateTime).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) : "N/A";
    const raName = [profile.salutation, profile.first_name, profile.middle_name, profile.surname].filter(Boolean).join(" ") || "N/A";
    const message = options?.preparedMessage?.trim() || `EXIT Recommendation\nExit Message Published On: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}\n\nEXIT ${call.instrument || "STOCK"} ${call.type || "Cash"} Expiry: ${expiry}\n\nStock Name: ${call.instrument || call.symbol || "N/A"}\nSymbol: ${call.symbol || "N/A"}\nCall Type: Exit\n\nExit Price: ${exitPrice}\nEntry Price: ${entryPrice}\nPnL: ${pnl > 0 ? `Profit ${pnl.toFixed(2)}` : pnl < 0 ? `Loss ${Math.abs(pnl).toFixed(2)}` : "No Profit / No Loss"}\n\nRecommendation Published On: ${publishedAt}\nRemarks: ${exitRemark.trim()}\n\nDISCLAIMER CUM DISCLOSURE:\n\n${call.disclaimer_snapshot || profile.additional_comments || "Investment in securities market are subject to market risks. Read all related documents carefully before investing."}\n\nResearch Analyst: ${raName} (${profile.org_name || "Tarkashh"})\nSEBI Registration No: ${profile.sebi_reg_no || "N/A"}\nContact No: ${profile.mobile || "N/A"}\nEmail ID: ${profile.email || "N/A"}\n\nRead Full Disclaimer / Disclosure at:\nhttps://lotusfunds.com/disclaimer&disclosure`;

    if (options?.previewOnly) {
      options.onPreview?.(message);
      return;
    }
    await axios.patch(`${import.meta.env.VITE_API_URL}/api/research/calls/${encodeURIComponent(String(item.id))}/exit`, {
      exit_price: exitPrice,
      exit_remark: exitRemark.trim(),
      message_text: message,
    }, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
    setData(previous => previous.map(row => row.id === String(item.id) ? { ...row, status: "CLOSED", exit_price: exitPrice, profitLoss: pnl } : row));
    setExitDialogOpen(false);
    setExitCall(null);
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

  const compactHistoryHeadStyle = {
    ...historyHeadStyle,
    fontSize: "0.84rem",
    color: "#475467",
    whiteSpace: "nowrap",
    px: 1.75,
  };
  const compactHistoryBodyStyle = {
    ...historyBodyStyle,
    fontSize: "0.9rem",
    color: "#344054",
    py: 1.75,
    px: 1.75,
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
           width: "100%",
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


   {/* EXPORT CONTAINER */}
{enableExport && (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: { xs: "stretch", sm: "center", md: "flex-start" },
      width: { xs: "100%", sm: "auto" },
      minWidth: 0,
      px: { xs: 1, sm: 1.5 },
      py: { xs: 1, sm: 1 },
      flexShrink: 1,
    }}
  >
    <Box
      sx={{
        width: { xs: "100%", sm: "auto" },
        minWidth: 0,
      }}
    >
      <TableExportMenu
        rows={paginatedData}
        columns={exportColumns}
        fileBaseName={exportFileBaseName}
        printTitle="RA Recommendation History"
        loading={loading}
      />
    </Box>
  </Box>
)}

      </Box>
    </Box>
  </Box>
)}
        </Box>

        {compactRecommendationView && (
          <Stack spacing={1.25} sx={{ display: { xs: "flex", md: "none" }, p: 1.5 }}>
            {loading && <LoadingPage title="Loading" subtitle="Fetching recommendation history..." fullScreen={false} size={44} />}
            {!loading && paginatedData.length === 0 && <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}><Typography color="text.secondary">No records found</Typography></Paper>}
            {!loading && paginatedData.map((row, idx) => {
              const side = row.action.toUpperCase();
              const name = row.symbol && row.symbol !== "-" ? row.symbol : row.instrument;
              const pnlPositive = row.profitLoss >= 0;
              const expiry = timeToExpiry(row.expiry);
              return <Paper key={`${row.id || row.symbol}-${idx}`} variant="outlined" sx={{ p: 1.5, borderColor: "#E6EAF0", borderRadius: 2 }}>
                <Stack direction="row" justifyContent="space-between" gap={1} alignItems="flex-start">
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={0.75} sx={{ mb: 0.75, flexWrap: "wrap" }}>
                      <Box sx={{ px: 1, py: 0.3, borderRadius: 1, bgcolor: side === "BUY" ? "#E8F7EF" : side === "SELL" ? "#FDECEC" : "#F1F3F5", color: side === "BUY" ? "#138A5B" : side === "SELL" ? "#C33D3D" : "#475467", fontWeight: 750, fontSize: 12 }}>{side}</Box>
                      <Box sx={{ px: 1, py: 0.3, borderRadius: 1, bgcolor: "#EEF4FF", color: "#56719A", fontWeight: 650, fontSize: 12 }}>{row.category || row.holding_period || row.type}</Box>
                    </Stack>
                    <Typography sx={{ mt: 1.1, color: "#202938", fontSize: "0.95rem", fontWeight: 650, lineHeight: 1.35, letterSpacing: "0.01em", overflowWrap: "anywhere" }}>{name}</Typography>
                    <Typography sx={{ display: "block", mt: 0.65, color: "#667085", fontSize: "0.75rem", fontWeight: 600, lineHeight: 1.4, letterSpacing: "0.04em", textTransform: "uppercase" }}>{row.type || "Instrument type unavailable"}{row.exchange && row.exchange !== "-" ? ` · ${row.exchange}` : ""}</Typography>
                  </Box>
                  <Box sx={{ flexShrink: 0, textAlign: "right" }}><Typography sx={{ fontSize: "0.82rem", color: "#344054", lineHeight: 1.5 }}>{new Date(row.dateTime).toLocaleDateString("en-IN")}</Typography><Typography sx={{ fontSize: "0.78rem", color: "#667085", lineHeight: 1.5 }}>{new Date(row.dateTime).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}</Typography></Box>
                </Stack>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.25, mt: 1.5 }}>
                  <Box><Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>Status</Typography><Stack direction="column" spacing={0.55} alignItems="flex-start" sx={{ mt: 0.35 }}><Box sx={{ px: 0.9, py: 0.25, borderRadius: 1, fontSize: "0.78rem", fontWeight: 650, bgcolor: ["published", "active"].includes(row.status.toLowerCase()) ? "#E8F7EF" : row.status.toLowerCase() === "closed" ? "#FFF4D6" : "#F2F4F7", color: ["published", "active"].includes(row.status.toLowerCase()) ? "#138A5B" : row.status.toLowerCase() === "closed" ? "#9A6700" : "#475467" }}>{row.status}</Box>{isErrataVersion(row.version_type) && <Box sx={errataBadgeSx}>ERRATA</Box>}</Stack></Box>
                  <Box><Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>Current Market Price</Typography><Typography sx={{ fontSize: "0.95rem", fontWeight: 600, color: "#475467" }}>—</Typography></Box>
                  <Box><Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>Entry</Typography><Typography sx={{ fontSize: "0.95rem", fontWeight: 600, color: "#344054" }}>{row.entry}</Typography></Box>
                  <Box><Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>Stop Loss</Typography><Typography sx={{ fontSize: "0.95rem", fontWeight: 650, color: "#D92D20" }}>{row.stop_loss ?? "—"}</Typography></Box>
                  <Box><Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>Target</Typography><Typography sx={{ fontSize: "0.95rem", fontWeight: 650, color: "#039855" }}>{row.target_price ?? "—"}</Typography></Box>
                  <Box><Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>P/L</Typography><Typography sx={{ fontSize: "0.95rem", fontWeight: 700, color: pnlPositive ? "success.main" : "error.main" }}>{pnlPositive ? "+" : "−"}{Math.abs(row.profitLoss).toLocaleString()}</Typography></Box>
                </Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.25, pt: 1, borderTop: "1px solid #EEF0F3" }}>
                  <Box><Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>Analyst: {getResearcherName(row)}</Typography>{enableExitCalls && <Typography sx={{ fontSize: "0.8rem", display: "block", color: "text.secondary" }}>{expiry?.label || "Expiry: —"}</Typography>}</Box>
                  <Stack direction="row" spacing={0.75} alignItems="center">{renderRowActions && renderRowActions(row)}{enableExitCalls && row.id && ["PUBLISHED", "ERRATA", "ACTIVE"].includes(row.status.toUpperCase()) && <Button size="small" variant="contained" onClick={() => { setExitCall(row); setExitDialogOpen(true); }}>Exit</Button>}</Stack>
                </Stack>
              </Paper>;
            })}
          </Stack>
        )}

        {!compactRecommendationView && <Stack spacing={1.5} sx={{ display: { xs: "flex", md: "none" }, p: 1.5 }}>
          {loading && <LoadingPage title="Loading" subtitle="Fetching recommendation history..." fullScreen={false} size={44} />}
          {!loading && paginatedData.length === 0 && <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}><Typography color="text.secondary">No records found</Typography></Paper>}
          {!loading && paginatedData.map((row, idx) => <Paper key={`${row.id || row.symbol}-${idx}`} variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" gap={1} alignItems="flex-start">
              <Box><Typography fontWeight={800}>{row.symbol}</Typography><Typography variant="caption" color="text.secondary">{row.instrument} · {row.exchange}</Typography></Box>
              <Box sx={{ px: 1.25, py: .4, borderRadius: 1, fontSize: 12, fontWeight: 800, bgcolor: row.action.toUpperCase() === "BUY" ? "success.light" : row.action.toUpperCase() === "SELL" ? "error.light" : "grey.100", color: row.action.toUpperCase() === "BUY" ? "success.dark" : row.action.toUpperCase() === "SELL" ? "error.dark" : "text.primary" }}>{row.action}</Box>
            </Stack>
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.5 }}><Typography variant="body2">Entry: {row.entry}</Typography><Typography variant="body2">Exit: {row.exit_price}</Typography></Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}><Typography variant="caption" color="text.secondary">{formatDateTime(row.dateTime)}</Typography><Typography variant="caption" fontWeight={750}>{row.status}</Typography></Stack>
            <Typography variant="caption" color="text.secondary" display="block">Researcher: {getResearcherName(row)}</Typography>
            {(showMedia || renderRowActions) && <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>{showMedia && <RecommendationMediaButton filePath={row.file_url} attachments={row.attachments} symbol={row.symbol} />}{renderRowActions && renderRowActions(row)}</Stack>}
          </Paper>)}
        </Stack>}

        {compactRecommendationView && <TableContainer sx={{ display: { xs: "none", md: "block" } }}>
          <Table stickyHeader size="small" sx={{ borderCollapse: "separate", borderSpacing: "0 3px" }}>
            <TableHead><TableRow>
              <TableCell sx={compactHistoryHeadStyle}>Date &amp; Time</TableCell><TableCell sx={compactHistoryHeadStyle}>Recommendation</TableCell><TableCell sx={compactHistoryHeadStyle}>Status</TableCell><TableCell sx={compactHistoryHeadStyle}>Current Market Price</TableCell><TableCell sx={compactHistoryHeadStyle}>Entry</TableCell><TableCell sx={compactHistoryHeadStyle}>Stop Loss</TableCell><TableCell sx={compactHistoryHeadStyle}>Target</TableCell><TableCell align="right" sx={compactHistoryHeadStyle}>Profit / Loss</TableCell><TableCell sx={compactHistoryHeadStyle}>Analyst</TableCell>{renderRowActions && <TableCell sx={compactHistoryHeadStyle}>Options</TableCell>}{enableExitCalls && <TableCell sx={compactHistoryHeadStyle}>Exit</TableCell>}
            </TableRow></TableHead>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={9 + (renderRowActions ? 1 : 0) + (enableExitCalls ? 1 : 0)} align="center" sx={{ py: 4 }}><LoadingPage title="Loading" subtitle="Fetching recommendation history..." fullScreen={false} size={44} /></TableCell></TableRow> : paginatedData.length === 0 ? <TableRow><TableCell colSpan={9 + (renderRowActions ? 1 : 0) + (enableExitCalls ? 1 : 0)} align="center" sx={{ py: 4 }}>No records found</TableCell></TableRow> : paginatedData.map((row, idx) => {
                const side = row.action.toUpperCase();
                const name = row.symbol && row.symbol !== "-" ? row.symbol : row.instrument;
                const pnlPositive = row.profitLoss >= 0;
                const expiry = timeToExpiry(row.expiry);
                const canExit = enableExitCalls && row.id && ["PUBLISHED", "ERRATA", "ACTIVE"].includes(row.status.toUpperCase());
                return <TableRow key={`${row.id || row.symbol}-${idx}`} sx={{ bgcolor: "#fff", transition: "background-color 140ms ease", "&:hover": { bgcolor: "#F8FAFC" }, "& td:first-of-type": { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }, "& td:last-of-type": { borderTopRightRadius: 8, borderBottomRightRadius: 8 }, "& td": { borderBottom: "1px solid #EAECF0" }, ...(isErrataVersion(row.version_type) ? errataRowSx : {}) }}>
                  <TableCell sx={compactHistoryBodyStyle}><Typography sx={{ fontSize: "0.82rem", color: "#344054", lineHeight: 1.5 }}>{new Date(row.dateTime).toLocaleDateString("en-IN")}</Typography><Typography sx={{ fontSize: "0.78rem", color: "#667085", lineHeight: 1.5 }}>{new Date(row.dateTime).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}</Typography></TableCell>
                  <TableCell sx={{ ...compactHistoryBodyStyle, minWidth: 260, py: 2.25 }}>
                    <Stack direction="row" spacing={0.75} sx={{ mb: 1.25 }}>
                      <Box sx={{ px: 1, py: 0.3, borderRadius: 1, bgcolor: side === "BUY" ? "#E8F7EF" : side === "SELL" ? "#FDECEC" : "#F1F3F5", color: side === "BUY" ? "#138A5B" : side === "SELL" ? "#C33D3D" : "#475467", fontWeight: 750, fontSize: 11 }}>{side}</Box>
                      <Box sx={{ px: 1, py: 0.3, borderRadius: 1, bgcolor: "#EEF4FF", color: "#56719A", fontWeight: 650, fontSize: 11 }}>{row.category || row.holding_period || row.type}</Box>
                    </Stack>
                    <Typography sx={{ mb: 0.7, color: "#202938", fontSize: "0.9rem", fontWeight: 650, lineHeight: 1.35, letterSpacing: "0.01em", overflowWrap: "anywhere" }}>{name}</Typography>
                    <Typography sx={{ color: "#667085", fontSize: "0.74rem", fontWeight: 600, lineHeight: 1.45, letterSpacing: "0.04em", textTransform: "uppercase" }}>{row.type || "Instrument type unavailable"}{row.exchange && row.exchange !== "-" ? ` · ${row.exchange}` : ""}</Typography>
                  </TableCell>
                  <TableCell sx={compactHistoryBodyStyle}><Stack direction="column" spacing={0.55} alignItems="flex-start"><Box sx={{ px: 1, py: 0.4, borderRadius: 1, fontSize: "0.78rem", fontWeight: 650, bgcolor: ["published", "active"].includes(row.status.toLowerCase()) ? "#E8F7EF" : row.status.toLowerCase() === "closed" ? "#FFF4D6" : "#F2F4F7", color: ["published", "active"].includes(row.status.toLowerCase()) ? "#138A5B" : row.status.toLowerCase() === "closed" ? "#9A6700" : "#475467" }}>{row.status}</Box>{isErrataVersion(row.version_type) && <Box sx={errataBadgeSx}>ERRATA</Box>}</Stack></TableCell>
                  <TableCell sx={compactHistoryBodyStyle}><Typography sx={{ fontSize: "0.9rem", fontWeight: 600, color: "#475467" }}>—</Typography></TableCell><TableCell sx={{ ...compactHistoryBodyStyle, color: "#344054", fontWeight: 600 }}>{row.entry}</TableCell><TableCell sx={{ ...compactHistoryBodyStyle, color: "#D92D20", fontWeight: 650 }}>{row.stop_loss ?? "—"}</TableCell><TableCell sx={{ ...compactHistoryBodyStyle, color: "#039855", fontWeight: 650 }}>{row.target_price ?? "—"}</TableCell>
                  <TableCell align="right" sx={compactHistoryBodyStyle}><Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: pnlPositive ? "success.dark" : "error.dark" }}>{pnlPositive ? "+" : "−"}{Math.abs(row.profitLoss).toLocaleString()}</Typography></TableCell>
                  <TableCell sx={compactHistoryBodyStyle}>{getResearcherName(row)}</TableCell>{renderRowActions && <TableCell sx={compactHistoryBodyStyle}>{renderRowActions(row)}</TableCell>}{enableExitCalls && <TableCell sx={compactHistoryBodyStyle}><Stack spacing={0.75} alignItems="flex-start"><Typography sx={{ fontSize: "0.78rem", color: "#667085", whiteSpace: "nowrap" }}>{expiry?.label || "Expiry: —"}</Typography>{canExit && <Button size="small" variant="contained" onClick={() => { setExitCall(row); setExitDialogOpen(true); }} sx={{ fontSize: "0.82rem", textTransform: "none", px: 1.5, py: 0.55 }}>Exit</Button>}</Stack></TableCell>}
                </TableRow>;
              })}
            </TableBody>
          </Table>
        </TableContainer>}

        {!compactRecommendationView && <TableContainer sx={{ display: { xs: "none", md: "block" } }}>
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
                {showMedia && <TableCell sx={historyHeadStyle}>Media</TableCell>}
                {renderRowActions && <TableCell sx={historyHeadStyle}>Options</TableCell>}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={13 + (showMedia ? 1 : 0) + (renderRowActions ? 1 : 0)} align="center" sx={{ py: 4 }}>
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
                  <TableCell colSpan={13 + (showMedia ? 1 : 0) + (renderRowActions ? 1 : 0)} align="center" sx={{ py: 4 }}>
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, idx) => (
                  <TableRow key={idx} sx={{ "&:last-child td, &:last-child th": { border: 0 }, ...(isErrataVersion(row.version_type) ? errataRowSx : {}) }}>
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

 {isErrataVersion(row.version_type) && (
  <Box
    sx={errataBadgeSx}
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
                    {showMedia && (
                      <TableCell sx={historyBodyStyle}>
                        <RecommendationMediaButton filePath={row.file_url} attachments={row.attachments} symbol={row.symbol} />
                      </TableCell>
                    )}
                    {renderRowActions && <TableCell sx={historyBodyStyle}>{renderRowActions(row)}</TableCell>}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>}

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
  {enableExitCalls && <ExitRecommendationDialog
    open={exitDialogOpen}
    item={exitCall as (HistoryRecord & { [key: string]: unknown }) | null}
    onClose={() => { setExitDialogOpen(false); setExitCall(null); }}
    onSubmit={submitExitCall}
  />}
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
