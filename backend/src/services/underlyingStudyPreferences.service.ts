import { pool } from "../db";
import { UNDERLYING_STUDY_VALUE_SET } from "../constants/underlyingStudyValues";

const MAX_SUBMITTED_STUDIES = 20;
const STUDY_VALUE_PATTERN = /^[a-z0-9_]{1,100}$/;

export type StudyPreference = {
  value: string;
  selectionCount: number;
  lastSelectedAt: string;
};

export type StudyPersonalization = {
  recent: StudyPreference[];
  frequent: StudyPreference[];
};

export const normalizeStudyValues = (
  input: unknown
): string[] => {
  let values: unknown = input;

  // Multipart requests send arrays as JSON strings.
  if (typeof input === "string") {
    try {
      values = JSON.parse(input);
    } catch {
      values = input.split(",");
    }
  }

  if (!Array.isArray(values)) {
    return [];
  }

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
