import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  TextField,
} from "@mui/material";
import { memo, useEffect, useState } from "react";

type ExitRecommendationDialogProps = {
  open: boolean;
  item: { id?: string | number; [key: string]: unknown } | null;
  onClose: () => void;
  onSubmit: (
    item: { id?: string | number; [key: string]: unknown },
    exitPrice: number,
    exitRemark: string,
    options?: {
      previewOnly?: boolean;
      preparedMessage?: string;
      onPreview?: (message: string) => void;
    }
  ) => Promise<void>;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const requestError = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };

  return requestError.response?.data?.message || requestError.message || fallback;
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
    const [previewing, setPreviewing] = useState(false);
    const [previewMessage, setPreviewMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
      if (open) {
        setExitPrice("");
        setExitRemark("");
        setPreviewMessage("");
        setError("");
      }
    }, [open, item?.id]);

    const getValidatedValues = () => {
      const parsedPrice = Number(exitPrice);
      const trimmedRemark = exitRemark.trim();

      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        setError("Enter a valid exit price");
        return null;
      }

      if (!trimmedRemark) {
        setError("Exit remark is required");
        return null;
      }

      return { parsedPrice, trimmedRemark };
    };

    const handlePreview = async () => {
      if (!item || submitting || previewing) return;

      const values = getValidatedValues();
      if (!values) return;

      try {
        setPreviewing(true);
        setError("");
        await onSubmit(item, values.parsedPrice, values.trimmedRemark, {
          previewOnly: true,
          onPreview: setPreviewMessage,
        });
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to prepare exit-call preview"));
      } finally {
        setPreviewing(false);
      }
    };

    const handleSubmit = async () => {
      if (!item || submitting || previewing) return;

      const values = getValidatedValues();
      if (!values) return;

      try {
        setSubmitting(true);
        setError("");

        await onSubmit(item, values.parsedPrice, values.trimmedRemark, {
          preparedMessage: previewMessage || undefined,
        });
        onClose();
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to exit recommendation"));
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <Dialog
        open={open}
        onClose={submitting || previewing ? undefined : onClose}
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
              setPreviewMessage("");
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
              setPreviewMessage("");
              setError("");
            }}
            error={Boolean(error)}
            helperText={error || `${exitRemark.length}/2000`}
            margin="normal"
          />

          {previewMessage && (
            <Paper
              component="pre"
              variant="outlined"
              sx={{
                p: 2,
                mt: 2,
                mb: 0,
                maxHeight: 320,
                overflow: "auto",
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
                fontFamily: "inherit",
                fontSize: "0.85rem",
                lineHeight: 1.6,
                backgroundColor: "#F8FAFF",
                borderColor: "#C7D2FE",
              }}
            >
              {previewMessage}
            </Paper>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={onClose}
            disabled={submitting || previewing}
          >
            Cancel
          </Button>

          <Button
            variant="outlined"
            onClick={handlePreview}
            disabled={
              submitting ||
              previewing ||
              !exitPrice ||
              !exitRemark.trim()
            }
          >
            {previewing ? "Preparing Preview..." : "Preview Exit Call"}
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={
              submitting ||
              previewing ||
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
