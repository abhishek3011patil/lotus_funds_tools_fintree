import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

const indianStates = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
    "Puducherry",
];

interface PayCardProps {
    open: boolean;
    onClose: () => void;
    onBack: () => void;
    planName: string;
    planPrice: string;
    resetToken?: string; // Add this to your props
}

export default function PayCard({ open, onClose, onBack, planName, planPrice, resetToken }: PayCardProps) {
    const [selectedState, setSelectedState] = useState<string>("Maharashtra");
    
    // 1. Add states for inputs
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvv, setCvv] = useState("");
    const [cardHolder, setCardHolder] = useState("");

    const handleCardPayment = async () => {
        const numericPrice = parseInt(planPrice.replace(/[^0-9]/g, "")) || 0;

        try {
            // 2. Create Order
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/create-order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    amount: numericPrice, 
                    planName, 
                    resetToken: resetToken || "test_manual_card" 
                }),
            });

            const order = await response.json();

            // 3. Razorpay Options
            const options = {
                key: order.key_id,
                amount: order.amount,
                currency: "INR",
                name: "Fintree",
                order_id: order.id,
                // Prefill helps the user so they don't type twice
                prefill: {
                    name: cardHolder,
                    method: 'card',
                },
                handler: async function (response: any) {
                    const verifyRes = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/verify`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            resetToken: resetToken,
                            amountPaid: numericPrice
                        }),
                    });

                    if (verifyRes.ok) {
                        window.location.href = "/dashboard?success=true";
                    }
                },
                theme: { color: "#1a73e8" },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error("Card Payment Error:", error);
            alert("Payment initialization failed.");
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: 398,
                    maxWidth: 398,
                    borderRadius: 0,
                    boxShadow: "0px 8px 32px rgba(0,0,0,0.22)",
                },
            }}
        >
            <Box sx={{ p: 2.5 }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <IconButton size="small" onClick={onBack}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography fontSize={16} fontWeight={500}>
                        Add credit or debit card
                    </Typography>
                </Stack>

                <Typography fontSize={12} color="#5f6368" mt={3} mb={3}>
                    All fields required
                </Typography>

                <TextField
                    fullWidth
                    label="Card number"
                    size="small"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <CreditCardOutlinedIcon fontSize="small" />
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <InputAdornment position="end">
                                <HelpOutlineIcon fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />

                <Stack direction="row" spacing={2} mt={3}>
                    <TextField 
                        fullWidth size="small" placeholder="MM/YY" 
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                    />
                    <TextField
                        fullWidth size="small" placeholder="CVV"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                    />
                </Stack>

                <TextField
                    fullWidth size="small" label="Cardholder name" sx={{ mt: 3 }}
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                />

                <Box mt={3}>
                    <Typography fontSize={11} color="#5f6368">
                        Country/region
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontSize={15}>India (IN)</Typography>
                        <EditOutlinedIcon sx={{ fontSize: 18, color: "#1a73e8" }} />
                    </Stack>
                </Box>

                <FormControl fullWidth size="small" sx={{ mt: 2.5 }}>
                    <Select
                        value={selectedState}
                        onChange={(event) => setSelectedState(event.target.value)}
                    >
                        {indianStates.map((item) => (
                            <MenuItem key={item} value={item}>
                                {item}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Typography fontSize={11} color="#5f6368" mt={4} lineHeight={1.4}>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Corporis
                    molestias incidunt eligendi consequatur labore possimus laborum veniam
                    numquam excepturi cum! Illo nemo recusandae facilis eos nam ipsam id
                    rerum necessitatibus?
                </Typography>

                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mt={3}
                    mb={3}
                >
                    <Typography fontSize={14} fontWeight={500}>
                        {planName}
                    </Typography>
                    <Typography fontSize={14}>{planPrice}</Typography>
                </Stack>

                <Button
                    fullWidth
                    variant="contained"
                    onClick={handleCardPayment} // 4. Attach the function
                    sx={{ borderRadius: "24px", textTransform: "none", height: 44, mt: 2 }}
                >
                    Pay {planPrice}
                </Button>
            </Box>
        </Dialog>
    );
}
