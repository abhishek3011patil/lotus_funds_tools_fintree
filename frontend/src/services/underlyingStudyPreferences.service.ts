export type StudyPreferenceRecord = {
  value: string;
  selectionCount: number;
  lastSelectedAt: string;
};

export type StudyPreferencesResponse = {
  success: boolean;
  data: {
    recent: StudyPreferenceRecord[];
    frequent: StudyPreferenceRecord[];
  };
};

export const fetchUnderlyingStudyPreferences =
  async (
    token: string
  ): Promise<
    StudyPreferencesResponse["data"]
  > => {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/research/underlying-studies/preferences`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        "Unable to load study preferences"
      );
    }

    const result =
      (await response.json()) as
        StudyPreferencesResponse;

    return result.data;
  };