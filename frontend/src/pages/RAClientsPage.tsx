import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import api from "../utils/axio";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

type Client = {
  id: string; subscriptionId: string; name: string; email: string | null;
  status: string; startsAt: string | null; expiresAt: string | null;
  subscribedAt: string | null;
  telegramAdded: boolean;
  whatsappAdded: boolean;
};

const date = (value: string | null) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function RAClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [telegramDialogOpen, setTelegramDialogOpen] = useState(false);
const [selectedClientId, setSelectedClientId] = useState("");
const [telegramPhone, setTelegramPhone] = useState("");
const [telegramSaving, setTelegramSaving] = useState(false);
const [telegramDeleteDialogOpen, setTelegramDeleteDialogOpen] =useState(false);
const [telegramDeleteClientId, setTelegramDeleteClientId] = useState("");
const [telegramDeleteSaving, setTelegramDeleteSaving] = useState(false);
const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
const [whatsappClientId, setWhatsappClientId] = useState("");
const [whatsappPhone, setWhatsappPhone] = useState("");
const [whatsappSaving, setWhatsappSaving] = useState(false);
const [whatsappDeleteDialogOpen, setWhatsappDeleteDialogOpen] = useState(false);
const [whatsappDeleteClientId, setWhatsappDeleteClientId] = useState("");
const [whatsappDeleteSaving, setWhatsappDeleteSaving] = useState(false);


const handleAddTelegram = (clientId: string) => {
  setSelectedClientId(clientId);
  setTelegramPhone("");
  setTelegramDialogOpen(true);
};

const handleConfirmAddTelegram = async () => {
  if (!selectedClientId) return;

  if (!telegramPhone.trim()) {
    setError("Please enter the client's phone number.");
    return;
  }

  try {
    setTelegramSaving(true);
    setError("");

    await api.post("/telegram/ra-client/add", {
      clientUserId: selectedClientId,
      telegramPhone: telegramPhone.trim(),
    });

    setClients((currentClients) =>
      currentClients.map((client) =>
        client.id === selectedClientId
          ? { ...client, telegramAdded: true }
          : client
      )
    );

    setTelegramDialogOpen(false);
    setTelegramPhone("");
    setSelectedClientId("");
  } catch (error: any) {
    setError(
      error?.response?.data?.message ||
        "Unable to add client to Telegram."
    );
  } finally {
    setTelegramSaving(false);
  }
};

const handleRemoveTelegram = (clientId: string) => { 
  setTelegramDeleteClientId(clientId); 
  setTelegramDeleteDialogOpen(true); 
};

const handleConfirmRemoveTelegram = async () => {
  if (!telegramDeleteClientId) return;

  try {
    setTelegramDeleteSaving(true);

    await api.delete(
      `/telegram/ra-client/${telegramDeleteClientId}`
    );

    setClients((prev) =>
      prev.map((client) =>
        client.id === telegramDeleteClientId
          ? { ...client, telegramAdded: false }
          : client
      )
    );

    setTelegramDeleteDialogOpen(false);
    setTelegramDeleteClientId("");
  } catch (error: any) {
    console.error("REMOVE TELEGRAM CLIENT ERROR:", error);

    alert(
      error?.response?.data?.message ||
        "Failed to remove client from Telegram"
    );
  } finally {
    setTelegramDeleteSaving(false);
  }
};

const handleAddWhatsApp = (clientId: string) => {
  setWhatsappClientId(clientId);
  setWhatsappPhone("");
  setWhatsappDialogOpen(true);
};

const handleConfirmAddWhatsApp = async () => {
  if (!whatsappClientId) return;

  if (!whatsappPhone.trim()) {
    setError("Please enter the client's phone number.");
    return;
  }

  try {
    setWhatsappSaving(true);
    setError("");

    const selectedClient = clients.find(
      (client) => client.id === whatsappClientId
    );

    await api.post("/whatsapp/ra-client/add", {
      clientUserId: whatsappClientId,
      phoneNumber: whatsappPhone.trim(),
      participantName: selectedClient?.name || "",
    });

    setClients((currentClients) =>
      currentClients.map((client) =>
        client.id === whatsappClientId
          ? { ...client, whatsappAdded: true }
          : client
      )
    );

    setWhatsappDialogOpen(false);
    setWhatsappPhone("");
    setWhatsappClientId("");
  } catch (error: any) {
    setError(
      error?.response?.data?.message ||
        "Unable to add client to WhatsApp."
    );
  } finally {
    setWhatsappSaving(false);
  }
};

