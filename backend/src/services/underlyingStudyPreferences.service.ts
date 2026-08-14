import { pool } from "../db";
import { UNDERLYING_STUDY_VALUE_SET } from "../constants/underlyingStudyValues";

const MAX_SUBMITTED_STUDIES = 20;
const MAX_UNDERLYING_STUDY_LENGTH = 255;
const STUDY_VALUE_PATTERN = /^[a-z0-9_]{1,100}$/;

const STUDY_LABEL_ALIASES: Record<string, string> = {
  average_directional_index_adx: "adx",
  average_true_range_atr: "atr",
  chande_momentum_oscillator: "cmo",
  commodity_channel_index: "cci",
  detrended_price_oscillator: "dpo",
  directional_movement_index: "dmi",
  fibonacci_retracements_extensions: "fibonacci_retracements",
  linear_regression_indicator: "linear_regression",
  moving_average_ma: "ma",
  displaced_ma_dma: "dma",
  exponential_ma_ema: "ema",
  hull_ma_hma: "hma",
  simple_ma_sma: "sma",
  weighted_ma_wma: "wma",
  wilder_ma_wwma: "wwma",
  money_flow_index: "mfi",
  momentum_indicator: "momentum",
  negative_volume_index: "nvi",
  on_balance_volume: "obv",
  parabolic_sar: "psar",
  relative_strength_index_rsi: "rsi",
  stochastic_oscillator: "stochastic",
  williams_r: "williams_percent_r",
  discussions_about_indicators: "indicator_discussions",
};

export type StudyPreference = {
  value: string;
  selectionCount: number;
  lastSelectedAt: string;
};

export type StudyPersonalization = {
  recent: StudyPreference[];
  frequent: StudyPreference[];
};

const parseStudyValues = (input: unknown): unknown[] => {
  if (Array.isArray(input)) return input;

  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return input.split(",");
    }
  }

  return [];
};

const valueFromStudyLabel = (label: string): string => {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return STUDY_LABEL_ALIASES[slug] || slug;
};

export const validateUnderlyingStudySubmission = ({
  studyText,
  studyValues,
  required,
}: {
  studyText: unknown;
  studyValues: unknown;
  required: boolean;
}): { valid: true; text: string | null; values: string[] } | {
  valid: false;
  message: string;
} => {
  const text = typeof studyText === "string" ? studyText.trim() : "";
  const labels = text
    ? text.split(",").map((label) => label.trim()).filter(Boolean)
    : [];
  const rawValues = parseStudyValues(studyValues);

  if (!text && rawValues.length === 0) {
    return required
      ? { valid: false, message: "Underlying Study is required." }
      : { valid: true, text: null, values: [] };
  }

  if (text.length > MAX_UNDERLYING_STUDY_LENGTH) {
    return {
      valid: false,
      message: `Underlying Study must not exceed ${MAX_UNDERLYING_STUDY_LENGTH} characters.`,
    };
  }

  if (rawValues.length === 0 || rawValues.length > MAX_SUBMITTED_STUDIES) {
    return {
      valid: false,
      message: `Select between 1 and ${MAX_SUBMITTED_STUDIES} underlying studies.`,
    };
  }

  if (rawValues.some((value) => typeof value !== "string")) {
    return { valid: false, message: "Underlying Study contains an invalid selection." };
  }

  const values = rawValues.map((value) => String(value).trim().toLowerCase());
  const uniqueValues = Array.from(new Set(values));

  if (
    uniqueValues.length !== values.length ||
    values.some(
      (value) =>
        !STUDY_VALUE_PATTERN.test(value) ||
        !UNDERLYING_STUDY_VALUE_SET.has(value)
    )
  ) {
    return { valid: false, message: "Underlying Study contains an invalid selection." };
  }

  if (
    labels.length !== values.length ||
    labels.some((label, index) => valueFromStudyLabel(label) !== values[index])
  ) {
    return {
      valid: false,
      message: "Underlying Study labels do not match the selected values.",
    };
  }

  return { valid: true, text: labels.join(", "), values };
};

export const normalizeStudyValues = (
  input: unknown
): string[] => {
  const values = parseStudyValues(input);

  return Array.from(
    new Set(
      values
        .filter(
          (value): value is string =>
            typeof value === "string"
        )
        .map((value) =>
          value.trim().toLowerCase()
        )
        .filter((value) =>
          STUDY_VALUE_PATTERN.test(value) &&
          UNDERLYING_STUDY_VALUE_SET.has(value)
        )
    )
  ).slice(0, MAX_SUBMITTED_STUDIES);
};

export const recordUnderlyingStudySelections =
  async ({
    raUserId,
    studyValues,
  }: {
    raUserId: string;
    studyValues: unknown;
  }): Promise<void> => {
    const normalized =
      normalizeStudyValues(studyValues);

    if (normalized.length === 0) {
      return;
    }

    await pool.query(
      `
        INSERT INTO
          ra_underlying_study_preferences (
            ra_user_id,
            study_value,
            selection_count,
            last_selected_at
          )
        SELECT
          $1,
          selected.study_value,
          1,
          NOW()
        FROM UNNEST($2::text[]) AS selected(
          study_value
        )
        ON CONFLICT (
          ra_user_id,
          study_value
        )
        DO UPDATE SET
          selection_count =
            ra_underlying_study_preferences
              .selection_count + 1,
          last_selected_at = NOW(),
          updated_at = NOW()
      `,
      [raUserId, normalized]
    );
  };

const mapPreference = (
  row: Record<string, unknown>
): StudyPreference => ({
  value: String(row.study_value),
  selectionCount: Number(
    row.selection_count
  ),
  lastSelectedAt: String(
    row.last_selected_at
  ),
});

export const getUnderlyingStudyPersonalization =
  async (
    raUserId: string
  ): Promise<StudyPersonalization> => {
    const [recentResult, frequentResult] =
      await Promise.all([
        pool.query(
          `
            SELECT
              study_value,
              selection_count,
              last_selected_at
            FROM
              ra_underlying_study_preferences
            WHERE ra_user_id = $1
            ORDER BY
              last_selected_at DESC,
              study_value ASC
            LIMIT 5
          `,
          [raUserId]
        ),
        pool.query(
          `
            SELECT
              study_value,
              selection_count,
              last_selected_at
            FROM
              ra_underlying_study_preferences
            WHERE ra_user_id = $1
            ORDER BY
              selection_count DESC,
              last_selected_at DESC,
              study_value ASC
            LIMIT 5
          `,
          [raUserId]
        ),
      ]);

    return {
      recent:
        recentResult.rows.map(mapPreference),
      frequent:
        frequentResult.rows.map(
          mapPreference
        ),
    };
  };
