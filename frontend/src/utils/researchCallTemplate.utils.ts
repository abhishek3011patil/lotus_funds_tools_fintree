export const CALL_TEMPLATE_STORAGE_KEY =
  "lotusfunds.ra.call-template.v1";
export const CALL_TEMPLATE_VERSION = 1 as const;
export const MAX_CUSTOM_BLOCK_LENGTH = 500;

export const CALL_TEMPLATE_FIELDS = [
  {
    key: "recommendationHeading",
    label: "Recommendation heading",
    locked: false,
  },
  {
    key: "publishedAt",
    label: "Published date and time",
    locked: false,
  },
  {
    key: "instrument",
    label: "Instrument / stock name",
    locked: true,
  },
  {
    key: "symbol",
    label: "Symbol",
    locked: true,
  },
  {
    key: "exchange",
    label: "Exchange",
    locked: false,
  },
  {
    key: "action",
    label: "Action",
    locked: true,
  },
  {
    key: "callType",
    label: "Call type",
    locked: false,
  },
  {
    key: "entry",
    label: "Entry / entry range",
    locked: true,
  },
  {
    key: "target1",
    label: "Target 1",
    locked: true,
  },
  {
    key: "target2",
    label: "Target 2",
    locked: false,
  },
  {
    key: "target3",
    label: "Target 3",
    locked: false,
  },
  {
    key: "stopLoss1",
    label: "Stop Loss 1",
    locked: true,
  },
  {
    key: "stopLoss2",
    label: "Stop Loss 2",
    locked: false,
  },
  {
    key: "stopLoss3",
    label: "Stop Loss 3",
    locked: false,
  },
  {
    key: "expiry",
    label: "Expiry date",
    locked: false,
  },
  {
    key: "timeHorizon",
    label: "Time horizon / holding period",
    locked: true,
  },
  {
    key: "rationale",
    label: "Rationale",
    locked: false,
  },
  {
    key: "underlyingStudy",
    label: "Underlying study",
    locked: false,
  },
  {
    key: "remarks",
    label: "Remarks",
    locked: false,
  },
  {
    key: "raAttribution",
    label: "Research Analyst attribution",
    locked: true,
  },
  {
    key: "sebiRegistration",
    label: "SEBI registration number",
    locked: true,
  },
  {
    key: "contact",
    label: "Contact number",
    locked: false,
  },
  {
    key: "email",
    label: "Email",
    locked: false,
  },
  {
    key: "disclaimer",
    label: "Mandatory disclaimer and link",
    locked: true,
  },
] as const;

export type CallTemplateFieldKey =
  (typeof CALL_TEMPLATE_FIELDS)[number]["key"];

export type CallTemplateBlock =
  | {
      id: string;
      type: "field";
      fieldKey: CallTemplateFieldKey;
      enabled: boolean;
      locked: boolean;
    }
  | {
      id: string;
      type: "text";
      text: string;
      enabled: boolean;
      locked: false;
    }
  | {
      id: string;
      type: "heading";
      text: string;
      enabled: boolean;
      locked: false;
    }
  | {
      id: string;
      type: "separator";
      enabled: boolean;
      locked: false;
    };

export interface CallTemplate {
  version: typeof CALL_TEMPLATE_VERSION;
  blocks: CallTemplateBlock[];
}

export interface ResearchCallTemplateData {
  publishedAt?: string;
  instrument?: string;
  symbol?: string;
  exchange?: string;
  action?: string;
  callType?: string;
  entry?: string;
  targets?: Array<string | number | null | undefined>;
  stopLosses?: Array<string | number | null | undefined>;
  expiry?: string;
  timeHorizon?: string;
  holdingPeriod?: string;
  rationale?: string;
  underlyingStudy?: string;
  remarks?: string;
}

export interface ResearchAnalystTemplateData {
  fullName?: string;
  organizationName?: string;
  sebiRegistrationNumber?: string;
  contactNumber?: string;
  email?: string;
  disclaimer?: string;
  disclaimerLink?: string;
}

const fieldDefinitionByKey = new Map(
  CALL_TEMPLATE_FIELDS.map((field) => [
    field.key,
    field,
  ])
);

const cloneTemplate = (
  template: CallTemplate
): CallTemplate =>
  JSON.parse(JSON.stringify(template)) as CallTemplate;

export const createDefaultCallTemplate = (): CallTemplate => ({
  version: CALL_TEMPLATE_VERSION,
  blocks: CALL_TEMPLATE_FIELDS.map((field) => ({
    id: `field:${field.key}`,
    type: "field" as const,
    fieldKey: field.key,
    enabled: field.key !== "recommendationHeading",
    locked: field.locked,
  })),
});

