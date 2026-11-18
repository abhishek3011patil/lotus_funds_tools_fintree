export const CALL_TEMPLATE_STORAGE_KEY =
  "lotusfunds.ra.call-template.v1";
export const ERRATA_TEMPLATE_STORAGE_KEY =
  "lotusfunds.ra.errata-template.v1";
export const BROKER_CALL_TEMPLATE_STORAGE_KEY =
  "lotusfunds.broker.call-template.v1";
export const BROKER_ERRATA_TEMPLATE_STORAGE_KEY =
  "lotusfunds.broker.errata-template.v1";
export const CALL_TEMPLATE_VERSION = 1 as const;
export const DEFAULT_RA_DISCLAIMER = "Investment/Trading in equities is subject to market risks.";
export const MAX_CUSTOM_BLOCK_LENGTH = 500;
export type CallTemplateOwnerType = "RA" | "BROKER";

export type ResearchCallMessageType =
  | "NEW_CALL"
  | "ERRATA";

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
    label: "Disclaimer and link (optional)",
    locked: false,
  },
] as const;

export const ERRATA_TEMPLATE_FIELDS = [
  {
    key: "errataHeading",
    label: "ERRATA / CORRECTION heading",
    locked: true,
  },
  {
    key: "publishedAt",
    label: "Correction date and time",
    locked: true,
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
    label: "Corrected entry / entry range",
    locked: true,
  },
  {
    key: "target1",
    label: "Corrected Target 1",
    locked: true,
  },
  {
    key: "target2",
    label: "Corrected Target 2",
    locked: false,
  },
  {
    key: "target3",
    label: "Corrected Target 3",
    locked: false,
  },
  {
    key: "stopLoss1",
    label: "Corrected Stop Loss 1",
    locked: true,
  },
  {
    key: "stopLoss2",
    label: "Corrected Stop Loss 2",
    locked: false,
  },
  {
    key: "stopLoss3",
    label: "Corrected Stop Loss 3",
    locked: false,
  },
  {
    key: "expiry",
    label: "Expiry date",
    locked: false,
  },
  {
    key: "timeHorizon",
    label: "Call type / holding period",
    locked: true,
  },
  {
    key: "errataReason",
    label: "Reason for correction",
    locked: true,
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
    label: "Disclaimer and link (optional)",
    locked: false,
  },
] as const;

export const BROKER_CALL_TEMPLATE_FIELDS = CALL_TEMPLATE_FIELDS.map((field) =>
  field.key === "raAttribution"
    ? { key: "dynamicRaName" as const, label: "Dynamic Research Analyst name", locked: true }
    : field.key === "disclaimer"
      ? { key: "brokerDisclaimer" as const, label: "Dynamic Broker Disclaimer (optional)", locked: false }
      : field
);

export const BROKER_ERRATA_TEMPLATE_FIELDS = ERRATA_TEMPLATE_FIELDS.map((field) =>
  field.key === "raAttribution"
    ? { key: "dynamicRaName" as const, label: "Dynamic Research Analyst name", locked: true }
    : field.key === "disclaimer"
      ? { key: "brokerDisclaimer" as const, label: "Dynamic Broker Disclaimer (optional)", locked: false }
      : field
);

export type CallTemplateFieldKey =
  | (typeof CALL_TEMPLATE_FIELDS)[number]["key"]
  | (typeof ERRATA_TEMPLATE_FIELDS)[number]["key"]
  | "dynamicRaName"
  | "brokerDisclaimer";

export const getCallTemplateFields = (
  messageType: ResearchCallMessageType,
  ownerType: CallTemplateOwnerType = "RA"
) =>
  ownerType === "BROKER"
    ? messageType === "ERRATA" ? BROKER_ERRATA_TEMPLATE_FIELDS : BROKER_CALL_TEMPLATE_FIELDS
    : messageType === "ERRATA" ? ERRATA_TEMPLATE_FIELDS : CALL_TEMPLATE_FIELDS;

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
  standardLayout?: boolean;
  canvasText?: string;
}

