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
  // Basic Information
  "salutation",
  "first_name",
  "middle_name",
  "surname",
  "org_name",
  "designation",
  "short_bio",

  // Contact
  "email",
  "mobile",
  "telephone",

  // Address
  "address_line1",
  "address_line2",
  "city",
  "state",
  "country",
  "pincode",

  // SEBI Details
  "sebi_reg_no",
  "sebi_start_date",
  "sebi_expiry_date",

  // NISM Details
  "nism_reg_no",
  "nism_valid_till",

  // Qualifications
  "academic_qualification",
  "professional_qualification",
  "market_experience",
  "expertise",
  "markets",

  // Bank Details
  "bank_name",
  "account_holder",
  "account_number",
  "ifsc_code",

  // Other Details
  "pan_number",
  "address_proof_type",

  // Declarations
  "declare_info_true",
  "consent_verification",
  "no_guaranteed_returns",
  "conflict_of_interest",
  "personal_trading",
  "sebi_compliance",
  "platform_policy",

  // Disclaimer
  "additional_comments",

  // Uploaded Documents
  "profile_image",
  "pan_card",
  "address_proof_document",
  "sebi_certificate",
  "sebi_receipt",
  "nism_certificate",
  "cancelled_cheque",
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
              requests.map((req) => {

         const changedFields = fieldsToCompare.filter((field) => {
  const newValue = req.requested_changes?.[field];

  if (newValue === undefined || newValue === null) return false;

  if (req.status !== "PENDING") {
    return true;
  }

  const oldValue = req[field];

  return String(oldValue ?? "").trim() !== String(newValue ?? "").trim();
});
                ({
    cityFromDB: req.city,
    cityRequested: req.requested_changes?.city,
    requestedChanges: req.requested_changes,
  });

  return (
   
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
  {changedFields.length === 0 ? (
  <Typography color="text.secondary">
    No actual changed fields
  </Typography>
) : (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
    {changedFields.map((field) => {
      const oldValue = req[field];
      const newValue = req.requested_changes?.[field];

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

          <Typography color="error">
            Old: {oldValue}
          </Typography>

          <Typography color="success.main">
            New: {newValue}
          </Typography>
        </Box>
      );
    })}
  </Box>
)}
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

              );})
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default RAProfileUpdateRequests;