import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material";
import type { LoadState } from "../types/broker.types";

const BrokerEmptyState = ({ state, emptyText, onRetry }: { state: Exclude<LoadState, "ready">; emptyText: string; onRetry?: () => void }) => {
  if (state === "loading") return <Box sx={{ py: 8, textAlign: "center" }}><CircularProgress aria-label="Loading broker data" /></Box>;
  if (state === "error") return <Alert severity="error" action={onRetry ? <Button onClick={onRetry}>Retry</Button> : undefined}>Broker data could not be loaded.</Alert>;
  return <Box sx={{ py: 8, textAlign: "center" }}><Typography color="text.secondary">{emptyText}</Typography></Box>;
};

export default BrokerEmptyState;
