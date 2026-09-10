import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useState } from "react";
import { roleDialogPaperSx } from "../layout/roleSurfaceStyles";

const SuspensionReasonDialog = ({
  open,
  subject,
  action = "suspend",
  onClose,
  onConfirm,
}: {
  open: boolean;
  subject: string;
  action?: "suspend" | "delete";
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) => {
  const [reason, setReason] = useState("");
  const close = () => {
    setReason("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: roleDialogPaperSx } }}
    >
      <DialogTitle>
        {action === "delete" ? "Delete" : "Suspend"} {subject}?
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          A reason is mandatory. This foundation uses a mock handler and does
          not change backend state.
        </DialogContentText>
        <TextField
          autoFocus
          required
          fullWidth
          multiline
          minRows={3}
          label="Reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          inputProps={{ "aria-label": `${action} reason` }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>Cancel</Button>
        <Button
          color="error"
          variant="contained"
          disabled={!reason.trim()}
          onClick={() => {
            onConfirm(reason.trim());
            close();
          }}
        >
          Confirm {action}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SuspensionReasonDialog;
