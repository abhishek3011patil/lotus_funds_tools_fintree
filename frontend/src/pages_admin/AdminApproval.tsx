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
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import { useNavigate } from "react-router-dom";

import AdminFilter, { type AdminFilterValue } from "../assets/adminFilter";

type AdminRow = {
  id: string;
  name: string;
  phone: string;
  type: "RA" | "Broker";

  profile?: string;
  pan?: string;
  address?: string;
  sebi?: string;
  sebi_receipt?: string;
  nism?: string;
  cheque?: string;

  sebi_certificate?: string;
  exchange_certificates?: string[]; // exchange_certificates text[]
  appointment_letter?: string;     // appointment_letter text
  networth_certificate?: string;   // networth_certificate text
  financial_statements?: string;   // financial_statements text
  ca_certificate?: string;

  status: "Pending" | "Approved" | "Rejected" | string;
  rejectionReason?: string;

  "age/time": string;
};

const ITEMS_PER_PAGE = 10;

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || ""
).replace(/\/$/, "");

const buildApiUrl = (path: string) => `${API_BASE_URL}${path}`;
const buildUploadUrl = (file: string) =>
  `${API_BASE_URL}/uploads/${encodeURIComponent(file)}`;

const AdminApproval = () => {

  const [rows, setRows] = useState<AdminRow[]>([]);
  const [filter, setFilter] = useState<AdminFilterValue>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedRA, setSelectedRA] = useState<AdminRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<"approve" | "reject" | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [brokerRows, setBrokerRows] = useState<AdminRow[]>([]);
  const [brokerSearch, setBrokerSearch] = useState("");
  const [selectedBroker, setSelectedBroker] = useState<AdminRow | null>(null);
  const [brokerFilter, setBrokerFilter] = useState<AdminFilterValue>("All");
  const [brokerPage, setBrokerPage] = useState(1);

  const navigate = useNavigate();

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(
          buildApiUrl("/api/registration/all-registrations")
        );

        const data = await response.json();

        const formatted = data.map((item: any) => ({
           id: item.id,
           type: "RA",
          name: `${item.first_name || ""} ${item.surname || ""}`,
          phone: item.mobile || "",

          profile: item.profile_image,
          pan: item.pan_card,
          address: item.address_proof_document,
          sebi: item.sebi_certificate,
          sebi_receipt: item.sebi_receipt,
          nism: item.nism_certificate,
          cheque: item.cancelled_cheque,

          status: item.status || "Pending",
          rejectionReason: item.rejection_reason || "",

          "age/time": "Just now",
        }));

        setRows(formatted);

      } catch (error) {
        console.error("Failed to load admin data:", error);
      }
    };

    load();
  }, []);

  /* ================= LOAD BROKER DATA ================= */
useEffect(() => {
  const loadBrokers = async () => {
    try {
      // Make sure this matches the route you just created: /all-brokers
      const response = await fetch(buildApiUrl("/api/broker/all-brokers"));

      if (!response.ok) {
         throw new Error("Route not found");
      }

      const data = await response.json();

      const formatted = data.map((item: any) => ({
        id: item.id,
        name: item.legal_name || "N/A", // Using names from your SQL query
        phone: item.mobile || "",
        status: item.status || "Pending",
        logo: item.sebi_certificate, // Mapping files from your DB
        pan: item.pan,
        license: item.sebi_registration_no,
        sebi_certificate: item.sebi_certificate,
    appointment_letter: item.appointment_letter,
    networth_certificate: item.networth_certificate,
    financial_statements: item.financial_statements,
    ca_certificate: item.ca_certificate,
    exchange_certificates: item.exchange_certificates || [],
        "age/time": "New",
      }));

      setBrokerRows(formatted);
    } catch (error) {
      console.error("Broker fetch failed:", error);
    }
  };

  loadBrokers();
}, []);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filter]);

  /* ================= STATUS COLOR ================= */

  const statusColor = (status: AdminRow["status"]) => {
    const s = status.toLowerCase();

    if (s === "approved") return "success";
    if (s === "rejected") return "error";
    if (s === "pending") return "warning";

    return "default";
  };

  /* ================= FILTER ================= */

  const filteredRows = rows.filter((row) => {

    const matchesFilter =
      filter === "All" ||
      row.status.toLowerCase() === filter.toLowerCase();

    const query = searchQuery.toLowerCase();

    const matchesSearch =
      row.name.toLowerCase().includes(query) ||
      row.phone.includes(query);

    return matchesFilter && matchesSearch;
  });

  const pageCount = Math.ceil(filteredRows.length / ITEMS_PER_PAGE);

  const paginatedRows = filteredRows.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  /* ================= FILE VIEW ================= */

 const openFile = (file?: string) => {
  if (!file) return alert("File not uploaded");

  // Handle multiple files (comma separated)
  const files = file.split(",");

  files.forEach((f) => {
    const cleanFile = f.trim();
    if (cleanFile) {
      const url = buildUploadUrl(cleanFile);
      window.open(url, "_blank");
    }
  });
};
  /* ================= APPROVE ================= */

