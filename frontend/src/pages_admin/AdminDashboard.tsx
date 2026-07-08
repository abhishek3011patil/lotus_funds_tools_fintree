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
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import {ToggleButton, ToggleButtonGroup} from "@mui/material";

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
 suspendReason?: string;
  "age/time": string;
  pending_requests: number;
};

const ITEMS_PER_PAGE = 10;

const AdminDashboard = () => {
  
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [filterTab, setFilterTab] = useState<"all" | "approved" | "requests">("all");

  const [selectedRA, setSelectedRA] = useState<AdminRow | null>(null);
  const [panelMode, setPanelMode] = useState<"ra" | "participant">("ra");
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendedPage, setSuspendedPage] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
const [confirmType, setConfirmType] = useState<"RA" | "BROKER" | null>(null);
const [confirmId, setConfirmId] = useState<string | null>(null);


  type Participant = {
  id: string;

  telegram_user_id: number | string;

  telegram_client_name: string;

  phone_number?: string;

  entity_type?: "USER" | "GROUP" | "CHANNEL";
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
 const loadRegistrations = async () => {
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
    console.log("ACTIVE USERS API:", data);

    if (!Array.isArray(data)) {
      console.error("Expected array but got:", data);
      return;
    }

    //console.log("Raw data from API:", data);

    const formatted: AdminRow[] = data.map((item: any) => ({
      id: item.ra_id || item.broker_id,

      userId: item.user_id,

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
      suspendReason: item.suspended_reason || "",
      pending_requests: Number(item.pending_requests ?? 0),
      "age/time": "Just now",
    }));

    const sortedFormatted = formatted.sort((a, b) => {
  return Number(b.pending_requests || 0) - Number(a.pending_requests || 0);
});

setRows(sortedFormatted);

  } catch (error) {
    console.error(
      "Failed to load admin data:",
      error
    );
  }
};

const handleActivate = async (
  userId: number
) => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/admin/activate/ra/${userId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      alert(
        result.message ||
          "Failed to activate RA"
      );
      return;
    }

    alert("RA activated successfully");

    // refresh table
    loadRegistrations();

  } catch (error) {
    console.error(error);

    alert("Failed to activate RA");
  }
};

useEffect(() => {
  loadRegistrations();
}, []);

  useEffect(() => {
    setPage(1);
    setSuspendedPage(1);
  }, [searchQuery]);

  /* ================= STATUS COLOR ================= */
 const statusColor = (status: AdminRow["status"]) => {
  const s = status.toLowerCase();

  if (s === "approved") return "success";
  if (s === "active") return "success";
  if (s === "rejected") return "error";
  if (s === "pending") return "warning";
  if (s === "suspended") return "secondary";

  return "default";
};

  /* ================= FILTER (Approved only) ================= */
  const approvedRows = rows.filter(
    (row) =>
      (row.raStatus || "").toLowerCase() === "approved" ||
      (row.status || "").toLowerCase() === "active"
  );

const suspendedRows = rows.filter(
  (row) =>
    (row.status || "").toLowerCase() === "suspended" ||
    (row.raStatus || "").toLowerCase() === "suspended"
);

const filteredRows = approvedRows.filter((row) => {
  const query = searchQuery.toLowerCase().trim();

  // 1. Partial/Full Keyword Search Overrides
  if (query && "approved".startsWith(query)) return true;
  if (query && "requests".startsWith(query)) return Number(row.pending_requests) > 0;

  // 2. Toggle Tab Filter
  if (filterTab === "requests" && Number(row.pending_requests) <= 0) return false;

  // 3. Text Search (Name, Phone, Telegram)
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

  const filteredSuspendedRows = suspendedRows.filter((row) => {
  const query = searchQuery.toLowerCase();

  

  return (
    row.name.toLowerCase().includes(query) ||
    row.phone.includes(query)
  );
});

const suspendedPageCount = Math.ceil(
  filteredSuspendedRows.length / ITEMS_PER_PAGE
);

const paginatedSuspendedRows = filteredSuspendedRows.slice(
  (suspendedPage - 1) * ITEMS_PER_PAGE,
  suspendedPage * ITEMS_PER_PAGE
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
    console.error(" RA ID is missing");
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


    // suspended logic


    return (
      <span
        style={{ display: "block", minHeight: "20px", cursor: "pointer" }}
        onClick={(e) => {
  e.stopPropagation();

  // ✅ SET SELECTED PARTICIPANT
  setParticipant(p);

  // ✅ START EDITING
  setEditingCell({
    id: String(p.id),
    field,
    value: value || "",
  });
}}
      >
        {value || "N/A"}
      </span>
    );
  };
  /* ================= APPROVE ================= */
const handleApprove = async (id: string, type: "RA" | "BROKER") => {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/admin/approve-user`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId: id,   // MUST be ra_details.id OR broker_details.id
        type,
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    alert(data?.message || "Approve failed");
    return;
  }

  alert(data.message);
};


const handleSuspend = async (userId: string) => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/admin/suspend-user`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          suspendReason,
        }),
      }
    );

    const result = await response.json();

