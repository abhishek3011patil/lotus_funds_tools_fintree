import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Paper,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import Grid from "@mui/material/GridLegacy"; 
import { Search, Download } from '@mui/icons-material';
import axios from "axios";
import * as XLSX from 'xlsx';
import FilterListIcon from "@mui/icons-material/FilterList";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import AuditLogTable from './Admin common/AuditLogTable';

interface AuditLog {
  log_id: string;
  created_at: string;
  admin_name: string;
  admin_role: string;
  action: string;
  module: string;
  target_entity: string;
  target_type: string;
  description: string;
  status: string;
  reason?: string;
  ip_address: string;
  device?: string;
  old_value?: unknown;
  new_value?: unknown;
}

const auditModules = [
  { value: 'AUDIT', label: 'Audit' },
  { value: 'AUTH', label: 'Authentication' },
  { value: 'BROKER', label: 'Broker' },
  { value: 'CLIENT', label: 'Client' },
  { value: 'PAYMENT', label: 'Payment' },
  { value: 'RA', label: 'Research Analyst' },
  { value: 'RA_PROFILE', label: 'RA Profile' },
  { value: 'REGISTRATION', label: 'Registration' },
  { value: 'RESEARCH_CALL', label: 'Research Call' },
  { value: 'SUBSCRIPTION', label: 'Subscription' },
  { value: 'TELEGRAM', label: 'Telegram' },
  { value: 'TELEGRAM_CLIENT', label: 'Telegram Client' },
  { value: 'USER_MANAGEMENT', label: 'User Management' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
] as const;

const parseManualDate = (value: string): string | null => {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return `${yearText}-${monthText}-${dayText}`;
};

const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filterOpen, setFilterOpen] = useState(true);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filterFromDate, setFilterFromDate] = useState("");
const [filterToDate, setFilterToDate] = useState("");

  // ── NEW: dialog state ──────────────────────────────────────────────
  const [exportFromDate, setExportFromDate] = useState('');
  const [exportToDate, setExportToDate] = useState('');
  const [exportError, setExportError] = useState('');
  // ──────────────────────────────────────────────────────────────────

  const [debouncedSearch, setDebouncedSearch] = useState("");

 const [totalLogs, setTotalLogs] = useState(0);

