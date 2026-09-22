import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import BrokerPageHeader from "../components/BrokerPageHeader";
import { addBrokerAnalyst, createBrokerInvitation, getBrokerAnalysts, onboardingError, searchBrokerAnalysts, type AssociatedAnalyst, type BrokerInvitation } from "../services/brokerOnboarding.service";

const BrokerResearchAnalysts = () => {
  const navigate = useNavigate();
  const [analysts, setAnalysts] = useState<AssociatedAnalyst[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dialog, setDialog] = useState<"choose" | "link" | "existing" | null>(null);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [email, setEmail] = useState("");
  const [invitation, setInvitation] = useState<BrokerInvitation | null>(null);
  const [linkNotice, setLinkNotice] = useState("");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<AssociatedAnalyst[]>([]);
  const [searched, setSearched] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setAnalysts(await getBrokerAnalysts()); }
    catch (err) { setError(onboardingError(err)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    void load();
    const refresh = () => { void load(); };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [load]);
  const open = () => {
    setDialog("choose"); setDialogError(""); setEmail(""); setInvitation(null);
    setLinkNotice(""); setSearch(""); setResults([]); setSearched(false);
  };
  const directRegistration = async () => {
    setBusy(true); setDialogError("");
    try { navigate((await createBrokerInvitation("DIRECT")).registrationPath); }
    catch (err) { setDialogError(onboardingError(err)); }
    finally { setBusy(false); }
  };
  const generateLink = async (sendEmail: boolean) => {
    setBusy(true); setDialogError(""); setLinkNotice("");
    try {
      const result = await createBrokerInvitation("LINK", email, sendEmail);
      setInvitation(result);
      setLinkNotice(sendEmail ? (result.emailSent ? "Registration link sent by email." : "Email could not be sent. Copy the registration link below to share it.") : "Registration link is ready to share.");
    } catch (err) { setDialogError(onboardingError(err)); }
    finally { setBusy(false); }
  };
  const findAnalysts = async () => {
    setBusy(true); setDialogError(""); setResults([]); setSearched(false);
    try { setResults(await searchBrokerAnalysts(search.trim())); setSearched(true); }
    catch (err) { setDialogError(onboardingError(err)); }
    finally { setBusy(false); }
  };
  const addExisting = async (ra: AssociatedAnalyst) => {
    setBusy(true); setDialogError("");
    try {
      await addBrokerAnalyst(ra.id); setDialog(null);
      setNotice(`${ra.name} added. Their published calls are now available in Research Calls.`);
      await load();
    } catch (err) { setDialogError(onboardingError(err)); }
    finally { setBusy(false); }
  };
  const registrationUrl = invitation ? new URL(invitation.registrationPath, window.location.origin).href : "";
  return <Box>
    <BrokerPageHeader title="Research Analysts" subtitle="Onboard and manage the Research Analysts associated with your brokerage." />
    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ mb: 2 }}>
      <Typography color="text.secondary">{analysts.length} associated Research Analysts</Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={open}>Add Research Analyst</Button>
    </Stack>
    {notice && <Alert severity="success" onClose={() => setNotice("")} sx={{ mb: 2 }}>{notice}</Alert>}
    {error && <Alert severity="error" action={<Button onClick={() => void load()}>Retry</Button>} sx={{ mb: 2 }}>{error}</Alert>}
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1, borderColor: "#E9E9EE" }}>
      <Table size="small" aria-label="Associated Research Analysts" sx={{ minWidth: 720, "& th": { bgcolor: "#F9FAFB", fontWeight: 700, fontSize: 12, py: 2, whiteSpace: "nowrap" }, "& td": { fontSize: 13, py: 1.8 } }}>
        <TableHead><TableRow><TableCell>Name</TableCell><TableCell>SEBI registration</TableCell><TableCell>Expertise</TableCell><TableCell>Registration expiry</TableCell><TableCell>Onboarding</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
        <TableBody>
          {loading ? <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={24} aria-label="Loading Research Analysts" /></TableCell></TableRow>
            : analysts.length === 0 ? <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}>No Research Analysts added yet. Use Add Research Analyst to get started.</TableCell></TableRow>
              : analysts.map(ra => <TableRow key={ra.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{ra.name}</TableCell><TableCell>{ra.sebiRegistration || "—"}</TableCell>
                <TableCell>{ra.category || "—"}</TableCell><TableCell>{ra.registrationExpiry ? new Date(ra.registrationExpiry).toLocaleDateString("en-IN") : "—"}</TableCell>
                <TableCell>{{ DIRECT: "Added here", LINK: "Registration link", EXISTING: "Existing RA" }[ra.onboardingMethod || "EXISTING"]}</TableCell>
                <TableCell><Chip size="small" label={ra.status === "PENDING" ? "Pending onboarding" : ra.status} color={ra.status === "ACTIVE" ? "success" : ra.status === "REJECTED" ? "error" : "warning"} /></TableCell>
              </TableRow>)}
        </TableBody>
      </Table>
    </TableContainer>
    <Dialog open={dialog !== null} onClose={() => { if (!busy) setDialog(null); }} fullWidth maxWidth="sm" aria-labelledby="onboard-ra-title">
      <DialogTitle id="onboard-ra-title">{dialog === "link" ? "Send registration link" : dialog === "existing" ? "Add existing RA" : "Add Research Analyst"}</DialogTitle>
      <DialogContent>
        {dialogError && <Alert severity="error" sx={{ mb: 2 }}>{dialogError}</Alert>}
        {dialog === "choose" && <Stack spacing={2}>
          <Typography color="text.secondary">Choose how you would like to onboard your Research Analyst.</Typography>
          {[
            { title: "Add here", text: "Open the RA registration form and complete their details.", icon: <PersonAddOutlinedIcon />, action: directRegistration },
            { title: "Send registration link", text: "Email or copy a secure link for the RA to register.", icon: <LinkOutlinedIcon />, action: () => setDialog("link") },
            { title: "Add existing RA", text: "Find and associate an RA already registered on the platform.", icon: <GroupAddOutlinedIcon />, action: () => setDialog("existing") },
          ].map(option => <Button key={option.title} variant="outlined" disabled={busy} onClick={option.action} startIcon={option.icon} sx={{ p: 2, justifyContent: "flex-start", textAlign: "left", textTransform: "none", borderColor: "#E2E8F0" }}>
            <Box><Typography fontWeight={700}>{option.title}</Typography><Typography variant="body2" color="text.secondary">{option.text}</Typography></Box>
          </Button>)}
        </Stack>}
        {dialog === "link" && <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography color="text.secondary">The link connects the completed RA registration to your brokerage and expires in 7 days.</Typography>
          <TextField label="RA email address" type="email" value={email} disabled={busy} onChange={e => { setEmail(e.target.value); setInvitation(null); setLinkNotice(""); }} helperText="Required for email delivery; optional when copying a link." fullWidth />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button variant="contained" disabled={busy || !email.trim()} onClick={() => void generateLink(true)}>Send link by email</Button>
            <Button variant="outlined" disabled={busy} onClick={() => void generateLink(false)}>Generate link</Button>
          </Stack>
          {linkNotice && <Alert severity={invitation?.emailSent ? "success" : "info"}>{linkNotice}</Alert>}
          {invitation && <><TextField label="Registration link" value={registrationUrl} slotProps={{ input: { readOnly: true } }} fullWidth />
            <Button onClick={async () => {
              try { await navigator.clipboard.writeText(registrationUrl); setLinkNotice("Registration link copied."); }
              catch { setDialogError("Copy could not complete. Select and copy the registration link above."); }
            }}>Copy link</Button></>}
        </Stack>}
        {dialog === "existing" && <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography color="text.secondary">Search active RAs by name or SEBI registration number. Already associated RAs are excluded.</Typography>
          <Box component="form" onSubmit={e => { e.preventDefault(); if (search.trim().length >= 2 && !busy) void findAnalysts(); }} sx={{ display: "flex", gap: 1 }}>
            <TextField autoFocus size="small" fullWidth label="Name or SEBI registration" value={search} disabled={busy} onChange={e => { setSearch(e.target.value); setSearched(false); setResults([]); }} />
            <Button type="submit" variant="outlined" disabled={busy || search.trim().length < 2}>Search</Button>
          </Box>
          {searched && results.length === 0 && <Alert severity="info">No matching RAs available to add.</Alert>}
          {results.map(ra => <Stack key={ra.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ border: "1px solid #E2E8F0", borderRadius: 1, p: 1.5 }}>
            <Box><Typography fontWeight={600}>{ra.name}</Typography><Typography variant="body2" color="text.secondary">{ra.sebiRegistration}</Typography></Box>
            <Button disabled={busy} onClick={() => void addExisting(ra)} aria-label={`Add ${ra.name}`}>Add</Button>
          </Stack>)}
        </Stack>}
        {busy && <Box sx={{ textAlign: "center", pt: 2 }}><CircularProgress size={24} aria-label="Processing" /></Box>}
      </DialogContent>
      <DialogActions>
        {dialog !== "choose" && <Button disabled={busy} onClick={() => { setDialog("choose"); setDialogError(""); }}>Back</Button>}
        <Button disabled={busy} onClick={() => setDialog(null)}>Close</Button>
      </DialogActions>
    </Dialog>
  </Box>;
};
export default BrokerResearchAnalysts;
