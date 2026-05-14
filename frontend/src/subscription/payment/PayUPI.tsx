import React, { useState } from "react";
import { Box, Button, Dialog, IconButton, Stack, TextField, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

interface PayUPIProps {
    open: boolean;
    onClose: () => void;
    onBack: () => void;
    planName: string;
    planPrice: string;
    resetToken: string | null; // Add this line
}

export default function PayUPI({ open, onClose, onBack, planName, planPrice, resetToken }: PayUPIProps) {
    const [step, setStep] = useState<"details" | "payment">("details");
    const [loading, setLoading] = useState(false);
    const [upiId, setUpiId] = useState(""); // Add this state

    // Helper to get reset token from URL
    const getResetToken = () => new URLSearchParams(window.location.search).get("token");

    // PayUPI.tsx

    const handlePayment = async () => {
    // 1. Get the numeric price from string (e.g., "₹199/mo" -> 199)
    const numericPrice = parseInt(planPrice.replace(/[^0-9]/g, "")) || 0;

    // 2. Safety check: Don't proceed if token is missing (unless testing)
    if (!resetToken) {
        console.error("Missing resetToken! DB update will fail.");
        // alert("Invalid session. Please use the link from your email.");
        // return; // Uncomment these in production
    }

    try {
        // 3. Create Order on Backend
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/create-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                amount: numericPrice, 
                planName: planName, 
                resetToken: resetToken || "test_bypass_user" 
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Order Creation Failed: ${errorText}`);
        }

        const order = await response.json();

        // 4. Initialize Razorpay
        const options = {
            key: order.key_id, // Key sent from backend
            amount: order.amount,
            currency: "INR",
            name: "Fintree",
            description: `Payment for ${planName}`,
            order_id: order.id,
            handler: async function (response: any) {
                console.log("Razorpay Success! Now verifying with database...");
                
                // 5. CRITICAL STEP: Verify Payment and Update DB
                try {
                    const verifyRes = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/verify`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            resetToken: resetToken, // This MUST match the DB entry
                            amountPaid: numericPrice
                        }),
                    });

                    if (verifyRes.ok) {
                        console.log("✅ Database updated successfully!");
                        // Redirect to dashboard on success
                        window.location.href = `/set-password?token=${resetToken}`;
                    } else {
                        const errorData = await verifyRes.json();
                        console.error("❌ DB Update Failed:", errorData.message);
                        alert("Payment successful, but we couldn't update your account. Please contact support.");
                    }
                } catch (verifyError) {
                    console.error("Network error during verification:", verifyError);
                    alert("Connection lost after payment. Please refresh the page.");
                }
            },
            prefill: {
                name: "User",
                email: "user@example.com",
            },
            theme: { color: "#1a73e8" },
            modal: {
                ondismiss: function () {
                    console.log("User closed the Razorpay modal");
                }
            }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();

    } catch (error: any) {
        console.error("Payment Process Error:", error);
        alert(error.message || "Failed to initialize payment.");
    }
};

    const handleClose = () => {
        setStep("details");
        onClose();
    };

    // UI Logic for the "Payment Summary" Step
    if (step === "payment") {
        return (
            <Dialog open={open} onClose={handleClose} PaperProps={{ sx: { width: 438, borderRadius: "16px" } }}>
                <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, py: 2 }}>
                        <Typography fontWeight={600}>Fintree Pay</Typography>
                        <IconButton size="small" onClick={handleClose}>✕</IconButton>
                    </Stack>

                    <Box sx={{ px: 2.5, pb: 2 }}>
                        <Typography fontWeight={600}>{planName}</Typography>
                        <Typography fontSize={13} color="#5f6368">Fintree One</Typography>
                        <Stack direction="row" justifyContent="space-between" mt={2}>
                            <Typography fontSize={14}>Total Due</Typography>
                            <Typography fontSize={14} fontWeight={600}>{planPrice}</Typography>
                        </Stack>
                    </Box>

                    <Box sx={{ p: 2.5 }}>
                        <Button
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            onClick={handlePayment}
                            sx={{ borderRadius: "24px", textTransform: "none", height: 44 }}
                        >
                            {loading ? "Processing..." : "Pay and Subscribe"}
                        </Button>
                    </Box>
                </Box>
            </Dialog>
        );
    }

    // UI Logic for the "Details/UPI Entry" Step
    return (
        <Dialog open={open} onClose={handleClose} PaperProps={{ sx: { width: 398, borderRadius: "12px" } }}>
            <Box sx={{ p: 2.5 }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <IconButton size="small" onClick={onBack}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography fontSize={16} fontWeight={500}>Confirm Details</Typography>
                </Stack>

                <Typography fontSize={12} color="#5f6368" mt={3} mb={3}>
                    Review your subscription to <b>{planName}</b>.
                </Typography>

                <TextField
    fullWidth
    label="UPI ID"
    size="small"
    placeholder="yourname@upi"
    value={upiId} // Link state
    onChange={(e) => setUpiId(e.target.value)} // Update state
    autoFocus // This helps with focus issues in Dialogs
/>

                <Stack direction="row" justifyContent="space-between" mt={3} mb={3}>
                    <Typography fontSize={14} fontWeight={500}>{planName}</Typography>
                    <Typography fontSize={14}>{planPrice}</Typography>
                </Stack>

                <Button
                    fullWidth
                    variant="contained"
                    onClick={() => setStep("payment")}
                    sx={{ borderRadius: "24px", textTransform: "none", height: 44 }}
                >
                    Continue to Summary
                </Button>
            </Box>
        </Dialog>
    );
}