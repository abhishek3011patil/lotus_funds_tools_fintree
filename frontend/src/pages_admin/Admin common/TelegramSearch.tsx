import {
  Box,
  TextField,
  Button,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  Typography,
} from "@mui/material";
import { Send as SendIcon } from "@mui/icons-material";
import DownloadIcon from "@mui/icons-material/Download";
import { useState, useRef } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

type TelegramSearchProps = {
  raId?: string; // ✅ optional now
  onSaved?: () => void;
};

export const TelegramSearch = ({ raId, onSaved }: TelegramSearchProps) => {
  const [username, setUsername] = useState("");
  const [telegramId, setTelegramId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [entityType, setEntityType] = useState("USER");
  const fileInputRef = useRef<HTMLInputElement>(null);

  console.log("raId prop =", raId);
console.trace("TelegramSearch rendered from");

  const handleSave = async () => {
  // ✅ At least one field required
  if (!telegramId && !username && !phoneNumber) {
    alert("Enter at least one: Username, Telegram ID, or Phone");
    return;
  }

  if (phoneNumber && !phoneNumber.startsWith("+91")) {
    alert("Phone number must start with +91");
    return;
  }

  const cleanUsername = username.trim().replace(/^@/, "");

  try {
    setLoading(true);

    const token = localStorage.getItem("token");

    // 🔥 COMMON PAYLOAD
    const payload = {
      telegram_user_id: telegramId || null,
      telegram_client_name: cleanUsername || null,
      phone_number: phoneNumber || null,
    };

    // =========================
    // ✅ ADMIN FLOW
    // =========================
    if (raId && raId.trim()) {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/telegram/save-user`,
        {
          ...payload,
          user_id: raId.trim(), // ✅ required for admin
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }

    // =========================
    // ✅ RA FLOW (SELF)
    // =========================
    else {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/telegram/add-participant`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }

    alert("✅ Saved successfully");

    onSaved?.();

    // reset fields
    setUsername("");
    setTelegramId("");
    setPhoneNumber("");

  } catch (err: unknown) {
    const errorMsg = axios.isAxiosError(err)
      ? err.response?.data?.message ||
        "Invalid Telegram details or server error"
      : "Invalid Telegram details or server error";

    alert(`❌ Error: ${errorMsg}`);
  } finally {
    setLoading(false);
  }
};

const handleExcelUpload = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0];

  if (!file) return;

  try {
    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("file", file);

    if (raId) {
      formData.append("user_id", raId);
    }

    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/telegram/upload-excel`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const { summary, results } = res.data;

const failed = results.filter(
  (x: any) => x.status === "failed"
);

let message =
`Success : ${summary.success}
Failed : ${summary.failed}`;

if (failed.length) {

   message += "\n\nFailed:\n";

   failed.forEach((f:any)=>{

      message += `${f.participant} : ${f.error}\n`;

   });

}

alert(message);

onSaved?.();

    onSaved?.();
  } catch (err: any) {
    console.error(err);

    alert(
      err.response?.data?.message || "Upload failed"
    );
  }
};

const downloadTemplate = async () => {
  const token = localStorage.getItem("token");

  const response = await axios.get(
    `${import.meta.env.VITE_API_URL}/api/telegram/download-template`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: "blob",
    }
  );

  const url = window.URL.createObjectURL(
    new Blob([response.data])
  );

  const link = document.createElement("a");

  link.href = url;
  link.download = "Telegram_Template.xlsx";

  document.body.appendChild(link);
  link.click();

  link.remove();
};

 return (
  <Box
    sx={{
      width: "100%",
      maxWidth: "100%",
      minWidth: 0,
      p: { xs: 0, sm: 1 },
      boxSizing: "border-box",
    }}
  >
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 3 },
        border: "1px solid #e0e0e0",
        borderRadius: 2,
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            sm: "minmax(0, 1fr)",
            md: "repeat(3, minmax(0, 1fr))",
          },
          gap: { xs: 2, sm: 3 },
          width: "100%",
          minWidth: 0,
        }}
      >

        {/* Entity Type */}
        <Box
          sx={{
            gridColumn: "1 / -1",
            width: "100%",
            minWidth: 0,
          }}
        >
          <Typography sx={{ mb: 1, fontWeight: 600 }}>
            Type
          </Typography>

          <RadioGroup
            row
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            sx={{
              display: "flex",
              flexWrap: "wrap",
              width: "100%",
              minWidth: 0,
              gap: { xs: 0.5, sm: 1 },
            }}
          >
            <FormControlLabel
              value="USER"
              control={<Radio />}
              label="User"
              sx={{ mr: { xs: 1, sm: 2 } }}
            />

            <FormControlLabel
              value="GROUP"
              control={<Radio />}
              label="Group"
              sx={{ mr: { xs: 1, sm: 2 } }}
            />

            <FormControlLabel
              value="CHANNEL"
              control={<Radio />}
              label="Channel"
              sx={{ mr: 0 }}
            />
          </RadioGroup>
        </Box>

        {/* Username */}
        <TextField
          fullWidth
          label={
            entityType === "USER"
              ? "Telegram Username"
              : entityType === "GROUP"
              ? "Group Username or Link"
              : "Channel Username or Link"
          }
          placeholder={
            entityType === "USER"
              ? "@username"
              : entityType === "GROUP"
              ? "@group_username"
              : "@channel_username"
          }
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          sx={{
            minWidth: 0,
            "& .MuiInputBase-root": {
              minWidth: 0,
            },
          }}
        />

        {/* Telegram ID */}
        {entityType === "USER" && (
          <TextField
            fullWidth
            label="Telegram ID"
            placeholder="123456789"
            value={telegramId}
            onChange={(e) => setTelegramId(e.target.value)}
            sx={{
              minWidth: 0,
              "& .MuiInputBase-root": {
                minWidth: 0,
              },
            }}
          />
        )}

        {/* Phone */}
        {entityType === "USER" && (
          <TextField
            fullWidth
            label="Phone Number"
            placeholder="+919876543210"
            value={phoneNumber}
            error={!!phoneError}
            helperText={phoneError}
            onChange={(e) => {
              const value = e.target.value;
              setPhoneNumber(value);

              if (value && !value.startsWith("+91")) {
                setPhoneError(
                  "Phone number must start with +91"
                );
              } else {
                setPhoneError("");
              }
            }}
            sx={{
              minWidth: 0,
              "& .MuiInputBase-root": {
                minWidth: 0,
              },
            }}
          />
        )}

        {/* Buttons */}
        <Box
          sx={{
            gridColumn: "1 / -1",
            mt: 1,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            flexWrap: "wrap",
            gap: 2,
            width: "100%",
            minWidth: 0,
          }}
        >
          {/* Save */}
          <Button
            variant="contained"
            size="large"
            startIcon={<SendIcon />}
            onClick={handleSave}
            disabled={loading}
            sx={{
              backgroundColor: "#22C55E",
              "&:hover": {
                backgroundColor: "#1a9d4b",
              },
              textTransform: "none",
              px: 4,
              fontWeight: "600",
              fontSize: 15,
              width: { xs: "100%", sm: "auto" },
              maxWidth: "100%",
              boxSizing: "border-box",
            }}
          >
            {loading ? "Saving..." : "Save Details"}
          </Button>

          {/* Add Excel */}
          <Button
            variant="outlined"
            size="large"
            onClick={() => fileInputRef.current?.click()}
            sx={{
              textTransform: "none",
              width: { xs: "100%", sm: "auto" },
              maxWidth: "100%",
              boxSizing: "border-box",
            }}
          >
            Add Excel
          </Button>

          {/* Download Excel */}
          <Button
            variant="outlined"
            size="large"
            component="a"
            href="/excel_sheets/telegram-sheets.xlsx"
            download="telegram-sheets.xlsx"
            sx={{
              textTransform: "none",
              width: { xs: "100%", sm: "auto" },
              maxWidth: "100%",
              boxSizing: "border-box",
            }}
          >
            Download Excel
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept=".xlsx,.xls"
            onChange={handleExcelUpload}
          />
        </Box>
      </Box>
    </Paper>
  </Box>
);
};

export default TelegramSearch;