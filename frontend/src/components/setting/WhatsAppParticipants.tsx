import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Pagination,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SearchIcon from "@mui/icons-material/Search";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import axios from "axios";

type WhatsAppParticipant = {
  id: string;
  ra_user_id: string;
  participant_name: string;
  phone_number: string;
  consent_confirmed: boolean;
  consent_source?: string;
  consent_confirmed_at?: string;
  is_active: boolean;
  created_at: string;
};

type Props = {
  /**
   * Leave undefined in RA Settings.
   * Pass selectedRA.userId in the Admin Dashboard.
   */
  raId?: string;
  title?: string;
};

const emptyForm = {
  participantName: "",
  phoneNumber: "",
  consentConfirmed: false,
};

const rowsPerPage = 5;

const WhatsAppParticipants = ({
  raId,
  title = "Manage WhatsApp Participants",
}: Props) => {
  const [participants, setParticipants] = useState<WhatsAppParticipant[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingParticipant, setEditingParticipant] =
    useState<WhatsAppParticipant | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);




  const [testing, setTesting] = useState(false);

const handleTestMessage = async () => {
  try {
    setTesting(true);

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login again");
      return;
    }

    const testMessage = `Hello,

WhatsApp notifications have been started successfully.

Your Research Analyst may send research calls to you today through this WhatsApp number.

This is only a test message. No investment action is required.

- Lotus Funds`;

    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/whatsapp/test-message`,
      {
        raId,
        message: testMessage,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert(response.data.message);
  } catch (error: any) {
    console.error(error);

    alert(
      error.response?.data?.message ||
        "Failed to send test WhatsApp message"
    );
  } finally {
    setTesting(false);
  }
};

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<WhatsAppParticipant | null>(
    null,
  );

  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const fetchParticipants = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (raId) {
        params.set("raId", raId);
      }

      const query = params.toString() ? `?${params.toString()}` : "";

      const response = await fetch(
        `${apiUrl}/api/whatsapp/participants${query}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load WhatsApp participants");
      }

      setParticipants(data.data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load WhatsApp participants",
      );
    } finally {
      setLoading(false);
    }
  }, [apiUrl, token, raId]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingParticipant(null);
  };

  const normalizePhoneNumber = (value: string) => value.replace(/\D/g, "");

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const isEditing = Boolean(editingParticipant);
      const endpoint = isEditing
        ? `${apiUrl}/api/whatsapp/participants/${editingParticipant?.id}`
        : `${apiUrl}/api/whatsapp/participants`;

      const response = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          raId,
          participantName: form.participantName.trim(),
          phoneNumber: normalizePhoneNumber(form.phoneNumber),
          consentConfirmed: editingParticipant
            ? editingParticipant.consent_confirmed
            : form.consentConfirmed,
          consentSource: raId ? "ADMIN_DECLARATION" : "RA_DECLARATION",
          isActive: editingParticipant?.is_active ?? true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save WhatsApp participant");
      }

      setSuccess(
        isEditing
          ? "WhatsApp participant updated successfully"
          : "WhatsApp participant added successfully",
      );

      resetForm();
      await fetchParticipants();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save WhatsApp participant",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (participant: WhatsAppParticipant) => {
    setEditingParticipant(participant);
    setForm({
      participantName: participant.participant_name,
      phoneNumber: participant.phone_number,
      consentConfirmed: participant.consent_confirmed,
    });
    setError("");
    setSuccess("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggle = async (participant: WhatsAppParticipant) => {
    try {
      setUpdatingId(participant.id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${apiUrl}/api/whatsapp/participants/${participant.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            raId,
            participantName: participant.participant_name,
            phoneNumber: participant.phone_number,
            isActive: !participant.is_active,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update WhatsApp participant",
        );
      }

      setSuccess(
        participant.is_active
          ? "WhatsApp participant disabled"
          : "WhatsApp participant enabled",
      );

      await fetchParticipants();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update WhatsApp participant",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const params = new URLSearchParams();

      if (raId) {
        params.set("raId", raId);
      }

      const query = params.toString() ? `?${params.toString()}` : "";

      const response = await fetch(
        `${apiUrl}/api/whatsapp/participants/${deleteTarget.id}${query}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to remove WhatsApp participant",
        );
      }

      if (editingParticipant?.id === deleteTarget.id) {
        resetForm();
      }

      setDeleteTarget(null);
      setSuccess("WhatsApp participant removed successfully");
      await fetchParticipants();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to remove WhatsApp participant",
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredParticipants = participants.filter((participant) => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return true;

    return (
      participant.participant_name.toLowerCase().includes(query) ||
      participant.phone_number.toLowerCase().includes(query) ||
      (participant.is_active ? "active" : "inactive").includes(query) ||
      (participant.consent_confirmed ? "confirmed" : "not confirmed").includes(
        query,
      )
    );
  });

  const pageCount = Math.ceil(filteredParticipants.length / rowsPerPage);

  const paginatedParticipants = filteredParticipants.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (pageCount > 0 && page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const formIsValid =
    form.participantName.trim().length > 0 &&
    normalizePhoneNumber(form.phoneNumber).length >= 10 &&
    Boolean(editingParticipant || form.consentConfirmed);

  return (
    <Box sx={{ mt: 4, width: "100%" }}>  <Button
  variant="contained"
  color="success"
  startIcon={
    testing ? (
      <CircularProgress size={18} color="inherit" />
    ) : (
      <WhatsAppIcon />
    )
  }
  onClick={handleTestMessage}
  disabled={testing}
  sx={{
    marginBottom: 3,
    textTransform: "none",
    whiteSpace: "nowrap",
  }}
>
  {testing ? "Sending..." : "Test WhatsApp"}
</Button>
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: -1 }}>
        <WhatsAppIcon color="success" sx={{ fontSize: 24 }} />
        <Typography 
          variant="h6" 
          sx={{ 
            fontSize: "20px", 
            fontWeight: 600, 
            color: "#1a1a1a", 
            fontFamily: "sans-serif"
          }}
        >
          {title}
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

{/* Section 1: Add New Participant Form */}
<Box 
  sx={{ 
    width: "100%", 
    mb: 4, 
    mt: 2,
    backgroundColor: "#F8F9FA", 
    border: "1px solid #E9EAEB", 
    borderRadius: "16px", 
    p: 3, 
  }}
>
  <Typography sx={{ mb: 0.5, fontSize: "15px", fontWeight: 600, color: "#1a1a1a" }}>
    {editingParticipant ? "Edit Participant" : "Add New Participant"}
  </Typography>

  <Typography color="text.secondary" sx={{ mb: 2.5, fontSize: "14px" }}>
    Enter the participant name and WhatsApp number with country code.
  </Typography>

  <Stack spacing={1}>
    {/* Combined single row for fields and buttons */}
    <Box 
      sx={{ 
        display: "flex", 
        gap: 2, 
        flexDirection: { xs: "column", md: "row" },
        alignItems: { xs: "stretch", md: "flex-start" },
        mb: 1
      }}
    >
      <TextField
        fullWidth
        size="small"
        label="Participant Name"
        placeholder="e.g. John Doe"
        value={form.participantName}
        onChange={(e) => setForm(prev => ({ ...prev, participantName: e.target.value }))}
      />
      <TextField
        fullWidth
        size="small"
        label="WhatsApp Number"
        placeholder="e.g. 919876543210"
        value={form.phoneNumber}
        onChange={(e) => setForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
      />

      {/* Buttons container is now a sibling inside the horizontal flexbox */}
      <Box 
        sx={{ 
          display: "flex", 
          gap: 1.5, 
          flexDirection: { xs: "column", sm: "row" },
          // Perfect alignment alignment offset for small-sized textfields with labels
          mt: { md: "4px" }, 
          width: { xs: "100%", md: "auto" }
        }}
      >
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!formIsValid || saving}
          sx={{
            whiteSpace: "nowrap",
            height: 40,
            px: 3,
            width: { xs: "100%", sm: "auto" },
            textTransform: "none",
            fontWeight: 500,
            boxShadow: "none",
            minWidth: editingParticipant ? 145 : 110,
            backgroundColor: "#1D4ED8",
            "&:hover": {
              backgroundColor: "#1E40AF",
              boxShadow: "none",
              },
            "&.Mui-disabled": {
              backgroundColor: "rgba(0, 0, 0, 0.12)",
            }
          }}
        >
          {saving ? "Saving..." : editingParticipant ? "Update" : "Add"}
        </Button>

        {editingParticipant && (
          <Button
            variant="outlined"
            onClick={resetForm}
            disabled={saving}
            sx={{ 
              whiteSpace: "nowrap", 
              height: 40, 
              width: { xs: "100%", sm: "auto" },
              textTransform: "none", 
              fontWeight: 500 
            }}
          >
            Cancel
          </Button>
        )}
      </Box>
    </Box>

    {!editingParticipant && (
      <FormControlLabel
        control={
          <Checkbox
            checked={form.consentConfirmed}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                consentConfirmed: event.target.checked,
              }))
            }
          />
        }
        label="I confirm that the recipient has consented to receive WhatsApp messages."
        sx={{ mt: 1, "& .MuiFormControlLabel-label": { fontSize: "14px" } }}
      />
    )}
  </Stack>

 
</Box>

     <Box sx={{ width: "100%", pt: 2, borderTop: "1px solid #E9E9EE" }}>
        <Typography sx={{ mb: 0.5, fontSize: "15px", fontWeight: 600, color: "#1a1a1a" }}>
          Participants
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 2, fontSize: 14 }}>
          Total Participants: {participants.length}
        </Typography>

        <TextField
          fullWidth
          size="small"
          placeholder="Search by Name, Phone, Status or Consent"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <>
           <TableContainer sx={{ overflowX: "auto", width: "100%", mb: 1 }}>
              <Table size="small" sx={{ minWidth: 780 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>WhatsApp Number</TableCell>
                    <TableCell>Consent</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Added On</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {paginatedParticipants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        No WhatsApp participants found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedParticipants.map((participant) => (
                      <TableRow key={participant.id} hover>
                        <TableCell>
                          <Typography fontWeight={600} fontSize={14}>
                            {participant.participant_name}
                          </Typography>
                        </TableCell>

                        <TableCell>+{participant.phone_number}</TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={
                              participant.consent_confirmed
                                ? "Confirmed"
                                : "Not Confirmed"
                            }
                            color={
                              participant.consent_confirmed
                                ? "success"
                                : "warning"
                            }
                            variant="outlined"
                          />
                        </TableCell>

                        <TableCell>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.5}
                          >
                            <Switch
                              size="small"
                              color="success"
                              checked={participant.is_active}
                              disabled={updatingId === participant.id}
                              onChange={() => handleToggle(participant)}
                              inputProps={{
                                "aria-label": "Enable WhatsApp participant",
                              }}
                            />

                            <Chip
                              size="small"
                              label={
                                participant.is_active ? "Active" : "Inactive"
                              }
                              color={
                                participant.is_active ? "success" : "default"
                              }
                            />
                          </Stack>
                        </TableCell>

                        <TableCell>
                          {participant.created_at
                            ? new Date(participant.created_at).toLocaleString()
                            : "N/A"}
                        </TableCell>

                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={0.5}
                            justifyContent="flex-end"
                          >
                            <Tooltip title="Edit participant">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleEdit(participant)}
                              >
                                <EditOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Button
                              color="error"
                              variant="outlined"
                              size="small"
                              startIcon={<DeleteOutlineIcon />}
                              onClick={() => setDeleteTarget(participant)}
                            >
                              Remove
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {pageCount > 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <Pagination
                  count={pageCount}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Box>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => !saving && setDeleteTarget(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Remove WhatsApp participant?</DialogTitle>

        <DialogContent>
          <Typography>
            {deleteTarget?.participant_name} will no longer receive WhatsApp
            research calls.
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={saving}>
            Cancel
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={saving}
          >
            {saving ? "Removing..." : "Remove"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WhatsAppParticipants;