const isRecord = (
  value: unknown
): value is Record<string, unknown> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value);

export const normalizeCustomBlockText = (
  value: string
): string =>
  value
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const isValidFieldBlock = (
  block: Record<string, unknown>
): block is Extract<CallTemplateBlock, { type: "field" }> => {
  if (
    block.type !== "field" ||
    typeof block.id !== "string" ||
    typeof block.fieldKey !== "string" ||
    typeof block.enabled !== "boolean" ||
    typeof block.locked !== "boolean"
  ) {
    return false;
  }

  const definition = fieldDefinitionByKey.get(
    block.fieldKey as CallTemplateFieldKey
  );

  return Boolean(
    definition &&
      block.id === `field:${definition.key}` &&
      block.locked === definition.locked &&
      (!definition.locked || block.enabled)
  );
};

const isValidCustomBlock = (
  block: Record<string, unknown>
): block is Exclude<CallTemplateBlock, { type: "field" }> => {
  if (
    typeof block.id !== "string" ||
    typeof block.enabled !== "boolean" ||
    block.locked !== false
  ) {
    return false;
  }

  if (block.type === "separator") {
    return true;
  }

  if (block.type !== "text" && block.type !== "heading") {
    return false;
  }

  if (typeof block.text !== "string") {
    return false;
  }

  const normalized = normalizeCustomBlockText(block.text);
  return (
    normalized.length > 0 &&
    normalized.length <= MAX_CUSTOM_BLOCK_LENGTH
  );
};

export const isValidCallTemplate = (
  value: unknown
): value is CallTemplate => {
  if (
    !isRecord(value) ||
    value.version !== CALL_TEMPLATE_VERSION ||
    !Array.isArray(value.blocks) ||
    value.blocks.length < CALL_TEMPLATE_FIELDS.length ||
    value.blocks.length > 100
  ) {
    return false;
  }

  const ids = new Set<string>();
  const fieldKeys = new Set<CallTemplateFieldKey>();

  for (const candidate of value.blocks) {
    if (!isRecord(candidate)) {
      return false;
    }

    let block: CallTemplateBlock;

    if (candidate.type === "field") {
      if (!isValidFieldBlock(candidate)) {
        return false;
      }
      block = candidate;
    } else {
      if (!isValidCustomBlock(candidate)) {
        return false;
      }
      block = candidate;
    }

    if (ids.has(block.id)) {
      return false;
    }

    ids.add(block.id);

    if (block.type === "field") {
      if (fieldKeys.has(block.fieldKey)) {
        return false;
      }
      fieldKeys.add(block.fieldKey);
    }
  }

  return CALL_TEMPLATE_FIELDS.every((field) =>
    fieldKeys.has(field.key)
  );
};

export const parseStoredCallTemplate = (
  rawValue: string | null
): CallTemplate => {
  if (!rawValue) {
    return createDefaultCallTemplate();
  }

  try {
    const parsed: unknown = JSON.parse(rawValue);
    return isValidCallTemplate(parsed)
      ? cloneTemplate(parsed)
      : createDefaultCallTemplate();
  } catch {
    return createDefaultCallTemplate();
  }
};

export const loadCallTemplate = (
  storage: Pick<Storage, "getItem"> = window.localStorage
): CallTemplate =>
  parseStoredCallTemplate(
    storage.getItem(CALL_TEMPLATE_STORAGE_KEY)
  );

export const saveCallTemplate = (
  template: CallTemplate,
  storage: Pick<Storage, "setItem"> = window.localStorage
) => {
  if (!isValidCallTemplate(template)) {
    throw new Error(
      "The template is invalid or is missing mandatory blocks."
    );
  }

  storage.setItem(
    CALL_TEMPLATE_STORAGE_KEY,
    JSON.stringify(template)
  );
};

export const reorderTemplateBlocks = (
  template: CallTemplate,
  activeId: string,
  overId: string
): CallTemplate => {
  const oldIndex = template.blocks.findIndex(
    (block) => block.id === activeId
  );
  const newIndex = template.blocks.findIndex(
    (block) => block.id === overId
  );

  if (
    oldIndex < 0 ||
    newIndex < 0 ||
    oldIndex === newIndex
  ) {
    return cloneTemplate(template);
  }

  const blocks = [...template.blocks];
  const [movedBlock] = blocks.splice(oldIndex, 1);
  blocks.splice(newIndex, 0, movedBlock);

  return {
    version: CALL_TEMPLATE_VERSION,
    blocks,
  };
};

const valueOrFallback = (
  value: string | number | null | undefined
): string => {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return "N/A";
  }

  return String(value).trim();
};

