import type { Pool, PoolClient } from "pg";

export const RESEARCH_CALL_TEMPLATE_VERSION = 1 as const;
export const MAX_RESEARCH_CALL_TEMPLATE_BLOCKS = 100;
export const MAX_RESEARCH_CALL_CUSTOM_BLOCK_LENGTH = 500;

export type ResearchCallMessageType =
  | "NEW_CALL"
  | "ERRATA";

interface TemplateFieldDefinition {
  key: string;
  locked: boolean;
}

const NEW_CALL_FIELDS: TemplateFieldDefinition[] = [
  { key: "recommendationHeading", locked: false },
  { key: "publishedAt", locked: false },
  { key: "instrument", locked: true },
  { key: "symbol", locked: true },
  { key: "exchange", locked: false },
  { key: "action", locked: true },
  { key: "callType", locked: false },
  { key: "entry", locked: true },
  { key: "target1", locked: true },
  { key: "target2", locked: false },
  { key: "target3", locked: false },
  { key: "stopLoss1", locked: true },
  { key: "stopLoss2", locked: false },
  { key: "stopLoss3", locked: false },
  { key: "expiry", locked: false },
  { key: "timeHorizon", locked: true },
  { key: "rationale", locked: false },
  { key: "underlyingStudy", locked: false },
  { key: "remarks", locked: false },
  { key: "raAttribution", locked: true },
  { key: "sebiRegistration", locked: true },
  { key: "contact", locked: false },
  { key: "email", locked: false },
  { key: "disclaimer", locked: true },
];

const ERRATA_FIELDS: TemplateFieldDefinition[] = [
  { key: "errataHeading", locked: true },
  { key: "publishedAt", locked: true },
  { key: "instrument", locked: true },
  { key: "symbol", locked: true },
  { key: "exchange", locked: false },
  { key: "action", locked: true },
  { key: "callType", locked: false },
  { key: "entry", locked: true },
  { key: "target1", locked: true },
  { key: "target2", locked: false },
  { key: "target3", locked: false },
  { key: "stopLoss1", locked: true },
  { key: "stopLoss2", locked: false },
  { key: "stopLoss3", locked: false },
  { key: "expiry", locked: false },
  { key: "timeHorizon", locked: true },
  { key: "errataReason", locked: true },
  { key: "raAttribution", locked: true },
  { key: "sebiRegistration", locked: true },
  { key: "contact", locked: false },
  { key: "email", locked: false },
  { key: "disclaimer", locked: true },
];

const FIELDS_BY_MESSAGE_TYPE: Record<
  ResearchCallMessageType,
  TemplateFieldDefinition[]
> = {
  NEW_CALL: NEW_CALL_FIELDS,
  ERRATA: ERRATA_FIELDS,
};

export interface ResearchCallTemplate {
  version: typeof RESEARCH_CALL_TEMPLATE_VERSION;
  blocks: Array<Record<string, unknown>>;
}

interface StoredTemplateRow {
  message_type: ResearchCallMessageType;
  template_version: number;
  template_data: unknown;
  updated_at: Date | string;
}

type Queryable = Pick<Pool | PoolClient, "query">;

const isRecord = (
  value: unknown
): value is Record<string, unknown> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value);

const normalizeCustomText = (value: string): string =>
  value
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export const isResearchCallMessageType = (
  value: unknown
): value is ResearchCallMessageType =>
  value === "NEW_CALL" || value === "ERRATA";

export const parseResearchCallTemplateSnapshot = (
  value: unknown,
  messageType: ResearchCallMessageType
): ResearchCallTemplate | null => {
  try {
    const parsed =
      typeof value === "string"
        ? (JSON.parse(value) as unknown)
        : value;

    return isValidResearchCallTemplate(
      parsed,
      messageType
    )
      ? parsed
      : null;
  } catch {
    return null;
  }
};

export const isValidResearchCallTemplate = (
  value: unknown,
  messageType: ResearchCallMessageType
): value is ResearchCallTemplate => {
  const definitions = FIELDS_BY_MESSAGE_TYPE[messageType];

  if (
    !isRecord(value) ||
    value.version !== RESEARCH_CALL_TEMPLATE_VERSION ||
    !Array.isArray(value.blocks) ||
    value.blocks.length < definitions.length ||
    value.blocks.length >
      MAX_RESEARCH_CALL_TEMPLATE_BLOCKS
  ) {
    return false;
  }

  const definitionsByKey = new Map(
    definitions.map((definition) => [
      definition.key,
      definition,
    ])
  );
  const ids = new Set<string>();
  const fieldKeys = new Set<string>();

  for (const candidate of value.blocks) {
    if (
      !isRecord(candidate) ||
      typeof candidate.id !== "string" ||
      typeof candidate.enabled !== "boolean" ||
      typeof candidate.locked !== "boolean" ||
      ids.has(candidate.id)
    ) {
      return false;
    }

    ids.add(candidate.id);

    if (candidate.type === "field") {
      if (
        typeof candidate.fieldKey !== "string" ||
        fieldKeys.has(candidate.fieldKey)
      ) {
        return false;
      }

      const definition = definitionsByKey.get(
        candidate.fieldKey
      );

      if (
        !definition ||
        candidate.id !== `field:${definition.key}` ||
        candidate.locked !== definition.locked ||
        (definition.locked && !candidate.enabled)
      ) {
        return false;
      }

      fieldKeys.add(candidate.fieldKey);
      continue;
    }

    if (
      candidate.type === "separator" &&
      candidate.locked === false
    ) {
      continue;
    }

    if (
      (candidate.type !== "text" &&
        candidate.type !== "heading") ||
      candidate.locked !== false ||
      typeof candidate.text !== "string"
    ) {
      return false;
    }

    const normalized = normalizeCustomText(candidate.text);
    if (
      normalized.length === 0 ||
      normalized.length >
        MAX_RESEARCH_CALL_CUSTOM_BLOCK_LENGTH
    ) {
      return false;
    }
  }

  return definitions.every((definition) =>
    fieldKeys.has(definition.key)
  );
};

export const getResearchCallTemplate = async (
  queryable: Queryable,
  raUserId: string,
  messageType: ResearchCallMessageType
): Promise<{
  template: ResearchCallTemplate;
  templateVersion: number;
  updatedAt: Date | string;
} | null> => {
  const result = await queryable.query<StoredTemplateRow>(
    `
      SELECT
        message_type,
        template_version,
        template_data,
        updated_at
      FROM ra_message_templates
      WHERE ra_user_id = $1
        AND message_type = $2
      LIMIT 1
    `,
    [raUserId, messageType]
  );

  const row = result.rows[0];
  if (
    !row ||
    !isValidResearchCallTemplate(
      row.template_data,
      messageType
    )
  ) {
    return null;
  }

  return {
    template: row.template_data,
    templateVersion: row.template_version,
    updatedAt: row.updated_at,
  };
};
