import React, { useEffect, useRef, useState } from "react";
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
import * as XLSX from "xlsx";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import TelegramIcon from "@mui/icons-material/Telegram";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleExcelUpload = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const data = await file.arrayBuffer();

    const workbook = XLSX.read(data, {
      type: "array",
    });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const participants = XLSX.utils.sheet_to_json(sheet);

    const token = localStorage.getItem("token");

    const res = await axios.post(
  `${import.meta.env.VITE_API_URL}/api/telegram/upload-excel`,
  {
    participants,
  },
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

const result = res.data;

// Refresh list
await fetchParticipants();

let message = "";

// Successfully added count
if (result.successCount !== undefined) {
  message += `✅ Added: ${result.successCount}\n`;
}

// Failed count
if (result.failedCount !== undefined) {
  message += `❌ Failed: ${result.failedCount}\n`;
}

// Show failed participants
if (Array.isArray(result.failedParticipants) && result.failedParticipants.length) {
  message += "\nFailed Participants:\n";

  result.failedParticipants.forEach((p: any) => {
    message += `• ${p.telegram_client_name || p.username || "Unknown"} - ${
      p.reason || "Unknown error"
    }\n`;
  });
}

alert(message || "Upload completed");
  } catch (err: any) {
    console.error(err);
    alert(err?.response?.data?.message || "Upload failed");
  }

  e.target.value = "";
};

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
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 4 }}>
      <Typography 
        variant="h6" 
        sx={{ 
          fontSize: "20px", 
          fontWeight: 600, 
          color: "#1a1a1a", 
          fontFamily: "sans-serif",
          mb: -1 
        }}
      >
        Manage Telegram Participants
      </Typography>

      {/* Section 1: Add New Participant */}
  
<Box sx={{ 
  width: "100%", 
  p: 3, 
  border: "1px solid #E9E9EE", 
  borderRadius: 2, 
  backgroundColor: "#fafafa" 
}}>
  <Typography fontWeight={700} sx={{ mb: 0.5, fontSize: 16 }}>
    Add New Participant
  </Typography>

  <Typography color="text.secondary" sx={{ mb: 2, fontSize: 14 }}>
    Enter Telegram username, group username, or channel username.
  </Typography>

  <Box sx={{ display: "flex", gap: 1, maxWidth: { xs: "100%", md: "75%" } }}>
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
      sx={{ whiteSpace: "nowrap", textTransform: "none", px: 3 }}
    >
      {saving ? "Adding..." : "Add"}
    </Button>

    <Button
      variant="outlined"
      startIcon={<UploadFileIcon />}
      onClick={() => fileInputRef.current?.click()}
      sx={{ whiteSpace: "nowrap", textTransform: "none" }}
    >
      Add Excel
    </Button>

     <Button
  variant="outlined"
  
  onClick={() => window.open("/excel_sheets/Telegram sheets.xlsx", "_blank")}
>
  Download Excel
</Button>

    <input
      ref={fileInputRef}
      type="file"
      accept=".xlsx,.xls"
      hidden
      onChange={handleExcelUpload}
    />
  </Box>
</Box>

      {/* Section 2: Participants List */}
      <Box sx={{ width: "100%" }}>
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
          <Typography sx={{ mt: 2, fontSize: 14, color: "text.secondary" }}>Loading...</Typography>
        ) : (
          <>
            <TableContainer component={Paper} sx={{ overflowX: "auto", boxShadow: "none", border: "1px solid #E9E9EE" }}>
              <Table size="small" sx={{ minWidth: 650 }}>
                <TableHead sx={{ backgroundColor: "#f9f9fb" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Username / Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Telegram ID</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Action</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {paginatedParticipants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3, color: "text.secondary" }}>
                        No participants found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedParticipants.map((participant) => {
                      const type = participant.entity_type || "USER";

                      return (
                        <TableRow key={participant.id} sx={{ "&:last-child cell, &:last-child th": { border: 0 } }}>
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
                              sx={{ fontWeight: 500 }}
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
                              sx={{ textTransform: "none" }}
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
              <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                <Pagination
                  count={pageCount}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                  size="small"
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default ManageParticipants;