
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  InputAdornment,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Stack,
  Divider,
  Tooltip,
  Snackbar,
  CircularProgress,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";

interface SupportRequest {
  id: number | string;
  ticketId: string;
  userType: "RA" | "BROKER" | "CLIENT";
  senderName: string;
  complaint: string;
  category?: string;
  description: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: "OPEN" | "IN PROGRESS" | "RESOLVED" | "CLOSED";
  submittedAt: string;
  attachmentName?: string;
  attachmentUrl?: string;
}

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const AdminSupportRequests: React.FC = () => {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const [userTypeFilter, setUserTypeFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedRequest, setSelectedRequest] =
    useState<SupportRequest | null>(null);

  const [viewDialog, setViewDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);

  const [editPriority, setEditPriority] =
    useState<SupportRequest["priority"]>("LOW");

  const [editStatus, setEditStatus] =
    useState<SupportRequest["status"]>("OPEN");

  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState("");
  const [attachmentPreviewType, setAttachmentPreviewType] = useState<
    "image" | "pdf" | "unsupported" | ""
  >("");
  const [attachmentPreviewLoading, setAttachmentPreviewLoading] =
    useState(false);

  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const showMessage = (
    message: string,
    severity: "success" | "error" = "success"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  // Get authentication headers
  const getHeaders = () => {
    const token = localStorage.getItem("token");

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  // Clear attachment preview and release browser memory
  const clearAttachmentPreview = () => {
    if (attachmentPreviewUrl) {
      URL.revokeObjectURL(attachmentPreviewUrl);
    }

    setAttachmentPreviewUrl("");
    setAttachmentPreviewType("");
    setAttachmentPreviewLoading(false);
  };

  // Close View dialog
  const handleCloseView = () => {
    clearAttachmentPreview();
    setViewDialog(false);
  };

  // Convert backend response into frontend format
  const normalizeRequest = (item: any): SupportRequest => {
    const rawDate =
      item.submittedAt ||
      item.submitted_at ||
      item.created_at;

    return {
      id: item.id,
      ticketId:
        item.ticketId ||
        item.ticket_id ||
        `#${String(item.id).padStart(5, "0")}`,
      userType: item.userType || item.user_type,
      senderName: item.senderName || item.sender_name || "",
      complaint: item.complaint || "",
      category: item.category || "",
      description: item.description || "",
      priority: item.priority || "MEDIUM",
      status: item.status || "OPEN",
      submittedAt: rawDate
        ? new Date(rawDate).toLocaleString()
        : "",
      attachmentName:
        item.attachmentName ||
        item.attachment_name ||
        undefined,
      attachmentUrl:
        item.attachmentUrl ||
        item.attachment_url ||
        undefined,
    };
  };

  // Fetch all support requests
  const fetchSupportRequests = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_URL}/admin/support/requests`,
        {
          headers: getHeaders(),
        }
      );

      const responseData = response.data?.data;

      const records = Array.isArray(responseData)
        ? responseData
        : Array.isArray(response.data?.requests)
        ? response.data.requests
        : [];

      setRequests(records.map(normalizeRequest));
    } catch (error: any) {
      console.error("Failed to fetch support requests:", error);

      setRequests([]);

      showMessage(
        error.response?.data?.message ||
          "Failed to load support requests.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupportRequests();
  }, []);

  // Search and filters
  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const searchMatch = [
        request.ticketId,
        request.senderName,
        request.complaint,
        request.userType,
        request.category || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      const userMatch =
        userTypeFilter === "ALL" ||
        request.userType === userTypeFilter;

      const priorityMatch =
        priorityFilter === "ALL" ||
        request.priority === priorityFilter;

      const statusMatch =
        statusFilter === "ALL" ||
        request.status === statusFilter;

      return (
        searchMatch &&
        userMatch &&
        priorityMatch &&
        statusMatch
      );
    });
  }, [
    requests,
    search,
    userTypeFilter,
    priorityFilter,
    statusFilter,
  ]);

  const paginatedRequests = filteredRequests.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Badge colors
  const getUserColor = (type: string) => {
    switch (type) {
      case "RA":
        return { bgcolor: "#C9F2D8", color: "#168447" };
      case "BROKER":
        return { bgcolor: "#C7E5FF", color: "#1769AA" };
      case "CLIENT":
        return { bgcolor: "#E8C9F5", color: "#8537A4" };
      default:
        return {};
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return { bgcolor: "#FDE0E0", color: "#D93636" };
      case "MEDIUM":
        return { bgcolor: "#FFE6BD", color: "#A45C00" };
      case "LOW":
        return { bgcolor: "#DCE4EB", color: "#526170" };
      default:
        return {};
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return { bgcolor: "#FFE6A3", color: "#8A5B00" };
      case "IN PROGRESS":
        return { bgcolor: "#C8E5FF", color: "#1769AA" };
      case "RESOLVED":
        return { bgcolor: "#C9F2D8", color: "#168447" };
      case "CLOSED":
        return { bgcolor: "#E0E0E0", color: "#555555" };
      default:
        return {};
    }
  };

  // View complaint and fetch latest details
  const handleView = async (request: SupportRequest) => {
    clearAttachmentPreview();
    setSelectedRequest(request);
    setViewDialog(true);

    try {
      const response = await axios.get(
        `${API_URL}/admin/support/requests/${request.id}`,
        {
          headers: getHeaders(),
        }
      );

      const details = response.data?.data;

      if (details) {
        setSelectedRequest(normalizeRequest(details));
      }
    } catch (error) {
      console.error("Failed to fetch support request details:", error);
      showMessage("Could not load the latest request details.", "error");
    }
  };

  // Open edit dialog
  const handleEdit = (request: SupportRequest) => {
    setSelectedRequest(request);
    setEditPriority(request.priority);
    setEditStatus(request.status);
    setEditDialog(true);
  };

  // Update request in backend
  const handleSave = async () => {
    if (!selectedRequest) return;

    try {
      setSaving(true);

      await axios.put(
        `${API_URL}/admin/support/requests/${selectedRequest.id}`,
        {
          priority: editPriority,
          status: editStatus,
        },
        {
          headers: getHeaders(),
        }
      );

      setRequests((prev) =>
        prev.map((request) =>
          String(request.id) === String(selectedRequest.id)
            ? {
                ...request,
                priority: editPriority,
                status: editStatus,
              }
            : request
        )
      );

      setSelectedRequest((prev) =>
        prev
          ? {
              ...prev,
              priority: editPriority,
              status: editStatus,
            }
          : prev
      );

      setEditDialog(false);
      setSelectedRequest(null);

      showMessage("Support request updated successfully.");
    } catch (error: any) {
      console.error("Failed to update support request:", error);

      showMessage(
        error.response?.data?.message ||
          "Failed to update support request.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // Resolve complaint through backend
  const handleResolve = async (request: SupportRequest) => {
    try {
      await axios.put(
        `${API_URL}/admin/support/requests/${request.id}`,
        {
          status: "RESOLVED",
        },
        {
          headers: getHeaders(),
        }
      );

      setRequests((prev) =>
        prev.map((item) =>
          String(item.id) === String(request.id)
            ? { ...item, status: "RESOLVED" }
            : item
        )
      );

      showMessage("Complaint marked as resolved.");
    } catch (error: any) {
      console.error("Failed to resolve complaint:", error);

      showMessage(
        error.response?.data?.message ||
          "Failed to resolve complaint.",
        "error"
      );
    }
  };

  // Export filtered records
  const handleExport = () => {
    const headers = [
      "Ticket ID",
      "User Type",
      "Sender Name",
      "Complaint",
      "Category",
      "Description",
      "Priority",
      "Status",
      "Submitted At",
    ];

    const rows = filteredRequests.map((request) =>
      [
        request.ticketId,
        request.userType,
        request.senderName,
        request.complaint,
        request.category || "",
        request.description,
        request.priority,
        request.status,
        request.submittedAt,
      ]
        .map((value) =>
          `"${String(value).replace(/"/g, '""')}"`
        )
        .join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "Tarkashh_Support_Requests.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const resetFilters = () => {
    setUserTypeFilter("ALL");
    setPriorityFilter("ALL");
    setStatusFilter("ALL");
    setSearch("");
    setPage(1);
  };

  // Get attachment as a protected Blob using authentication
  const getAttachmentBlob = async (): Promise<Blob | null> => {
    if (!selectedRequest?.attachmentUrl) return null;

    const attachmentUrl = selectedRequest.attachmentUrl.startsWith("http")
      ? selectedRequest.attachmentUrl
      : `${API_URL}${
          selectedRequest.attachmentUrl.startsWith("/")
            ? ""
            : "/"
        }${selectedRequest.attachmentUrl}`;

    const response = await axios.get(attachmentUrl, {
      headers: getHeaders(),
      responseType: "blob",
    });

    return response.data as Blob;
  };

  // Preview attachment inside the same dialog
  const handleAttachmentPreview = async () => {
    if (!selectedRequest?.attachmentUrl) return;

    try {
      setAttachmentPreviewLoading(true);
      clearAttachmentPreview();

      const blob = await getAttachmentBlob();

      if (!blob) return;

      const fileName = selectedRequest.attachmentName || "";
      const extension = fileName.split(".").pop()?.toLowerCase();

      let previewType: "image" | "pdf" | "unsupported" = "unsupported";

      if (
        blob.type.startsWith("image/") ||
        ["jpg", "jpeg", "png", "webp"].includes(extension || "")
      ) {
        previewType = "image";
      } else if (
        extension === "pdf" ||
        blob.type === "application/pdf"
      ) {
        previewType = "pdf";
      }

      const blobUrl = URL.createObjectURL(blob);

      setAttachmentPreviewType(previewType);
      setAttachmentPreviewUrl(blobUrl);
    } catch (error) {
      console.error("Attachment preview failed:", error);
      showMessage("Failed to open attachment.", "error");
    } finally {
      setAttachmentPreviewLoading(false);
    }
  };

  // Download attachment separately
  const handleAttachmentDownload = async () => {
    if (!selectedRequest?.attachmentUrl) return;

    try {
      const blob = await getAttachmentBlob();

      if (!blob) return;

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = blobUrl;
      link.download =
        selectedRequest.attachmentName || "support-attachment";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      console.error("Attachment download failed:", error);
      showMessage("Failed to download attachment.", "error");
    }
  };

  return (
    <Box sx={{ width: "100%", color: "#111827" }}>
      {/* Page Heading */}
      <Box sx={{ mb: 2.5 }}>
        <Typography
          sx={{
            fontSize: 22,
            fontWeight: 600,
            color: "#111827",
          }}
        >
          Support Requests
        </Typography>

        <Typography sx={{ color: "#7B8491", fontSize: 14 }}>
          View and manage support complaints and feedback from RAs,
          Brokers, and Clients.
        </Typography>
      </Box>

      {/* Search and Actions */}
      <Paper
        elevation={0}
        sx={{
          p: 1.75,
          mb: 2.5,
          border: "1px solid #E1E5EB",
          borderRadius: "12px",
          backgroundColor: "#FFFFFF",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems="center"
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Search by RA Name, Broker, Client, or Ticket ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#64748B" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                backgroundColor: "#FFFFFF",
                height: 44,
              },
            }}
          />

          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setFilterOpen(true)}
            sx={{
              height: 42,
              minWidth: 105,
              borderRadius: "25px",
              textTransform: "none",
              borderColor: "#3157FF",
              color: "#3157FF",
            }}
          >
            Filter
          </Button>

          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
            disabled={filteredRequests.length === 0}
            sx={{
              height: 42,
              minWidth: 105,
              borderRadius: "10px",
              textTransform: "none",
              borderColor: "#3157FF",
              color: "#3157FF",
            }}
          >
            Export
          </Button>
        </Stack>

        {/* Filters */}
       
