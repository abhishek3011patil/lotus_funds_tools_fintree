import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
} from "@mui/material";

const RAProfileUpdateRequests = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fieldsToCompare = [
  "first_name",
  "surname",
  "email",
  "mobile",
  "city",
  "state",
  "country",
  "sebi_reg_no",
  "nism_reg_no",
  "bank_name",
  "account_number",
  "ifsc_code",
];

  const fetchRequests = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/registration/ra-profile-update-requests`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();
      setRequests(data.data || []);
    } catch (error) {
      console.error("FETCH REQUESTS ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const approveRequest = async (id: number) => {
    await fetch(
      `${import.meta.env.VITE_API_URL}/api/registration/ra-profile-update-requests/${id}/approve`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    fetchRequests();
  };

  const rejectRequest = async (id: number) => {
    const admin_remark = prompt("Enter rejection reason");

    await fetch(
      `${import.meta.env.VITE_API_URL}/api/registration/ra-profile-update-requests/${id}/reject`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ admin_remark }),
      }
    );

    fetchRequests();
  };

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight={700} mb={2}>
        RA Profile Update Requests
      </Typography>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>RA Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Requested Changes</TableCell>
              <TableCell>Requested At</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No profile update requests found
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>{req.name || "N/A"}</TableCell>
                  <TableCell>{req.email}</TableCell>

                  <TableCell>
                    <Chip
                      label={req.status}
                      color={
                        req.status === "PENDING"
                          ? "warning"
                          : req.status === "APPROVED"
                          ? "success"
                          : "error"
                      }
                      size="small"
                    />
                  </TableCell>

                 <TableCell>
  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
    {fieldsToCompare.map((field) => {
      const requestedValue = req.requested_changes?.[field];

      if (requestedValue === undefined || requestedValue === null) {
        return null;
      }

      return (
        <Box
          key={field}
          sx={{
            p: 1,
            borderRadius: 1,
            backgroundColor: "#fff3cd",
            border: "1px solid #ffeeba",
            maxWidth: 450,
          }}
        >
          <Typography fontSize={12} fontWeight={700}>
            {field.replace(/_/g, " ").toUpperCase()}
          </Typography>

          <Typography fontSize={13}>
            {String(requestedValue)}
          </Typography>
        </Box>
      );
    })}
  </Box>
</TableCell>

                  <TableCell>
                    {new Date(req.created_at).toLocaleString()}
                  </TableCell>

                  <TableCell align="right">
                    {req.status === "PENDING" && (
                      <>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={() => approveRequest(req.id)}
                          sx={{ mr: 1 }}
                        >
                          Approve
                        </Button>

                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => rejectRequest(req.id)}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default RAProfileUpdateRequests;