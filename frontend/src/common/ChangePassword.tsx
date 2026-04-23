import { useState } from "react";
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    CircularProgress,
    Alert,
} from "@mui/material";
import axios from "axios";

const ChangePassword = () => {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

const handleConfirm = async () => {
    setError(null);
    setSuccess(null);

    if (!oldPassword || !newPassword) {
        setError("Both fields are required.");
        return;
    }

    setLoading(true);

    try {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        console.log("TOKEN:", token);
        console.log("ROLE:", role);

        if (!token) {
            setError("You are not logged in ❌");
            return;
        }

        let url = "";

        if (role === "ADMIN") {
            url = "http://localhost:3000/api/auth/admin/change-password";
        } 
        else if (role === "RESEARCH_ANALYST") {
            url = "http://localhost:3000/api/registration/ra/change-password";
        } 
        else {
            setError("Invalid role for password change");
            return;
        }

        const res = await axios.post(
            url,
            { oldPassword, newPassword },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("SUCCESS:", res.data);

        setSuccess(res.data.message || "Password changed successfully ✅");
        setOldPassword("");
        setNewPassword("");

    } catch (err: any) {
        console.log("ERROR:", err.response?.data);
        setError(err.response?.data?.message || "Something went wrong");
    } finally {
        setLoading(false);
    }
};
    return (
        <Box sx={{ mt: 4 }}>
            <Paper
                sx={{
                    p: 3,
                    border: "1px solid #E9E9EE",
                    borderRadius: 2,
                    boxShadow: "none",
                }}
            >
                <Typography variant="h6" fontWeight={600} mb={2}>
                    Change Password
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <TextField
                        label="Old Password"
                        type="password"
                        size="small"
                        sx={{ width: "50%" }}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                    />
                    <TextField
                        label="New Password"
                        type="password"
                        size="small"
                        sx={{ width: "50%" }}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Box sx={{ textAlign: "left", mt: 1 }}>
                        <Button
                            variant="contained"
                            size="large"
                            disabled={loading}
                            onClick={handleConfirm}
                            sx={{ minWidth: 160, textTransform: "none", fontSize: "1.1rem" }}
                        >
                            {loading ? <CircularProgress size={24} /> : "Confirm"}
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

export default ChangePassword;