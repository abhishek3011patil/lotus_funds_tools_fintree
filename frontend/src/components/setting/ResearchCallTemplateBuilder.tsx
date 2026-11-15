import {
  useEffect,
  useMemo,
  useState,
  type SetStateAction,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
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
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import TextFieldsOutlinedIcon from "@mui/icons-material/TextFieldsOutlined";
import TouchAppOutlinedIcon from "@mui/icons-material/TouchAppOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
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
  CALL_TEMPLATE_VERSION,
  MAX_CUSTOM_BLOCK_LENGTH,
  createDefaultCallTemplate,
  formatResearchCallMessage,
  getCallTemplateFields,
  isValidCallTemplate,
  loadCallTemplate,
  normalizeCustomBlockText,
  reorderTemplateBlocks,
  saveCallTemplate,
  type CallTemplate,
  type CallTemplateBlock,
  type CallTemplateFieldKey,
  type CallTemplateOwnerType,
  type ResearchCallMessageType,
} from "../../utils/researchCallTemplate.utils";
import {
  fetchResearchCallTemplates,
  saveResearchCallTemplate as saveResearchCallTemplateToApi,
  type ResearchCallTemplateMap,
  fetchNamedResearchCallTemplates,
  saveNamedResearchCallTemplate,
  deleteNamedResearchCallTemplate,
  type NamedResearchCallTemplate,
} from "../../services/researchCallTemplate.service";
import { fetchAudienceGroups, updateAudienceGroup, type AudienceGroup } from "../../services/audienceGroups.service";

type CustomBlockType = "text" | "heading";

interface SortableTemplateBlockProps {
  block: CallTemplateBlock;
  label: string;
  onRemove: (block: CallTemplateBlock) => void;
}

const TARKASH_BLUE = "#4F6CF8";
const TARKASH_BLUE_DARK = "#1E40AF";
const TARKASH_BLUE_DEEP = "#172554";
const TARKASH_BLUE_PALE = "#EEF2FF";

