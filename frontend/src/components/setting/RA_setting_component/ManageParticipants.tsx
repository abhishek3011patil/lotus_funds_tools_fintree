import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Chip,
  InputAdornment,
  Pagination,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

interface Participant {
  id: string;
  phone_number?: string;
  telegram_client_name?: string;
  telegram_user_id?: string | number;
  entity_type?: "USER" | "GROUP" | "CHANNEL";
}

const ManageParticipants: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [telegramUsername, setTelegramUsername] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);

  const rowsPerPage = 5;

  const fetchParticipants = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/telegram/my-participants`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setParticipants(res.data.data || []);
    } catch (err) {
      console.error("FETCH PARTICIPANTS ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddParticipant = async () => {
    if (!telegramUsername.trim()) {
      alert("Enter Telegram username, group, or channel");
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("token");

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/telegram/add-participant`,
        {
          telegram_client_name: telegramUsername.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setTelegramUsername("");
      await fetchParticipants();
      alert("Participant added successfully ✅");
    } catch (err: any) {
      console.error("ADD PARTICIPANT ERROR:", err);
      alert(err?.response?.data?.message || "Failed to add participant");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this participant?")) return;

    try {
      const token = localStorage.getItem("token");

      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/telegram/participant/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchParticipants();
    } catch (err: any) {
      console.error("DELETE PARTICIPANT ERROR:", err);
      alert(err?.response?.data?.message || "Failed to remove participant");
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  const filteredParticipants = participants.filter((participant) => {
    const query = searchQuery.toLowerCase();

    const phone = participant.phone_number?.toLowerCase() || "";
    const username = participant.telegram_client_name?.toLowerCase() || "";
    const telegramId = String(participant.telegram_user_id || "").toLowerCase();
    const type = participant.entity_type?.toLowerCase() || "";

    return (
      phone.includes(query) ||
      username.includes(query) ||
      telegramId.includes(query) ||
      type.includes(query)
    );
  });

  const pageCount = Math.ceil(filteredParticipants.length / rowsPerPage);

  const paginatedParticipants = filteredParticipants.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  return (
    <Box sx={{ mt: 4, width: "100%" }}>
      <Typography fontWeight={700} sx={{ fontSize: 18, mb: 2 }}>
        Manage Telegram Participants
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography fontWeight={700} sx={{ mb: 1, fontSize: 16 }}>
          Add New Participant
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 1, fontSize: 14 }}>
          Enter Telegram username, group username, or channel username.
        </Typography>

        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="@username / group / channel"
            value={telegramUsername}
            onChange={(e) => setTelegramUsername(e.target.value)}
          />

          <Button
            variant="contained"
            onClick={handleAddParticipant}
            disabled={saving}
            sx={{ whiteSpace: "nowrap" }}
          >
            {saving ? "Adding..." : "Add"}
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography fontWeight={700} sx={{ mb: 0.5, fontSize: 16 }}>
          Participants
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 2, fontSize: 14 }}>
          Total Participants: {participants.length}
        </Typography>

        <TextField
          fullWidth
          size="small"
          placeholder="Search by Phone, Username, Telegram ID or Type"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
          <Typography>Loading...</Typography>
        ) : (
          <>
            <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Username / Name</TableCell>
                    <TableCell>Telegram ID</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {paginatedParticipants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No participants found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedParticipants.map((participant) => {
                      const type = participant.entity_type || "USER";

                      return (
                        <TableRow key={participant.id}>
                          <TableCell>
                            <Chip
                              size="small"
                              label={
                                type === "GROUP"
                                  ? "👥 Group"
                                  : type === "CHANNEL"
                                  ? "📢 Channel"
                                  : "👤 User"
                              }
                              color={
                                type === "GROUP"
                                  ? "info"
                                  : type === "CHANNEL"
                                  ? "secondary"
                                  : "default"
                              }
                            />
                          </TableCell>

                          <TableCell>
                            {type === "USER"
                              ? participant.phone_number || "N/A"
                              : type}
                          </TableCell>

                          <TableCell>
                            {participant.telegram_client_name || "N/A"}
                          </TableCell>

                          <TableCell>
                            {participant.telegram_user_id || "N/A"}
                          </TableCell>

                          <TableCell align="right">
                            <Button
                              color="error"
                              variant="outlined"
                              size="small"
                              startIcon={<DeleteOutlineIcon />}
                              onClick={() => handleDelete(participant.id)}
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
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
      </Paper>
    </Box>
  );
};

export default ManageParticipants;