console.log("STATUS:", response.status);
console.log("RESULT:", result);

    if (!response.ok) {
      alert(result.message || "Failed to suspend user");
      return;
    }

    alert("User suspended successfully");

    

    // reload table
    window.location.reload();

  } catch (error) {
    console.error(error);
    alert("Failed to suspend user");
  }
};

const handleResendPasswordLink = async (userId: string) => {
  try {
    const res = await fetch(
  `${import.meta.env.VITE_API_URL}/admin/resend-password-link`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  }
);

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to send link");
    }

    alert("Password setup link sent successfully ✅");

  } catch (error) {
    console.error(error);
    alert("Failed to send password setup link");
  }
};




  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        
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

      {/* 👇 ADD THIS FILTER TOGGLE BUTTON GROUP HERE */}
    <ToggleButtonGroup
      value={filterTab}
      exclusive
      onChange={(_, newTab) => {
        if (newTab !== null) {
          setFilterTab(newTab);
          setPage(1); // Reset pagination back to page 1 on filter change
        }
      }}
      size="small"
      sx={{ alignSelf: "flex-start" }}
    >
      <ToggleButton value="all" sx={{ px: 3 }}>ALL</ToggleButton>
      <ToggleButton value="approved" sx={{ px: 3 }}>APPROVED</ToggleButton>
      <ToggleButton value="requests" sx={{ px: 3 }}>REQUESTS</ToggleButton>
    </ToggleButtonGroup>

      {/* TABLE */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead sx={{ backgroundColor: "#f6f6f6" }}>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Age / Time</TableCell>
              <TableCell>Requests</TableCell>
               <TableCell align="right">Action</TableCell> 
              <TableCell>Telegram</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>

                <TableCell>{row.phone}</TableCell>

                <TableCell>
                  <Chip
                    size="small"
                    label={row.raStatus || "N/A"}
                    color={statusColor(row.raStatus || "") as any}
                  />
                </TableCell>

                
                <TableCell>{row["age/time"]}</TableCell>
                <TableCell>
  {Number(row.pending_requests) > 0 ? (
    <Button
      size="small"
      color="warning"
      variant="contained"
      onClick={() =>
        navigate(`/admin/ra-profile-update-requests?userId=${row.userId}`)
      }
    >
      {Number(row.pending_requests)}
    </Button>
  ) : (
    "-"
  )}
</TableCell>

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

      {/* Mobile backdrop */}
      {selectedRA && (
        <Box
          onClick={closePanel}
          sx={{
            display: { xs: "block", sm: "none" },
            position: "fixed",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.4)",
            zIndex: 1199,
          }}
        />
      )}

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

      {/* ================= SUSPENDED USERS TABLE ================= */}

<Box sx={{ mt: 5 }}>
  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
    Suspended Users
  </Typography>

  <TableContainer component={Paper} variant="outlined">
    <Table size="small">

      <TableHead sx={{ backgroundColor: "#f6f6f6" }}>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Phone</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Age / Time</TableCell>
          <TableCell>Suspend Reason</TableCell>
          <TableCell >Action</TableCell>
          
        </TableRow>
      </TableHead>

      <TableBody>

        {paginatedSuspendedRows.map((row) => (
          <TableRow key={row.id}>

            <TableCell>{row.name}</TableCell>
            <TableCell>{row.phone}</TableCell>
            <TableCell>
              <Chip
                size="small"
                label={ row.raStatus}
                color="secondary"
              />
            </TableCell>

            
<TableCell>{row["age/time"]}</TableCell>
          
              <TableCell>
                {row.suspendReason || "-"}
              </TableCell>
            <TableCell >
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setPanelMode("ra");
                  setSelectedRA(row);
                }}
              >
                View Details
              </Button>
            </TableCell>

          </TableRow>
        ))}

        {filteredSuspendedRows.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} align="center">
              No suspended users
            </TableCell>
          </TableRow>
        )}

      </TableBody>

    </Table>
  </TableContainer>
  <Pagination
    sx={{ mx: "auto", display: "flex", justifyContent: "center", mt: 2 }}
    count={suspendedPageCount || 1}
    page={suspendedPage}
    onChange={(_, value) => setSuspendedPage(value)}
    renderItem={(item) => (
      <PaginationItem
        slots={{ previous: ArrowBackIcon, next: ArrowForwardIcon }}
        {...item}
      />
    )}
  />
