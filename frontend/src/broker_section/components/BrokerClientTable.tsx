import { Box, Button, Card, CardContent, Chip, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import TelegramIcon from "@mui/icons-material/Telegram";
import HistoryIcon from "@mui/icons-material/History";
import type { ReactNode } from "react";
import type { BrokerClient } from "../types/broker.types";
import { formatIndiaDateTime } from "../../utils/formatters";

const ChannelButton = ({ added, label, icon, onClick }: { added: boolean; label: string; icon: ReactNode; onClick: () => void }) => (
  <Button size="small" variant={added ? "outlined" : "contained"} color={added ? "success" : "primary"} startIcon={icon} onClick={onClick}>
    {added ? `${label} added` : `Add ${label}`}
  </Button>
);

const BrokerClientTable = ({ clients, busyId, onChannel, onHistory }: {
  clients: BrokerClient[];
  busyId: string;
  onChannel: (client: BrokerClient, channel: "whatsapp" | "telegram") => void;
  onHistory: (client: BrokerClient) => void;
}) => (
  <>
  <Stack spacing={1.5} sx={{ display: { xs: "flex", md: "none" } }}>
    {clients.map(client => <Card key={client.id} variant="outlined"><CardContent>
      <Stack direction="row" justifyContent="space-between" gap={1} alignItems="flex-start">
        <Box><Typography fontWeight={750}>{client.name}</Typography><Typography variant="caption" color="text.secondary">{client.email || "No email"} · {client.phoneNumber ? `+${client.phoneNumber}` : "No phone"}</Typography></Box>
        <Chip size="small" label={client.status} color={client.status === "ACTIVE" ? "success" : "default"} />
      </Stack>
      <Typography variant="body2" sx={{ mt: 1.5 }}>Calls received: {client.receivedCallCount || 0}</Typography>
      <Typography variant="caption" color="text.secondary">Last delivery: {formatIndiaDateTime(client.lastDeliveryAt)}</Typography>
      <Stack spacing={1} sx={{ mt: 2 }}>
        <ChannelButton added={client.whatsappAdded} label="WhatsApp" icon={<WhatsAppIcon />} onClick={() => onChannel(client, "whatsapp")} />
        <ChannelButton added={client.telegramAdded} label="Telegram" icon={<TelegramIcon />} onClick={() => onChannel(client, "telegram")} />
        <Button size="small" startIcon={<HistoryIcon />} disabled={busyId === client.id} onClick={() => onHistory(client)}>View delivery history</Button>
      </Stack>
    </CardContent></Card>)}
  </Stack>
  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, display: { xs: "none", md: "block" } }}>
    <Table size="small" aria-label="Broker clients" sx={{ minWidth: 1250 }}>
      <TableHead><TableRow>
        <TableCell>Client</TableCell><TableCell>Source</TableCell><TableCell>Status</TableCell><TableCell>Phone</TableCell><TableCell>KYC</TableCell>
        <TableCell>WhatsApp</TableCell><TableCell>Telegram</TableCell><TableCell>Calls received</TableCell><TableCell>Last delivery</TableCell><TableCell>History</TableCell>
      </TableRow></TableHead>
      <TableBody>{clients.map(client => <TableRow key={client.id} hover>
        <TableCell><Typography fontWeight={750}>{client.name}</Typography><Typography variant="caption" color="text.secondary">{client.email || "No email"}</Typography></TableCell>
        <TableCell><Chip size="small" label={client.source === "PORTAL" ? "Portal" : "Broker added"} color={client.source === "PORTAL" ? "primary" : "default"} variant="outlined" /></TableCell>
        <TableCell><Chip size="small" label={client.status} color={client.status === "ACTIVE" ? "success" : "default"} /></TableCell>
        <TableCell>{client.phoneNumber ? `+${client.phoneNumber}` : "—"}</TableCell>
        <TableCell><Stack spacing={.25}><Typography variant="caption">Aadhaar: {client.aadhaarMasked || "—"}</Typography><Typography variant="caption">PAN: {client.panMasked || "—"}</Typography></Stack></TableCell>
        <TableCell><ChannelButton added={client.whatsappAdded} label="WhatsApp" icon={<WhatsAppIcon />} onClick={() => onChannel(client, "whatsapp")} /></TableCell>
        <TableCell><ChannelButton added={client.telegramAdded} label="Telegram" icon={<TelegramIcon />} onClick={() => onChannel(client, "telegram")} /></TableCell>
        <TableCell><Chip size="small" label={client.receivedCallCount || 0} color={client.receivedCallCount ? "success" : "default"} /></TableCell>
        <TableCell>{formatIndiaDateTime(client.lastDeliveryAt)}</TableCell>
        <TableCell><Button size="small" startIcon={<HistoryIcon />} disabled={busyId === client.id} onClick={() => onHistory(client)}>View</Button></TableCell>
      </TableRow>)}</TableBody>
    </Table>
  </TableContainer>
  </>
);

export default BrokerClientTable;
