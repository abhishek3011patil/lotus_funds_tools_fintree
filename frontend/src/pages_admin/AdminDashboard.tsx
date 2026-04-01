
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
  status: "Pending" | "Approved" | "Rejected" | string;
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

  const [participant, setParticipant] = useState<{
    telegram_id: string;
    telegram_client_name: string;
  } | null>(null);
  const [participantsList, setParticipantsList] = useState<
    Array<{
      telegram_id: string;
      telegram_client_name: string;
    }>
  >([]);
  const [participantUsername, setParticipantUsername] = useState("");
  const [participantLoading, setParticipantLoading] = useState(false);
  const [participantSearchQuery, setParticipantSearchQuery] = useState("");

  const navigate = useNavigate();

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/api/registration/all-registrations"
        );
        const data = await response.json();

        const formatted: AdminRow[] = data.map((item: any) => ({
          id: item.id,
          name: `${item.first_name || ""} ${item.surname || ""}`.trim(),
          phone: item.mobile || "",

          profile: item.profile_image,
          pan: item.pan_card,
          address: item.address_proof_document,
          sebi: item.sebi_certificate,
          sebi_receipt: item.sebi_receipt,
          nism: item.nism_certificate,
          cheque: item.cancelled_cheque,

          telegram: item.telegram_client_name || "",
          telegram_id: item.telegram_user_id
            ? String(item.telegram_user_id)
            : item.telegram_id
              ? String(item.telegram_id)
              : "",

          status: item.status || "Pending",
          rejectionReason: item.rejection_reason || "",

          // Keep exactly the same time/age UI logic as AdminApproval/AdminRecommendations
          "age/time": "Just now",
        }));

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
    (row) => row.status.toLowerCase() === "approved"
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

    const url = `http://localhost:3000/uploads/${encodeURIComponent(file)}`;
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

  const fetchParticipants = async (selectTelegramId?: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Authorization token missing. Please login again.");
      return;
    }

    setParticipantLoading(true);
    try {
      const res = await fetch(
        `http://localhost:3000/api/telegram/participants`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Failed to load participants");
        return;
      }

      const list: Array<{
        telegram_id: string;
        telegram_client_name: string;
      }> = Array.isArray(data.participants) ? data.participants : [];
      setParticipantsList(list);

      const found = selectTelegramId
        ? list.find((p) => String(p.telegram_id) === String(selectTelegramId))
        : null;

      const selected = found || list[0] || null;

      setParticipant(selected);
      setParticipantUsername(selected?.telegram_client_name || "");
      setParticipantSearchQuery("");
    } catch (error: any) {
      console.error(error);
      alert("Failed to load participants");
    } finally {
      setParticipantLoading(false);
    }
  };

  const handleViewParticipant = (row: AdminRow) => {
    setPanelMode("participant");
    setSelectedRA(row);
    if (row.telegram_id) {
      fetchParticipants(row.telegram_id);
    } else {
      fetchParticipants();
    }
  };

  const handleUpdateParticipant = async () => {
    if (!participant) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Authorization token missing. Please login again.");
      return;
    }

    const res = await fetch(
      `http://localhost:3000/api/telegram/participant/${encodeURIComponent(
        participant.telegram_id
      )}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          telegram_client_name: participantUsername,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data?.error || "Failed to update participant");
      return;
    }

    alert("Participant updated successfully");

    // Refresh list and re-select current participant
    await fetchParticipants(participant.telegram_id);
  };

  const handleDeleteParticipant = async () => {
    if (!participant) return;

    const ok = window.confirm(
      "Are you sure you want to delete this Telegram participant?"
    );
    if (!ok) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Authorization token missing. Please login again.");
      return;
    }

    const res = await fetch(
      `http://localhost:3000/api/telegram/participant/${encodeURIComponent(
        participant.telegram_id
      )}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data?.error || "Failed to delete participant");
      return;
    }

    alert("Participant deleted successfully");
    setPanelMode("ra");

    // Refresh list
    await fetchParticipants();
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
                    label={row.status}
                    color={statusColor(row.status) as any}
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
                    <Typography variant="body2">
                      {row.telegram || ""}
                    </Typography>
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
            width: 450,
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

                <Button
                  variant="contained"
                  color="warning"
                  fullWidth
                  onClick={() => handleEdit(selectedRA.id)}
                >
                  Edit
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Typography fontWeight={600}>View Participant</Typography>
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
                  sx={{ mb: 1 }}
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
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Phone</TableCell>
                        <TableCell>Username</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {participantsList
                        .filter((p) => {
                          const q = participantSearchQuery.trim().toLowerCase();
                          if (!q) return true;
                          return (
                            String(p.telegram_id || "")
                              .toLowerCase()
                              .includes(q) ||
                            String(p.telegram_client_name || "")
                              .toLowerCase()
                              .includes(q)
                          );
                        })
                        .length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} align="center">
                            No participants found
                          </TableCell>
                        </TableRow>
                      ) : (
                        participantsList
                          .filter((p) => {
                            const q = participantSearchQuery
                              .trim()
                              .toLowerCase();
                            if (!q) return true;
                            return (
                              String(p.telegram_id || "")
                                .toLowerCase()
                                .includes(q) ||
                              String(p.telegram_client_name || "")
                                .toLowerCase()
                                .includes(q)
                            );
                          })
                          .map((p) => (
                            <TableRow
                              key={p.telegram_id}
                              hover
                              selected={participant?.telegram_id === p.telegram_id}
                              onClick={() => {
                                setParticipant(p);
                                setParticipantUsername(
                                  p.telegram_client_name || ""
                                );
                              }}
                              sx={{ cursor: "pointer" }}
                            >
                              <TableCell>{p.telegram_id}</TableCell>
                              <TableCell>{p.telegram_client_name}</TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </Box>

              {/* Create */}
              <Box sx={{ mt: 2 }}>
                <Typography fontWeight={600} sx={{ mb: 1 }}>
                  Add New Participant
                </Typography>
                <TelegramSearch
                  onSaved={(telegramUserId) => {
                    if (telegramUserId) {
                      fetchParticipants(String(telegramUserId));
                    }
                  }}
                />
              </Box>

              {/* Update / Delete */}
              <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
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