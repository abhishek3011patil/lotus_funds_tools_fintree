
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  Chip,
  Stack,
  Divider,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";

import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";

interface SupportTicket {
  id: number;
  ticketId: string;
  complaint: string;
  category: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "IN PROGRESS" | "RESOLVED" | "CLOSED";
  attachmentName?: string | null;
  attachmentUrl?: string | null;
  submittedAt: string;
}

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const ClientSupportHelpdesk: React.FC = () => {
  const username = localStorage.getItem("username") || "Client";
  const token = localStorage.getItem("token");

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("LOW");
  const [description, setDescription] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [snackbar, setSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info"
  >("info");

  const [dragActive, setDragActive] = useState(false);

  // --------------------------------------------------
  // SNACKBAR
  // --------------------------------------------------

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "info"
  ) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbar(true);
  };

  // --------------------------------------------------
  // GET MY SUPPORT TICKETS
  // --------------------------------------------------

  const fetchTickets = useCallback(async () => {
    if (!token) {
      setLoadingTickets(false);
      showSnackbar("Please log in again to view your support tickets.", "error");
      return;
    }

    try {
      setLoadingTickets(true);

      const response = await axios.get(
        `${API_URL}/api/support/my-requests`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setTickets(response.data.data || []);
      }
    } catch (error: unknown) {
      console.error("Fetch support tickets error:", error);

      const message = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message || "Unable to fetch support tickets."
        : "Unable to fetch support tickets.";

      showSnackbar(message, "error");
    } finally {
      setLoadingTickets(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchTickets();
  }, [fetchTickets]);

  // --------------------------------------------------
  // HANDLE ATTACHMENT
  // --------------------------------------------------

  const handleFile = (file?: File) => {
    if (!file) return;

    const allowedExtensions = [
      "jpg",
      "jpeg",
      "png",
      "webp",
      "pdf",
      "xls",
      "xlsx",
    ];

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!extension || !allowedExtensions.includes(extension)) {
      showSnackbar(
        "Only JPG, JPEG, PNG, WEBP, PDF, XLS and XLSX files are allowed.",
        "error"
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showSnackbar("File size should not exceed 5 MB.", "error");
      return;
    }

    setAttachment(file);
  };

  // --------------------------------------------------
  // SUBMIT SUPPORT REQUEST
  // --------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !category || !description.trim()) {
      showSnackbar("Please fill in all required fields.", "error");
      return;
    }

    if (!token) {
      showSnackbar("Your session has expired. Please log in again.", "error");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();

      formData.append("complaint", subject.trim());
      formData.append("category", category);
      formData.append("description", description.trim());
      formData.append("priority", priority);

      if (attachment) {
        formData.append("attachment", attachment);
      }

      const response = await axios.post(
        `${API_URL}/api/support`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setSubject("");
        setCategory("");
        setPriority("LOW");
        setDescription("");
        setAttachment(null);

        // Refresh tickets from the database
        await fetchTickets();

        showSnackbar(
          response.data.message || "Support request submitted successfully.",
          "success"
        );
      }
    } catch (error: unknown) {
      console.error("Submit support request error:", error);

      const message = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message || "Unable to submit your complaint."
        : "Unable to submit your complaint.";

      showSnackbar(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // --------------------------------------------------
  // PRIORITY COLORS
  // --------------------------------------------------

  const getPriorityColor = (value: string) => {
    switch (value) {
      case "HIGH":
        return {
          bgcolor: "#FEE2E2",
          color: "#DC2626",
        };
      case "MEDIUM":
        return {
          bgcolor: "#FEEDCF",
          color: "#B45309",
        };
      default:
        return {
          bgcolor: "#E2E8F0",
          color: "#475569",
        };
    }
  };

  // --------------------------------------------------
  // STATUS COLORS
  // --------------------------------------------------

  const getStatusColor = (value: string) => {
    switch (value) {
      case "OPEN":
        return {
          bgcolor: "#FDE68A",
          color: "#92400E",
        };
      case "IN PROGRESS":
        return {
          bgcolor: "#BFDBFE",
          color: "#1D4ED8",
        };
      case "RESOLVED":
        return {
          bgcolor: "#BBF7D0",
          color: "#15803D",
        };
      case "CLOSED":
        return {
          bgcolor: "#E2E8F0",
          color: "#475569",
        };
      default:
        return {};
    }
  };

  return (
    <Box sx={{ width: "100%", maxWidth: "1500px", mx: "auto" }}>

      {/* PAGE TITLE */}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 2.5,
        }}
      >
        <SupportAgentIcon sx={{ color: "#5271FF", fontSize: 28 }} />

        <Box>
          <Typography
            sx={{
              fontSize: 22,
              fontWeight: 700,
              color: "#111827",
            }}
          >
            Support Helpdesk
          </Typography>

          <Typography sx={{ fontSize: 13, color: "#64748B" }}>
            Raise complaints and track your support requests.
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "1.8fr 0.95fr",
          },
          gap: 2,
          alignItems: "start",
        }}
      >

        {/* LEFT: RAISE SUPPORT TICKET */}

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            border: "1px solid #E2E8F0",
            borderRadius: "12px",
            backgroundColor: "#FFFFFF",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: 23,
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Raise a Support Ticket
              </Typography>

              <Typography sx={{ fontSize: 13, color: "#64748B" }}>
                Submit your issue to the admin team. We will review and
                respond as soon as possible.
              </Typography>
            </Box>

            <Typography sx={{ fontSize: 13, color: "#475569" }}>
              Logged in as:{" "}
              <Box
                component="span"
                sx={{ fontWeight: 700, color: "#111827" }}
              >
                {username} (Client)
              </Box>
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >

            {/* SUBJECT */}

            <Box>
              <Typography sx={labelStyle}>
                Subject / Issue Title
              </Typography>

              <TextField
                fullWidth
                size="small"
                placeholder="e.g., Unable to access research recommendations"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </Box>

            {/* CATEGORY */}

            <Box>
              <Typography sx={labelStyle}>Category</Typography>

              <TextField
                select
                fullWidth
                size="small"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (value) =>
                    value ? String(value) : "Select complaint category",
                }}
              >
                <MenuItem value="" disabled>
                  Select complaint category
                </MenuItem>

                <MenuItem value="Technical Issue">
                  Technical Issue
                </MenuItem>

                <MenuItem value="Login / Access Issue">
                  Login / Access Issue
                </MenuItem>

                <MenuItem value="Research Recommendations">
                  Research Recommendations
                </MenuItem>

                <MenuItem value="Research Analysts">
                  Research Analysts
                </MenuItem>

                <MenuItem value="Performance / Insights">
                  Performance / Insights
                </MenuItem>

                <MenuItem value="Notifications">
                  Notifications
                </MenuItem>

                <MenuItem value="Profile Issue">
                  Profile Issue
                </MenuItem>

                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Box>

            {/* PRIORITY */}

            <Box>
              <Typography sx={labelStyle}>Priority</Typography>

              <Stack direction="row" spacing={1}>
                {(["LOW", "MEDIUM", "HIGH"] as const).map((item) => {
                  const colors = getPriorityColor(item);
                  const selected = priority === item;

                  return (
                    <Button
                      key={item}
                      onClick={() => setPriority(item)}
                      variant="outlined"
                      sx={{
                        minWidth: 90,
                        borderRadius: "25px",
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: 13,
                        color: selected ? colors.color : "#64748B",
                        backgroundColor: selected
                          ? colors.bgcolor
                          : "#FFFFFF",
                        borderColor: selected
                          ? colors.color
                          : "#CBD5E1",
                        "&:hover": {
                          backgroundColor: colors.bgcolor,
                          borderColor: colors.color,
                        },
                      }}
                    >
                      {item.charAt(0) + item.slice(1).toLowerCase()}
                    </Button>
                  );
                })}
              </Stack>
            </Box>

            {/* DESCRIPTION */}

            <Box>
              <Typography sx={labelStyle}>
                Describe Your Complaint
              </Typography>

              <TextField
                fullWidth
                multiline
                minRows={3}
                maxRows={6}
                placeholder="Provide as much detail as possible to help us troubleshoot and respond."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </Box>

            {/* ATTACHMENT */}

            <Box>
              <Typography sx={labelStyle}>
                Attachment / Screenshot (optional)
              </Typography>

              <Box
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  handleFile(e.dataTransfer.files[0]);
                }}
                sx={{
                  border: "1.5px dashed",
                  borderColor: dragActive ? "#5271FF" : "#94A3B8",
                  borderRadius: "9px",
                  p: 2,
                  textAlign: "center",
                  backgroundColor: dragActive ? "#EEF2FF" : "#F8FAFC",
                  transition: "0.2s",
                }}
              >
                <input
                  type="file"
                  id="client-support-file"
                  hidden
                  accept=".jpg,.jpeg,.png,.webp,.pdf,.xls,.xlsx"
                  onChange={(e) => {
                    handleFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />

                <label htmlFor="client-support-file">
                  <Stack
                    alignItems="center"
                    spacing={0.5}
                    sx={{ cursor: "pointer" }}
                  >
                    <CloudUploadOutlinedIcon
                      sx={{ fontSize: 30, color: "#5271FF" }}
                    />

                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#334155",
                      }}
                    >
                      Upload screenshot or drag here
                    </Typography>

                    <Typography sx={{ fontSize: 11, color: "#94A3B8" }}>
                      JPG, PNG, WEBP, PDF or Excel (Max 5 MB)
                    </Typography>
                  </Stack>
                </label>
              </Box>

              {attachment && (
                <Box
                  sx={{
                    mt: 1,
                    p: 1,
                    border: "1px solid #E2E8F0",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ minWidth: 0 }}
                  >
                    <AttachFileIcon sx={{ color: "#5271FF" }} />

                    <Typography
                      sx={{
                        fontSize: 12,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {attachment.name}
                    </Typography>
                  </Stack>

                  <IconButton
                    size="small"
                    onClick={() => setAttachment(null)}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Box>

            {/* SUBMIT */}

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
                sx={{
                  backgroundColor: "#22C55E",
                  color: "#FFFFFF",
                  px: 3,
                  py: 1,
                  borderRadius: "9px",
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": {
                    backgroundColor: "#16A34A",
                  },
                }}
              >
                {submitting ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  "Submit Complaint"
                )}
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* RIGHT: RECENT SUPPORT TICKETS */}

        <Paper
          elevation={0}
          sx={{
            p: 2,
            border: "1px solid #E2E8F0",
            borderRadius: "12px",
            backgroundColor: "#FFFFFF",
          }}
        >
          <Typography
            sx={{
              fontSize: 19,
              fontWeight: 700,
              mb: 1.5,
              color: "#111827",
            }}
          >
            Your Recent Support Tickets
          </Typography>

          <Box
            sx={{
              border: "1px solid #E2E8F0",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "0.8fr 1.8fr 0.9fr 1.1fr",
                gap: 0.5,
                p: 1.2,
                backgroundColor: "#F1F5F9",
                alignItems: "center",
              }}
            >
              {["TICKET ID", "ISSUE NAME", "PRIORITY", "STATUS"].map(
                (heading) => (
                  <Typography
                    key={heading}
                    sx={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#334155",
                    }}
                  >
                    {heading}
                  </Typography>
                )
              )}
            </Box>

            {loadingTickets ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={25} />
              </Box>
            ) : tickets.length === 0 ? (
              <Typography
                sx={{
                  textAlign: "center",
                  py: 4,
                  fontSize: 13,
                  color: "#94A3B8",
                }}
              >
                No support tickets submitted yet.
              </Typography>
            ) : (
              tickets.map((ticket) => (
                <Box
                  key={ticket.id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "0.8fr 1.8fr 0.9fr 1.1fr",
                    gap: 0.5,
                    alignItems: "center",
                    p: 1.2,
                    borderTop: "1px solid #E2E8F0",
                  }}
                >
                  <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
                    {ticket.ticketId}
                  </Typography>

                  <Typography
                    title={ticket.complaint}
                    sx={{
                      fontSize: 11.5,
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {ticket.complaint}
                  </Typography>

                  <Chip
                    size="small"
                    label={ticket.priority}
                    sx={{
                      ...getPriorityColor(ticket.priority),
                      fontSize: 10,
                      height: 23,
                      fontWeight: 600,
                    }}
                  />

                  <Chip
                    size="small"
                    label={ticket.status}
                    sx={{
                      ...getStatusColor(ticket.status),
                      fontSize: 9,
                      height: 23,
                      fontWeight: 600,
                    }}
                  />
                </Box>
              ))
            )}
          </Box>

          <Typography
            sx={{
              fontSize: 11,
              color: "#94A3B8",
              mt: 1.5,
            }}
          >
            Track the status of your previously submitted complaints here.
          </Typography>
        </Paper>
      </Box>

      {/* SNACKBAR */}

      <Snackbar
        open={snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbarSeverity}
          onClose={() => setSnackbar(false)}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const labelStyle = {
  fontSize: 14,
  fontWeight: 600,
  color: "#1E293B",
  mb: 0.8,
};

export default ClientSupportHelpdesk;
