import { useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import api from "../../utils/axio";

type ClientSummary = {
  activeClients: number;
  newClientsThisMonth: number;
  lifetimeClients: number;
};

type SubscribedClient = {
  id: string;
  subscriptionId: string;
  name: string;
  email: string | null;
  status: string;
  startsAt: string | null;
  expiresAt: string | null;
  subscribedAt: string | null;
};

type ClientListResponse = {
  success: boolean;
  clients: SubscribedClient[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const emptySummary: ClientSummary = {
  activeClients: 0,
  newClientsThisMonth: 0,
  lifetimeClients: 0,
};

const formatDate = (value: string | null) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const RAClientsCard = () => {
  const [summary, setSummary] = useState<ClientSummary>(emptySummary);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<SubscribedClient[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let active = true;

    api
      .get<{ success: boolean; summary: ClientSummary }>("/ra/dashboard/summary")
      .then((response) => {
        if (active) setSummary(response.data.summary || emptySummary);
      })
      .catch(() => {
        if (active) setSummaryError("Unable to load client count.");
      })
      .finally(() => {
        if (active) setSummaryLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    let active = true;
    const timer = window.setTimeout(() => {
      setClientsLoading(true);
      setClientsError(null);

      api
        .get<ClientListResponse>("/ra/dashboard/clients", {
          params: { search, status, page, limit: 10 },
        })
        .then((response) => {
          if (!active) return;
          setClients(response.data.clients || []);
          setTotal(Number(response.data.pagination?.total || 0));
          setTotalPages(Number(response.data.pagination?.totalPages || 0));
        })
        .catch(() => {
          if (active) setClientsError("Unable to load subscribed clients.");
        })
        .finally(() => {
          if (active) setClientsLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [open, page, search, status]);

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const changeStatus = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: 2.25,
          minWidth: 0,
          height: "100%",
          boxSizing: "border-box",
          border: "1px solid #E7ECF4",
          borderRadius: 3,
          background: "linear-gradient(145deg, #FFFFFF 0%, #FBFCFF 100%)",
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.045)",
          transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 14px 30px rgba(30, 64, 175, 0.09)",
            borderColor: "#C9D5F2",
          },
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1} minWidth={0}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2.25,
                color: "primary.main",
                bgcolor: "#EEF3FF",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <PeopleAltOutlinedIcon fontSize="small" />
            </Box>
            <Typography fontWeight={750} fontSize="0.9rem" noWrap color="#172033">
              Subscribed Clients
            </Typography>
          </Stack>
          {summaryLoading ? (
            <CircularProgress size={18} />
          ) : (
            <Chip
              size="small"
              label={`${summary.activeClients} active`}
              color="primary"
              sx={{ fontWeight: 650, height: 25, fontSize: "0.7rem" }}
            />
          )}
        </Stack>

        <Box sx={{ mt: 1.5, minHeight: 44 }}>
          {summaryError ? (
            <Typography variant="caption" color="error.main">
              {summaryError}
            </Typography>
          ) : (
            <>
              <Typography variant="h5" fontWeight={800} color="#172033" lineHeight={1.05}>
                {summaryLoading ? "—" : summary.activeClients}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {summary.newClientsThisMonth} new this month · {summary.lifetimeClients} lifetime
              </Typography>
            </>
          )}
        </Box>

        <Button
          size="small"
          onClick={() => setOpen(true)}
          endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: "1rem !important" }} />}
          sx={{ mt: 0.75, px: 0, py: 0.25, fontWeight: 700 }}
        >
          View clients
        </Button>
      </Paper>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
      >
        <DialogTitle sx={{ px: { xs: 2, sm: 3 }, py: 2.25 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Box>
              <Typography variant="h6" fontWeight={800} color="#172033">
                Subscribed Clients
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {total} client{total === 1 ? "" : "s"} in this view
              </Typography>
            </Box>
            <IconButton aria-label="Close client list" onClick={() => setOpen(false)}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} mb={2.5}>
            <TextField
              fullWidth
              size="small"
              value={search}
              onChange={(event) => changeSearch(event.target.value)}
              placeholder="Search client name or email"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
            <TextField
              select
              size="small"
              label="Status"
              value={status}
              onChange={(event) => changeStatus(event.target.value)}
              sx={{ minWidth: { sm: 150 }, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            >
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="EXPIRED">Expired</MenuItem>
              <MenuItem value="ALL">All paid</MenuItem>
            </TextField>
          </Stack>

          {clientsError && <Alert severity="error">{clientsError}</Alert>}

          {clientsLoading ? (
            <Box sx={{ minHeight: 220, display: "grid", placeItems: "center" }}>
              <CircularProgress size={30} />
            </Box>
          ) : !clientsError && clients.length === 0 ? (
            <Box sx={{ minHeight: 190, display: "grid", placeItems: "center", textAlign: "center" }}>
              <Box>
                <Typography fontWeight={750} color="#172033">No clients found</Typography>
                <Typography variant="body2" color="text.secondary">
                  Try another search or subscription status.
                </Typography>
              </Box>
            </Box>
          ) : (
            <Stack divider={<Divider flexItem />}>
              {clients.map((client) => (
                <Stack
                  key={client.subscriptionId}
                  direction={{ xs: "column", sm: "row" }}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  justifyContent="space-between"
                  spacing={1.25}
                  py={1.5}
                >
                  <Stack direction="row" spacing={1.25} alignItems="center" minWidth={0}>
                    <Avatar sx={{ width: 40, height: 40, bgcolor: "#E8EEFF", color: "#2448A8", fontWeight: 750 }}>
                      {client.name.trim().charAt(0).toUpperCase() || "C"}
                    </Avatar>
                    <Box minWidth={0}>
                      <Typography fontWeight={750} color="#172033" noWrap>
                        {client.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {client.email || "Email unavailable"}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1.5} alignItems="center" pl={{ xs: 6.5, sm: 0 }}>
                    <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Expires
                      </Typography>
                      <Typography variant="body2" fontWeight={650} color="#172033">
                        {formatDate(client.expiresAt)}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={client.status.toLowerCase()}
                      color={client.status === "ACTIVE" ? "success" : "default"}
                      sx={{ textTransform: "capitalize", fontWeight: 700 }}
                    />
                  </Stack>
                </Stack>
              ))}
            </Stack>
          )}

          {totalPages > 1 && !clientsLoading && (
            <Stack alignItems="center" mt={2.5}>
              <Pagination
                page={page}
                count={totalPages}
                onChange={(_event, value) => setPage(value)}
                color="primary"
                shape="rounded"
              />
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RAClientsCard;