export const DEFAULT_RA_CANVAS: Record<ResearchCallMessageType, string> = {
  NEW_CALL: "{{publishedAt}}\nRESEARCH RECOMMENDATION:\n{{action}} {{symbol}} {{expiry}} {{callType}}\nEntry Price: {{entry}}\nTarget: {{target1}}\nStop Loss: {{stopLoss1}}\nHolding Period: {{holdingPeriod}}\nRationale: {{rationale}}\nLot Size: {{lotSize}}\n{{riskRewardPerLot}}\nStatus: {{status}}\nResearch Analyst: {{raName}} ({{organization}})\nSEBI Registration No: {{sebiRegistration}}\nContact No: {{contact}}\nEmail ID: {{email}}\nDisclaimer: {{disclaimer}}",
  ERRATA: "{{publishedAt}}\nERRATA / CORRECTION:\n{{action}} {{symbol}} {{expiry}} {{callType}}\nEntry Price: {{entry}}\nTarget: {{target1}}\nStop Loss: {{stopLoss1}}\nHolding Period: {{holdingPeriod}}\nReason for Correction: {{errataReason}}\nResearch Analyst: {{raName}} ({{organization}})\nSEBI Registration No: {{sebiRegistration}}\nContact No: {{contact}}\nEmail ID: {{email}}\nDisclaimer: {{disclaimer}}",
};

export const RA_CANVAS_VALUES = [
  ["publishedAt", "Date and time", "Call"], ["action", "Buy / Sell", "Call"],
  ["symbol", "Symbol", "Call"], ["instrument", "Stock name", "Call"],
  ["exchange", "Exchange", "Call"], ["exchangeType", "NSE / BSE", "Call"],
  ["marketType", "Stock / Index", "Call"], ["callType", "Cash / Futures / Options", "Call"],
  ["tradeType", "Intraday / BTST / STBT / Term", "Call"], ["expiry", "Expiry", "Call"],
  ["holdingPeriod", "Holding period", "Call"], ["status", "Status", "Call"],
  ["entry", "Entry price or range", "Prices"], ["entryLow", "Entry range low", "Prices"],
  ["entryUpper", "Entry range high", "Prices"], ["target1", "Target 1", "Prices"],
  ["target2", "Target 2", "Prices"], ["target3", "Target 3", "Prices"],
  ["stopLoss1", "Stop Loss 1", "Prices"], ["stopLoss2", "Stop Loss 2", "Prices"],
  ["stopLoss3", "Stop Loss 3", "Prices"], ["lotSize", "Lot size", "Prices"],
  ["riskPerLot", "Risk on 1 lot", "Risk & reward"],
  ["rewardPerLot", "Reward on 1 lot", "Risk & reward"],
  ["riskRewardPerLot", "Risk / Reward on 1 Lot (full line)", "Risk & reward"],
  ["riskPercent", "Risk %", "Risk & reward"],
  ["rewardPercent", "Reward %", "Risk & reward"],
  ["riskRewardRatio", "Risk : Reward ratio", "Risk & reward"],
  ["rationale", "Rationale", "Notes"], ["underlyingStudy", "Underlying study", "Notes"],
  ["remarks", "Research remarks", "Notes"], ["errataReason", "Errata reason", "Notes"],
  ["raName", "RA full name", "Research analyst"], ["raSalutation", "RA title", "Research analyst"],
  ["raFirstName", "RA first name", "Research analyst"],
  ["raMiddleName", "RA middle name", "Research analyst"],
  ["raSurname", "RA surname", "Research analyst"],
  ["organization", "Organization", "Research analyst"],
  ["sebiRegistration", "SEBI number", "Research analyst"],
  ["contact", "RA contact", "Research analyst"], ["email", "RA email", "Research analyst"],
  ["raComments", "RA additional comments", "Research analyst"],
  ["disclaimer", "Disclaimer", "Research analyst"],
] as const;

