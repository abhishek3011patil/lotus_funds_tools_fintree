import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CALL_TEMPLATE_FIELDS,
  CALL_TEMPLATE_VERSION,
  MAX_CUSTOM_BLOCK_LENGTH,
  createDefaultCallTemplate,
  formatResearchCallMessage,
  isValidCallTemplate,
  loadCallTemplate,
  normalizeCustomBlockText,
  reorderTemplateBlocks,
  saveCallTemplate,
  type CallTemplate,
  type CallTemplateBlock,
  type CallTemplateFieldKey,
} from "../../utils/researchCallTemplate.utils";

type CustomBlockType = "text" | "heading";

interface SortableTemplateBlockProps {
  block: CallTemplateBlock;
  label: string;
  onRemove: (block: CallTemplateBlock) => void;
}

const SortableTemplateBlock = ({
  block,
  label,
  onRemove,
}: SortableTemplateBlockProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  return (
    <Paper
      ref={setNodeRef}
      variant="outlined"
      sx={{
        p: 1.25,
        opacity: isDragging ? 0.65 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
      >
        <IconButton
          size="small"
          aria-label={`Drag to reorder ${label}`}
          {...attributes}
          {...listeners}
          sx={{ cursor: "grab", touchAction: "none" }}
        >
          <DragIndicatorIcon fontSize="small" />
        </IconButton>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography fontSize="0.875rem" fontWeight={600}>
            {label}
          </Typography>
          {block.type !== "field" &&
            block.type !== "separator" && (
              <Typography
                color="text.secondary"
                fontSize="0.75rem"
                sx={{
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}
              >
                {block.text}
              </Typography>
            )}
        </Box>

        {block.locked ? (
          <Tooltip title="Mandatory compliance block">
            <LockOutlinedIcon
              color="action"
              fontSize="small"
              aria-label="Locked mandatory block"
            />
          </Tooltip>
        ) : (
          <Tooltip title="Remove from message">
            <IconButton
              size="small"
              aria-label={`Remove ${label}`}
              onClick={() => onRemove(block)}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Paper>
  );
};

const fieldLabel = (
  fieldKey: CallTemplateFieldKey
): string =>
  CALL_TEMPLATE_FIELDS.find(
    (field) => field.key === fieldKey
  )?.label || fieldKey;

const blockLabel = (block: CallTemplateBlock): string => {
  if (block.type === "field") {
    return fieldLabel(block.fieldKey);
  }

  if (block.type === "separator") {
    return "Separator";
  }

  return block.type === "heading"
    ? "Custom heading"
    : "Custom text";
};

const createCustomBlockId = (type: string): string => {
  const randomPart =
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${type}:${randomPart}`;
};

const PREVIEW_CALL = {
  publishedAt: "29 July 2026, 10:30 AM",
  instrument: "Lotus Industries Limited",
  symbol: "LOTUS",
  exchange: "NSE / STOCK",
  action: "BUY",
  callType: "Cash",
  entry: "₹245 - ₹250",
  targets: ["₹265", "₹275", "₹285"],
  stopLosses: ["₹235", "₹230", "₹225"],
  expiry: "N/A",
  timeHorizon: "Short Term",
  holdingPeriod: "2–4 weeks",
  rationale: "Illustrative momentum setup",
  underlyingStudy: "Price action and volume",
  remarks: "Preview values only",
};

const PREVIEW_RA = {
  fullName: "Aarav Sharma",
  organizationName: "Lotus Funds",
  sebiRegistrationNumber: "INH000000000",
  contactNumber: "+91 90000 00000",
  email: "analyst@example.com",
  disclaimer:
    "Investment in securities market are subject to market risks. Read all related documents carefully before investing.",
  disclaimerLink:
    "https://lotusfunds.com/disclaimer&disclosure",
};

const ResearchCallTemplateBuilder = () => {
  const [template, setTemplate] = useState<CallTemplate>(
    () => loadCallTemplate()
  );
  const [savedSnapshot, setSavedSnapshot] = useState(
    () => JSON.stringify(loadCallTemplate())
  );
  const [customBlockType, setCustomBlockType] =
    useState<CustomBlockType>("text");
  const [customText, setCustomText] = useState("");
  const [validationError, setValidationError] =
    useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeBlocks = useMemo(
    () => template.blocks.filter((block) => block.enabled),
    [template]
  );

  const removedFields = useMemo(
    () =>
      template.blocks.filter(
        (
          block
        ): block is Extract<
          CallTemplateBlock,
          { type: "field" }
        > => block.type === "field" && !block.enabled
      ),
    [template]
  );

  const hasUnsavedChanges =
    JSON.stringify(template) !== savedSnapshot;

  const preview = useMemo(() => {
    try {
      return formatResearchCallMessage(
        template,
        PREVIEW_CALL,
        PREVIEW_RA
      );
    } catch {
      return "The current layout cannot be previewed. Restore the default template.";
    }
  }, [template]);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return;
    }

    setTemplate((current) =>
      reorderTemplateBlocks(
        current,
        String(active.id),
        String(over.id)
      )
    );
  };

  const removeBlock = (block: CallTemplateBlock) => {
    setValidationError("");

    setTemplate((current) => ({
      version: CALL_TEMPLATE_VERSION,
      blocks:
        block.type === "field"
          ? current.blocks.map((candidate) =>
              candidate.id === block.id
                ? { ...candidate, enabled: false }
                : candidate
            )
          : current.blocks.filter(
              (candidate) => candidate.id !== block.id
            ),
    }));
  };

  const restoreField = (fieldKey: CallTemplateFieldKey) => {
    setTemplate((current) => ({
      version: CALL_TEMPLATE_VERSION,
      blocks: current.blocks.map((block) =>
        block.type === "field" &&
        block.fieldKey === fieldKey
          ? { ...block, enabled: true }
          : block
      ),
    }));
  };

  const addCustomBlock = () => {
    const normalized = normalizeCustomBlockText(customText);

    if (!normalized) {
      setValidationError(
        "Enter plain text before adding the block."
      );
      return;
    }

    if (normalized.length > MAX_CUSTOM_BLOCK_LENGTH) {
      setValidationError(
        `Custom blocks are limited to ${MAX_CUSTOM_BLOCK_LENGTH} characters.`
      );
      return;
    }

    setTemplate((current) => ({
      version: CALL_TEMPLATE_VERSION,
      blocks: [
        ...current.blocks,
        {
          id: createCustomBlockId(customBlockType),
          type: customBlockType,
          text: normalized,
          enabled: true,
          locked: false,
        },
      ],
    }));
    setCustomText("");
    setValidationError("");
  };

  const addSeparator = () => {
    setTemplate((current) => ({
      version: CALL_TEMPLATE_VERSION,
      blocks: [
        ...current.blocks,
        {
          id: createCustomBlockId("separator"),
          type: "separator",
          enabled: true,
          locked: false,
        },
      ],
    }));
  };

  const saveTemplate = () => {
    if (!isValidCallTemplate(template)) {
      setValidationError(
        "The template is invalid or is missing a mandatory block."
      );
      return;
    }

    try {
      saveCallTemplate(template);
      setSavedSnapshot(JSON.stringify(template));
      setValidationError("");
      setSuccessMessage("Research-call template saved.");
    } catch (error) {
      setValidationError(
        error instanceof Error
          ? error.message
          : "Unable to save the template."
      );
    }
  };

  const resetTemplate = () => {
    const defaultTemplate = createDefaultCallTemplate();

    try {
      saveCallTemplate(defaultTemplate);
      setTemplate(defaultTemplate);
      setSavedSnapshot(JSON.stringify(defaultTemplate));
      setValidationError("");
      setSuccessMessage("Default template restored.");
    } catch {
      setValidationError(
        "Unable to restore the default template."
      );
    }
  };

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1}
        mb={1}
      >
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Research Call Message Template
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Reorder message fields and add plain-text content.
            This affects only new-call publication messages.
          </Typography>
        </Box>
        <Chip
          size="small"
          color={hasUnsavedChanges ? "warning" : "success"}
          label={
            hasUnsavedChanges
              ? "Unsaved changes"
              : "Saved"
          }
        />
      </Stack>

      {validationError && (
        <Alert severity="error" sx={{ my: 2 }}>
          {validationError}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 1fr) minmax(0, 1fr)",
          },
          gap: 2,
          mt: 2,
        }}
      >
        <Box>
          <Typography fontWeight={700} mb={1}>
            Message layout
          </Typography>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={activeBlocks.map((block) => block.id)}
              strategy={verticalListSortingStrategy}
            >
              <Stack spacing={1}>
                {activeBlocks.map((block) => (
                  <SortableTemplateBlock
                    key={block.id}
                    block={block}
                    label={blockLabel(block)}
                    onRemove={removeBlock}
                  />
                ))}
              </Stack>
            </SortableContext>
          </DndContext>

          {removedFields.length > 0 && (
            <Box mt={2}>
              <Typography fontWeight={700} fontSize="0.875rem">
                Removed optional fields
              </Typography>
              <Stack
                direction="row"
                flexWrap="wrap"
                gap={1}
                mt={1}
              >
                {removedFields.map((block) => (
                  <Chip
                    key={block.id}
                    label={`Restore ${fieldLabel(
                      block.fieldKey
                    )}`}
                    onClick={() =>
                      restoreField(block.fieldKey)
                    }
                    icon={<RestartAltIcon />}
                  />
                ))}
              </Stack>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Typography fontWeight={700} mb={1}>
            Add content block
          </Typography>
          <Stack spacing={1.5}>
            <FormControl size="small">
              <InputLabel id="custom-block-type-label">
                Block type
              </InputLabel>
              <Select
                labelId="custom-block-type-label"
                label="Block type"
                value={customBlockType}
                onChange={(event) =>
                  setCustomBlockType(
                    event.target.value as CustomBlockType
                  )
                }
              >
                <MenuItem value="text">Static text</MenuItem>
                <MenuItem value="heading">Heading</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label={
                customBlockType === "heading"
                  ? "Heading"
                  : "Plain text"
              }
              value={customText}
              onChange={(event) =>
                setCustomText(event.target.value)
              }
              multiline
              minRows={2}
              inputProps={{
                maxLength: MAX_CUSTOM_BLOCK_LENGTH,
              }}
              helperText={`${customText.length}/${MAX_CUSTOM_BLOCK_LENGTH} characters`}
            />

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addCustomBlock}
              >
                Add block
              </Button>
              <Button
                variant="outlined"
                onClick={addSeparator}
              >
                Add separator
              </Button>
            </Stack>
          </Stack>
        </Box>

        <Box>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            mb={1}
          >
            <Typography fontWeight={700}>Preview</Typography>
            <Chip
              label="Preview only"
              size="small"
              color="info"
              variant="outlined"
            />
          </Stack>
          <Paper
            variant="outlined"
            component="pre"
            sx={{
              p: 2,
              m: 0,
              minHeight: 360,
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              fontFamily: "monospace",
              fontSize: "0.75rem",
              backgroundColor: "#fafafa",
            }}
          >
            {preview}
          </Paper>
        </Box>
      </Box>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        mt={2}
      >
        <Button
          variant="contained"
          startIcon={<SaveOutlinedIcon />}
          onClick={saveTemplate}
          disabled={!hasUnsavedChanges}
        >
          Save template
        </Button>
        <Button
          variant="outlined"
          startIcon={<RestartAltIcon />}
          onClick={resetTemplate}
        >
          Reset to default
        </Button>
      </Stack>

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={3500}
        onClose={() => setSuccessMessage("")}
        message={successMessage}
      />
    </Box>
  );
};

export default ResearchCallTemplateBuilder;
