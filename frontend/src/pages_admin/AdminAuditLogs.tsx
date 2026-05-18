import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
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

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const token = localStorage.getItem("token");
        const API_URL = import.meta.env.VITE_API_URL;
        const response = await axios.get(`${API_URL}/api/audit-logs`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLogs(response.data.logs || []);
      } catch (error) {
        console.error("Failed to fetch audit logs:", error);
        setLogs([]);
      }
    };
    fetchAuditLogs();
  }, []);

  const filterLogs = () => {
    return (logs || []).filter(log => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          log.admin_name?.toLowerCase().includes(query) ||
          log.action?.toLowerCase().includes(query) ||
          log.module?.toLowerCase().includes(query) ||
          log.target_entity?.toLowerCase().includes(query) ||
          log.description?.toLowerCase().includes(query) ||
          log.ip_address?.includes(query);
        if (!matchesSearch) return false;
      }

      if (dateFilter) {
        const logDate = new Date(log.created_at);
        const now = new Date();
        switch (dateFilter) {
          case 'today': {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (logDate < today) return false;
            break;
          }
          case 'week': {
            const weekAgo = new Date();
            weekAgo.setDate(now.getDate() - 7);
            if (logDate < weekAgo) return false;
            break;
          }
          case 'month': {
            const monthAgo = new Date();
            monthAgo.setMonth(now.getMonth() - 1);
            if (logDate < monthAgo) return false;
            break;
          }
        }
      }

      if (userFilter) {
        if (userFilter === "admin" && log.admin_role !== "ADMIN") return false;
        if (userFilter === "superadmin" && log.admin_role !== "SUPER_ADMIN") return false;
      }

      if (moduleFilter && log.module !== moduleFilter) return false;
      if (statusFilter && log.status !== statusFilter) return false;

      return true;
    });
  };

  const filteredLogs = filterLogs();
  const paginatedLogs = filteredLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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

  // ── NEW: actual download logic ────────────────────────────────────
  const handleConfirmExport = () => {
    if (!exportFromDate || !exportToDate) {
      setExportError('Please select both From and To dates.');
      return;
    }

    const from = new Date(exportFromDate);
    const to = new Date(exportToDate);
    to.setHours(23, 59, 59, 999); // include the full "to" day

    if (from > to) {
      setExportError('"From" date cannot be after "To" date.');
      return;
    }

    // Filter logs within the selected date range
    const exportData = logs.filter(log => {
      const logDate = new Date(log.created_at);
      return logDate >= from && logDate <= to;
    });

    if (exportData.length === 0) {
      setExportError('No logs found for the selected date range.');
      return;
    }

    // Build rows for the spreadsheet
    const worksheetData = exportData.map(log => ({
      'Log ID': log.log_id || '',
      'Timestamp': log.created_at ? new Date(log.created_at).toLocaleString() : '',
      'Admin Name': log.admin_name || '',
      'Admin Role': log.admin_role || '',
      'Action': log.action || '',
      'Module': log.module || '',
      'Target Entity': log.target_entity || '',
      'Target Type': log.target_type || '',
      'Description': log.description || '',
      'Status': log.status || '',
      'Reason': log.reason || '',
      'IP Address': log.ip_address || '',
      'Device': log.device || '',
      'Old Value': log.old_value ? (typeof log.old_value === 'string' ? log.old_value : JSON.stringify(log.old_value)) : '',
      'New Value': log.new_value ? (typeof log.new_value === 'string' ? log.new_value : JSON.stringify(log.new_value)) : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);

    // Auto-size columns
    const colWidths = Object.keys(worksheetData[0]).map(key => ({
      wch: Math.max(key.length, 15),
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Logs');

    const fileName = `audit_logs_${exportFromDate}_to_${exportToDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    setExportDialogOpen(false);
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

      <Paper sx={{ p: 3, mb: 3, boxShadow: 'none', border: '1px solid #E9E9EE', borderRadius: 2 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />,
              }}
              size="small"
              sx={{ height: '48px' }}
            />
          </Grid>

          <Grid item xs={6} sm={6} md={2.5}>
            <FormControl fullWidth size="medium" sx={{ minWidth: 130 }}>
              <InputLabel>Date</InputLabel>
              <Select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} label="Date">
                <MenuItem value="">All</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} sm={6} md={2.5}>
            <FormControl fullWidth size="medium" sx={{ minWidth: 130 }}>
              <InputLabel>Users</InputLabel>
              <Select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} label="Users">
                <MenuItem value="">All Users</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="superadmin">Super Admin</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} sm={6} md={2.5}>
            <FormControl fullWidth size="medium" sx={{ minWidth: 130 }}>
              <InputLabel>Modules</InputLabel>
              <Select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} label="Modules">
                <MenuItem value="">All Modules</MenuItem>
                <MenuItem value="RA">RA</MenuItem>
                <MenuItem value="Broker">Broker</MenuItem>
                <MenuItem value="TELEGRAM_CLIENT">Telegram</MenuItem>
                <MenuItem value="Billing">Billing</MenuItem>
                <MenuItem value="Subscription">Subscription</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} sm={6} md={2.5}>
            <FormControl fullWidth size="medium" sx={{ minWidth: 130 }}>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="SUCCESS">Success</MenuItem>
                <MenuItem value="FAILED">Failed</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} sm={6} md={2}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleExport}
              fullWidth
              sx={{ height: '48px', fontSize: '14px' }}
            >
              Download
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <AuditLogTable logs={paginatedLogs} totalEntries={filteredLogs.length} showingEntries={paginatedLogs.length} />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <TablePagination
          component="div"
          count={filteredLogs.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Rows"
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