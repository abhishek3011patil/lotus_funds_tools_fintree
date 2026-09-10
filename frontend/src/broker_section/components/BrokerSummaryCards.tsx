import { Card, CardContent, Grid, Typography } from "@mui/material";

export interface SummaryItem { label: string; value: string | number; helper?: string }

const BrokerSummaryCards = ({ items }: { items: SummaryItem[] }) => (
  <Grid container spacing={2}>
    {items.map((item) => (
      <Grid key={item.label} size={{ xs: 12, sm: 6, lg: 4 }}>
        <Card variant="outlined" sx={{ height: "100%" }}><CardContent>
          <Typography variant="body2" color="text.secondary">{item.label}</Typography>
          <Typography variant="h4" fontWeight={700} sx={{ my: 0.5 }}>{item.value}</Typography>
          {item.helper && <Typography variant="caption" color="text.secondary">{item.helper}</Typography>}
        </CardContent></Card>
      </Grid>
    ))}
  </Grid>
);

export default BrokerSummaryCards;
