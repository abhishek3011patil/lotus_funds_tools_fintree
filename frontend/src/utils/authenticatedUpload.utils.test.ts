import { describe, expect, it, vi } from "vitest";
import {
  openAuthenticatedUploads,
  uploadedFileNames,
} from "./authenticatedUpload.utils";

describe("uploadedFileNames", () => {
  it("normalizes stored filenames, upload paths, URLs, and arrays", () => {
    expect(
      uploadedFileNames([
        "sebi.pdf",
        "/uploads/nism.pdf",
        "https://example.test/uploads/pan%20card.pdf?download=1",
      ])
    ).toEqual(["sebi.pdf", "nism.pdf", "pan card.pdf"]);
  });

  it("supports legacy comma-separated document values", () => {
    expect(uploadedFileNames("one.pdf, uploads/two.pdf")).toEqual([
      "one.pdf",
      "two.pdf",
    ]);
  });
});

describe("openAuthenticatedUploads", () => {
  it("opens the tab before awaiting the authenticated download", async () => {
    const calls: string[] = [];
    const replace = vi.fn();
    const openWindow = vi.fn(() => {
      calls.push("open");
      return { location: { replace }, close: vi.fn() } as unknown as Window;
    });
    const fetchImpl = vi.fn(async () => {
      calls.push("fetch");
      return new Response(new Blob(["document"]), { status: 200 });
    });
    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:document");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);

    await openAuthenticatedUploads("/uploads/sebi.pdf", {
      apiBaseUrl: "http://localhost:3000",
      token: "token",
      fetchImpl,
      openWindow,
    });

    expect(calls).toEqual(["open", "fetch"]);
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://localhost:3000/uploads/sebi.pdf",
      { headers: { Authorization: "Bearer token" } }
    );
    expect(replace).toHaveBeenCalledWith("blob:document");
    createObjectURL.mockRestore();
  });
});
