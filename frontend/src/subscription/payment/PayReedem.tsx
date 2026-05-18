import React from "react";
import {
    Box,
    Button,
    Dialog,
    IconButton,
    Link,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

interface PayRedeemProps {
    open: boolean;
    onClose: () => void;
    onBack: () => void;
}

export default function PayRedeem({ open, onClose, onBack }: PayRedeemProps) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: 480,
                    maxWidth: 480,
                    borderRadius: "12px",
                    boxShadow: "0px 8px 32px rgba(0,0,0,0.22)",
                },
            }}
        >
            <Box sx={{ p: 3 }}>
                {/* Header with back arrow */}
                <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                    <IconButton size="small" onClick={onBack}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography fontSize={14} color="#5f6368">
                        Payment methods
                    </Typography>
                </Stack>

                {/* Title Section */}
                <Box sx={{ textAlign: "center", mb: 3 }}>
                    <Typography
                        sx={{
                            fontSize: "22px",
                            fontWeight: 500,
                            color: "#202124",
                        }}
                    >
                        Redeem Code
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: "13px",
                            color: "#5f6368",
                            mt: 0.5,
                        }}
                    >
                        name@gmail.com
                    </Typography>
                </Box>

                {/* Input Field */}
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Enter gift card or promo code"
                    size="small"
                    sx={{
                        mb: 2,
                        "& .MuiOutlinedInput-root": {
                            borderRadius: "4px",
                            "& fieldset": {
                                borderColor: "#1a73e8",
                                borderWidth: "2px",
                            },
                            "&:hover fieldset": {
                                borderColor: "#1557b0",
                            },
                            "&.Mui-focused fieldset": {
                                borderColor: "#1a73e8",
                            },
                        },
                        "& .MuiInputBase-input::placeholder": {
                            color: "#1a73e8",
                            opacity: 1,
                            fontSize: "14px",
                        },
                    }}
                />

                {/* Terms Text */}
                <Typography
                    sx={{
                        fontSize: "12px",
                        color: "#5f6368",
                        lineHeight: 1.5,
                        mb: 3,
                    }}
                >
                    By clicking Redeem, you agree to the Gift Card & Promotional Code{" "}
                    <Link
                        href="#"
                        sx={{
                            color: "#1a73e8",
                            textDecorationColor: "#1a73e8",
                            fontSize: "12px",
                        }}
                    >
                        Terms and Conditions
                    </Link>
                    , as applicable.
                </Typography>

                {/* Action Buttons */}
                <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
                    <Button
                        onClick={onBack}
                        sx={{
                            textTransform: "none",
                            color: "#5f6368",
                            fontWeight: 500,
                            fontSize: "14px",
                            px: 2.5,
                            borderRadius: "20px",
                            "&:hover": {
                                bgcolor: "rgba(0,0,0,0.04)",
                            },
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: "14px",
                            px: 3,
                            borderRadius: "20px",
                            bgcolor: "#1a73e8",
                            boxShadow: "none",
                            "&:hover": {
                                bgcolor: "#1557b0",
                                boxShadow: "0 2px 8px rgba(26,115,232,0.3)",
                            },
                        }}
                    >
                        Redeem
                    </Button>
                </Stack>
            </Box>
        </Dialog>
    );
}
