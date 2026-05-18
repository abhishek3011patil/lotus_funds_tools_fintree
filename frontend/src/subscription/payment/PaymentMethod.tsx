import React, { useState, useEffect } from "react";
import {
    Box,
    Dialog,
    DialogContent,
    Divider,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
// import SmartphoneOutlinedIcon from "@mui/icons-material/SmartphoneOutlined";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import PayCard from "./PayCard";
import PayUPI from "./PayUPI";
import PayRedeem from "./PayReedem";

type ActiveView = "main" | "card" | "upi" | "redeem" | "phone";

interface PaymentItemProps {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onClick?: () => void;
}

const PaymentItem: React.FC<PaymentItemProps> = ({
    icon,
    title,
    subtitle,
    onClick,
}) => {
    return (
        <Stack
            direction="row"
            spacing={2.5}
            alignItems="flex-start"
            onClick={onClick}
            sx={{
                py: 1.4,
                cursor: "pointer",
            }}
        >
            <Box
                sx={{
                    color: "#3c4043",
                    display: "flex",
                    alignItems: "center",
                    mt: 0.2,
                }}
            >
                {icon}
            </Box>

            <Box>
                <Typography
                    sx={{
                        fontSize: "16px",
                        color: "#202124",
                        fontWeight: 400,
                    }}
                >
                    {title}
                </Typography>

                {subtitle && (
                    <Typography
                        sx={{
                            mt: 0.3,
                            fontSize: "13px",
                            lineHeight: 1.35,
                            color: "#5f6368",
                            maxWidth: "420px",
                        }}
                    >
                        {subtitle}
                    </Typography>
                )}
            </Box>
        </Stack>
    );
};

interface PaymentMethodProps {
    open: boolean;
    onClose: () => void;
    planName: string;
    planPrice: string;
    resetToken: string | null; // 1. ADD THIS TO INTERFACE
}

export default function PaymentMethod({ 
    open, 
    onClose, 
    planName, 
    planPrice, 
    resetToken // 2. DESTRUCTURE FROM PROPS
}: PaymentMethodProps) {
    const [activeView, setActiveView] = useState<ActiveView>("main");

    // Reset to main view whenever the dialog opens
    useEffect(() => {
        if (open) {
            setActiveView("main");
        }
    }, [open]);

    const handleClose = () => {
        setActiveView("main");
        onClose();
    };

    const handleBack = () => {
        setActiveView("main");
    };

    return (
        <>
            {/* Main Payment Method Dialog */}
            <Dialog
                open={open && activeView === "main"}
                onClose={handleClose}
                PaperProps={{
                    sx: {
                        width: "589px",
                        maxWidth: "589px",
                        borderRadius: "20px",
                        boxShadow: "0px 2px 8px rgba(0,0,0,0.15), 0px 8px 24px rgba(0,0,0,0.12)",
                        overflow: "hidden",
                    },
                }}
            >
                <Box sx={{ px: 3, py: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography sx={{ fontSize: "30px", fontWeight: 500, color: "#5f6368" }}>FintreePay</Typography>
                    <IconButton size="small" onClick={handleClose}>
                        <CloseIcon sx={{ color: "#5f6368", fontSize: 28 }} />
                    </IconButton>
                </Box>
                <Divider />
                <DialogContent sx={{ px: 3, py: 2.5 }}>
                    <Typography sx={{ fontSize: "18px", fontWeight: 500, color: "#202124" }}>Start by adding a payment method</Typography>
                    <Stack spacing={0.5} sx={{ mt: 3 }}>
                        <PaymentItem icon={<CreditCardOutlinedIcon />} title="Add card" onClick={() => setActiveView("card")} />
                        <PaymentItem icon={<AccountBalanceWalletOutlinedIcon />} title="Pay with UPI" onClick={() => setActiveView("upi")} />
                        <PaymentItem icon={<ConfirmationNumberOutlinedIcon />} title="Redeem code" onClick={() => setActiveView("redeem")} />
                    </Stack>
                </DialogContent>
            </Dialog>

            {/* Sub-dialogs */}
            <PayCard
                open={open && activeView === "card"}
                onClose={handleClose}
                onBack={handleBack}
                planName={planName}
                planPrice={planPrice}
                // resetToken={resetToken} // Uncomment this once PayCard interface is updated
            />
            <PayUPI
                open={open && activeView === "upi"}
                onClose={handleClose}
                onBack={handleBack}
                planName={planName}
                planPrice={planPrice}
                resetToken={resetToken} // 3. PASS THE TOKEN TO PayUPI
            />
            <PayRedeem
                open={open && activeView === "redeem"}
                onClose={handleClose}
                onBack={handleBack}
            />
        </>
    );
}