{/* Filter Dialog */}
<Dialog
  open={filterOpen}
  onClose={() => setFilterOpen(false)}
  fullWidth
  maxWidth="sm"
>
  <DialogTitle
    sx={{
      fontWeight: 600,
      borderBottom: "1px solid #E9E9EE",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}
  >
    Filters

    <IconButton
      onClick={() => setFilterOpen(false)}
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

  <DialogContent dividers>
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
      {/* User Type Filter */}
      <TextField
        select
        fullWidth
        size="small"
        label="User Type"
        value={userTypeFilter}
        onChange={(e) => {
          setUserTypeFilter(e.target.value);
          setPage(1);
        }}
      >
        <MenuItem value="ALL">All Users</MenuItem>
        <MenuItem value="RA">RA</MenuItem>
        <MenuItem value="BROKER">Broker</MenuItem>
        <MenuItem value="CLIENT">Client</MenuItem>
      </TextField>

      {/* Priority Filter */}
      <TextField
        select
        fullWidth
        size="small"
        label="Priority"
        value={priorityFilter}
        onChange={(e) => {
          setPriorityFilter(e.target.value);
          setPage(1);
        }}
      >
        <MenuItem value="ALL">All Priorities</MenuItem>
        <MenuItem value="HIGH">High</MenuItem>
        <MenuItem value="MEDIUM">Medium</MenuItem>
        <MenuItem value="LOW">Low</MenuItem>
      </TextField>

      {/* Status Filter */}
      <TextField
        select
        fullWidth
        size="small"
        label="Status"
        value={statusFilter}
        onChange={(e) => {
          setStatusFilter(e.target.value);
          setPage(1);
        }}
        sx={{ gridColumn: { sm: "span 2" } }}
      >
        <MenuItem value="ALL">All Status</MenuItem>
        <MenuItem value="OPEN">Open</MenuItem>
        <MenuItem value="IN PROGRESS">In Progress</MenuItem>
        <MenuItem value="RESOLVED">Resolved</MenuItem>
        <MenuItem value="CLOSED">Closed</MenuItem>
      </TextField>
    </Box>
  </DialogContent>

  <DialogActions sx={{ p: 2 }}>
    <Button
      color="inherit"
      onClick={resetFilters}
    >
      Clear
    </Button>

    <Button
      variant="outlined"
      onClick={() => setFilterOpen(false)}
      sx={{
        textTransform: "none",
      }}
    >
      Apply
    </Button>
  </DialogActions>
</Dialog>

      </Paper>

      {/* Table Heading */}
      <Box sx={{ mb: 1.5 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 600 }}>
          All Complaints
        </Typography>

        <Typography sx={{ fontSize: 14, color: "#6B7280" }}>
          Showing {paginatedRequests.length} of {filteredRequests.length} entries
        </Typography>
      </Box>

      {/* Complaints Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: "1px solid #E0E5EC",
          borderRadius: "20px",
          overflowX: "auto",
          backgroundColor: "#FFFFFF",
        }}
      >
        <Table sx={{ minWidth: 1100 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#EDF2F7" }}>
              {[
                "SR. NO.",
                "TICKET ID",
                "USER TYPE",
                "SENDER NAME",
                "COMPLAINT / ISSUE",
                "ATTACHMENT",
                "PRIORITY",
                "STATUS",
                "SUBMITTED AT",
                "ACTION",
              ].map((heading) => (
                <TableCell
                  key={heading}
                  sx={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#111827",
                    whiteSpace: "nowrap",
                    py: 2,
                  }}
                >
                  {heading}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 5 }}>
                  <CircularProgress size={28} />
                  <Typography
                    sx={{ mt: 1, fontSize: 13, color: "#64748B" }}
                  >
                    Loading support requests...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : paginatedRequests.length > 0 ? (
              paginatedRequests.map((request, index) => (
                <TableRow
                  key={request.id}
                  hover
                  sx={{
                    "&:last-child td": { borderBottom: 0 },
                  }}
                >
                  <TableCell sx={{ color: "#64748B", width: 60 }}>
                    {(page - 1) * rowsPerPage + index + 1}
                  </TableCell>

                  <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                    {request.ticketId}
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={request.userType}
                      size="small"
                      sx={{
                        ...getUserColor(request.userType),
                        fontWeight: 600,
                        fontSize: 12,
                        borderRadius: "20px",
                        minWidth: 65,
                      }}
                    />
                  </TableCell>

                  <TableCell sx={{ fontWeight: 500, minWidth: 125 }}>
                    {request.senderName}
                  </TableCell>

                  <TableCell
                    sx={{
                      minWidth: 220,
                      maxWidth: 250,
                      fontWeight: 500,
                      whiteSpace: "normal",
                    }}
                  >
                    {request.complaint}
                  </TableCell>

                  <TableCell sx={{ minWidth: 150 }}>
                    {request.attachmentName ? (
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <FileDownloadIcon
                          sx={{ fontSize: 17, color: "#526A9F" }}
                        />
                        <Typography
                          sx={{
                            fontSize: 12,
                            color: "#435F9D",
                            fontWeight: 500,
                            maxWidth: 140,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={request.attachmentName}
                        >
                          {request.attachmentName}
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>
                        No attachment
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={request.priority}
                      size="small"
                      sx={{
                        ...getPriorityColor(request.priority),
                        fontWeight: 600,
                        fontSize: 12,
                        borderRadius: "20px",
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={request.status}
                      size="small"
                      sx={{
                        ...getStatusColor(request.status),
                        fontWeight: 600,
                        fontSize: 12,
                        borderRadius: "20px",
                        whiteSpace: "nowrap",
                      }}
                    />
                  </TableCell>

                  <TableCell
                    sx={{
                      whiteSpace: "nowrap",
                      fontSize: 13,
                    }}
                  >
                    {request.submittedAt}
                  </TableCell>

                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={0.3}>
                      <Button
                        size="small"
                        onClick={() => handleView(request)}
                        sx={{
                          textTransform: "none",
                          minWidth: "auto",
                          color: "#435F9D",
                          fontWeight: 600,
                        }}
                      >
                        View
                      </Button>

                      {request.status !== "RESOLVED" &&
                        request.status !== "CLOSED" && (
                          <Tooltip title="Resolve complaint">
                            <IconButton
                              size="small"
                              onClick={() => handleResolve(request)}
                              sx={{ color: "#269B60" }}
                            >
                              <CheckCircleOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                      <Tooltip title="Edit complaint">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(request)}
                          sx={{ color: "#435F9D" }}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">
                    No support requests found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          mt: 2.5,
          mb: 2,
        }}
      >
        <Pagination
          count={Math.max(
            1,
            Math.ceil(filteredRequests.length / rowsPerPage)
          )}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
          shape="rounded"
        />
      </Box>

      {/* View Complaint Dialog */}
      <Dialog
        open={viewDialog}
        onClose={handleCloseView}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: 600,
          }}
        >
          Support Request Details

          <IconButton onClick={handleCloseView}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent>
          {selectedRequest && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Box>
                <Typography color="text.secondary" fontSize={12}>
                  Ticket ID
                </Typography>
                <Typography fontWeight={600}>
                  {selectedRequest.ticketId}
                </Typography>
              </Box>

              <Box>
                <Typography color="text.secondary" fontSize={12}>
                  Sender Name
                </Typography>
                <Typography fontWeight={500}>
                  {selectedRequest.senderName}
                </Typography>
              </Box>

              <Box>
                <Typography color="text.secondary" fontSize={12}>
                  User Type
                </Typography>
                <Chip
                  label={selectedRequest.userType}
                  size="small"
                  sx={getUserColor(selectedRequest.userType)}
                />
              </Box>

              <Box>
                <Typography color="text.secondary" fontSize={12}>
                  Complaint / Issue
                </Typography>
                <Typography fontWeight={600}>
                  {selectedRequest.complaint}
                </Typography>
              </Box>

              {selectedRequest.category && (
                <Box>
                  <Typography color="text.secondary" fontSize={12}>
                    Category
                  </Typography>
                  <Typography fontWeight={500}>
                    {selectedRequest.category}
                  </Typography>
                </Box>
              )}

              <Box>
                <Typography color="text.secondary" fontSize={12}>
                  Description
                </Typography>
                <Typography
                  sx={{
                    mt: 0.5,
                    p: 2,
                    backgroundColor: "#F8FAFC",
                    borderRadius: 2,
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                  }}
                >
                  {selectedRequest.description}
                </Typography>
              </Box>

              {/* Attachment Preview Section */}
              <Box>
                <Typography color="text.secondary" fontSize={12}>
                  Attachment / Screenshot
                </Typography>

                {selectedRequest.attachmentName ? (
                  <Paper
                    elevation={0}
                    sx={{
                      mt: 1,
                      p: 1.5,
                      border: "1px solid #E2E8F0",
                      borderRadius: 2,
                      backgroundColor: "#F8FAFC",
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ minWidth: 0, flex: 1 }}
                      >
                        <FileDownloadIcon sx={{ color: "#526A9F" }} />

                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            fontSize={13}
                            fontWeight={600}
                            sx={{
                              overflowWrap: "anywhere",
                            }}
                          >
                            {selectedRequest.attachmentName}
                          </Typography>

                          <Typography fontSize={11} color="text.secondary">
                            Attached file
                          </Typography>
                        </Box>
                      </Stack>

                      {selectedRequest.attachmentUrl && (
                        <Stack
                          direction="row"
                          spacing={0.5}
                          alignItems="center"
                          flexShrink={0}
                        >
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={
                              attachmentPreviewLoading ? (
                                <CircularProgress size={14} />
                              ) : (
                                <VisibilityOutlinedIcon />
                              )
                            }
                            onClick={handleAttachmentPreview}
                            disabled={attachmentPreviewLoading}
                            sx={{
                              textTransform: "none",
                              color: "#435F9D",
                              borderColor: "#8998BB",
                              borderRadius: "8px",
                            }}
                          >
                            View
                          </Button>

                          <Tooltip title="Download attachment">
                            <span>
                              <IconButton
                                size="small"
                                onClick={handleAttachmentDownload}
                                sx={{
                                  color: "#435F9D",
                                  border: "1px solid #D5DCE8",
                                  borderRadius: "8px",
                                }}
                              >
                                <FileDownloadOutlinedIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      )}
                    </Stack>

                    {/* Attachment Preview */}
                    {attachmentPreviewLoading && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          py: 4,
                        }}
                      >
                        <CircularProgress size={26} />
                        <Typography
                          sx={{
                            ml: 1.5,
                            fontSize: 13,
                            color: "#64748B",
                          }}
                        >
                          Loading attachment...
                        </Typography>
                      </Box>
                    )}

                    {!attachmentPreviewLoading && attachmentPreviewUrl && (
                      <Box
                        sx={{
                          mt: 2,
                          border: "1px solid #DCE3ED",
                          borderRadius: 2,
                          backgroundColor: "#FFFFFF",
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            px: 1.5,
                            py: 1,
                            borderBottom: "1px solid #E2E8F0",
                          }}
                        >
                          <Typography
                            fontSize={12}
                            fontWeight={600}
                            color="#475569"
                          >
                            Attachment Preview
                          </Typography>

                          <Tooltip title="Close preview">
                            <IconButton
                              size="small"
                              onClick={clearAttachmentPreview}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>

                        {attachmentPreviewType === "pdf" && (
                          <Box
                            component="iframe"
                            src={attachmentPreviewUrl}
                            title="Support attachment PDF preview"
                            sx={{
                              display: "block",
                              width: "100%",
                              height: 450,
                              border: 0,
                              backgroundColor: "#F8FAFC",
                            }}
                          />
                        )}

                        {attachmentPreviewType === "unsupported" && (
                          <Box sx={{ p: 2.5 }}>
                            <Typography
                              fontSize={13}
                              color="text.secondary"
                              textAlign="center"
                            >
                              Preview is not available for this file type.
                              Please use the download button to open it.
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Paper>
                ) : (
                  <Typography
                    sx={{ mt: 1, fontSize: 13, color: "#9CA3AF" }}
                  >
                    No attachment provided.
                  </Typography>
                )}
              </Box>

              <Stack direction="row" spacing={4}>
                <Box>
                  <Typography color="text.secondary" fontSize={12}>
                    Priority
                  </Typography>
                  <Chip
                    label={selectedRequest.priority}
                    size="small"
                    sx={getPriorityColor(selectedRequest.priority)}
                  />
                </Box>

                <Box>
                  <Typography color="text.secondary" fontSize={12}>
                    Status
                  </Typography>
                  <Chip
                    label={selectedRequest.status}
                    size="small"
                    sx={getStatusColor(selectedRequest.status)}
                  />
                </Box>
              </Stack>

              <Box>
                <Typography color="text.secondary" fontSize={12}>
                  Submitted At
                </Typography>
                <Typography>{selectedRequest.submittedAt}</Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleCloseView}
            variant="outlined"
            sx={{ textTransform: "none" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>


{/* Full Screen Image Preview Dialog */}
<Dialog
  open={viewDialog && !!attachmentPreviewUrl && attachmentPreviewType === "image"}
  onClose={clearAttachmentPreview}
  maxWidth={false}
  PaperProps={{
    sx: {
      width: "90vw",
      height: "90vh",
      maxWidth: "1200px",
      m: 2,
      borderRadius: "12px",
      backgroundColor: "#111827",
      position: "relative",
      overflow: "hidden",
    },
  }}
>
  {/* Close Button */}
  <IconButton
    onClick={clearAttachmentPreview}
    sx={{
      position: "absolute",
      top: 12,
      right: 12,
      zIndex: 2,
      color: "#FFFFFF",
      backgroundColor: "rgba(0,0,0,0.6)",
      "&:hover": {
        backgroundColor: "rgba(0,0,0,0.85)",
      },
    }}
  >
    <CloseIcon />
  </IconButton>

  {/* Image in Center */}
  <Box
    sx={{
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      p: 3,
    }}
  >
    <Box
      component="img"
      src={attachmentPreviewUrl}
      alt={selectedRequest?.attachmentName || "Support attachment"}
      sx={{
        maxWidth: "100%",
        maxHeight: "100%",
        objectFit: "contain",
      }}
    />
  </Box>
</Dialog>


      {/* Edit Complaint Dialog */}
      <Dialog
        open={editDialog}
        onClose={() => !saving && setEditDialog(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Update Support Request
        </DialogTitle>

        <DialogContent>
          {selectedRequest && (
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <Typography color="text.secondary" fontSize={14}>
                Ticket ID: {selectedRequest.ticketId}
              </Typography>

              <TextField
                select
                fullWidth
                label="Priority"
                value={editPriority}
                onChange={(e) =>
                  setEditPriority(
                    e.target.value as SupportRequest["priority"]
                  )
                }
              >
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="LOW">Low</MenuItem>
              </TextField>

              <TextField
                select
                fullWidth
                label="Status"
                value={editStatus}
                onChange={(e) =>
                  setEditStatus(
                    e.target.value as SupportRequest["status"]
                  )
                }
              >
                <MenuItem value="OPEN">Open</MenuItem>
                <MenuItem value="IN PROGRESS">In Progress</MenuItem>
                <MenuItem value="RESOLVED">Resolved</MenuItem>
                <MenuItem value="CLOSED">Closed</MenuItem>
              </TextField>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setEditDialog(false)}
            disabled={saving}
            sx={{ textTransform: "none", color: "#64748B" }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{
              textTransform: "none",
              backgroundColor: "#4F6CF8",
              "&:hover": { backgroundColor: "#3D58DC" },
            }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() =>
          setSnackbar((prev) => ({ ...prev, open: false }))
        }
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() =>
            setSnackbar((prev) => ({ ...prev, open: false }))
          }
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminSupportRequests;
