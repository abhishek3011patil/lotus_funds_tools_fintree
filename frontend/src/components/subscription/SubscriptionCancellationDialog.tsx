import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

type SubscriptionCancellationDialogProps = {
  open: boolean;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (reason: string, confirmation: string) => void;
};

const SubscriptionCancellationDialog = ({
  open,
  loading = false,
  error = null,
  onClose,
  onConfirm,
}: SubscriptionCancellationDialogProps) => {
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");

  useEffect(() => {
    if (open) {
      setReason("");
      setConfirmation("");
    }
  }, [open]);

  const valid =
    reason.trim().length >= 5 &&
    reason.trim().length <= 500 &&
    confirmation === "CANCEL";

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Cancel subscription?</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <Alert severity="warning">
            Cancellation takes effect immediately. You will lose
            subscription-protected publishing access, and the unused
            subscription period will not be refunded automatically.
          </Alert>

          <Typography variant="body2" color="text.secondary">
            Your RA account, Profile, Settings and previous research
            history will remain available. You can renew again later.
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Reason for cancellation"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            multiline
            minRows={3}
            inputProps={{ maxLength: 500 }}
            helperText={`${reason.trim().length}/500 characters (minimum 5)`}
            disabled={loading}
            required
          />

          <TextField
            label='Type "CANCEL" to confirm'
            value={confirmation}
            onChange={(event) =>
              setConfirmation(event.target.value.toUpperCase())
            }
            disabled={loading}
            required
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={loading}>
          Keep subscription
        </Button>
        <Button
          color="error"
          variant="contained"
          disabled={!valid || loading}
          onClick={() =>
            onConfirm(reason.trim(), confirmation)
          }
        >
          {loading ? "Cancelling..." : "Cancel subscription"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubscriptionCancellationDialog;
