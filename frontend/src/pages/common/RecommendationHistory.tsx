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
} from "@mui/material";

import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LoadingPage from "../../common/LoadingPage";

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
  exit: number | string;
  status: string;
  profitLoss: number;
  researcherName?: string;
  researcher?: string;
  researcher_name?: string;
  createdBy?: string;
  created_by?: string;
  username?: string;
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
  exit?: number | string;
  status?: string;
  profit_loss?: number | null;
  researcher_name?: string;
}

// Added Prop Interface
interface RecommendationHistoryProps {
  statusFilter?: string;
  enableAddNotification?: boolean;
  searchQuery?: string;
}

const CLIENT_HISTORY_STORAGE_KEY = "clientRecommendationHistory";
const CLIENT_HISTORY_EVENT = "client-recommendation-history-added";
const CLIENT_HISTORY_PENDING_NOTIFICATION_KEY = "clientHistoryPendingNotification";

export default function RecommendationHistory({
  statusFilter = "All",
  enableAddNotification = false,
  searchQuery = "",
}: RecommendationHistoryProps) {
  const mapApiRowToHistory = (row: ApiHistoryRecord): HistoryRecord => ({
    dateTime: row.date_time || "",
    action: row.action || "-",
    exchange: row.exchange || "-",
    type: row.type || "-",
    category: row.category || "-",
    instrument: row.instrument || "-",
    symbol: row.symbol || "-",
    expiry: row.expiry ?? null,
    entry: row.entry ?? "-",
    exit: row.exit ?? "-",
    status: row.status || "-",
    profitLoss: Number(row.profit_loss ?? 0),
    researcher_name: row.researcher_name,
  });

  // State
  const [data, setData] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationText, setNotificationText] = useState("New recommendation added to history.");

  // Filters
  const [dateFilter, setDateFilter] = useState("All");
  const [typesOfCall, settypesOfCall] = useState("All");
  const [actionFilter, setActionFilter] = useState("All");
  const [outcomeFilter, setOutcomeFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Pagination
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

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

        const res = await fetch(import.meta.env.VITE_API_URL + "/api/research/performance", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

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
  }, []);

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
    let result = [...data];

    // --- GLOBAL SEARCH LOGIC ---
    if (searchQuery.trim() !== "") {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((item) => {
        // This converts every value in the row to a string and checks for a match
        return Object.values(item).some((value) => 
          String(value).toLowerCase().includes(lowerQuery)
        );
      });
    }

    // --- CONDITION FOR DASHBOARD ---
    if (statusFilter !== "All") {
      const normalizedStatusFilter = statusFilter.toLowerCase();

      if (normalizedStatusFilter === "active") {
        result = result.filter((item) => item.status.toLowerCase() !== "closed");
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
    if (actionFilter !== "All") {
      result = result.filter((item) => item.action.toUpperCase() === actionFilter);
    }
    if (outcomeFilter !== "All") {
      result = result.filter((item) =>
        outcomeFilter === "Profit" ? item.profitLoss > 0 : item.profitLoss < 0
      );
    }
    if (dateFilter !== "All") {
      const now = new Date();
      result = result.filter((item) => {
        const itemDate = new Date(item.dateTime);
        if (dateFilter === "Today") {
          return itemDate.toDateString() === now.toDateString();
        }
        if (dateFilter === "Last 7 Days") {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          return itemDate >= sevenDaysAgo;
        }
        return true;
      });
    }

    return result;
  }, [data, searchQuery, statusFilter, typesOfCall, categoryFilter, actionFilter, outcomeFilter, dateFilter]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const paginatedData = filteredData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleReset = () => {
    setDateFilter("All");
    settypesOfCall("All");
    setActionFilter("All");
    setOutcomeFilter("All");
    setCategoryFilter("All");
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

  // Show full-page loader until recommendation history is fetched and prepared.
  if (loading) {
    return (
      <LoadingPage
        title="Loading history"
        subtitle="Please wait while we fetch recommendation history."
      />
    );
  }

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
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          sx={{ p: 2, borderBottom: "1px solid #F0F0F0" }}
        >
          <Typography fontSize="1.25rem" fontWeight={700}>
            {statusFilter === "active" ? "Active Recommendations" : "Recommendation History"}
          </Typography>

          {/* Condition: Only show Filters on Performance page */}
          {statusFilter === "All" && (
            <Box sx={{ p: 2, backgroundColor: "#fff" }}>
  <Box
    sx={{
      display: "flex",
      flexDirection: { xs: "column", md: "row" }, // Stack on mobile, single line on desktop
      border: "1px solid #E9E9EE",
      borderRadius: "0.5rem",
      overflow: "hidden",
      width: "fit-content",
      maxWidth: "100%"
    }}
  >
    {/* Filter Icon & Label */}
    <Box sx={{ 
      display: "flex", 
      alignItems: "center", 
      px: 2, 
      py: 1, 
      backgroundColor: "#F8F9FA",
      borderRight: "1px solid #E9E9EE",
      borderBottom: { xs: "1px solid #E9E9EE", md: "none" }
    }}>
      <FilterAltOutlinedIcon sx={{ fontSize: "1.1rem", color: "#666", mr: 1 }} />
      <Typography fontSize="0.75rem" color="#666" fontWeight={600} sx={{ whiteSpace: 'nowrap' }}>
        Filter By
      </Typography>
    </Box>

    {/* Dropdowns Container */}
    <Box sx={{ 
      display: "flex", 
      flexWrap: { xs: "wrap", md: "nowrap" }, // Wrap on mobile, NO wrap on desktop
      flexGrow: 1 
    }}>
      {[
        { value: dateFilter, setter: setDateFilter, label: "Date", options: ["Today", "Last 7 Days"] },
        { value: typesOfCall, setter: settypesOfCall, label: "Type of Calls", options: ["cash", "futures", "options call", "options put"] },
        { value: actionFilter, setter: setActionFilter, label: "Action", options: ["BUY", "SELL"] },
        { value: outcomeFilter, setter: setOutcomeFilter, label: "Outcome", options: ["Profit", "Loss"] },
        { value: categoryFilter, setter: setCategoryFilter, label: "Category", options: ["Intraday", "Short Term", "Long Term"] },
      ].map((f, i) => (
        <Box 
          key={i} 
          sx={{ 
            borderRight: "1px solid #E9E9EE",
            // On mobile: take half width to form a grid. On desktop: auto width.
            flex: { xs: "1 1 50%", md: "0 0 auto" }, 
            borderBottom: { xs: "1px solid #E9E9EE", md: "none" },
          }}
        >
          <Select
            value={f.value}
            onChange={(e) => { f.setter(e.target.value); setPage(1); }}
            displayEmpty
            size="small"
            sx={{
                ...historySelectStyle,
                width: "100%",
                minWidth: { md: "130px" } // Ensures desktop looks consistent
            }}
            variant="standard"
            disableUnderline
          >
            <MenuItem value="All">{f.label}</MenuItem>
            {f.options.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
          </Select>
        </Box>
      ))}
    </Box>

    {/* Reset Button */}
    <Button
      startIcon={<RestartAltIcon sx={{ fontSize: "1rem" }} />}
      onClick={handleReset}
      sx={{
        textTransform: "none",
        color: "#ff4d4d",
        fontWeight: 600,
        fontSize: "0.75rem",
        px: 3,
        py: { xs: 1.5, md: 0 },
        whiteSpace: "nowrap",
        "&:hover": { backgroundColor: "rgba(255, 77, 77, 0.05)" }
      }}
    >
      Reset Filter
    </Button>
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
              {paginatedData.length === 0 ? (
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
                    <TableCell sx={historyBodyStyle}>{row.expiry || "-"}</TableCell>
                    <TableCell sx={historyBodyStyle}>{row.entry}</TableCell>
                    <TableCell sx={historyBodyStyle}>{row.exit}</TableCell>
                    <TableCell sx={historyBodyStyle}>
  <Box
    sx={{
      display: "inline-block",
      px: 1.5,
      py: 0.5,
      borderRadius: "4px",
      fontSize: "0.75rem",
      fontWeight: 700,
      textTransform: "capitalize",
      // THE CONDITION:
      backgroundColor: 
        row.status.toLowerCase() === "active" ? "#DCFCE7" : // Light Green
        row.status.toLowerCase() === "published" ? "#DCFCE7" : // Light Green
        row.status.toLowerCase() === "closed" ? "#FEF9C3" : // Light Yellow
        "#F3F4F6", // Default Gray
      color: 
        row.status.toLowerCase() === "active" ? "#166534" : // Dark Green
        row.status.toLowerCase() === "published" ? "#166534" : // Dark Green
        row.status.toLowerCase() === "closed" ? "#854D0E" : // Dark Yellow/Brown
        "#374151", // Default Dark Gray
    }}
  >
    {row.status}
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
            Showing {filteredData.length > 0 ? (page - 1) * rowsPerPage + 1 : 0}-{Math.min(page * rowsPerPage, filteredData.length)} of {filteredData.length.toString().padStart(2, "0")}
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
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              sx={historyPageButtonStyle}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>
      </Paper>

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