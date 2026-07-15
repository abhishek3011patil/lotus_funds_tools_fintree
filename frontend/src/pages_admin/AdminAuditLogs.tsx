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
  old_value?: any;
  new_value?: any;
}

const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // ── NEW: dialog state ──────────────────────────────────────────────
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
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
  search: debouncedSearch.trim().length >= 3 ? debouncedSearch.trim() : "",
  date: dateFilter,
  user: userFilter,
  module: moduleFilter,
  status: statusFilter,
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
}, [page, rowsPerPage, debouncedSearch, dateFilter, userFilter, moduleFilter, statusFilter]);

useEffect(() => {
  setPage(0);
}, [dateFilter, userFilter, moduleFilter, statusFilter]);

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
    setExportDialogOpen(true);
  };
  // ──────────────────────────────────────────────────────────────────
const handleResetFilters = () => {
  setSearchQuery("");
  setDebouncedSearch("");
  setDateFilter("");
  setUserFilter("");
  setModuleFilter("");
  setStatusFilter("");
  setPage(0);
};
  // ── NEW: actual download logic ────────────────────────────────────
 const handleConfirmExport = async () => {
  if (!exportFromDate || !exportToDate) {
    setExportError("Please select both From and To dates.");
    return;
  }

  if (new Date(exportFromDate) > new Date(exportToDate)) {
    setExportError('"From" date cannot be after "To" date.');
    return;
  }

  try {
    const token = localStorage.getItem("token");
    const API_URL = import.meta.env.VITE_API_URL;

    const response = await axios.get(`${API_URL}/api/audit-logs/export`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        fromDate: exportFromDate,
        toDate: exportToDate,
        search: debouncedSearch.trim().length >= 3 ? debouncedSearch.trim() : "",
        user: userFilter,
        module: moduleFilter,
        status: statusFilter,
      },
    });

    const exportData = response.data.logs || [];

    if (exportData.length === 0) {
      setExportError("No logs found for the selected date range.");
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
      `audit_logs_${exportFromDate}_to_${exportToDate}.xlsx`
    );

    setExportDialogOpen(false);
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

<Paper 
  elevation={0}
  sx={{ 
    p: { xs: 2, md: 2.5 }, 
    mb: 3, 
    border: '1px solid #e2e8f0', 
    borderRadius: '14px',
    backgroundColor: '#ffffff'
  }}
