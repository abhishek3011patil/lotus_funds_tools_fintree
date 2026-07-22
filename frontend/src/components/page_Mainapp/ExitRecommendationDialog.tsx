import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { memo, useEffect, useState } from "react";

type ExitRecommendationDialogProps = {
  open: boolean;
  item: any | null;
  onClose: () => void;
  onSubmit: (
    item: any,
    exitPrice: number,
    exitRemark: string
  ) => Promise<void>;
};

const ExitRecommendationDialog = memo(
  ({
    open,
    item,
    onClose,
    onSubmit,
  }: ExitRecommendationDialogProps) => {
    const [exitPrice, setExitPrice] = useState("");
    const [exitRemark, setExitRemark] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
      if (open) {
        setExitPrice("");
        setExitRemark("");
        setError("");
      }
    }, [open, item?.id]);

    const handleSubmit = async () => {
      if (!item || submitting) return;

      const parsedPrice = Number(exitPrice);
      const trimmedRemark = exitRemark.trim();

      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        setError("Enter a valid exit price");
        return;
      }

      if (!trimmedRemark) {
        setError("Exit remark is required");
        return;
      }

      try {
        setSubmitting(true);
        setError("");

        await onSubmit(item, parsedPrice, trimmedRemark);
        onClose();
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to exit recommendation"
        );
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <Dialog
        open={open}
        onClose={submitting ? undefined : onClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Exit Recommendation</DialogTitle>

        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            type="number"
            label="Exit Price"
            value={exitPrice}
            onChange={(event) => {
              setExitPrice(event.target.value);
              setError("");
            }}
            margin="normal"
            inputProps={{
              min: 0,
              step: "any",
            }}
          />

          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Exit Remark"
            value={exitRemark}
            onChange={(event) => {
              setExitRemark(event.target.value.slice(0, 2000));
              setError("");
            }}
            error={Boolean(error)}
            helperText={error || `${exitRemark.length}/2000`}
            margin="normal"
          />
        </DialogContent>

        <DialogActions>
          <Button
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={
              submitting ||
              !exitPrice ||
              !exitRemark.trim()
            }
          >
            {submitting ? "Exiting..." : "Exit Call"}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
);

export default ExitRecommendationDialog;