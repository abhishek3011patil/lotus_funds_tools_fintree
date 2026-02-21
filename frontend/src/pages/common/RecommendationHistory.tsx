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

interface HistoryRecord {
  dateTime: string;
  action: string;
  exchange: string;
  type: string;
  category: string;
  instrument: string;
  symbol: string;
  expiry: string | null;
  entry: number;
  exit: number;
  status: string;
  profitLoss: number;
  researcherName?: string;
  researcher?: string;
  researcher_name?: string;
  createdBy?: string;
  created_by?: string;
  username?: string;
}

// Added Prop Interface
interface RecommendationHistoryProps {
  statusFilter?: string;
  enableAddNotification?: boolean;
}

const CLIENT_HISTORY_STORAGE_KEY = "clientRecommendationHistory";
const CLIENT_HISTORY_EVENT = "client-recommendation-history-added";
const CLIENT_HISTORY_PENDING_NOTIFICATION_KEY = "clientHistoryPendingNotification";

export default function RecommendationHistory({
  statusFilter = "All",
  enableAddNotification = false,
}: RecommendationHistoryProps) {
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
    fetch("/recommendationHistory.json")
      .then((res) => res.json())
      .then((json) => {
        const fetchedHistory = json.recommendationHistory || [];

        let localHistory: HistoryRecord[] = [];
        try {
          const stored = window.localStorage.getItem(CLIENT_HISTORY_STORAGE_KEY);
          const parsed = stored ? JSON.parse(stored) : [];
          localHistory = Array.isArray(parsed) ? parsed : [];
        } catch {
          localHistory = [];
        }

        setData([...localHistory, ...fetchedHistory]);
      })
      .catch((err) => console.error("Error fetching active call history:", err))
      .finally(() => setLoading(false));
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

    // --- CONDITION FOR DASHBOARD ---
    if (statusFilter !== "All") {
      result = result.filter(
        (item) => item.status.toLowerCase() === statusFilter.toLowerCase()
      );
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
  }, [data, dateFilter, typesOfCall, categoryFilter, actionFilter, outcomeFilter, statusFilter]);

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
            <Paper
              elevation={0}
              sx={{
                display: "flex",
                alignItems: "center",
                border: "1px solid #E9E9EE",
                borderRadius: "0.5rem",
                overflow: "hidden",
              }}
            >
              <Box sx={{ p: 1, borderRight: "1px solid #E9E9EE", display: "flex", alignItems: "center", backgroundColor: "#F8F9FA" }}>
                <FilterAltOutlinedIcon sx={{ fontSize: "1.1rem", color: "#666" }} />
              </Box>

              <Box sx={{ px: 1.5, py: 0.5, borderRight: "1px solid #E9E9EE" }}>
                <Typography fontSize="0.75rem" color="#666" fontWeight={500}>Filter By</Typography>
              </Box>

              <Box sx={{ borderRight: "1px solid #E9E9EE" }}>
                <Select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  displayEmpty
                  size="small"
                  sx={historySelectStyle}
                  variant="standard"
                  disableUnderline
                >
                  <MenuItem value="All">Date</MenuItem>
                  <MenuItem value="Today">Today</MenuItem>
                  <MenuItem value="Last 7 Days">Last 7 Days</MenuItem>
                </Select>
              </Box>

              <Box sx={{ borderRight: "1px solid #E9E9EE" }}>
                <Select
                  value={typesOfCall}
                  onChange={(e) => settypesOfCall(e.target.value)}
                  displayEmpty
                  size="small"
                  sx={historySelectStyle}
                  variant="standard"
                  disableUnderline
                >
                  <MenuItem value="All">Type of Calls</MenuItem>
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="futures">Futures</MenuItem>
                  <MenuItem value="options call">Option Call</MenuItem>
                  <MenuItem value="options put">Option Put</MenuItem>
                </Select>
              </Box>

              <Box sx={{ borderRight: "1px solid #E9E9EE" }}>
                <Select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  displayEmpty
                  size="small"
                  sx={historySelectStyle}
                  variant="standard"
                  disableUnderline
                >
                  <MenuItem value="All">Action</MenuItem>
                  <MenuItem value="BUY">Buy</MenuItem>
                  <MenuItem value="SELL">Sell</MenuItem>
                </Select>
              </Box>

              <Box sx={{ borderRight: "1px solid #E9E9EE" }}>
                <Select
                  value={outcomeFilter}
                  onChange={(e) => setOutcomeFilter(e.target.value)}
                  displayEmpty
                  size="small"
                  sx={historySelectStyle}
                  variant="standard"
                  disableUnderline
                >
                  <MenuItem value="All">Outcome</MenuItem>
                  <MenuItem value="Profit">Profit</MenuItem>
                  <MenuItem value="Loss">Loss</MenuItem>
                </Select>
              </Box>

              <Box sx={{ borderRight: "1px solid #E9E9EE" }}>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  displayEmpty
                  size="small"
                  sx={historySelectStyle}
                  variant="standard"
                  disableUnderline
                >
                  <MenuItem value="All">Category</MenuItem>
                  <MenuItem value="Intraday">Intraday</MenuItem>
                  <MenuItem value="Short Term">Short Term</MenuItem>
                  <MenuItem value="Long Term">Long Term</MenuItem>
                </Select>
              </Box>

              <Button
                startIcon={<RestartAltIcon sx={{ fontSize: "1rem" }} />}
                onClick={handleReset}
                sx={{
                  textTransform: "none",
                  color: "#ff4d4d",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  px: 2,
                  "&:hover": { backgroundColor: "rgba(255, 77, 77, 0.05)" },
                }}
              >
                Reset Filter
              </Button>
            </Paper>
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
                    Loading...
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
                    <TableCell sx={historyBodyStyle}>{row.action}</TableCell>
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
        row.status.toLowerCase() === "closed" ? "#FEF9C3" : // Light Yellow
        "#F3F4F6", // Default Gray
      color: 
        row.status.toLowerCase() === "active" ? "#166534" : // Dark Green
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