>
  <Box 
    sx={{ 
      display: 'flex', 
      flexDirection: { xs: 'column', lg: 'row' }, 
      alignItems: { xs: 'stretch', lg: 'center' }, 
      justifyContent: 'space-between',
      gap: 2
    }}
  >
    {/* Left Side: Inputs wrapper - responsive grid/wrap alignment across screens */}
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' }, 
        flexWrap: 'wrap', 
        alignItems: 'center', 
        gap: 1.5, 
        flexGrow: 1, 
        width: '100%' 
      }}
    >
      <TextField
        placeholder="Search logs..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: <Search sx={{ color: 'text.secondary', mr: 0.75, fontSize: '1.25rem' }} />,
        }}
        size="small"
        sx={{ 
          width: { xs: '100%', sm: 'calc(50% - 6px)', md: '240px' },
          '& .MuiOutlinedInput-root': { borderRadius: '10px', height: '42px', fontSize: '0.9rem' } 
        }}
      />

      <FormControl size="small" sx={{ width: { xs: '100%', sm: 'calc(50% - 6px)', md: '150px' } }}>
        <InputLabel sx={{ fontSize: '0.9rem', mt: 0.1 }}>Date Range</InputLabel>
        <Select 
          value={dateFilter} 
          onChange={(e) => setDateFilter(e.target.value)} 
          label="Date Range"
          sx={{ borderRadius: '10px', height: '42px', fontSize: '0.9rem' }}
        >
          <MenuItem value="" sx={{ fontSize: '0.9rem' }}>All Time</MenuItem>
          <MenuItem value="today" sx={{ fontSize: '0.9rem' }}>Today</MenuItem>
          <MenuItem value="week" sx={{ fontSize: '0.9rem' }}>This Week</MenuItem>
          <MenuItem value="month" sx={{ fontSize: '0.9rem' }}>This Month</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ width: { xs: '100%', sm: 'calc(50% - 6px)', md: '150px' } }}>
        <InputLabel sx={{ fontSize: '0.9rem', mt: 0.1 }}>User Role</InputLabel>
        <Select 
          value={userFilter} 
          onChange={(e) => setUserFilter(e.target.value)} 
          label="User Role"
          sx={{ borderRadius: '10px', height: '42px', fontSize: '0.9rem' }}
        >
          <MenuItem value="" sx={{ fontSize: '0.9rem' }}>All Roles</MenuItem>
          <MenuItem value="admin" sx={{ fontSize: '0.9rem' }}>Admin</MenuItem>
          <MenuItem value="superadmin" sx={{ fontSize: '0.9rem' }}>Super Admin</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ width: { xs: '100%', sm: 'calc(50% - 6px)', md: '160px' } }}>
        <InputLabel sx={{ fontSize: '0.9rem', mt: 0.1 }}>Modules</InputLabel>
        <Select 
          value={moduleFilter} 
          onChange={(e) => setModuleFilter(e.target.value)} 
          label="Modules"
          sx={{ borderRadius: '10px', height: '42px', fontSize: '0.9rem' }}
        >
          <MenuItem value="" sx={{ fontSize: '0.9rem' }}>All Modules</MenuItem>
          <MenuItem value="RA" sx={{ fontSize: '0.9rem' }}>RA</MenuItem>
          <MenuItem value="Broker" sx={{ fontSize: '0.9rem' }}>Broker</MenuItem>
          <MenuItem value="TELEGRAM_CLIENT" sx={{ fontSize: '0.9rem' }}>Telegram</MenuItem>
          <MenuItem value="Billing" sx={{ fontSize: '0.9rem' }}>Billing</MenuItem>
          <MenuItem value="Subscription" sx={{ fontSize: '0.9rem' }}>Subscription</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ width: { xs: '100%', sm: 'calc(50% - 6px)', md: '150px' } }}>
        <InputLabel sx={{ fontSize: '0.9rem', mt: 0.1 }}>Status</InputLabel>
        <Select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)} 
          label="Status"
          sx={{ borderRadius: '10px', height: '42px', fontSize: '0.9rem' }}
        >
          <MenuItem value="" sx={{ fontSize: '0.9rem' }}>All Statuses</MenuItem>
          <MenuItem value="SUCCESS" sx={{ fontSize: '0.9rem' }}>Success</MenuItem>
          <MenuItem value="FAILED" sx={{ fontSize: '0.9rem' }}>Failed</MenuItem>
        </Select>
      </FormControl>
    </Box>

    {/* Right Side: Action Buttons - auto-stretches down onto mobile devices */}
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1.5, 
        width: { xs: '100%', lg: 'auto' }, 
        justifyContent: { xs: 'stretch', sm: 'flex-end' } 
      }}
    >
      <Button
        variant="outlined"
        size="medium"
        onClick={handleResetFilters}
        sx={{ 
          textTransform: 'none', 
          fontWeight: 600,
          borderRadius: '10px',
          px: 3,
          height: '42px',
          fontSize: '0.9rem',
          borderColor: '#cbd5e1',
          color: '#475569',
          whiteSpace: 'nowrap',
          flex: { xs: 1, sm: 'initial' },
          '&:hover': { backgroundColor: '#f8fafc', borderColor: '#94a3b8' }
        }}
      >
        Reset
      </Button>
      
      <Button
        variant="contained"
        startIcon={<Download sx={{ fontSize: '1.1rem' }} />}
        onClick={handleExport}
        size="medium"
        sx={{ 
          textTransform: 'none', 
          fontWeight: 600,
          borderRadius: '10px',
          px: 3,
          height: '42px',
          fontSize: '0.9rem',
          backgroundColor: '#1e3a8a',
          boxShadow: 'none',
          whiteSpace: 'nowrap',
          flex: { xs: 1, sm: 'initial' },
          '&:hover': { backgroundColor: '#172554', boxShadow: 'none' }
        }}
      >
        Export
      </Button>
    </Box>
  </Box>
</Paper>

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

      {/* ── NEW: Date Range Export Dialog ─────────────────────────────── */}
      <Dialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 380 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
          Download Audit Logs
        </DialogTitle>

        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select the date range for the logs you want to export.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="From Date"
                type="date"
                value={exportFromDate}
                onChange={(e) => {
                  setExportFromDate(e.target.value);
                  setExportError('');
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="To Date"
                type="date"
                value={exportToDate}
                onChange={(e) => {
                  setExportToDate(e.target.value);
                  setExportError('');
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          {exportError && (
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              {exportError}
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setExportDialogOpen(false)}
            sx={{ flex: 1 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleConfirmExport}
            sx={{ flex: 1 }}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>
      {/* ──────────────────────────────────────────────────────────────── */}
    </Box>
  );
};

export default AdminAuditLogs;