const formatRaCanvas = (canvasText: string, call: ResearchCallTemplateData, ra: ResearchAnalystTemplateData): string => {
  const ratio = call.riskRewardRatio ?? (call.riskPerLot && call.rewardPerLot !== undefined ? call.rewardPerLot / call.riskPerLot : undefined);
  const riskRewardPerLot = call.riskPerLot !== undefined && call.rewardPerLot !== undefined && ratio !== undefined && Number.isFinite(ratio)
    ? `Risk /Reward on 1 Lot: Rs.${Math.round(call.riskPerLot)}/Rs. ${Math.round(call.rewardPerLot)}; 1:${ratio.toFixed(2)}`
    : "Risk /Reward on 1 Lot: N/A";
  const values: Record<string, string> = {
    publishedAt: call.publishedAt || "N/A", action: call.action || "N/A",
    symbol: call.symbol || "N/A", instrument: call.instrument || "N/A",
    exchange: call.exchange || "N/A", exchangeType: call.exchangeType || "N/A",
    marketType: call.marketType || "N/A", callType: call.callType || "N/A",
    tradeType: call.timeHorizon || "N/A",
    expiry: call.expiry || "N/A", entry: call.entry || "N/A",
    entryLow: call.entryLow || "", entryUpper: call.entryUpper || "",
    target1: String(call.targets?.[0] ?? "N/A"), target2: String(call.targets?.[1] ?? ""),
    target3: String(call.targets?.[2] ?? ""), stopLoss1: String(call.stopLosses?.[0] ?? "N/A"),
    stopLoss2: String(call.stopLosses?.[1] ?? ""), stopLoss3: String(call.stopLosses?.[2] ?? ""),
    holdingPeriod: call.holdingPeriod || "N/A", rationale: call.rationale || "N/A",
    lotSize: String(call.lotSize ?? "N/A"), status: call.status || "Open",
    underlyingStudy: call.underlyingStudy || "", remarks: call.remarks || "",
    riskPerLot: call.riskPerLot === undefined ? "" : String(Math.round(call.riskPerLot)),
    rewardPerLot: call.rewardPerLot === undefined ? "" : String(Math.round(call.rewardPerLot)),
    riskRewardPerLot,
    riskPercent: call.riskPercent === undefined ? "" : call.riskPercent.toFixed(2),
    rewardPercent: call.rewardPercent === undefined ? "" : call.rewardPercent.toFixed(2),
    riskRewardRatio: ratio === undefined || !Number.isFinite(ratio) ? "" : `1:${ratio.toFixed(2)}`,
    errataReason: call.errataReason || "N/A", raName: ra.fullName || "N/A",
    raSalutation: ra.salutation || "", raFirstName: ra.firstName || "",
    raMiddleName: ra.middleName || "", raSurname: ra.surname || "",
    organization: ra.organizationName || "N/A", sebiRegistration: ra.sebiRegistrationNumber || "N/A",
    contact: ra.contactNumber || "N/A", email: ra.email || "N/A",
    raComments: ra.additionalComments || "",
    disclaimer: ra.disclaimer?.trim() || DEFAULT_RA_DISCLAIMER,
  };
  return canvasText.replace(/\{\{([a-zA-Z0-9]+)\}\}/g, (_token, key: string) => values[key] ?? "").trim();
};

export interface ResearchCallTemplateData {
  publishedAt?: string;
  instrument?: string;
  symbol?: string;
  exchange?: string;
  exchangeType?: string;
  marketType?: string;
  action?: string;
  callType?: string;
  entry?: string;
  entryLow?: string;
  entryUpper?: string;
  targets?: Array<string | number | null | undefined>;
  stopLosses?: Array<string | number | null | undefined>;
  expiry?: string;
  timeHorizon?: string;
  holdingPeriod?: string;
  rationale?: string;
  underlyingStudy?: string;
  remarks?: string;
  errataReason?: string;
  lotSize?: number | string;
  riskPerLot?: number;
  rewardPerLot?: number;
  riskPercent?: number;
  rewardPercent?: number;
  riskRewardRatio?: number;
  status?: string;
}

export interface ResearchAnalystTemplateData {
  fullName?: string;
  salutation?: string;
  firstName?: string;
  middleName?: string;
  surname?: string;
  organizationName?: string;
  sebiRegistrationNumber?: string;
  contactNumber?: string;
  email?: string;
  disclaimer?: string;
  disclaimerLink?: string;
  additionalComments?: string;
}

