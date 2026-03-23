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

import AdminFilter, { type AdminFilterValue } from "../assets/adminFilter";

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

  status: "Pending" | "Approved" | "Rejected" | string;
  rejectionReason?: string;

  "age/time": string;
};

const ITEMS_PER_PAGE = 10;

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

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/api/registration/all-registrations"
        );

        const data = await response.json();

        const formatted = data.map((item: any) => ({
          id: item.id,
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

    if (!file || file.trim() === "") {
      alert("File not uploaded");
      return;
    }

    const url = `http://localhost:3000/uploads/${encodeURIComponent(file)}`;

    window.open(url, "_blank");
  };

  /* ================= APPROVE ================= */

  const handleApprove = async (id: string) => {

    try {

      const res = await fetch(
        `http://localhost:3000/api/registration/approve/${id}`,
        { method: "PUT" }
      );

      const data = await res.json();

      if (res.ok) {

        alert("User Approved Successfully");

        setRows((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, status: "Approved" } : r
          )
        );

        setSelectedRA(null);

      } else {

        alert(data.message || "Failed to approve");
      }

    } catch (error) {
      console.error(error);
    }
  };

  /* ================= REJECT ================= */

  const handleReject = async (id: string) => {

    if (!rejectReason.trim()) {
      alert("Please enter rejection reason");
      return;
    }

    try {

      const res = await fetch(
        `http://localhost:3000/api/registration/reject/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: rejectReason,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {

        alert("User Rejected Successfully");

        setRows((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, status: "Rejected" } : r
          )
        );

        setSelectedRA(null);
        setRejectReason("");

      } else {

        alert(data.message || "Reject failed");
      }

    } catch (error) {
      console.error(error);
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

              <TableRow key={row.id}>

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
                    onClick={() => setSelectedRA(row)}
                  >
                    View
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
                handleApprove(selectedId);
              } else {
                handleReject(selectedId);
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

    </Box>
  );
};

export default AdminApproval;