</Box>

      {/* SIDE PANEL */}
      {selectedRA && (
        <Paper
          elevation={4}
          sx={{
            position: "fixed",
            zIndex: 1200,
            right: { xs: 0, sm: 20 },
            top: { xs: "auto", sm: 120 },
            bottom: { xs: 0, sm: "auto" },
            left: { xs: 0, sm: "auto" },
            width: { xs: "100%", sm: 600 },
            p: 3,
            borderRadius: { xs: "16px 16px 0 0", sm: 2 },
            maxHeight: { xs: "80vh", sm: "calc(100vh - 140px)" },
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
{/*                 
                <Button onClick={() => openFile(selectedRA.pan)}>View PAN</Button>
                <Button onClick={() => openFile(selectedRA.address)}>
                  View Address
                </Button>
                <Button onClick={() => openFile(selectedRA.sebi)}>View SEBI</Button>
                <Button onClick={() => openFile(selectedRA.sebi_receipt)}>
                  View SEBI Receipt
                </Button>
                <Button onClick={() => openFile(selectedRA.nism)}>View NISM</Button>
                <Button onClick={() => openFile(selectedRA.cheque)}>View Cheque</Button> */}
                

                <Button
 
  onClick={() =>
    selectedRA?.userId &&
    navigate(`/admin/disclaimer-history/${selectedRA.userId}`)
  }
>
  View Disclaimer History
</Button>
                
                
                <Button
 
  onClick={() =>
    selectedRA?.userId &&
    handleResendPasswordLink((selectedRA.userId))
  }
>
  Resend Password Link
</Button>


<Button
 
  onClick={() =>
    navigate("/admin/ra-profile-update-requests")
  }
>
  Profile Update Requests
</Button>
              </Box>

              




 {/* APPROVE / EDIT */}
<Box
  sx={{
    display: "flex",
    flexDirection: "column",
    gap: 2,
    mt: 3,
  }}
>
  {selectedRA.status?.toLowerCase() === "active" ? (
    <>
      <TextField
        fullWidth
        multiline
        rows={2}
        placeholder="Suspend Reason"
        value={suspendReason}
        onChange={(e) => setSuspendReason(e.target.value)}
      />

      <Button
        variant="contained"
        color="error"
        fullWidth
        onClick={() => {
          if (!suspendReason.trim()) {
            alert("Please enter suspend reason");
            return;
          }

          handleSuspend(selectedRA.userId || "");
        }}
        sx={{
          py: 1.2,
          fontWeight: 600,
          borderRadius: 2,
        }}
      >
        Suspend
      </Button>
    </>
    
    
  ) : (
    <Button
      variant="contained"
      color="success"
      fullWidth
      onClick={() => handleActivate(selectedRA.userId)}
      sx={{
        py: 1.2,
        fontWeight: 600,
        borderRadius: 2,
      }}
    >
      Activate
    </Button>
    
  )}
     
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
                    placeholder="Search by Phone, Username, Group or Channel"
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
    <TableCell>Type</TableCell>
    <TableCell>Phone</TableCell>
    <TableCell>Username</TableCell>
    <TableCell>User ID</TableCell>
  </TableRow>
</TableHead>

                        <TableBody>
  {participantsList
    .filter((p) => {
      const q = participantSearchQuery.trim().toLowerCase();

      if (!q) return true;

      return (
        String(p.phone_number || "")
          .toLowerCase()
          .includes(q) ||

        String(p.telegram_client_name || "")
          .toLowerCase()
          .includes(q) ||

        String(p.telegram_user_id || "")
          .toLowerCase()
          .includes(q) ||

        String(p.entity_type || "")
          .toLowerCase()
          .includes(q)
      );
    })
    .map((p) => {
      const isRowEditing =
        editingCell?.id === String(p.id);

      const type = p.entity_type || "USER";

      return (
        <TableRow
          key={p.id}
          selected={participant?.id === p.id}
          onClick={() => {
            if (isRowEditing) return;

            setParticipant(p);

            setParticipantUsername(
              p.telegram_client_name || ""
            );
          }}
          sx={{ cursor: "pointer" }}
        >
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
              ? renderEditableCell(
                  p,
                  "phone_number",
                  p.phone_number
                )
              : type === "GROUP"
              ? "Group"
              : "Channel"}
          </TableCell>

          {/* USERNAME */}
          <TableCell>
            {renderEditableCell(
              p,
              "telegram_client_name",
              p.telegram_client_name
            )}
          </TableCell>

          {/* TELEGRAM ID */}
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
      raId={selectedRA.userId}   // ✅ correct
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
  fullWidth
  disabled={!participant || participantLoading}
  onClick={handleUpdateParticipant}
  sx={{
    backgroundColor: participant ? "#1976d2" : "#e0e0e0",
    color: participant ? "#fff" : "#9e9e9e",
    "&:hover": {
      backgroundColor: participant ? "#1565c0" : "#e0e0e0",
    },
  }}
>
  Update
</Button>

                  <Button
  variant="contained"
  fullWidth
  disabled={!participant || participantLoading}
  onClick={handleDeleteParticipant}
  sx={{
    backgroundColor: participant ? "#d32f2f" : "#e0e0e0",
    color: participant ? "#fff" : "#9e9e9e",
    "&:hover": {
      backgroundColor: participant ? "#b71c1c" : "#e0e0e0",
    },
  }}
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
     

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
  <DialogTitle>
    Are you sure you want to approve this user?
  </DialogTitle>

  <DialogActions>
    <Button onClick={() => setConfirmOpen(false)}>
      No
    </Button>

    <Button
      variant="contained"
      color="success"
      onClick={() => {
        if (!confirmId || !confirmType) return;

        handleApprove(confirmId, confirmType);

        setConfirmOpen(false);
        setConfirmId(null);
        setConfirmType(null);
      }}
    >
      Yes
    </Button>
  </DialogActions>
</Dialog>
    </Box>
    
  );
};

export default AdminDashboard;