const handleApprove = async (id: string, type: "RA" | "BROKER") => {
  try {
    const res = await fetch(buildApiUrl("/admin/approve-user"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: id, type }),
    });

    const data = await res.json();

    // If backend says success is false (duplicate email etc)
    if (!res.ok || data.success === false) {
      alert(data.message || "Approval failed ❌");
      return; // stop further execution
    }

    // ✅ Success: user approved
    alert("Approved & Email Sent ✅");

    if (type === "RA") {
      setRows(prev =>
        prev.map(r => (r.id === id ? { ...r, status: "Approved" } : r))
      );
      setSelectedRA(null);
    } else {
      setBrokerRows(prev =>
        prev.map(b => (b.id === id ? { ...b, status: "Approved" } : b))
      );
      setSelectedBroker(null);
    }

  } catch (error) {
    console.error(error);
    alert("Server error while approving ❌");
  }
};

/* ================= Edit ================= */
const handleEdit = (id: string, type: "RA" | "BROKER") => {
  navigate(`/admin/edit/${type}/${id}`);
};

/* ================= REJECT ================= */
const handleReject = async (id: string, type: "RA" | "BROKER") => {
  if (!rejectReason || rejectReason.trim() === "") {
    alert("Please enter a rejection reason ❌");
    return;
  }

  try {
    const res = await fetch(
      `${buildApiUrl("/api/registration/reject")}/${type.toLowerCase()}/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: rejectReason }),
      }
    );

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error("Invalid JSON response");
    }

    console.log("Reject response:", data);

    if (!res.ok || data.success === false) {
      alert(data.message);
      return;
    }

    alert(data.message || "Rejected successfully ❌");

    if (type === "RA") {
      setRows(prev =>
        prev.map(r => (r.id === id ? { ...r, status: "Rejected" } : r))
      );
      setSelectedRA(null);
    } else {
      setBrokerRows(prev =>
        prev.map(b => (b.id === id ? { ...b, status: "Rejected" } : b))
      );
      setSelectedBroker(null);
    }

    setRejectReason("");

  } catch (error) {
    console.error("Reject Error:", error);
    alert("Server error while rejecting ❌");
  }
};
  /* ================= UI ================= */

  return (

    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

      <Typography variant="h5" fontWeight={600}>
        Admin Approval
      </Typography>

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

      <Box sx={{ overflowX: "auto" }}>
        <AdminFilter value={filter} onChange={setFilter} />
      </Box>

      {/* TABLE */}

      <TableContainer component={Paper} variant="outlined">

        <Table size="small">

          <TableHead sx={{ backgroundColor: "#f6f6f6" }}>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Age / Time</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>

            {paginatedRows.map((row) => (

              <TableRow key={row.id || Math.random()}>

                <TableCell>{row.name}</TableCell>
                <TableCell>{row.phone}</TableCell>

                <TableCell>
                  <Chip
                    size="small"
                    label={row.status}
                    color={statusColor(row.status) as any}
                  />
                </TableCell>

                <TableCell>{row["age/time"]}</TableCell>

                <TableCell align="right">
                  <Button
  size="small"
  variant="outlined"
  onClick={() => {
    setSelectedRA(row);
    setSelectedBroker(null); // ✅ VERY IMPORTANT FIX
  }}
>
  View Details
</Button>
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
            width: 330,
            p: 2,
            borderRadius: 2,
            zIndex: 1200,
          }}
        >

          <Button
            size="small"
            onClick={() => setSelectedRA(null)}
            sx={{ position: "absolute", right: 10, top: 10 }}
          >
            X
          </Button>

          <Typography fontWeight={600}>RA Verification</Typography>

          <Typography sx={{ mt: 1 }}>{selectedRA.name}</Typography>
          <Typography color="text.secondary">{selectedRA.phone}</Typography>

          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
            <Button onClick={() => openFile(selectedRA.profile)}>View Profile</Button>
            <Button onClick={() => openFile(selectedRA.pan)}>View PAN</Button>
            <Button onClick={() => openFile(selectedRA.address)}>View Address</Button>
            <Button onClick={() => openFile(selectedRA.sebi)}>View SEBI</Button>
            <Button onClick={() => openFile(selectedRA.sebi_receipt)}>View SEBI Receipt</Button>
            <Button onClick={() => openFile(selectedRA.nism)}>View NISM</Button>
            <Button onClick={() => openFile(selectedRA.cheque)}>View Cheque</Button>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="Rejection Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            sx={{ mt: 2 }}
          />

          <Box sx={{ display: "flex", gap: 1, mt: 2 }}>

            <Button
              variant="contained"
              color="success"
              fullWidth
              onClick={() => {
                setSelectedId(selectedRA.id);
                setConfirmType("approve");
                setConfirmOpen(true);
              }}
            >
              Approve
            </Button>

            <Button
              variant="contained"
              color="error"
              fullWidth
              onClick={() => {
                setSelectedId(selectedRA.id);
                setConfirmType("reject");
                setConfirmOpen(true);
              }}
            >
              Reject
            </Button>
            <Button
  variant="contained"
  color="warning"
  fullWidth
  onClick={() => handleEdit(selectedRA.id, "RA")}
>
  Edit
</Button>

          </Box>

        </Paper>
      )}

      {/* CONFIRM DIALOG */}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>

        <DialogTitle>
          Are you sure you want to {confirmType === "approve" ? "approve" : "reject"} this registration?
        </DialogTitle>

        <DialogActions>

          <Button onClick={() => setConfirmOpen(false)}>
            No
          </Button>

          <Button
  variant="contained"
  color={confirmType === "approve" ? "success" : "error"}
  onClick={() => {

    if (!selectedId) return;

    if (confirmType === "approve") {
  if (selectedRA) {
    handleApprove(selectedId, "RA");
  } else if (selectedBroker) {
    handleApprove(selectedId, "BROKER");
  }
} else {
      handleReject(selectedId, selectedRA ? "RA" : "BROKER");
    }

    setConfirmOpen(false);
  }}
>
  Yes
</Button>

        </DialogActions>

      </Dialog>

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

      {/* ================= BROKER TABLE ================= */}
<Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 6 }}>
  <Typography variant="h5" fontWeight={600}>
    Broker Approval
  </Typography>

  <TextField
    placeholder="Search brokers by name or mobile"
    fullWidth
    size="small"
    value={brokerSearch}
    onChange={(e) => setBrokerSearch(e.target.value)}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <SearchIcon fontSize="small" />
        </InputAdornment>
      ),
    }}
  />

  <Box sx={{ overflowX: "auto" }}>
  <AdminFilter value={brokerFilter} onChange={setBrokerFilter} />
</Box>

  <TableContainer component={Paper} variant="outlined">
    <Table size="small">
      <TableHead sx={{ backgroundColor: "#f0f7ff" }}>
        <TableRow>
          <TableCell>Broker Name</TableCell>
          <TableCell>Phone</TableCell>
          <TableCell>Status</TableCell>
          <TableCell align="right">Action</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {brokerRows
          .filter(b => 
            b.name.toLowerCase().includes(brokerSearch.toLowerCase()) || 
            b.phone.includes(brokerSearch)
          )
          .map((broker) => (
            <TableRow key={broker.id}>
              <TableCell>{broker.name}</TableCell>
              <TableCell>{broker.phone}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={broker.status}
                  color={statusColor(broker.status) as any}
                />
              </TableCell>
              <TableCell align="right">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
  setSelectedBroker(broker);
  setSelectedRA(null); // ✅ avoid confusion
}}
                >
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  </TableContainer>
</Box>

{/* BROKER SIDE PANEL */}
{selectedBroker && (
  <Paper
    elevation={4}
    sx={{
      position: "fixed",
      right: 20,
      top: 120,
      width: 330,
      p: 2,
      borderRadius: 2,
      zIndex: 1000
    }}
  >
    <Button
      size="small"
      onClick={() => setSelectedBroker(null)}
      sx={{ position: "absolute", right: 10, top: 10 }}
    >
      X
    </Button>

    <Typography fontWeight={600}>Broker Verification</Typography>
    <Typography sx={{ mt: 1 }}>{selectedBroker.name}</Typography>
    
    <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
  {/* Standard Single Files */}
  {selectedBroker.sebi_certificate && (
    <Button onClick={() => openFile(selectedBroker.sebi_certificate)}>View SEBI Certificate</Button>
  )}
  
  {selectedBroker.appointment_letter && (
    <Button onClick={() => openFile(selectedBroker.appointment_letter)}>View Appointment Letter</Button>
  )}
  
  {selectedBroker.networth_certificate && (
    <Button onClick={() => openFile(selectedBroker.networth_certificate)}>View Networth Certificate</Button>
  )}
  
  {selectedBroker.financial_statements && (
    <Button onClick={() => openFile(selectedBroker.financial_statements)}>View Financial Statements</Button>
  )}
  
  {selectedBroker.ca_certificate && (
    <Button onClick={() => openFile(selectedBroker.ca_certificate)}>View CA Certificate</Button>
  )}

  {selectedBroker.pan && (
    <Button onClick={() => openFile(selectedBroker.pan)}>View Company PAN</Button>
  )}

  {/* Multiple Files: Exchange Certificates */}
  {selectedBroker.exchange_certificates && 
   selectedBroker.exchange_certificates.map((file: string, index: number) => (
    <Button key={index} onClick={() => openFile(file)}>
      View Exchange Cert {index + 1}
    </Button>
  ))}
</Box>

<TextField
  fullWidth
  multiline
  rows={2}
  placeholder="Rejection Reason"
  value={rejectReason}
  onChange={(e) => setRejectReason(e.target.value)}
  sx={{ mt: 2 }}
/>

   <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
  <Button
    variant="contained"
    color="success"
    fullWidth
    onClick={() => {
      setSelectedId(selectedBroker.id);
      setConfirmType("approve");
      setConfirmOpen(true);
    }}
  >
    Approve
  </Button>
      <Button
    variant="contained"
    color="error"
    fullWidth
    onClick={() => {
      setSelectedId(selectedBroker.id);
      setConfirmType("reject");
      setConfirmOpen(true);
    }}
  >
    Reject
  </Button>

   <Button
  variant="contained"
  color="warning"
  fullWidth
  onClick={() => handleEdit(selectedBroker.id, "BROKER")}
>
  Edit
</Button>

</Box>
  </Paper> 
)}
    </Box>
  );
};

export default AdminApproval;