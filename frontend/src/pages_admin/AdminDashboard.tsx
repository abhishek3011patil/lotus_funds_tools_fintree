import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import Pagination from "@mui/material/Pagination";
import PaginationItem from "@mui/material/PaginationItem";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useNavigate } from "react-router-dom";

import TelegramSearch from "./Admin common/TelegramSearch";

type AdminRow = {
  id: string;
  userId?: string;
  raId?: string;
  name: string;
  phone: string;

  profile?: string;
  pan?: string;
  address?: string;
  sebi?: string;
  sebi_receipt?: string;
  nism?: string;
  cheque?: string;

  telegram?: string;
  telegram_id?: string;
  status: string;
  raStatus?: string;
  rejectionReason?: string;

  "age/time": string;
};

const ITEMS_PER_PAGE = 10;

const AdminDashboard = () => {
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const [selectedRA, setSelectedRA] = useState<AdminRow | null>(null);
  const [panelMode, setPanelMode] = useState<"ra" | "participant">("ra");

  type Participant = {
  id: string; // ✅ DB ID (IMPORTANT)
  telegram_user_id: number;
  telegram_client_name: string;
  phone_number?: string;
};

const [participantsList, setParticipantsList] = useState<Participant[]>([]);
const [participant, setParticipant] = useState<Participant | null>(null);
  const [participantUsername, setParticipantUsername] = useState("");
  const [participantLoading, setParticipantLoading] = useState(false);
  const [participantSearchQuery, setParticipantSearchQuery] = useState("");

  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: string;
    value: string;
  } | null>(null);

  const navigate = useNavigate();

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/registration/all-registrations-active-users`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errBody = await response.json();
          console.error("Error response:", errBody);
          return;
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          console.error("Expected array but got:", data);
          return;
        }

        const formatted: AdminRow[] = data.map((item: any) => ({
          id: item.id || item.user_id,
          name:
            `${item.first_name || ""} ${item.surname || ""}`.trim() ||
            item.name ||
            "N/A",
          phone: item.mobile || "",
          profile: item.profile_image,
          pan: item.pan_card,
          address: item.address_proof_document,
          sebi: item.sebi_certificate,
          sebi_receipt: item.sebi_receipt,
          nism: item.nism_certificate,
          cheque: item.cancelled_cheque,
          telegram_id: item.telegram_user_id
            ? String(item.telegram_user_id)
            : "",
          status: item.user_status,
          raStatus: item.ra_status,
          rejectionReason: item.rejection_reason || "",
          "age/time": "Just now"
        }));
        console.log("RA DATA:", data);

        console.log(formatted);
        setRows(formatted);
      } catch (error) {
        console.error("Failed to load admin data:", error);
      }
    };

    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  /* ================= STATUS COLOR ================= */
  const statusColor = (status: AdminRow["status"]) => {
    const s = status.toLowerCase();

    if (s === "approved") return "success";
    if (s === "rejected") return "error";
    if (s === "pending") return "warning";

    return "default";
  };

  /* ================= FILTER (Approved only) ================= */
  const approvedRows = rows.filter(
    (row) =>
      (row.raStatus || "").toLowerCase() === "approved" ||
      (row.status || "").toLowerCase() === "active"
  );

  const filteredRows = approvedRows.filter((row) => {
    const query = searchQuery.toLowerCase();
    return (
      row.name.toLowerCase().includes(query) ||
      row.phone.includes(query) ||
      (row.telegram?.toLowerCase().includes(query) ?? false)
    );
  });

  const pageCount = Math.ceil(filteredRows.length / ITEMS_PER_PAGE);
  const paginatedRows = filteredRows.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  /* ================= FILE VIEW ================= */
  const openFile = (file?: string) => {
    if (!file || file.trim() === "") {
      alert("File not uploaded");
      return;
    }

    const url = `${import.meta.env.VITE_API_URL}/uploads/${encodeURIComponent(file)}`;
    window.open(url, "_blank");
  };

  /* ================= EDIT ================= */
  const handleEdit = (id: string) => {
    navigate(`/admin/edit-ra/${id}`);
  };

  /* ================= TELEGRAM LINK ================= */
  const getTelegramLink = (telegram?: string) => {
    const t = (telegram || "").trim();
    if (!t) return null;

    // If you already have @username
    if (t.startsWith("@")) return `https://t.me/${t.slice(1)}`;

    // If backend provides username without "@"
    if (/^[a-zA-Z0-9_]{5,}$/.test(t)) return `https://t.me/${t}`;

    // If backend provides a full link already
    if (t.includes("t.me/")) return t;

    return null;
  };

  const closePanel = () => {
    setSelectedRA(null);
    setPanelMode("ra");
    setParticipant(null);
    setParticipantUsername("");
  };

  const fetchParticipants = async (raId: string) => {
  if (!raId) {
    console.error("❌ RA ID is missing");
    return;
  }

  try {
    setParticipantLoading(true);

    const token = localStorage.getItem("token");

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/telegram/ra/${raId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await res.json();

    if (!res.ok) {
      console.error(result);
      setParticipantsList([]);
      return;
    }

    setParticipantsList(result.data || []);

  } catch (err) {
    console.error(err);
    setParticipantsList([]);
  } finally {
    setParticipantLoading(false);
  }
};

  const handleViewParticipant = (row: AdminRow) => {
    setPanelMode("participant");
    setSelectedRA(row);
    setParticipant(null);
setParticipantUsername("");

    fetchParticipants(row.userId || row.id);
  };

  const handleUpdateParticipant = async () => {
  if (!participant?.id) return;

  const token = localStorage.getItem("token");

  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/api/telegram/participant/${encodeURIComponent(participant.id)}`, // ✅ FIX
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        telegram_client_name: participant.telegram_client_name,
        phone_number: participant.phone_number,
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    alert(data?.message || "Update failed");
    return;
  }

  alert("Updated successfully");

  setParticipantsList((prev) =>
    prev.map((p) => (p.id === participant.id ? data.data : p))
  );
};

  const handleDeleteParticipant = async () => {
  if (!participant?.id) {
    alert("Invalid participant ID");
    return;
  }

  const ok = window.confirm("Are you sure?");
  if (!ok) return;

  const token = localStorage.getItem("token");

  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/api/telegram/participant/${encodeURIComponent(participant.id)}`, // ✅ FIX
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await res.json();

  if (!res.ok) {
    alert(data?.message || "Delete failed");
    return;
  }

  alert("Deleted successfully");

  setParticipant(null);

  if (selectedRA) {
    await fetchParticipants(selectedRA.id);
  }
};

  const handleInlineUpdate = async (p: Participant, field: keyof Participant) => {
  const newValue = editingCell?.value.trim();

  if (!newValue || newValue === p[field]) {
    setEditingCell(null);
    return;
  }

  try {
    const token = localStorage.getItem("token");

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/telegram/participant/${encodeURIComponent(p.id)}`, // ✅ FIX
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: newValue }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data?.message || "Update failed");
      return;
    }

    setParticipantsList((prev) =>
      prev.map((item) =>
        item.id === p.id ? { ...item, [field]: newValue } : item
      )
    );

    setEditingCell(null);

  } catch (error) {
    console.error(error);
    alert("Update failed");
  }
};

  const renderEditableCell = (
    p: Participant,
    field: keyof Participant,
    value: any
  ) => {
    // Use telegram_user_id instead of id to ensure uniqueness
    const isEditing =
  editingCell !== null &&
  editingCell.id === String(p.id) && // ✅ FIX
  editingCell.field === field;

    if (isEditing) {
      return (
        <TextField
          size="small"
          value={editingCell.value}
          autoFocus
          onClick={(e) => e.stopPropagation()}
          onChange={(e) =>
            setEditingCell((prev) =>
              prev ? { ...prev, value: e.target.value } : prev
            )
          }
          onBlur={() => handleInlineUpdate(p, field)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleInlineUpdate(p, field);
            if (e.key === "Escape") setEditingCell(null);
          }}
        />
      );
    }

    return (
      <span
        style={{ display: "block", minHeight: "20px", cursor: "pointer" }}
        onClick={(e) => {
          e.stopPropagation();
          setEditingCell({
  id: String(p.id), // ✅ FIX
  field,
  value: value || "",
});
        }}
      >
        {value || "N/A"}
      </span>
    );
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* <Typography variant="h5" fontWeight={600}>
        Admin Recommendations
      </Typography> */}

      {/* SEARCH */}
      <TextField
        placeholder="Search by name or mobile"
        fullWidth
        size="small"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      {/* TABLE */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead sx={{ backgroundColor: "#f6f6f6" }}>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Age / Time</TableCell>
              <TableCell align="right">Action</TableCell>
              <TableCell>Telegram</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>

                <TableCell>
                  <Chip
                    size="small"
                    label={row.raStatus || "N/A"}
                    color={statusColor(row.raStatus || "") as any}
                  />
                </TableCell>
                <TableCell>{row["age/time"]}</TableCell>

                <TableCell align="right">
                  <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setPanelMode("ra");
                        setSelectedRA(row);
                      }}
                    >
                      View
                    </Button>
                  </Box>
                </TableCell>

                <TableCell>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: 0.75,
                    }}
                  >
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleViewParticipant(row)}
                    >
                      View Participant
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}

            {filteredRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No matching results
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* SIDE PANEL */}
      {selectedRA && (
        <Paper
          elevation={4}
          sx={{
            position: "fixed",
            right: 20,
            top: 120,
            width: 600,   // 👈 increased from 450 → 800
            p: 3,
            borderRadius: 2,
            maxHeight: "calc(100vh - 140px)",
            overflowY: "auto",
          }}
        >
          <Button
            size="small"
            onClick={closePanel}
            sx={{ position: "absolute", right: 10, top: 10 }}
          >
            X
          </Button>

          {panelMode === "ra" ? (
            <>
              <Typography fontWeight={600}>RA Verification</Typography>

              <Typography sx={{ mt: 1 }}>{selectedRA.name}</Typography>
              <Typography color="text.secondary">{selectedRA.phone}</Typography>
              <Typography color="text.secondary">
                Telegram: {selectedRA.telegram || ""}
              </Typography>

              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                <Button onClick={() => openFile(selectedRA.profile)}>
                  View Profile
                </Button>
                <Button onClick={() => openFile(selectedRA.pan)}>View PAN</Button>
                <Button onClick={() => openFile(selectedRA.address)}>
                  View Address
                </Button>
                <Button onClick={() => openFile(selectedRA.sebi)}>View SEBI</Button>
                <Button onClick={() => openFile(selectedRA.sebi_receipt)}>
                  View SEBI Receipt
                </Button>
                <Button onClick={() => openFile(selectedRA.nism)}>View NISM</Button>
                <Button onClick={() => openFile(selectedRA.cheque)}>View Cheque</Button>
              </Box>

              <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={() => {
                    const link = getTelegramLink(selectedRA.telegram);
                    if (!link) {
                      alert("Telegram link is not available for this user.");
                      return;
                    }
                    window.open(link, "_blank", "noopener,noreferrer");
                  }}
                >
                  Join Telegram
                </Button>

                {/* <Button
                  variant="contained"
                  color="warning"
                  fullWidth
                  onClick={() => handleEdit(selectedRA.id)}
                >
                  Edit
                </Button> */}
              </Box>
            </>
          ) : (
            <>
              <Box
                sx={{
                  width: "95%",   // 👈 takes almost full screen
                  mx: "auto",
                }}
              >
                <Typography fontWeight={600}>View Participant</Typography>

                {/* Participants Section */}
                <Box sx={{ mt: 2 }}>
                  <Typography fontWeight={600} sx={{ mb: 1 }}>
                    Participants
                  </Typography>

                  <Typography color="text.secondary" sx={{ mb: 1, mt: 1 }}>
                    Search User
                  </Typography>

                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search by Phone or Username"
                    value={participantSearchQuery}
                    onChange={(e) => setParticipantSearchQuery(e.target.value)}
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  {participantLoading ? (
                    <Typography>Loading...</Typography>
                  ) : (
                    <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
                      <Table size="small" sx={{ minWidth: 400 }}>
                        <TableHead>
                          <TableRow>
                            <TableCell>Phone</TableCell>
                            <TableCell>Username</TableCell>
                            <TableCell>Userid</TableCell>
                          </TableRow>
                        </TableHead>

                        <TableBody>
                          {participantsList
                            .filter((p) => {
                              const q = participantSearchQuery.trim().toLowerCase();
                              if (!q) return true;
                              return (
                                String(p.phone_number || "").toLowerCase().includes(q) ||
                                String(p.telegram_client_name || "").toLowerCase().includes(q) ||
                                String(p.telegram_user_id || "").toLowerCase().includes(q)
                              );
                            })
                            .map((p) => {
                              // Check editing based on telegram_user_id
                              const isRowEditing = editingCell?.id === String(p.telegram_user_id);

                              return (
                                <TableRow
  key={p.id} // ✅ correct
  selected={participant?.id === p.id} // ✅ FIX
  onClick={() => {
    if (isRowEditing) return;
    setParticipant(p);
    setParticipantUsername(p.telegram_client_name || "");
  }}
  sx={{ cursor: "pointer" }}
>
                                  <TableCell>
                                    {renderEditableCell(p, "phone_number", p.phone_number)}
                                  </TableCell>

                                  <TableCell>
                                    {renderEditableCell(
                                      p,
                                      "telegram_client_name",
                                      p.telegram_client_name
                                    )}
                                  </TableCell>

                                  <TableCell>
                                    {p.telegram_user_id}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>

                {/* Add New Participant */}
                <Box sx={{ mt: 3 }}>
  <Typography fontWeight={600} sx={{ mb: 1 }}>
    Add New Participant
  </Typography>

  {selectedRA && (
    <TelegramSearch
      raId={selectedRA.id}   // ✅ correct
      onSaved={() => {
        fetchParticipants(selectedRA.id); // ✅ refresh correctly
      }}
    />
  )}
</Box>

                {/* Update / Delete Buttons */}
                <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={!participant || participantLoading}
                    onClick={handleUpdateParticipant}
                  >
                    Update
                  </Button>

                  <Button
                    variant="contained"
                    color="error"
                    fullWidth
                    disabled={!participant || participantLoading}
                    onClick={handleDeleteParticipant}
                  >
                    Delete
                  </Button>
                </Box>
              </Box>
            </>
          )}
        </Paper>
      )}

      {/* PAGINATION */}
      {pageCount > 1 && (
        <Pagination
          sx={{ alignSelf: "center", mt: 2 }}
          count={pageCount}
          page={page}
          onChange={(_, value) => setPage(value)}
          renderItem={(item) => (
            <PaginationItem
              slots={{ previous: ArrowBackIcon, next: ArrowForwardIcon }}
              {...item}
            />
          )}
        />
      )}
    </Box>
  );
};

export default AdminDashboard;