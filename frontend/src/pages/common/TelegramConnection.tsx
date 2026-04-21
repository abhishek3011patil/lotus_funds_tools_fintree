import { useState, useEffect } from "react";
import { Typography, Paper, TextField, Stack, Box, Button, Alert } from "@mui/material";
import axios from "axios";

const TelegramConnection = () => {
    const [step, setStep] = useState<"phone" | "otp" | "connected">("phone");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    useEffect(() => {
        const checkTelegram = async () => {
            try {
                const token = localStorage.getItem("token");

                const res = await axios.get(
                    import.meta.env.VITE_API_URL + "/api/telegram/status",
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                if (res.data.connected) {
                    setStep("connected");
                }
            } catch (err) {
                console.error(err);
            }
        };

        checkTelegram();
    }, []);

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
                    Connect Telegram
                </Typography>

                {/* ERROR */}
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* STEP 1: PHONE */}
                {step === "phone" && (
                    <Stack spacing={2}>
                        <TextField
                            label="Phone Number"
                            placeholder="+91XXXXXXXXXX"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            sx={{ width: "50%" }}
                        />

                        <Box sx={{ textAlign: "left", mt: 1 }}>
                            <Button
                                variant="contained"
                                size="large"
                                disabled={loading || !phone || cooldown > 0}
                                sx={{ minWidth: 160, textTransform: "none", fontSize: "1.1rem" }}
                                onClick={async () => {
                                    try {
                                        setLoading(true);
                                        setError("");

                                        if (!phone.startsWith("+")) {
                                            setError("Phone must include country code (+91...)");
                                            return;
                                        }

                                        const token = localStorage.getItem("token");

                                        await axios.post(
                                            import.meta.env.VITE_API_URL + "/api/telegram/send-otp",
                                            { phoneNumber: phone },
                                            {
                                                headers: {
                                                    Authorization: `Bearer ${token}`,
                                                },
                                            }
                                        );

                                        setStep("otp");
                                        setCooldown(30);
                                    } catch (err: any) {
                                        setError(err?.response?.data?.message || "Failed to send OTP");
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                            >
                                {cooldown > 0
                                    ? `Resend in ${cooldown}s`
                                    : loading
                                        ? "Sending OTP..."
                                        : "Send OTP"}
                            </Button>
                        </Box>
                    </Stack>
                )}

                {/* STEP 2: OTP */}
                {step === "otp" && (
                    <Stack spacing={2}>
                        <TextField
                            label="Enter OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            sx={{ width: "50%" }}
                        />

                        <Stack direction="row" spacing={2}>
                            <Button
                                variant="contained"
                                disabled={loading || otp.length < 4}
                                onClick={async () => {
                                    try {
                                        setLoading(true);
                                        setError("");

                                        const token = localStorage.getItem("token");

                                        await axios.post(
                                            import.meta.env.VITE_API_URL + "/api/telegram/verify-otp",
                                            { code: otp },
                                            {
                                                headers: {
                                                    Authorization: `Bearer ${token}`,
                                                },
                                            }
                                        );

                                        setStep("connected");
                                    } catch (err: any) {
                                        setError(err?.response?.data?.message || "OTP verification failed");
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                            >
                                {loading ? "Verifying..." : "Verify OTP"}
                            </Button>

                            <Button variant="outlined" onClick={() => setStep("phone")}>
                                Change Number
                            </Button>
                        </Stack>
                    </Stack>
                )}

                {/* STEP 3: CONNECTED */}
                {step === "connected" && (
                    <Stack spacing={2}>
                        <Alert severity="success">Telegram Connected Successfully</Alert>

                        <Typography variant="body2">
                            Connected Number:{" "}
                            {phone.replace(/(\d{2})\d{6}(\d{2})/, "$1******$2")}
                        </Typography>

                        <Button
                            variant="outlined"
                            onClick={() => {
                                setStep("phone");
                                setPhone("");
                                setOtp("");

                            }}
                        >
                            Reconnect
                        </Button>
                    </Stack>
                )}
            </Paper>
        </Box>
    );
};

export default TelegramConnection;