useEffect(() => {
  const fetchAuditLogs = async () => {
    try {
      
      const token = localStorage.getItem("token");
      const API_URL = import.meta.env.VITE_API_URL;
//console.count("Fetching audit logs");
      const response = await axios.get(`${API_URL}/api/audit-logs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
       params: {
  page: page + 1,
  limit: rowsPerPage,
  search: debouncedSearch.trim().length >= 3
    ? debouncedSearch.trim()
    : "",
  date: dateFilter,
  user: userFilter,
  module: moduleFilter,
  status: statusFilter,
  fromDate: filterFromDate || "",
  toDate: filterToDate || "",
},
      });

      setLogs(response.data.logs || []);
      setTotalLogs(response.data.total || 0);
     
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      setLogs([]);
      setTotalLogs(0);
    }
  };

  fetchAuditLogs();
}, [
  page,
  rowsPerPage,
  debouncedSearch,
  dateFilter,
  userFilter,
  moduleFilter,
  statusFilter,
  filterFromDate,
  filterToDate,
]);

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchQuery);
    setPage(0);
  }, 500);

  return () => clearTimeout(timer);
}, [searchQuery]);

 

  const handleChangePage = (event: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // ── NEW: open dialog instead of console.log ───────────────────────
const handleExport = () => {
  setExportFromDate('');
  setExportToDate('');
  setExportError('');
  setFilterDialogOpen(true);
};


  // ──────────────────────────────────────────────────────────────────
const handleResetFilters = () => {
  setSearchQuery("");
  setDebouncedSearch("");
  setDateFilter("");
  setUserFilter("");
  setModuleFilter("");
  setStatusFilter("");
  setFilterFromDate("");
  setFilterToDate("");
  setPage(0);
};
  // ── NEW: actual download logic ────────────────────────────────────
const handleConfirmExport = async () => {
  setExportError('');

  if ((exportFromDate && !exportToDate) || (!exportFromDate && exportToDate)) {
    setExportError("Please enter both From Date and To Date.");
    return;
  }

  let fromDate: string | null = null;
  let toDate: string | null = null;

  if (exportFromDate && exportToDate) {
    fromDate = parseManualDate(exportFromDate);
    toDate = parseManualDate(exportToDate);

    if (!fromDate || !toDate) {
      setExportError("Please enter valid dates in DD/MM/YYYY format.");
      return;
    }

    if (fromDate > toDate) {
      setExportError('"From" date cannot be after "To" date.');
      return;
    }
  }

  try {
    const token = localStorage.getItem("token");
    const API_URL = import.meta.env.VITE_API_URL;

const response = await axios.get(`${API_URL}/api/audit-logs/export`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
  params: {
    fromDate: fromDate || filterFromDate || undefined,
    toDate: toDate || filterToDate || undefined,
    search: debouncedSearch.trim().length >= 3
      ? debouncedSearch.trim()
      : "",
    date: dateFilter,
    user: userFilter,
    module: moduleFilter,
    status: statusFilter,
  },
});

    const exportData = response.data.logs || [];

    if (exportData.length === 0) {
      setExportError("No logs found for the selected filters.");
      return;
    }

    const worksheetData = exportData.map((log: AuditLog) => ({
      "Log ID": log.log_id || "",
      "Timestamp": log.created_at
        ? new Date(log.created_at).toLocaleString()
        : "",
      "Admin Name": log.admin_name || "",
      "Admin Role": log.admin_role || "",
      "Action": log.action || "",
      "Module": log.module || "",
      "Target Entity": log.target_entity || "",
      "Target Type": log.target_type || "",
      "Description": log.description || "",
      "Status": log.status || "",
      "Reason": log.reason || "",
      "IP Address": log.ip_address || "",
      "Device": log.device || "",
      "Old Value": log.old_value
        ? typeof log.old_value === "string"
          ? log.old_value
          : JSON.stringify(log.old_value)
        : "",
      "New Value": log.new_value
        ? typeof log.new_value === "string"
          ? log.new_value
          : JSON.stringify(log.new_value)
        : "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);

    worksheet["!cols"] = Object.keys(worksheetData[0]).map((key) => ({
      wch: Math.max(key.length, 18),
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Logs");

    XLSX.writeFile(
      workbook,
      `audit_logs_${fromDate || "all"}_to_${toDate || "all"}.xlsx`
    );

  } catch (error) {
    console.error("Export failed:", error);
    setExportError("Failed to export audit logs.");
  }
};
  // ──────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: '100%', mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={600} sx={{ mb: 1 }}>
          Audit Log
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track and monitor all system activities and user actions
        </Typography>
      </Box>




{filterOpen && (
  <Paper
    elevation={0}
    sx={{
      mb: 3,
      p: { xs: 1.5, sm: 2 },
      border: "1px solid #E2E8F0",
      borderRadius: "12px",
      backgroundColor: "#FFFFFF",
    }}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        width: "100%",
        flexWrap: "wrap",
      }}
    >
      {/* Search Bar */}
      <TextField
        fullWidth
        size="small"
        placeholder="Search logs..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <Search
              sx={{
                color: "#64748B",
                fontSize: 20,
                mr: 1,
              }}
            />
          ),
        }}
        sx={{
          flex: 1,
          minWidth: { xs: "100%", sm: "250px" },
          "& .MuiOutlinedInput-root": {
            height: 46,
            borderRadius: "10px",
            backgroundColor: "#FFFFFF",
            fontSize: "14px",
            "& fieldset": {
              borderColor: "#CBD5E1",
            },
            "&:hover fieldset": {
              borderColor: "#94A3B8",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#315BFF",
              borderWidth: "1px",
            },
          },
          "& input::placeholder": {
            color: "#94A3B8",
            opacity: 1,
          },
        }}
      />

      {/* Filter and Export Buttons */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 1.5,
          flexShrink: 0,
          width: { xs: "100%", sm: "auto" },
        }}
      >
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={() => setFilterDialogOpen(true)}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderRadius: "20px",
            px: 3,
            height: 42,
            borderColor: "#94A3FF",
            color: "#3157FF",
            "&:hover": {
              borderColor: "#3157FF",
              backgroundColor: "#F8FAFF",
            },
          }}
        >
          Filter
        </Button>

        <Button
          variant="outlined"
          startIcon={<Download />}
        onClick={handleExport}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderRadius: "10px",
            px: 2.5,
            height: 42,
            borderColor: "#3157FF",
            color: "#3157FF",
            "&:hover": {
              borderColor: "#3157FF",
              backgroundColor: "#F8FAFF",
            },
          }}
        >
          Export
        </Button>
      </Box>
    </Box>
  </Paper>
)}

{/* Filter Dialog */}
<Dialog
  open={filterDialogOpen}
  onClose={() => setFilterDialogOpen(false)}
  fullWidth
  maxWidth="sm"
  PaperProps={{
    sx: {
      borderRadius: 3,
    },
  }}
>
<DialogTitle
  sx={{
    fontWeight: 600,
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  }}
>
  Filters

  <IconButton
    onClick={() => setFilterDialogOpen(false)}
    size="small"
    sx={{
      color: "#64748B",
      "&:hover": {
        backgroundColor: "#F1F5F9",
        color: "#3157FF",
      },
    }}
  >
    <CloseIcon fontSize="small" />
  </IconButton>
</DialogTitle>

  <DialogContent sx={{ py: 3 }}>
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "1fr 1fr",
        },
        gap: 2,
        pt: 1,
      }}
    >
      {/* Date Range */}
      <TextField
        select
        fullWidth
        size="small"
        label="Date Range"
        value={dateFilter}
        onChange={(e) => {
          setDateFilter(e.target.value);
          setPage(0);
        }}
      >
        <MenuItem value="">All Time</MenuItem>
        <MenuItem value="today">Today</MenuItem>
        <MenuItem value="week">This Week</MenuItem>
        <MenuItem value="month">This Month</MenuItem>
      </TextField>

      {/* User Role */}
      <TextField
        select
        fullWidth
        size="small"
        label="User Role"
        value={userFilter}
        onChange={(e) => {
          setUserFilter(e.target.value);
          setPage(0);
        }}
      >
        <MenuItem value="">All Roles</MenuItem>
        <MenuItem value="admin">Admin</MenuItem>
        <MenuItem value="superadmin">Super Admin</MenuItem>
      </TextField>

      {/* Modules */}
      <TextField
        select
        fullWidth
        size="small"
        label="Modules"
        value={moduleFilter}
        onChange={(e) => {
          setModuleFilter(e.target.value);
          setPage(0);
        }}
      >
        <MenuItem value="">All Modules</MenuItem>
        {auditModules.map((module) => (
          <MenuItem key={module.value} value={module.value}>
            {module.label}
          </MenuItem>
        ))}
      </TextField>

      {/* Status */}
      <TextField
        select
        fullWidth
        size="small"
        label="Status"
        value={statusFilter}
        onChange={(e) => {
          setStatusFilter(e.target.value);
          setPage(0);
        }}
      >
        <MenuItem value="">All Statuses</MenuItem>
        <MenuItem value="SUCCESS">Success</MenuItem>
        <MenuItem value="FAILED">Failed</MenuItem>
      </TextField>

      {/* From Date */}
      <TextField
        fullWidth
        size="small"
        label="From Date"
        type="date"
        value={filterFromDate}
        onChange={(e) => setFilterFromDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
      />

      {/* To Date */}
      <TextField
        fullWidth
        size="small"
        label="To Date"
        type="date"
        value={filterToDate}
        onChange={(e) => setFilterToDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
      />
    </Box>
  </DialogContent>

  <DialogActions
    sx={{
      px: 3,
      py: 2,
      borderTop: "1px solid #e2e8f0",
    }}
  >
    <Button
      color="inherit"
      onClick={handleResetFilters}
      sx={{ fontWeight: 600, textTransform: "none" }}
    >
      Clear
    </Button>

    <Button
      variant="outlined"
      onClick={() => setFilterDialogOpen(false)}
      sx={{
        textTransform: "none",
        fontWeight: 600,
        borderRadius: 2,
        px: 2.5,
        borderColor: "#94A3FF",
        color: "#3157FF",
      }}
    >
      Apply
    </Button>
  </DialogActions>
</Dialog>

    <AuditLogTable
  logs={logs}
  totalEntries={totalLogs}
  showingEntries={logs.length}
/>

<Box 
  sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'flex-end', 
    mt: 2,
    borderTop: '1px solid #e2e8f0',
    pt: 1
  }}
>
  <TablePagination
    component="div"
    count={totalLogs}
    page={page}
    onPageChange={handleChangePage}
    rowsPerPage={rowsPerPage}
    onRowsPerPageChange={handleChangeRowsPerPage}
    rowsPerPageOptions={[5, 10, 25, 50]}
    sx={{
      color: '#475569',
      '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
        fontSize: '0.875rem',
      }
    }}
  />
</Box>
    </Box>
  );
};

export default AdminAuditLogs;
