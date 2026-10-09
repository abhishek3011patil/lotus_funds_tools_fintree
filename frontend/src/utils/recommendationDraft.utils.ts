const RECOMMENDATION_DRAFT_PREFIX = "raRecommendationDraft:v1";

export type RecommendationDraft<TForm> = {
  version: 1;
  form: TForm;
  stockInput: string;
  isErrataMode: boolean;
  errataSourceId: string | null;
  audienceMode: "ALL_CONNECTED" | "GROUPS";
  selectedAudienceGroupIds: string[];
  savedAt: string;
};

export const getRecommendationDraftStorageKey = (username: string | null) =>
  `${RECOMMENDATION_DRAFT_PREFIX}:${encodeURIComponent(username?.trim() || "current-ra")}`;

export const loadRecommendationDraft = <TForm>(
  storage: Pick<Storage, "getItem">,
  key: string
): RecommendationDraft<TForm> | null => {
  try {
    const rawDraft = storage.getItem(key);
    if (!rawDraft) return null;

    const draft = JSON.parse(rawDraft) as Partial<RecommendationDraft<TForm>>;
    if (
      draft.version !== 1 ||
      !draft.form ||
      typeof draft.form !== "object" ||
      typeof draft.stockInput !== "string" ||
      typeof draft.isErrataMode !== "boolean" ||
      (draft.errataSourceId !== null && typeof draft.errataSourceId !== "string") ||
      (draft.audienceMode !== "ALL_CONNECTED" && draft.audienceMode !== "GROUPS") ||
      !Array.isArray(draft.selectedAudienceGroupIds)
    ) {
      return null;
    }

    return draft as RecommendationDraft<TForm>;
  } catch {
    return null;
  }
};

export const saveRecommendationDraft = <TForm>(
  storage: Pick<Storage, "setItem">,
  key: string,
  draft: Omit<RecommendationDraft<TForm>, "version" | "savedAt">
) => {
  try {
    storage.setItem(
      key,
      JSON.stringify({
        ...draft,
        version: 1,
        savedAt: new Date().toISOString(),
      } satisfies RecommendationDraft<TForm>)
    );
  } catch {
    // Draft persistence is best effort (for example, storage can be disabled).
  }
};

export const clearRecommendationDraft = (
  storage: Pick<Storage, "removeItem">,
  key: string
) => {
  try {
    storage.removeItem(key);
  } catch {
    // Keep reset and successful submission usable when storage is unavailable.
  }
};
