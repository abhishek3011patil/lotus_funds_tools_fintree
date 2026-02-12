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
import Pagination from '@mui/material/Pagination';
import PaginationItem from '@mui/material/PaginationItem';
import Stack from '@mui/material/Stack';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AdminFilter, { type AdminFilterValue } from "../assets/adminFilter";


type AdminRow = {
  id: string;
  name: string;
  phone: string;
  status: "Pending" | "Approved" | "Rejected" | string;
  "age/time": string;
};

const ITEMS_PER_PAGE = 10;

const AdminApproval = () => {
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [filter, setFilter] = useState<AdminFilterValue>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/admin.json");
        const data = (await response.json()) as AdminRow[];
        setRows(data);
      } catch (error) {
        console.error("Failed to load admin data:", error);
      }
    };

    load();
  }, []);

  // Reset to first page when searching or filtering
  useEffect(() => {
    setPage(1);
  }, [searchQuery, filter]);

  const statusColor = (status: AdminRow["status"]) => {
    if (status === "Approved") return "success";
    if (status === "Rejected") return "error";
    if (status === "Pending") return "warning";
    return "default";
  };

  const filteredRows = rows.filter((row) => {
    const matchesFilter = filter === "All" || row.status === filter;
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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h5" fontWeight={600}>
        Admin Approval
      </Typography>

      <TextField
        placeholder="Search by name or mobile"
        fullWidth
        size="small"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" sx={{ pl: 1 }}>
              <SearchIcon color="action" fontSize="small" />
            </InputAdornment>
          ),
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "12px",
            backgroundColor: "#fff",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            "& fieldset": {
              borderColor: "rgba(0, 0, 0, 0.15)",
            },
            "&:hover fieldset": {
              borderColor: "primary.main",
            },
          },
        }}
      />

      <Box sx={{ overflowX: "auto", pb: 1, width: "100%" }}>
        <AdminFilter value={filter} onChange={setFilter} />
      </Box>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: "12px", overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 650 }}>
          <TableHead sx={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Age / Time</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, py: 1.5 }}>
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell sx={{ py: 1 }}>{row.name}</TableCell>
                <TableCell sx={{ py: 1 }}>{row.phone}</TableCell>
                <TableCell sx={{ py: 1 }}>
                  <Chip
                    size="small"
                    label={row.status}
                    color={statusColor(row.status)}
                    sx={{ fontWeight: 500, borderRadius: "6px" }}
                  />
                </TableCell>
                <TableCell sx={{ py: 1 }}>{row["age/time"]}</TableCell>
                <TableCell align="right" sx={{ py: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{
                      borderRadius: "8px",
                      textTransform: "none",
                      px: 2
                    }}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  No matching results found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

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
