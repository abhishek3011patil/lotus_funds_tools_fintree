import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Divider, Grid, Link, Stack, Typography } from "@mui/material";
import type { BrokerAccount } from "../types/brokerAccount";
import { getMyBrokerAccount } from "../services/brokerAccount.service";

const value = (item: unknown) => item === null || item === undefined || item === "" ? "—" : String(item);
const date = (item: string | null) => item ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(item)) : "—";
const mask = (item: string | null) => item ? `${"•".repeat(Math.max(0, item.length - 4))}${item.slice(-4)}` : "—";
const documentUrl = (path: string) => `${import.meta.env.VITE_API_URL}${path}`;
const normalizedStatus = (status: string | null) => status?.trim().toUpperCase() || "PENDING";

const Detail = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Grid size={{ xs: 12, sm: 6, lg: 4 }}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography sx={{ overflowWrap: "anywhere" }} fontWeight={600}>{children}</Typography></Grid>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card variant="outlined" sx={{ borderRadius: 3 }}><CardContent><Typography variant="h6" fontWeight={700}>{title}</Typography><Divider sx={{ my: 2 }} /><Grid container spacing={2.5}>{children}</Grid></CardContent></Card>
);

const BrokerProfile = () => {
  const [broker, setBroker] = useState<BrokerAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try { setBroker((await getMyBrokerAccount()).broker); }
    catch (requestError) {
      setError(axios.isAxiosError<{ message?: string }>(requestError) ? requestError.response?.data?.message || "Unable to load broker profile." : "Unable to load broker profile.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Load authenticated broker data when the page opens.
    void loadProfile();
  }, [loadProfile]);
  const retry = () => { setLoading(true); setError(null); void loadProfile(); };
  if (loading) return <Box sx={{ minHeight: 360, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  if (error || !broker) return <Alert severity="error" action={<Button color="inherit" onClick={retry}>Retry</Button>}>{error || "Broker profile not found."}</Alert>;

  const docs: [string, string | null][] = [
    ["SEBI certificate", broker.documents.sebiCertificate], ["Appointment letter", broker.documents.appointmentLetter],
    ["Net worth certificate", broker.documents.netWorthCertificate], ["Financial statements", broker.documents.financialStatements], ["CA certificate", broker.documents.caCertificate],
  ];

  return <Stack spacing={3}>
    <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
      <Box><Typography variant="h4" fontWeight={800}>My Broker Profile</Typography><Typography color="text.secondary">Your approved registration and organization information.</Typography></Box>
      <Stack direction="row" spacing={1}><Chip label={normalizedStatus(broker.registration.status)} color={normalizedStatus(broker.registration.status) === "APPROVED" ? "success" : "warning"} /><Chip label={broker.account.isActive ? "ACCOUNT ACTIVE" : "ACCOUNT INACTIVE"} variant="outlined" /></Stack>
    </Box>

    <Section title="Organization"><Detail label="Legal name">{value(broker.organization.legalName)}</Detail><Detail label="Trade name">{value(broker.organization.tradeName)}</Detail><Detail label="Entity type">{value(broker.organization.entityType)}</Detail><Detail label="Incorporation date">{date(broker.organization.incorporationDate)}</Detail><Detail label="PAN">{mask(broker.organization.pan)}</Detail><Detail label="CIN">{value(broker.organization.cin)}</Detail><Detail label="GSTIN">{value(broker.organization.gstin)}</Detail><Detail label="Website">{broker.organization.website ? <Link href={broker.organization.website} target="_blank" rel="noreferrer">{broker.organization.website}</Link> : "—"}</Detail></Section>
    <Section title="Contact and address"><Detail label="Account email">{value(broker.account.email)}</Detail><Detail label="Business email">{value(broker.contact.email)}</Detail><Detail label="Mobile">{value(broker.contact.mobile)}</Detail><Detail label="Registered address">{value(broker.contact.registeredAddress)}</Detail><Detail label="Correspondence address">{value(broker.contact.correspondenceAddress)}</Detail></Section>
    <Section title="SEBI registration"><Detail label="Registration number">{value(broker.registration.sebiRegistrationNo)}</Detail><Detail label="Category">{value(broker.registration.category)}</Detail><Detail label="Registration date">{date(broker.registration.registrationDate)}</Detail><Detail label="Validity">{date(broker.registration.validity)}</Detail><Detail label="Membership code">{value(broker.registration.membershipCode)}</Detail><Detail label="Application status">{value(broker.registration.applicationStatus)}</Detail></Section>
    <Section title="Exchange membership"><Grid size={{ xs: 12 }}><Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">{Object.entries(broker.exchanges).map(([name, active]) => <Chip key={name} label={name.toUpperCase()} color={active ? "primary" : "default"} variant={active ? "filled" : "outlined"} />)}</Stack></Grid><Grid size={{ xs: 12 }}><Typography variant="caption" color="text.secondary">Segments</Typography><Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" mt={0.5}>{Object.entries(broker.segments).map(([name, active]) => <Chip key={name} label={name === "futuresAndOptions" ? "F&O" : name.toUpperCase()} color={active ? "success" : "default"} variant={active ? "filled" : "outlined"} />)}</Stack></Grid></Section>
    <Section title="Compliance and financials"><Detail label="Compliance officer">{value(broker.compliance.officerName)}</Detail><Detail label="Designation">{value(broker.compliance.designation)}</Detail><Detail label="Compliance PAN">{mask(broker.compliance.pan)}</Detail><Detail label="Compliance mobile">{value(broker.compliance.mobile)}</Detail><Detail label="Net worth">{value(broker.financials.netWorth)}</Detail><Detail label="Auditor">{value(broker.financials.auditorName)}</Detail><Detail label="Auditor membership">{value(broker.financials.auditorMembership)}</Detail></Section>
    <Section title="Authorized person"><Detail label="Name">{value(broker.authorizedPerson.name)}</Detail><Detail label="Designation">{value(broker.authorizedPerson.designation)}</Detail><Detail label="Email">{value(broker.authorizedPerson.email)}</Detail><Detail label="Mobile">{value(broker.authorizedPerson.mobile)}</Detail><Detail label="PAN">{mask(broker.authorizedPerson.pan)}</Detail><Detail label="Aadhaar">{mask(broker.authorizedPerson.aadhaar)}</Detail></Section>
    <Section title="Documents"><Grid size={{ xs: 12 }}><Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">{docs.filter(([, path]) => path).map(([label, path]) => <Button key={label} component="a" href={documentUrl(path!)} target="_blank" rel="noreferrer" variant="outlined">{label}</Button>)}{broker.documents.exchangeCertificates.map((path, index) => <Button key={path} component="a" href={documentUrl(path)} target="_blank" rel="noreferrer" variant="outlined">Exchange certificate {index + 1}</Button>)}{docs.every(([, path]) => !path) && broker.documents.exchangeCertificates.length === 0 && <Typography color="text.secondary">No documents uploaded.</Typography>}</Stack></Grid></Section>
  </Stack>;
};

export default BrokerProfile;