const optionalValue = (
  value: string | number | null | undefined
): string | null => {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return null;
  }

  return String(value).trim();
};

const fieldValue = (
  fieldKey: CallTemplateFieldKey,
  call: ResearchCallTemplateData,
  ra: ResearchAnalystTemplateData
): string => {
  const target = (index: number) =>
    valueOrFallback(call.targets?.[index]);
  const stopLoss = (index: number) =>
    valueOrFallback(call.stopLosses?.[index]);

  switch (fieldKey) {
    case "recommendationHeading":
      return "RESEARCH RECOMMENDATION";
    case "publishedAt":
      return `Published On: ${valueOrFallback(call.publishedAt)}`;
    case "instrument":
      return `Stock Name: ${valueOrFallback(call.instrument)}`;
    case "symbol":
      return `Symbol: ${valueOrFallback(call.symbol)}`;
    case "exchange":
      return `Exchange: ${valueOrFallback(call.exchange)}`;
    case "action":
      return `Action: ${valueOrFallback(call.action)}`;
    case "callType":
      return `Call Type: ${valueOrFallback(call.callType)}`;
    case "entry":
      return `Entry: ${valueOrFallback(call.entry)}`;
    case "target1":
      return `Target: ${target(0)}`;
    case "target2": {
      const value = optionalValue(call.targets?.[1]);
      return value ? `T2: ${value}` : "";
    }
    case "target3": {
      const value = optionalValue(call.targets?.[2]);
      return value ? `T3: ${value}` : "";
    }
    case "stopLoss1":
      return `SL: ${stopLoss(0)}`;
    case "stopLoss2": {
      const value = optionalValue(call.stopLosses?.[1]);
      return value ? `SL 2: ${value}` : "";
    }
    case "stopLoss3": {
      const value = optionalValue(call.stopLosses?.[2]);
      return value ? `SL 3: ${value}` : "";
    }
    case "expiry":
      return `Expiry: ${valueOrFallback(call.expiry)}`;
    case "timeHorizon":
      return [
        `Time Horizon: ${valueOrFallback(call.timeHorizon)}`,
        `Holding Period: ${valueOrFallback(call.holdingPeriod)}`,
      ].join("\n");
    case "rationale":
      return `Rationale: ${valueOrFallback(call.rationale)}`;
    case "underlyingStudy":
      return `Underlying Study: ${valueOrFallback(
        call.underlyingStudy
      )}`;
    case "remarks":
      return `Remarks: ${valueOrFallback(call.remarks)}`;
    case "raAttribution":
      return `Research Analyst: ${valueOrFallback(
        ra.fullName
      )} (${valueOrFallback(ra.organizationName)})`;
    case "sebiRegistration":
      return `SEBI Registration No: ${valueOrFallback(
        ra.sebiRegistrationNumber
      )}`;
    case "contact":
      return `Contact No: ${valueOrFallback(ra.contactNumber)}`;
    case "email":
      return `Email ID: ${valueOrFallback(ra.email)}`;
    case "disclaimer":
      return [
        "DISCLAIMER CUM DISCLOSURE:",
        "",
        valueOrFallback(ra.disclaimer),
        "",
        "Read Full Disclaimer / Disclosure at:",
        valueOrFallback(
          ra.disclaimerLink ||
            "https://lotusfunds.com/disclaimer&disclosure"
        ),
      ].join("\n");
  }
};

export const formatResearchCallMessage = (
  template: CallTemplate,
  call: ResearchCallTemplateData,
  ra: ResearchAnalystTemplateData
): string => {
  if (!isValidCallTemplate(template)) {
    throw new Error(
      "The research-call template is invalid."
    );
  }

  return template.blocks
    .filter((block) => block.enabled)
    .map((block) => {
      if (block.type === "field") {
        return fieldValue(block.fieldKey, call, ra);
      }

      if (block.type === "separator") {
        return "--------------------------------";
      }

      return normalizeCustomBlockText(block.text);
    })
    .filter(Boolean)
    .join("\n\n")
    .trim();
};

export const formatSavedResearchCallMessage = (
  call: ResearchCallTemplateData,
  ra: ResearchAnalystTemplateData,
  fallback: () => string,
  storage: Pick<Storage, "getItem"> = window.localStorage
): string => {
  try {
    const rawTemplate = storage.getItem(
      CALL_TEMPLATE_STORAGE_KEY
    );

    if (!rawTemplate) {
      return fallback();
    }

    const parsed: unknown = JSON.parse(rawTemplate);
    if (!isValidCallTemplate(parsed)) {
      return fallback();
    }

    return formatResearchCallMessage(parsed, call, ra);
  } catch {
    return fallback();
  }
};