export interface BrokerTemplateData {
  companyName?: string;
  sebiRegistrationNumber?: string;
  disclaimer?: string;
}

const cloneTemplate = (
  template: CallTemplate
): CallTemplate =>
  JSON.parse(JSON.stringify(template)) as CallTemplate;

export const createDefaultCallTemplate = (
  messageType: ResearchCallMessageType = "NEW_CALL",
  ownerType: CallTemplateOwnerType = "RA"
): CallTemplate => ({
  version: CALL_TEMPLATE_VERSION,
  ...(ownerType === "RA" ? { standardLayout: true } : {}),
  blocks: getCallTemplateFields(messageType, ownerType).map((field) => ({
    id: `field:${field.key}`,
    type: "field" as const,
    fieldKey: field.key,
    enabled:
      messageType === "ERRATA" ||
      field.key !== "recommendationHeading",
    locked: field.locked,
  })),
});

export const formatDefaultRaRecommendation = (
  call: ResearchCallTemplateData,
  ra: ResearchAnalystTemplateData
): string => {
  const expiryDate = call.expiry ? new Date(call.expiry) : null;
  const expiryMonth = expiryDate && !Number.isNaN(expiryDate.getTime())
    ? expiryDate.toLocaleString("en-IN", { month: "long" }).toUpperCase() : "";
  const action = String(call.action || "Buy").toLowerCase() === "sell" ? "Sell" : "Buy";
  const instrumentLine = [action, call.symbol || call.instrument || "N/A", expiryMonth, String(call.callType || "").toUpperCase()].filter(Boolean).join(" ");
  const wholeRupees = (value?: number) => value === undefined || !Number.isFinite(value) ? "N/A" : String(Math.round(value));
  const percentages = call.riskPercent !== undefined && call.rewardPercent !== undefined
    ? ` ; (${call.riskPercent.toFixed(2)}/${call.rewardPercent.toFixed(2)})` : "";
  return [
    call.publishedAt || "N/A",
    "RESEARCH RECOMMENDATION:",
    `${instrumentLine}\nEntry Price: ${call.entry || "N/A"}\nTarget: ${call.targets?.[0] ?? "N/A"}\nStop Loss: ${call.stopLosses?.[0] ?? "N/A"}\nHolding Period: ${call.holdingPeriod || "N/A"}`,
    `Rationale: ${call.rationale || "N/A"}\nLot Size: ${call.lotSize || "N/A"}\nRisk /Reward on 1 Lot: Rs. ${wholeRupees(call.riskPerLot)}/Rs. ${wholeRupees(call.rewardPerLot)}${percentages}\nStatus: ${call.status || "Open"}`,
    `Research Analyst: ${ra.fullName || "N/A"} (${ra.organizationName || "N/A"})\nSEBI Registration No: ${ra.sebiRegistrationNumber || "N/A"}\nContact No: ${ra.contactNumber || "N/A"}\nEmail ID: ${ra.email || "N/A"}`,
    `Disclaimer: ${DEFAULT_RA_DISCLAIMER}`,
  ].join("\n\n");
};

