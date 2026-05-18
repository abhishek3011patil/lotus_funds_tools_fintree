import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TextField,
  InputAdornment,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import TelegramSearch from "../../pages_admin/Admin common/TelegramSearch";

interface Participant {
  id: string;

  phone_number?: string;

  telegram_client_name?: string;

  telegram_user_id?: string | number;

  entity_type?: "USER" | "GROUP" | "CHANNEL";
}

const AddParticipant: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchParticipants = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/telegram/my-participants`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // ✅ Handle invalid response
      if (!res.ok) {
        throw new Error("Failed to fetch participants");
      }

      const data = await res.json();

      setParticipants(data.data || []);

    } catch (err) {
      console.error("FETCH PARTICIPANTS ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  // ✅ Safe filtering
  const filteredParticipants = participants.filter((participant) => {
    const query = searchQuery.toLowerCase();

    const phone =
      participant.phone_number?.toLowerCase() || "";

    const username =
      participant.telegram_client_name?.toLowerCase() || "";

    const telegramId =
      String(participant.telegram_user_id || "").toLowerCase();

    return (
      phone.includes(query) ||
      username.includes(query) ||
      telegramId.includes(query)
    );
  });

  return (
    <Box
      sx={{
        mt: 4,
        width: "100%",
      }}
    >
      <Typography fontWeight={700} sx={{ fontSize: 18 }}>
        View Participant
      </Typography>

      {/* Participants Section */}
      <Box sx={{ mt: 2 }}>
        <Typography fontWeight={700} sx={{ mb: 1, fontSize: 16 }}>
          Participants
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 1, mt: 1, fontSize: 14 }}>
          Search User
        </Typography>

        <TextField
          fullWidth
          size="small"
          placeholder="Search by Phone or Username"
          value={searchQuery}
          onChange={(e) =>
            setSearchQuery(e.target.value)
          }
          sx={{
            mb: 2,
            "& .MuiInputLabel-root": { fontSize: 14 },
            "& .MuiInputBase-input": { fontSize: 15 },
          }}
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
          <TableContainer
            component={Paper}
            sx={{ overflowX: "auto" }}
          >
            <Table size="small" sx={{ minWidth: 400 }}>
              <TableHead>
  <TableRow>
    <TableCell>Type</TableCell>
    <TableCell>Phone</TableCell>
    <TableCell>Username</TableCell>
    <TableCell>User ID</TableCell>
  </TableRow>
</TableHead>

              <TableBody>
  {filteredParticipants.length === 0 ? (
    <TableRow>
      <TableCell colSpan={4} align="center">
        No participants found
      </TableCell>
    </TableRow>
  ) : (
    filteredParticipants.map((participant) => {
      const type = participant.entity_type || "USER";

      return (
        <TableRow key={participant.id}>
          
          {/* TYPE */}
          <TableCell>
            {type === "GROUP"
              ? "👥 Group"
              : type === "CHANNEL"
              ? "📢 Channel"
              : "👤 User"}
          </TableCell>

          {/* PHONE */}
          <TableCell>
            {type === "USER"
              ? participant.phone_number || "N/A"
              : type === "GROUP"
              ? "Group"
              : "Channel"}
          </TableCell>

          {/* USERNAME */}
          <TableCell>
            {participant.telegram_client_name || "N/A"}
          </TableCell>

          {/* TELEGRAM ID */}
          <TableCell>
            {participant.telegram_user_id || "N/A"}
          </TableCell>
        </TableRow>
      );
    })
  )}
</TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Add New Participant */}
      <Box sx={{ mt: 3 }}>
        <Typography fontWeight={700} sx={{ mb: 1, fontSize: 16 }}>
          Add New Participant
        </Typography>

        <TelegramSearch
          onSaved={fetchParticipants}
        />
      </Box>
    </Box>
  );
};

export default AddParticipant;