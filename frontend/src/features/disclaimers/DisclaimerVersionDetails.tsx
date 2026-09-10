import { Alert, Box, Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import DisclaimerStatusChip from "./DisclaimerStatusChip";
import type { DisclaimerVersion } from "./disclaimer.types";

const DisclaimerVersionDetails = ({ version }: { version: DisclaimerVersion }) => <Card variant="outlined"><CardContent><Stack direction="row" alignItems="center" justifyContent="space-between"><Typography variant="h6">Version {version.version}</Typography><DisclaimerStatusChip status={version.status} /></Stack><Typography variant="body2" color="text.secondary">{version.ownerType} · Effective {version.effectiveFrom ?? "not activated"} · Created by {version.createdBy}</Typography><Divider sx={{ my: 2 }} /><Box sx={{ whiteSpace: "pre-wrap" }}>{version.text}</Box>{version.status !== "DRAFT" && <Alert severity="info" sx={{ mt: 2 }}>Historical versions are read-only. Calls retain the exact disclaimer version attached when published.</Alert>}</CardContent></Card>;
export default DisclaimerVersionDetails;