const getBlockAppearance = (block: CallTemplateBlock) => {
  if (block.locked) {
    return {
      background: "#EEF2FF",
      border: "#A5B4FC",
      badge: "Required",
      badgeBackground: "#4F6CF8",
      badgeColor: "#FFFFFF",
    };
  }

  if (block.type === "heading") {
    return {
      background: "#F5F0FF",
      border: "#C4B5FD",
      badge: "Heading",
      badgeBackground: "#EDE9FE",
      badgeColor: "#5B21B6",
    };
  }

  if (block.type === "text") {
    return {
      background: "#ECFDF3",
      border: "#86EFAC",
      badge: "Your text",
      badgeBackground: "#DCFCE7",
      badgeColor: "#166534",
    };
  }

  if (block.type === "separator") {
    return {
      background: "#F8FAFC",
      border: "#CBD5E1",
      badge: "Divider",
      badgeBackground: "#E2E8F0",
      badgeColor: "#334155",
    };
  }

  return {
    background: "#EFF6FF",
    border: "#93C5FD",
    badge: "Optional",
    badgeBackground: "#DBEAFE",
    badgeColor: "#1D4ED8",
  };
};

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
  const appearance = getBlockAppearance(block);

  return (
    <Paper
      ref={setNodeRef}
      variant="outlined"
      sx={{
        p: { xs: 1.25, sm: 1.5 },
        opacity: isDragging ? 0.82 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
        backgroundColor: appearance.background,
        border: `2px solid ${appearance.border}`,
        borderRadius: 2.5,
        boxShadow: isDragging
          ? "0 12px 28px rgba(79, 108, 248, 0.24)"
          : "0 2px 8px rgba(15, 23, 42, 0.05)",
        "&:hover": {
          boxShadow: "0 6px 16px rgba(79, 108, 248, 0.14)",
        },
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
          sx={{
            width: 42,
            height: 42,
            flexShrink: 0,
            cursor: isDragging ? "grabbing" : "grab",
            touchAction: "none",
            color: "#FFFFFF",
            backgroundColor: TARKASH_BLUE,
            border: "2px solid rgba(30, 64, 175, 0.18)",
            "&:hover": {
              backgroundColor: "#3D56CA",
            },
            "&:focus-visible": {
              outline: `3px solid ${TARKASH_BLUE_DEEP}`,
              outlineOffset: 2,
            },
          }}
        >
          <DragIndicatorIcon />
        </IconButton>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={0.75}
          >
            <Typography fontSize="0.925rem" fontWeight={700}>
              {label}
            </Typography>
            <Chip
              size="small"
              label={appearance.badge}
              sx={{
                height: 22,
                fontSize: "0.675rem",
                fontWeight: 800,
                backgroundColor: appearance.badgeBackground,
                color: appearance.badgeColor,
              }}
            />
          </Stack>
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
          <Tooltip title="Required for a complete, compliant message. It cannot be removed.">
            <Box
              sx={{
                width: 34,
                height: 34,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                borderRadius: "50%",
                color: TARKASH_BLUE_DARK,
                backgroundColor: "rgba(79, 108, 248, 0.14)",
              }}
              aria-label="Locked mandatory block"
            >
              <LockOutlinedIcon fontSize="small" />
            </Box>
          </Tooltip>
        ) : (
          <Tooltip title="Remove from message">
            <IconButton
              size="small"
              aria-label={`Remove ${label}`}
              onClick={() => onRemove(block)}
              sx={{
                color: "#B42318",
                backgroundColor: "#FFF1F0",
                "&:hover": {
                  backgroundColor: "#FFE4E1",
                },
              }}
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
  fieldKey: CallTemplateFieldKey,
  messageType: ResearchCallMessageType,
  ownerType: CallTemplateOwnerType
): string =>
  getCallTemplateFields(messageType, ownerType).find(
    (field) => field.key === fieldKey
  )?.label || fieldKey;

const blockLabel = (
  block: CallTemplateBlock,
  messageType: ResearchCallMessageType,
  ownerType: CallTemplateOwnerType
): string => {
  if (block.type === "field") {
    return fieldLabel(block.fieldKey, messageType, ownerType);
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
  errataReason:
    "Entry range corrected after reviewing the published call.",
};

const PREVIEW_RA = {
  fullName: "Aarav Sharma",
  organizationName: "Tarkashh",
  sebiRegistrationNumber: "INH000000000",
  contactNumber: "+91 90000 00000",
  email: "analyst@example.com",
  disclaimer:
    "Investment in securities market are subject to market risks. Read all related documents carefully before investing.",
  disclaimerLink:
    "https://lotusfunds.com/disclaimer&disclosure",
};

const PREVIEW_BROKER = {
  companyName: "Tarkashh Securities Private Limited",
  sebiRegistrationNumber: "INZ000000000",
  disclaimer: "Tarkashh Securities Private Limited is a SEBI-registered broker. Investments in securities markets are subject to market risks. Read all related documents carefully before investing.",
};

type EditableTemplateMap = Record<
  ResearchCallMessageType,
  CallTemplate
>;

const loadEditableTemplates = (ownerType: CallTemplateOwnerType): EditableTemplateMap => {
  try {
    return {
      NEW_CALL: loadCallTemplate("NEW_CALL", window.localStorage, ownerType),
      ERRATA: loadCallTemplate("ERRATA", window.localStorage, ownerType),
    };
  } catch {
    return {
      NEW_CALL:
        createDefaultCallTemplate("NEW_CALL", ownerType),
      ERRATA: createDefaultCallTemplate("ERRATA", ownerType),
    };
  }
};

const ResearchCallTemplateBuilder = ({ ownerType = "RA" }: { ownerType?: CallTemplateOwnerType }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const focusGroupId = String((location.state as { focusGroupId?: string } | null)?.focusGroupId || "");
  const [initialAuthToken] = useState(() =>
    localStorage.getItem("token")
  );
  const [messageType, setMessageType] =
    useState<ResearchCallMessageType>("NEW_CALL");
  const [templates, setTemplates] =
    useState<EditableTemplateMap>(() => loadEditableTemplates(ownerType));
  const [savedSnapshots, setSavedSnapshots] = useState<
    Record<ResearchCallMessageType, string>
  >(() => {
    const localTemplates = loadEditableTemplates(ownerType);
    return {
      NEW_CALL: JSON.stringify(localTemplates.NEW_CALL),
      ERRATA: JSON.stringify(localTemplates.ERRATA),
    };
  });
  const [isLoadingTemplates, setIsLoadingTemplates] =
    useState(Boolean(initialAuthToken));
  const [isSavingTemplate, setIsSavingTemplate] =
    useState(false);
  const [customBlockType, setCustomBlockType] =
    useState<CustomBlockType>("text");
  const [customText, setCustomText] = useState("");
  const [validationError, setValidationError] = useState(
    initialAuthToken
      ? ""
      : "Please sign in again to load your saved templates."
  );
  const [successMessage, setSuccessMessage] =
    useState("");
  const [namedTemplates, setNamedTemplates] = useState<NamedResearchCallTemplate[]>([]);
  const [audienceGroups, setAudienceGroups] = useState<AudienceGroup[]>([]);
  const [disclaimerGroup, setDisclaimerGroup] = useState<AudienceGroup | null>(null);
  const [groupDisclaimerText, setGroupDisclaimerText] = useState("");
  const [isSavingGroupDisclaimer, setIsSavingGroupDisclaimer] = useState(false);
  const [namedTemplateId, setNamedTemplateId] = useState("");
  const [namedTemplateName, setNamedTemplateName] = useState("");
  const [namedTemplateGroupId, setNamedTemplateGroupId] = useState("");

  const template = templates[messageType];
  const savedSnapshot = savedSnapshots[messageType];

  const setTemplate = (
    update: SetStateAction<CallTemplate>
  ) => {
    setTemplates((current) => {
      const currentTemplate = current[messageType];
      const nextTemplate =
        typeof update === "function"
          ? update(currentTemplate)
          : update;

      return {
        ...current,
        [messageType]: nextTemplate,
      };
    });
  };

  useEffect(() => {
    let isMounted = true;
    const token = initialAuthToken;

    if (!token) {
      return () => {
        isMounted = false;
      };
    }

    fetchResearchCallTemplates(token, ownerType)
      .then((remoteTemplates: ResearchCallTemplateMap) => {
        if (!isMounted) {
          return;
        }

        const localTemplates = loadEditableTemplates(ownerType);
        const nextTemplates: EditableTemplateMap = {
          NEW_CALL:
            remoteTemplates.NEW_CALL ??
            localTemplates.NEW_CALL,
          ERRATA:
            remoteTemplates.ERRATA ??
            localTemplates.ERRATA,
        };

        (["NEW_CALL", "ERRATA"] as const).forEach(
          (type) => {
            const remoteTemplate = remoteTemplates[type];
            if (remoteTemplate) {
              try {
                saveCallTemplate(
                  remoteTemplate,
                  type,
                  window.localStorage,
                  ownerType
                );
              } catch {
                console.warn(
                  `${type} template could not be cached in this browser.`
                );
              }
            }
          }
        );

        setTemplates(nextTemplates);
        setSavedSnapshots({
          NEW_CALL: remoteTemplates.NEW_CALL
            ? JSON.stringify(remoteTemplates.NEW_CALL)
            : "",
          ERRATA: remoteTemplates.ERRATA
            ? JSON.stringify(remoteTemplates.ERRATA)
            : "",
        });
        setValidationError("");
      })
      .catch(() => {
        if (isMounted) {
          setValidationError(
            "Server templates could not be loaded. The browser copy is still available."
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingTemplates(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [initialAuthToken, ownerType]);

  useEffect(() => {
    if (!initialAuthToken || ownerType !== "RA") return;
    Promise.all([fetchNamedResearchCallTemplates(initialAuthToken), fetchAudienceGroups()])
      .then(([saved, groups]) => {
        setNamedTemplates(saved); setAudienceGroups(groups);
        if (focusGroupId) {
          const group = groups.find(item => item.id === focusGroupId) ?? null;
          if (group) {
            setDisclaimerGroup(group);
            setGroupDisclaimerText(group.customDisclaimer || "");
            setNamedTemplateGroupId(group.id);
          }
          navigate(location.pathname, { replace: true, state: null });
        }
      })
      .catch(() => setValidationError("Could not load named templates or audience groups."));
  }, [initialAuthToken, ownerType, focusGroupId, navigate, location.pathname]);

  const saveGroupDisclaimer = async () => {
    if (!disclaimerGroup) return;
    setIsSavingGroupDisclaimer(true);
    try {
      const input = {
        name: disclaimerGroup.name,
        description: disclaimerGroup.description || "",
        customDisclaimer: groupDisclaimerText.trim(),
        members: disclaimerGroup.members.map(member => ({ type: member.type, id: member.id })),
      };
      await updateAudienceGroup(disclaimerGroup.id, input);
      const updated = { ...disclaimerGroup, customDisclaimer: groupDisclaimerText.trim() || null };
      setDisclaimerGroup(updated);
      setAudienceGroups(current => current.map(group => group.id === updated.id ? updated : group));
      setSuccessMessage(`Disclaimer saved for “${updated.name}”.`);
      setValidationError("");
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : "Unable to save the group disclaimer.");
    } finally { setIsSavingGroupDisclaimer(false); }
  };

  const startNewNamedTemplate = () => {
    setNamedTemplateId("");
    setNamedTemplateName("");
    setNamedTemplateGroupId("");
    setValidationError("");
  };

  const loadNamedTemplate = (saved: NamedResearchCallTemplate) => {
    setNamedTemplateId(saved.id);
    setNamedTemplateName(saved.name);
    setNamedTemplateGroupId(saved.groupIds[0] ?? "");
    setTemplate(saved.template);
    setSavedSnapshots(current => ({ ...current, [messageType]: JSON.stringify(saved.template) }));
    setValidationError("");
  };

  const saveNamedTemplate = async () => {
    const token = localStorage.getItem("token");
    if (!token) return setValidationError("Please sign in again before saving a template.");
    if (namedTemplateName.trim().length < 2 || namedTemplateName.trim().length > 100) return setValidationError("Enter a template name between 2 and 100 characters.");
    if (!isValidCallTemplate(template, messageType, ownerType)) return setValidationError("The template layout is invalid.");
    setIsSavingTemplate(true);
    try {
      const saved = await saveNamedResearchCallTemplate(token, { templateId: namedTemplateId || undefined, messageType, name: namedTemplateName.trim(), template, groupIds: namedTemplateGroupId ? [namedTemplateGroupId] : [] });
      setNamedTemplateId(saved.id);
      setNamedTemplates(current => [saved, ...current.filter(item => item.id !== saved.id)]);
      setValidationError("");
      setSuccessMessage(`“${saved.name}” saved and assigned to ${saved.groupIds.length} group${saved.groupIds.length === 1 ? "" : "s"}.`);
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : "Unable to save this named template.");
    } finally { setIsSavingTemplate(false); }
  };

  const removeNamedTemplate = async (templateId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await deleteNamedResearchCallTemplate(token, templateId);
      setNamedTemplates(current => current.filter(item => item.id !== templateId));
      if (namedTemplateId === templateId) startNewNamedTemplate();
      setSuccessMessage("Named template deleted.");
    } catch (error) { setValidationError(error instanceof Error ? error.message : "Unable to delete this template."); }
  };

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
        PREVIEW_RA,
        messageType,
        ownerType,
        ownerType === "BROKER" ? PREVIEW_BROKER : undefined
      );
    } catch {
      return "The current layout cannot be previewed. Restore the default template.";
    }
  }, [messageType, template]);

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

  const saveTemplate = async () => {
    if (!isValidCallTemplate(template, messageType, ownerType)) {
      setValidationError(
        "The template is invalid or is missing a mandatory block."
      );
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setValidationError(
        "Please sign in again before saving."
      );
      return;
    }

    setIsSavingTemplate(true);
    try {
      const savedTemplate =
        await saveResearchCallTemplateToApi(
          token,
          messageType,
          template,
          ownerType
        );
      try {
        saveCallTemplate(savedTemplate, messageType, window.localStorage, ownerType);
      } catch {
        console.warn(
          "The server template was saved but could not be cached in this browser."
        );
      }
      setTemplate(savedTemplate);
      setSavedSnapshots((current) => ({
        ...current,
        [messageType]: JSON.stringify(savedTemplate),
      }));
      setValidationError("");
      setSuccessMessage(
        messageType === "ERRATA"
          ? `Errata template saved for your ${ownerType === "BROKER" ? "broker" : "RA"} account.`
          : `New-call template saved for your ${ownerType === "BROKER" ? "broker" : "RA"} account.`
      );
    } catch (error) {
      setValidationError(
        error instanceof Error
          ? error.message
          : "Unable to save the template."
      );
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const resetTemplate = async () => {
    const defaultTemplate =
      createDefaultCallTemplate(messageType, ownerType);
    const token = localStorage.getItem("token");

    if (!token) {
      setValidationError(
        "Please sign in again before resetting."
      );
      return;
    }

    setIsSavingTemplate(true);
    try {
      const savedTemplate =
        await saveResearchCallTemplateToApi(
          token,
          messageType,
          defaultTemplate,
          ownerType
        );
      try {
        saveCallTemplate(savedTemplate, messageType, window.localStorage, ownerType);
      } catch {
        console.warn(
          "The server template was reset but could not be cached in this browser."
        );
      }
      setTemplate(savedTemplate);
      setSavedSnapshots((current) => ({
        ...current,
        [messageType]: JSON.stringify(savedTemplate),
      }));
      setValidationError("");
      setSuccessMessage(
        messageType === "ERRATA"
          ? "Default Errata layout restored."
          : "Default new-call layout restored."
      );
    } catch {
      setValidationError(
        "Unable to restore the default template."
      );
    } finally {
      setIsSavingTemplate(false);
    }
  };

  return (
    <Box
      sx={{
        borderRadius: 3,
        background:
          "linear-gradient(180deg, #F4F7FE 0%, #FFFFFF 42%)",
      }}
    >
      <Box
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: 3,
          color: "#FFFFFF",
          background:
            "linear-gradient(135deg, #637BFF 0%, #4F6CF8 58%, #1D4ED8 100%)",
          boxShadow: "0 8px 22px rgba(79, 108, 248, 0.22)",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1.5}
        >
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  borderRadius: 2,
                  color: TARKASH_BLUE_DARK,
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                }}
              >
                <TextFieldsOutlinedIcon />
              </Box>
              <Typography
                variant="h6"
                fontWeight={800}
                fontSize={{ xs: "1.05rem", sm: "1.25rem" }}
              >
                {ownerType === "BROKER" ? "Broker Call Message Template" : "Research Call Message Template"}
              </Typography>
            </Stack>
            <Typography
              variant="body2"
              sx={{ mt: 1, maxWidth: 650, fontWeight: 600 }}
            >
              Build your message by moving the cards into the
              order you want. No technical knowledge is needed.
            </Typography>
          </Box>
          <Chip
            icon={
              hasUnsavedChanges
                ? <LightbulbOutlinedIcon />
                : <CheckCircleOutlineIcon />
            }
            label={
              hasUnsavedChanges
                ? "Changes not saved"
                : "Everything saved"
            }
            sx={{
              px: 0.5,
              fontWeight: 800,
              color: hasUnsavedChanges ? "#5B21B6" : "#14532D",
              backgroundColor: hasUnsavedChanges
                ? "#F5F3FF"
                : "#ECFDF3",
              border: `1px solid ${
                hasUnsavedChanges ? "#C4B5FD" : "#86EFAC"
              }`,
            }}
          />
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(3, minmax(0, 1fr))",
            },
            gap: 1,
            mt: 2,
          }}
        >
          {[
            {
              number: "1",
              title: "Hold the blue handle",
              text: "Use the dotted blue button on a card.",
            },
            {
              number: "2",
              title: "Move the card",
              text: "Drag it up or down to change the order.",
            },
            {
              number: "3",
              title: "Save your layout",
              text: "Check the preview, then press Save template.",
            },
          ].map((step) => (
            <Stack
              key={step.number}
              direction="row"
              spacing={1}
              alignItems="flex-start"
              sx={{
                p: 1.25,
                borderRadius: 2,
                backgroundColor: "rgba(255, 255, 255, 0.16)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  borderRadius: "50%",
                  color: TARKASH_BLUE_DEEP,
                  backgroundColor: "#FFFFFF",
                  fontSize: "0.8rem",
                  fontWeight: 800,
                }}
              >
                {step.number}
              </Box>
              <Box>
                <Typography fontSize="0.8rem" fontWeight={800}>
                  {step.title}
                </Typography>
                <Typography fontSize="0.7rem" lineHeight={1.35}>
                  {step.text}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Box>
      </Box>

      <Box
        sx={{
          p: 1.5,
          mt: 2,
          borderRadius: 2.5,
          backgroundColor: "#FFFFFF",
          border: "1px solid #C7D2FE",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
          spacing={1.5}
        >
          <Box>
            <Typography fontWeight={800}>
              Which message do you want to arrange?
            </Typography>
            <Typography
              color="text.secondary"
              fontSize="0.75rem"
            >
              Each layout is saved separately for your {ownerType === "BROKER" ? "broker" : "RA"} account.
            </Typography>
          </Box>
          <ToggleButtonGroup
            exclusive
            value={messageType}
            disabled={
              isLoadingTemplates || isSavingTemplate
            }
            onChange={(
              _event,
              nextType: ResearchCallMessageType | null
            ) => {
              if (!nextType) {
                return;
              }

              setMessageType(nextType);
              setCustomText("");
              setValidationError("");
              startNewNamedTemplate();
            }}
            aria-label="Choose message template"
            sx={{
              alignSelf: { xs: "stretch", sm: "auto" },
              "& .MuiToggleButton-root": {
                flex: { xs: 1, sm: "initial" },
                px: { xs: 1, sm: 2 },
                py: 1,
                fontWeight: 800,
                textTransform: "none",
                borderColor: "#A5B4FC",
                "&.Mui-selected": {
                  color: "#FFFFFF",
                  backgroundColor: TARKASH_BLUE,
                  "&:hover": {
                    backgroundColor: "#3D56CA",
                  },
                },
              },
            }}
          >
            <ToggleButton value="NEW_CALL">
              New Recommendation
            </ToggleButton>
            <ToggleButton value="ERRATA">
              Errata / Correction
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        {isLoadingTemplates && (
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            mt={1.25}
          >
            <CircularProgress size={16} />
            <Typography
              color="text.secondary"
              fontSize="0.75rem"
            >
              Loading your saved layouts...
            </Typography>
          </Stack>
        )}
      </Box>

      {ownerType === "RA" && disclaimerGroup && (
        <Paper variant="outlined" sx={{ mt: 2, p: 2, borderRadius: 2.5, borderColor: "#C7D2FE", backgroundColor: "#F8FAFF" }}>
          <Typography fontWeight={800}>Set a disclaimer for “{disclaimerGroup.name}”</Typography>
          <Typography color="text.secondary" fontSize="0.8rem" sx={{ mt: 0.4, mb: 1.25 }}>
            This disclaimer is shown in calls sent to this group. You can also assign a named message template to the group below.
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            maxRows={6}
            label="Group call disclaimer"
            value={groupDisclaimerText}
            onChange={event => setGroupDisclaimerText(event.target.value)}
            inputProps={{ maxLength: 2000 }}
            helperText={`${groupDisclaimerText.length}/2000 characters`}
          />
          <Button sx={{ mt: 1.25 }} variant="contained" onClick={saveGroupDisclaimer} disabled={isSavingGroupDisclaimer}>
            {isSavingGroupDisclaimer ? "Saving disclaimer…" : "Save group disclaimer"}
          </Button>
        </Paper>
      )}

      {ownerType === "RA" && (
        <Paper variant="outlined" sx={{ mt: 2, p: 2, borderRadius: 2.5, borderColor: "#C7D2FE" }}>
          <Typography fontWeight={800}>Named templates for groups</Typography>
          <Typography color="text.secondary" fontSize="0.8rem" sx={{ mt: 0.4, mb: 1.5 }}>
            Save a named layout, then assign it to one audience group. The selected group determines the template in call preview.
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="Template name"
            placeholder={messageType === "NEW_CALL" ? "e.g. Futures calls" : "e.g. Futures errata"}
            value={namedTemplateName}
            onChange={event => setNamedTemplateName(event.target.value)}
            inputProps={{ maxLength: 100 }}
            sx={{ mb: 1.25 }}
          />
          <FormControl fullWidth size="small">
            <InputLabel id="named-template-groups-label">Assign to audience group</InputLabel>
            <Select
              labelId="named-template-groups-label"
              value={namedTemplateGroupId}
              label="Assign to audience group"
              onChange={event => setNamedTemplateGroupId(String(event.target.value))}
            >
              <MenuItem value="">No group assigned</MenuItem>
              {audienceGroups.map(group => <MenuItem key={group.id} value={group.id}>{group.name}</MenuItem>)}
            </Select>
          </FormControl>
          <Button sx={{ mt: 1.25 }} variant="contained" onClick={saveNamedTemplate} disabled={isSavingTemplate || isLoadingTemplates}>
            {namedTemplateId ? "Update named template" : "Save named template"}
          </Button>
          {namedTemplateId && <Button sx={{ mt: 1.25, ml: 1 }} onClick={startNewNamedTemplate}>Create another template</Button>}
          <Divider sx={{ my: 1.5 }} />
          <Typography fontWeight={700} fontSize="0.9rem" sx={{ mb: 0.5 }}>Saved named templates</Typography>
          {namedTemplates.filter(item => item.messageType === messageType).length === 0 ? (
            <Typography color="text.secondary" fontSize="0.8rem">No named templates saved for this message type yet.</Typography>
          ) : namedTemplates.filter(item => item.messageType === messageType).map(item => (
            <Stack key={item.id} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={0.5} sx={{ py: 0.75, borderBottom: "1px solid #E2E8F0" }}>
              <Box>
                <Typography fontWeight={700} fontSize="0.85rem">{item.name}</Typography>
                <Typography color="text.secondary" fontSize="0.8rem">{item.groupIds.map(id => audienceGroups.find(group => group.id === id)?.name ?? "Unavailable group").join(", ") || "Not assigned to a group"}</Typography>
              </Box>
              <Stack direction="row" spacing={0.5}>
                <Button size="small" onClick={() => loadNamedTemplate(item)}>Edit</Button>
                <IconButton size="small" aria-label={`Delete ${item.name}`} onClick={() => void removeNamedTemplate(item.id)}><DeleteOutlineIcon fontSize="small" /></IconButton>
              </Stack>
            </Stack>
          ))}
        </Paper>
      )}

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
        <Box
          sx={{
            p: { xs: 1.5, sm: 2 },
            borderRadius: 3,
            backgroundColor: "#FFFFFF",
            border: "1px solid #C7D2FE",
            boxShadow: "0 4px 14px rgba(79, 108, 248, 0.07)",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            mb={0.5}
          >
            <TouchAppOutlinedIcon
              sx={{ color: TARKASH_BLUE }}
            />
            <Typography fontWeight={800} fontSize="1rem">
              Arrange your message
            </Typography>
          </Stack>
          <Typography
            color="text.secondary"
            fontSize="0.8rem"
            mb={1.5}
          >
            Drag from the blue handle. Indigo cards are required;
            blue cards are optional.
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
                    label={blockLabel(
                      block,
                      messageType,
                      ownerType
                    )}
                    onRemove={removeBlock}
                  />
                ))}
              </Stack>
            </SortableContext>
          </DndContext>

          {removedFields.length > 0 && (
            <Box
              mt={2}
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: "#F4F7FE",
                border: "1px dashed #A5B4FC",
              }}
            >
              <Typography
                fontWeight={800}
                fontSize="0.875rem"
                color={TARKASH_BLUE_DARK}
              >
                Want a field back?
              </Typography>
              <Typography
                color="text.secondary"
                fontSize="0.75rem"
                mt={0.25}
              >
                Tap a field below to restore it to your message.
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
                      block.fieldKey,
                      messageType,
                      ownerType
                    )}`}
                    onClick={() =>
                      restoreField(block.fieldKey)
                    }
                    icon={<RestartAltIcon />}
                    sx={{
                      fontWeight: 700,
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #A5B4FC",
                      "&:hover": {
                        backgroundColor: TARKASH_BLUE_PALE,
                      },
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Box
            sx={{
              p: 1.5,
              borderRadius: 2.5,
              backgroundColor: "#F4F7FE",
              border: "1px solid #C7D2FE",
            }}
          >
            <Typography fontWeight={800}>
              Add your own content
            </Typography>
            <Typography
              color="text.secondary"
              fontSize="0.75rem"
              mb={1.5}
            >
              Add a simple heading, a short note, or a divider.
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
                variant="contained"
                startIcon={<AddIcon />}
                onClick={addCustomBlock}
                sx={{
                  color: "#FFFFFF",
                  fontWeight: 800,
                  backgroundColor: TARKASH_BLUE,
                  "&:hover": {
                    backgroundColor: "#3D56CA",
                  },
                }}
              >
                Add block
              </Button>
              <Button
                variant="outlined"
                onClick={addSeparator}
                sx={{
                  color: TARKASH_BLUE_DARK,
                  fontWeight: 700,
                  borderColor: TARKASH_BLUE,
                  "&:hover": {
                    borderColor: TARKASH_BLUE_DARK,
                    backgroundColor: "#FFFFFF",
                  },
                }}
              >
                Add separator
              </Button>
            </Stack>
          </Stack>
          </Box>
        </Box>

        <Box
          sx={{
            p: { xs: 1.5, sm: 2 },
            borderRadius: 3,
            backgroundColor: "#FFFFFF",
            border: "1px solid #C7D2FE",
            boxShadow: "0 4px 14px rgba(79, 108, 248, 0.07)",
            alignSelf: "start",
            position: { md: "sticky" },
            top: { md: 16 },
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            mb={1}
          >
            <VisibilityOutlinedIcon
              sx={{ color: TARKASH_BLUE }}
            />
            <Typography fontWeight={800}>Your message preview</Typography>
            <Chip
              label="Preview only"
              size="small"
              sx={{
                color: TARKASH_BLUE_DARK,
                fontWeight: 800,
                backgroundColor: TARKASH_BLUE_PALE,
                border: "1px solid #A5B4FC",
              }}
            />
          </Stack>
          <Typography
            color="text.secondary"
            fontSize="0.75rem"
            mb={1.25}
          >
            This is an example only. Nothing is published from this
            screen.
          </Typography>
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
              lineHeight: 1.65,
              color: "#172554",
              backgroundColor: "#F8FAFF",
              border: "2px solid #C7D2FE",
              borderRadius: 2.5,
              boxShadow: "inset 0 0 0 1px #FFFFFF",
            }}
          >
            {preview}
          </Paper>
        </Box>
      </Box>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={1.5}
        mt={2}
        sx={{
          p: 1.5,
          borderRadius: 2.5,
          backgroundColor: "#EEF2FF",
          border: "1px solid #A5B4FC",
        }}
      >
        <Box>
          <Typography fontWeight={800} color={TARKASH_BLUE_DARK}>
            Happy with your message?
          </Typography>
          <Typography color="text.secondary" fontSize="0.75rem">
            Save it now so the same layout is ready next time.
          </Typography>
        </Box>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
        >
          <Button
            variant="contained"
            startIcon={
              isSavingTemplate
                ? <CircularProgress size={16} color="inherit" />
                : <SaveOutlinedIcon />
            }
            onClick={saveTemplate}
            disabled={
              !hasUnsavedChanges ||
              isLoadingTemplates ||
              isSavingTemplate
            }
            sx={{
              minHeight: 44,
              color: "#FFFFFF",
              fontWeight: 800,
              backgroundColor: TARKASH_BLUE,
              boxShadow: "0 4px 10px rgba(79, 108, 248, 0.22)",
              "&:hover": {
                backgroundColor: "#3D56CA",
              },
              "&.Mui-disabled": {
                color: "#64748B",
                backgroundColor: "#E2E8F0",
              },
            }}
          >
            Save template
          </Button>
          <Button
            variant="outlined"
            startIcon={<RestartAltIcon />}
            onClick={resetTemplate}
            disabled={
              isLoadingTemplates || isSavingTemplate
            }
            sx={{
              minHeight: 44,
              color: TARKASH_BLUE_DARK,
              fontWeight: 700,
              borderColor: TARKASH_BLUE,
              backgroundColor: "#FFFFFF",
              "&:hover": {
                borderColor: TARKASH_BLUE_DARK,
                backgroundColor: "#F4F7FE",
              },
            }}
          >
            Reset to default
          </Button>
        </Stack>
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