const handleRemoveWhatsApp = (clientId: string) => {
  setWhatsappDeleteClientId(clientId);
  setWhatsappDeleteDialogOpen(true);
};

const handleConfirmRemoveWhatsApp = async () => {
  if (!whatsappDeleteClientId) return;

  try {
    setWhatsappDeleteSaving(true);

    await api.delete(
      `/whatsapp/ra-client/${whatsappDeleteClientId}`
    );

    setClients((prev) =>
      prev.map((client) =>
        client.id === whatsappDeleteClientId
          ? { ...client, whatsappAdded: false }
          : client
      )
    );

    setWhatsappDeleteDialogOpen(false);
    setWhatsappDeleteClientId("");
  } catch (error: any) {
    console.error(
      "REMOVE WHATSAPP CLIENT ERROR:",
      error
    );

    setError(
      error?.response?.data?.message ||
        "Failed to remove client from WhatsApp"
    );
  } finally {
    setWhatsappDeleteSaving(false);
  }
};




  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get(`/ra/dashboard/clients?status=${status}&limit=50&search=${encodeURIComponent(search)}`)
      .then(({ data }) => mounted && setClients(data.clients || []))
      .catch(() => mounted && setError("Unable to load your clients right now."))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [status, search]);

  const activeCount = useMemo(() => clients.filter((client) => client.status === "ACTIVE").length, [clients]);

  return <Box sx={{ maxWidth: 1400, mx: "auto" }}>
    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={2} sx={{ mb: 3 }}>
      <Box><Typography variant="h4" sx={{ fontWeight: 750, color: "#172554" }}>Clients</Typography><Typography color="text.secondary" sx={{ mt: .5 }}>Manage relationships, subscriptions, and client activity.</Typography></Box>
      <TextField size="small" placeholder="Search clients" value={search} onChange={(event) => setSearch(event.target.value)} sx={{ width: { xs: "100%", md: 300 } }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
    </Stack>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
      <Tabs value={status} onChange={(_, value) => setStatus(value)} sx={{ px: 2, borderBottom: "1px solid #e5e7eb" }}>
        <Tab value="ACTIVE" label={`Active${activeCount ? ` (${activeCount})` : ""}`} />
        <Tab value="EXPIRED" label="Expired" />
        <Tab value="ALL" label="All clients" />
      </Tabs>
      <Box sx={{ overflowX: "auto" }}>
        <Box sx={{ minWidth: 1300 }}>
<Box
  sx={{
    display: "grid",
    gridTemplateColumns: "2fr 1.4fr 1.1fr 1.1fr 1.1fr 1fr 1.5fr 1.5fr",
    gap: 2,
    px: 3,
    py: 1.5,
    bgcolor: "#f8fafc",
    color: "text.secondary",
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
  }}
>
  <span>Client</span>
  <span>Subscription</span>
  <span>Start date</span>
  <span>End date</span>
  <span>Last activity</span>
  <span>Status</span>
  <span>Telegram</span>
  <span>WhatsApp</span>
</Box>
         {loading ? (
  <Stack alignItems="center" sx={{ py: 8 }}>
    <CircularProgress size={28} />
  </Stack>
) : clients.length === 0 ? (
  <Stack alignItems="center" sx={{ py: 8, px: 3 }}>
    <PersonOutlineIcon
      sx={{ fontSize: 42, color: "#94a3b8", mb: 1 }}
    />
    <Typography fontWeight={700}>
      No clients found
    </Typography>
    <Typography color="text.secondary">
      Subscribed clients will appear here.
    </Typography>
  </Stack>
) : (
  clients.map((client) => (
    <Box
      key={client.subscriptionId}
      sx={{
        display: "grid",
        gridTemplateColumns:
          "2fr 1.4fr 1.1fr 1.1fr 1.1fr 1fr 1.5fr 1.5fr",
        gap: 2,
        px: 3,
        py: 2,
        alignItems: "center",
        borderTop: "1px solid #eef2f7",
        "&:hover": {
          bgcolor: "#fafbff",
        },
      }}
    >
      {/* Client */}
      <Box>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography fontWeight={700}>
            {client.name}
          </Typography>

          {!client.telegramAdded && (
            <Chip
              size="small"
              label="NEW"
              color="primary"
              sx={{
                height: 21,
                fontSize: 10,
                fontWeight: 800,
              }}
            />
          )}
        </Stack>

        <Typography variant="body2" color="text.secondary">
          {client.email || "No email on file"}
        </Typography>
      </Box>

      {/* Subscription */}
      <Typography variant="body2">
        RA subscription
      </Typography>

      {/* Start date */}
      <Typography variant="body2">
        {date(client.startsAt)}
      </Typography>

      {/* End date */}
      <Typography variant="body2">
        {date(client.expiresAt)}
      </Typography>

      {/* Last activity */}
      <Typography variant="body2">
        {date(client.subscribedAt)}
      </Typography>

      {/* Status */}
      <Chip
        size="small"
        label={client.status}
        color={
          client.status === "ACTIVE"
            ? "success"
            : "default"
        }
      />

{/* Telegram */}
<Stack
  direction="row"
  alignItems="center"
  spacing={1}
>
  {client.telegramAdded ? (
    <>
      <Chip
        size="small"
        icon={<CheckCircleOutlineIcon />}
        label="Added"
        color="success"
        variant="outlined"
        sx={{
          fontWeight: 700,
        }}
      />

      <IconButton
        size="small"
        onClick={() =>
          handleRemoveTelegram(client.id)
        }
        title="Remove from Telegram"
        sx={{
          color: "#DC2626",
          "&:hover": {
            bgcolor: "#FEF2F2",
            color: "#B91C1C",
          },
        }}
      >
        <DeleteOutlineIcon fontSize="small" />
      </IconButton>
    </>
  ) : (
    <Button
      size="small"
      variant="contained"
      startIcon={<AddIcon />}
      onClick={() =>
        handleAddTelegram(client.id)
      }
      sx={{
        textTransform: "none",
        fontWeight: 700,
        borderRadius: 2,
        px: 1.5,
      }}
    >
      Add
    </Button>
  )}
</Stack>

{/* WhatsApp */}
<Stack
  direction="row"
  alignItems="center"
  spacing={1}
>
  {client.whatsappAdded ? (
    <>
      <Chip
        size="small"
        icon={<CheckCircleOutlineIcon />}
        label="Added"
        color="success"
        variant="outlined"
        sx={{
          fontWeight: 700,
        }}
      />

      <IconButton
        size="small"
        onClick={() =>
          handleRemoveWhatsApp(client.id)
        }
        title="Remove from WhatsApp"
        sx={{
          color: "#DC2626",
          "&:hover": {
            bgcolor: "#FEF2F2",
            color: "#B91C1C",
          },
        }}
      >
        <DeleteOutlineIcon fontSize="small" />
      </IconButton>
    </>
  ) : (
    <Button
      size="small"
      variant="contained"
      startIcon={<AddIcon />}
      onClick={() =>
        handleAddWhatsApp(client.id)
      }
      sx={{
        textTransform: "none",
        fontWeight: 700,
        borderRadius: 2,
        px: 1.5,
  backgroundColor: "#2E7D32",
"&:hover": {
  backgroundColor: "#1B5E20",
},
      }}
    >
      Add
    </Button>
  )}
</Stack>
    </Box>
  ))
)}
        </Box>
      </Box>
       </Paper>

    <Dialog
      open={telegramDialogOpen}
      onClose={() => {
        if (!telegramSaving) {
          setTelegramDialogOpen(false);
        }
      }}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        Add Client to Telegram
      </DialogTitle>

      <DialogContent>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          Enter the client's Telegram Phone Number.
        </Typography>

      <TextField
  fullWidth
  autoFocus
  label="Telegram Phone Number"
  placeholder="+919876543210"
  value={telegramPhone}
  onChange={(event) =>
    setTelegramPhone(event.target.value)
  }
  disabled={telegramSaving}
/>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={() => setTelegramDialogOpen(false)}
          disabled={telegramSaving}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleConfirmAddTelegram}
          disabled={telegramSaving}
        >
          {telegramSaving ? (
            <CircularProgress
              size={20}
              color="inherit"
            />
          ) : (
            "Add to Telegram"
          )}
        </Button>
      </DialogActions>
    </Dialog>
