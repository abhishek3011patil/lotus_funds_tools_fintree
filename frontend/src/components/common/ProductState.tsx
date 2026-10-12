import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

type ProductStateProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  kind?: "empty" | "loading" | "error" | "unavailable";
  actionLabel?: string;
  onAction?: () => void;
  note?: string;
};

const ProductState = ({
  title,
  description,
  icon,
  kind = "empty",
  actionLabel,
  onAction,
  note,
}: ProductStateProps) => (
  <Paper
    variant="outlined"
    sx={{
      minHeight: 280,
      p: { xs: 3, sm: 5 },
      display: "grid",
      placeItems: "center",
      textAlign: "center",
      borderStyle: kind === "unavailable" ? "dashed" : "solid",
    }}
  >
    <Stack spacing={1.5} alignItems="center" maxWidth={560}>
      {kind === "loading" ? <CircularProgress size={32} /> : icon && <Box color="primary.main">{icon}</Box>}
      <Typography variant="h6">{title}</Typography>
      <Typography color="text.secondary">{description}</Typography>
      {actionLabel && onAction && <Button variant="outlined" onClick={onAction}>{actionLabel}</Button>}
      {note && <Alert severity="info" sx={{ mt: 1, textAlign: "left" }}>{note}</Alert>}
    </Stack>
  </Paper>
);

export default ProductState;