export const formatDefaultRaErrata = (
  call: ResearchCallTemplateData,
  ra: ResearchAnalystTemplateData
): string => {
  const expiryDate = call.expiry ? new Date(call.expiry) : null;
  const expiryMonth = expiryDate && !Number.isNaN(expiryDate.getTime())
    ? expiryDate.toLocaleString("en-IN", { month: "long" }).toUpperCase() : "";
  const action = String(call.action || "Buy").toLowerCase() === "sell" ? "Sell" : "Buy";
  const instrumentLine = [action, call.symbol || call.instrument || "N/A", expiryMonth, String(call.callType || "").toUpperCase()].filter(Boolean).join(" ");
  return [
    call.publishedAt || "N/A",
    "ERRATA / CORRECTION:",
    `${instrumentLine}\nEntry Price: ${call.entry || "N/A"}\nTarget: ${call.targets?.[0] ?? "N/A"}\nStop Loss: ${call.stopLosses?.[0] ?? "N/A"}\nHolding Period: ${call.holdingPeriod || "N/A"}`,
    `Reason for Correction: ${call.errataReason || "N/A"}`,
    `Research Analyst: ${ra.fullName || "N/A"} (${ra.organizationName || "N/A"})\nSEBI Registration No: ${ra.sebiRegistrationNumber || "N/A"}\nContact No: ${ra.contactNumber || "N/A"}\nEmail ID: ${ra.email || "N/A"}`,
    `Disclaimer: ${DEFAULT_RA_DISCLAIMER}`,
  ].join("\n\n");
};

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
  block: Record<string, unknown>,
  messageType: ResearchCallMessageType,
  ownerType: CallTemplateOwnerType = "RA"
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

  const definition = getCallTemplateFields(messageType, ownerType).find(
    (field) => field.key === block.fieldKey
  );

  return Boolean(
    definition &&
      block.id === `field:${definition.key}` &&
      (block.locked === definition.locked ||
        ((definition.key === "disclaimer" || definition.key === "brokerDisclaimer") && block.locked === true)) &&
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
  value: unknown,
  messageType: ResearchCallMessageType = "NEW_CALL",
  ownerType: CallTemplateOwnerType = "RA"
): value is CallTemplate => {
  const fields = getCallTemplateFields(messageType, ownerType);

  if (
    !isRecord(value) ||
    value.version !== CALL_TEMPLATE_VERSION ||
    !Array.isArray(value.blocks) ||
    value.blocks.length < fields.length ||
    value.blocks.length > 100
  ) {
    return false;
  }

  if (value.canvasText !== undefined && (typeof value.canvasText !== "string" || value.canvasText.trim().length === 0 || value.canvasText.length > 8000 ||
    [...value.canvasText.matchAll(/\{\{([^{}]+)\}\}/g)].some(match => !RA_CANVAS_VALUES.some(([key]) => key === match[1])))) return false;

  const ids = new Set<string>();
  const fieldKeys = new Set<CallTemplateFieldKey>();

  for (const candidate of value.blocks) {
    if (!isRecord(candidate)) {
      return false;
    }

    let block: CallTemplateBlock;

    if (candidate.type === "field") {
      if (!isValidFieldBlock(candidate, messageType, ownerType)) {
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

  return fields.every((field) =>
    fieldKeys.has(field.key)
  );
};

export const parseStoredCallTemplate = (
  rawValue: string | null,
  messageType: ResearchCallMessageType = "NEW_CALL",
  ownerType: CallTemplateOwnerType = "RA"
): CallTemplate => {
  if (!rawValue) {
    return createDefaultCallTemplate(messageType, ownerType);
  }

  try {
    const parsed: unknown = JSON.parse(rawValue);
    if (!isValidCallTemplate(parsed, messageType, ownerType)) return createDefaultCallTemplate(messageType, ownerType);
    const normalized = cloneTemplate(parsed);
    normalized.blocks.forEach(block => {
      if (block.type === "field" && (block.fieldKey === "disclaimer" || block.fieldKey === "brokerDisclaimer")) block.locked = false;
    });
    return normalized
  } catch {
    return createDefaultCallTemplate(messageType, ownerType);
  }
};

export const loadCallTemplate = (
  messageType: ResearchCallMessageType = "NEW_CALL",
  storage: Pick<Storage, "getItem"> = window.localStorage,
  ownerType: CallTemplateOwnerType = "RA"
): CallTemplate =>
  parseStoredCallTemplate(
    storage.getItem(
      ownerType === "BROKER"
        ? messageType === "ERRATA" ? BROKER_ERRATA_TEMPLATE_STORAGE_KEY : BROKER_CALL_TEMPLATE_STORAGE_KEY
        : messageType === "ERRATA" ? ERRATA_TEMPLATE_STORAGE_KEY : CALL_TEMPLATE_STORAGE_KEY
    ),
    messageType,
    ownerType
  );

export const saveCallTemplate = (
  template: CallTemplate,
  messageType: ResearchCallMessageType = "NEW_CALL",
  storage: Pick<Storage, "setItem"> = window.localStorage,
  ownerType: CallTemplateOwnerType = "RA"
) => {
  if (!isValidCallTemplate(template, messageType, ownerType)) {
    throw new Error(
      "The template is invalid or is missing mandatory blocks."
    );
  }

  storage.setItem(
    ownerType === "BROKER"
      ? messageType === "ERRATA" ? BROKER_ERRATA_TEMPLATE_STORAGE_KEY : BROKER_CALL_TEMPLATE_STORAGE_KEY
      : messageType === "ERRATA" ? ERRATA_TEMPLATE_STORAGE_KEY : CALL_TEMPLATE_STORAGE_KEY,
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
  ra: ResearchAnalystTemplateData,
  broker?: BrokerTemplateData
): string => {
  const target = (index: number) =>
    valueOrFallback(call.targets?.[index]);
  const stopLoss = (index: number) =>
    valueOrFallback(call.stopLosses?.[index]);

  switch (fieldKey) {
    case "recommendationHeading":
      return "RESEARCH RECOMMENDATION";
    case "errataHeading":
      return "ERRATA / CORRECTION";
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
    case "errataReason":
      return [
        "Reason:",
        valueOrFallback(call.errataReason),
      ].join("\n");
    case "raAttribution":
      return `Research Analyst: ${valueOrFallback(
        ra.fullName
      )} (${valueOrFallback(ra.organizationName)})`;
    case "dynamicRaName":
      return `Research Analyst: ${valueOrFallback(ra.fullName)}`;
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
        `Disclaimer: ${ra.disclaimer?.trim() || DEFAULT_RA_DISCLAIMER}`,
        ra.disclaimerLink?.trim() ? `Read Full Disclaimer / Disclosure at:\n${ra.disclaimerLink.trim()}` : "",
      ].filter(Boolean).join("\n");
    case "brokerDisclaimer":
      return [
        "BROKER DISCLAIMER:",
        "",
        valueOrFallback(broker?.disclaimer),
      ].join("\n");
  }
};

export const formatResearchCallMessage = (
  template: CallTemplate,
  call: ResearchCallTemplateData,
  ra: ResearchAnalystTemplateData,
  messageType: ResearchCallMessageType = "NEW_CALL",
  ownerType: CallTemplateOwnerType = "RA",
  broker?: BrokerTemplateData
): string => {
  if (!isValidCallTemplate(template, messageType, ownerType)) {
    throw new Error(
      "The research-call template is invalid."
    );
  }

  if (ownerType === "RA" && template.canvasText) return formatRaCanvas(template.canvasText, call, ra);

  if (ownerType === "RA" && messageType === "NEW_CALL" && template.standardLayout) {
    return formatDefaultRaRecommendation(call, ra);
  }
  if (ownerType === "RA" && messageType === "ERRATA" && template.standardLayout) {
    return formatDefaultRaErrata(call, ra);
  }

  return template.blocks
    .filter((block) => block.enabled)
    .map((block) => {
      if (block.type === "field") {
        return fieldValue(block.fieldKey, call, ra, broker);
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
  storage: Pick<Storage, "getItem"> = window.localStorage,
  messageType: ResearchCallMessageType = "NEW_CALL",
  ownerType: CallTemplateOwnerType = "RA",
  broker?: BrokerTemplateData
): string => {
  try {
    const rawTemplate = storage.getItem(
      messageType === "ERRATA"
        ? ERRATA_TEMPLATE_STORAGE_KEY
        : CALL_TEMPLATE_STORAGE_KEY
    );

    if (!rawTemplate) {
      return fallback();
    }

    const parsed: unknown = JSON.parse(rawTemplate);
    if (!isValidCallTemplate(parsed, messageType, ownerType)) {
      return fallback();
    }

    return formatResearchCallMessage(
      parsed,
      call,
      ra,
      messageType,
      ownerType,
      broker
    );
  } catch {
    return fallback();
  }
};