<Dialog
  open={telegramDeleteDialogOpen}
  onClose={() => {
    if (!telegramDeleteSaving) {
      setTelegramDeleteDialogOpen(false);
      setTelegramDeleteClientId("");
    }
  }}
>
  <DialogTitle>Remove Telegram Client?</DialogTitle>

  <DialogContent>
    <DialogContentText>
      Are you sure you want to remove this client from your
      Telegram participants?
    </DialogContentText>
  </DialogContent>

  <DialogActions>
    <Button
      onClick={() => {
        setTelegramDeleteDialogOpen(false);
        setTelegramDeleteClientId("");
      }}
      disabled={telegramDeleteSaving}
    >
      Cancel
    </Button>

    <Button
      onClick={handleConfirmRemoveTelegram}
      color="error"
      variant="contained"
      disabled={telegramDeleteSaving}
    >
      {telegramDeleteSaving ? "Removing..." : "Remove"}
    </Button>
  </DialogActions>
</Dialog>

<Dialog
  open={whatsappDialogOpen}
  onClose={() => {
    if (!whatsappSaving) {
      setWhatsappDialogOpen(false);
    }
  }}
  fullWidth
  maxWidth="sm"
>
  <DialogTitle>
    Add Client to WhatsApp
  </DialogTitle>

  <DialogContent>
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ mb: 2 }}
    >
      Enter the client's WhatsApp phone number.
    </Typography>

    <TextField
      fullWidth
      autoFocus
      label="WhatsApp Phone Number"
      placeholder="+919876543210"
      value={whatsappPhone}
      onChange={(event) =>
        setWhatsappPhone(event.target.value)
      }
      disabled={whatsappSaving}
    />
  </DialogContent>

  <DialogActions sx={{ px: 3, pb: 2 }}>
    <Button
      onClick={() => setWhatsappDialogOpen(false)}
      disabled={whatsappSaving}
    >
      Cancel
    </Button>

    <Button
      variant="contained"
      onClick={handleConfirmAddWhatsApp}
      disabled={whatsappSaving}
    >
      {whatsappSaving ? (
        <CircularProgress
          size={20}
          color="inherit"
        />
      ) : (
        "Add to WhatsApp"
      )}
    </Button>
  </DialogActions>
</Dialog>

<Dialog
  open={whatsappDeleteDialogOpen}
  onClose={() => {
    if (!whatsappDeleteSaving) {
      setWhatsappDeleteDialogOpen(false);
      setWhatsappDeleteClientId("");
    }
  }}
>
  <DialogTitle>
    Remove WhatsApp Client?
  </DialogTitle>

  <DialogContent>
    <DialogContentText>
      Are you sure you want to remove this client from your
      WhatsApp participants?
    </DialogContentText>
  </DialogContent>

  <DialogActions>
    <Button
      onClick={() => {
        setWhatsappDeleteDialogOpen(false);
        setWhatsappDeleteClientId("");
      }}
      disabled={whatsappDeleteSaving}
    >
      Cancel
    </Button>

    <Button
      onClick={handleConfirmRemoveWhatsApp}
      color="error"
      variant="contained"
      disabled={whatsappDeleteSaving}
    >
      {whatsappDeleteSaving ? "Removing..." : "Remove"}
    </Button>
  </DialogActions>
</Dialog>
  </Box>;
}
