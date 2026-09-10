import { Alert, Box, Card, CardContent, Grid, Typography } from "@mui/material";
import type { ReactNode } from "react";

const AdminPageShell = ({ title, subtitle, children }: { title: string; subtitle: string; children?: ReactNode }) => <Box><Box sx={{ mb: 3, p: { xs: 2, sm: 2.5 }, bgcolor: "background.paper", border: "1px solid #e2e8f0", borderRadius: "12px" }}><Typography variant="h4" fontWeight={700}>{title}</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography></Box>{children ?? <Alert severity="info">This frontend shell is ready for the existing or future service integration.</Alert>}</Box>;

export const AdminMetricCards = ({ items }: { items: Array<{ label: string; value: string | number }> }) => <Grid container spacing={2}>{items.map((item) => <Grid key={item.label} size={{ xs: 12, sm: 6, md: 4 }}><Card variant="outlined"><CardContent><Typography color="text.secondary">{item.label}</Typography><Typography variant="h4" fontWeight={700}>{item.value}</Typography></CardContent></Card></Grid>)}</Grid>;
export default AdminPageShell;
