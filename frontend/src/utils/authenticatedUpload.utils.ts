export type UploadedFileValue = string | string[] | null | undefined;

export const uploadedFileNames = (value: UploadedFileValue): string[] => {
  const values = Array.isArray(value) ? value : value ? value.split(",") : [];

  return values
    .map((entry) => {
      const withoutQuery = String(entry).trim().split(/[?#]/, 1)[0];
      const basename = withoutQuery.replace(/\\/g, "/").split("/").pop() || "";

      try {
        return decodeURIComponent(basename).trim();
      } catch {
        return basename.trim();
      }
    })
    .filter(Boolean);
};

type OpenAuthenticatedUploadsOptions = {
  apiBaseUrl: string;
  token: string;
  fetchImpl?: typeof fetch;
  openWindow?: typeof window.open;
};

/**
 * Opens the tab immediately, while the click still has browser user activation,
 * and then loads the authenticated response into it. Waiting until after fetch
 * causes Chrome and Safari to treat the tab as an unsolicited popup.
 */
export const openAuthenticatedUploads = async (
  value: UploadedFileValue,
  {
    apiBaseUrl,
    token,
    fetchImpl = fetch,
    openWindow = window.open.bind(window),
  }: OpenAuthenticatedUploadsOptions
): Promise<void> => {
  const filenames = uploadedFileNames(value);
  if (filenames.length === 0) throw new Error("File not uploaded");

  const tabs = filenames.map((filename) => ({
    filename,
    tab: openWindow("about:blank", "_blank"),
  }));

  if (tabs.some(({ tab }) => !tab)) {
    tabs.forEach(({ tab }) => tab?.close());
    throw new Error("Please allow pop-ups for this site to view uploaded files.");
  }

  await Promise.all(
    tabs.map(async ({ filename, tab }) => {
      try {
        const response = await fetchImpl(
          `${apiBaseUrl}/uploads/${encodeURIComponent(filename)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "The uploaded file is missing from storage."
              : response.status === 401 || response.status === 403
                ? "You are not authorized to view this file."
                : "Unable to open the uploaded file."
          );
        }

        const objectUrl = URL.createObjectURL(await response.blob());
        tab!.location.replace(objectUrl);
        globalThis.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      } catch (error) {
        tab?.close();
        throw error;
      }
    })
  );
};
