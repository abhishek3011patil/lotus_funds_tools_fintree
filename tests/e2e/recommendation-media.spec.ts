import { expect, test } from "@playwright/test";

const attachment = (name: string, mimeType: string) => ({ url: `/uploads/${name}`, name, mimeType, size: 1024 });
const media = [attachment("chart.png", "image/png"), attachment("second.png", "image/png"), attachment("report.pdf", "application/pdf"), attachment("analysis.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")];
const row = { date_time: "2026-09-17T09:00:00Z", action: "BUY", exchange: "NSE", type: "Cash", category: "Intraday", instrument: "Test recommendation", entry: 100, status: "PUBLISHED", researcher_name: "Test analyst" };

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("token", "media-test-token");
    localStorage.setItem("role", "RESEARCH_ANALYST");
  });
  await page.route("**/api/**", async route => {
    const requestPath = new URL(route.request().url()).pathname;
    const pathname = requestPath.slice(requestPath.indexOf("/api/"));
    let json: any = { success: true, count: 0, data: {} };
    if (pathname === "/api/auth/me") json = { role: "RESEARCH_ANALYST" };
    if (pathname === "/api/research/calls/my" || pathname === "/api/researchers" || pathname.includes("instruments")) json = [];
    if (pathname.includes("underlying-studies/preferences")) json = { data: { recent: [], frequent: [] } };
    if (pathname === "/api/performance") json = { metrics: { total: 3, active: 3, accuracy: 0, strike: 0, rr: null, exited: 0, profit: 0, adverse: 0, sl: 0, early: 0, last: [] } };
    if (pathname === "/api/history/all") json = [
      { ...row, symbol: "MULTI", attachments: media, file_url: "C:\\backend\\uploads\\chart.png" },
      { ...row, symbol: "LEGACY", attachments: [], file_url: "C:\\backend\\uploads\\old chart.png" },
      { ...row, symbol: "EMPTY", attachments: [], file_url: null },
    ];
    await route.fulfill({ json });
  });
  await page.route("**/uploads/**", route => route.fulfill({
    contentType: "image/svg+xml",
    headers: { "Access-Control-Allow-Origin": "*" },
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="200"><rect width="500" height="200" fill="#f1f5f9"/><text x="20" y="40" font-family="sans-serif" font-size="18">Test research chart</text><path d="M20 170 L120 110 L200 140 L300 70 L460 40" stroke="#16a34a" fill="none" stroke-width="4"/></svg>',
  }));
});

test("recommendation picker adds, removes and validates multiple attachments", async ({ page }) => {
  await page.goto("/recommendations");
  const input = page.getByLabel("Recommendation attachments");
  const fixture = (name: string, mimeType = "image/png", size = 16) => ({ name, mimeType, buffer: Buffer.alloc(size) });
  await input.setInputFiles([fixture("chart.png"), fixture("report.pdf", "application/pdf")]);
  await expect(page.getByRole("button", { name: "Upload Media (2/10)", exact: true })).toBeVisible();
  await input.setInputFiles([fixture("second.png")]);
  await expect(page.getByRole("button", { name: "Upload Media (3/10)", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Remove chart.png", exact: true }).click();
  await expect(page.getByRole("button", { name: "Remove chart.png", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Remove report.pdf", exact: true })).toBeVisible();
  await input.setInputFiles([fixture("unsafe.html", "text/html")]);
  await expect(page.getByRole("alert")).toContainText("supported file type");
  await input.setInputFiles([fixture("huge.pdf", "application/pdf", 5 * 1024 * 1024 + 1)]);
  await expect(page.getByRole("alert")).toContainText("5 MB per file");
  await input.setInputFiles(Array.from({ length: 9 }, (_, i) => fixture(`extra-${i}.png`)));
  await expect(page.getByRole("alert")).toContainText("up to 10 files");
  await expect(page.getByRole("button", { name: "Upload Media (2/10)", exact: true })).toBeVisible();
});

test("performance viewer shows all attachments and keeps legacy media available", async ({ page }, testInfo) => {
  await page.goto("/performance");
  await expect(page.getByRole("row").filter({ hasText: "EMPTY" }).getByText("No media")).toBeVisible();
  await page.getByRole("button", { name: "View media for MULTI (4 files)", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: "View Image", exact: true })).toHaveCount(2);
  await expect(dialog.getByRole("button", { name: /^Open / })).toHaveCount(4);
  for (const file of media) {
    const fileRequest = page.waitForRequest(request => new URL(request.url()).pathname === `/uploads/${encodeURIComponent(file.name)}`);
    const popupOpened = page.waitForEvent("popup");
    await dialog.getByRole("button", { name: `Open ${file.name}`, exact: true }).click();
    expect((await fileRequest).headers().authorization).toBe("Bearer media-test-token");
    const popup = await popupOpened;
    await expect(popup).toHaveURL(/^blob:/);
    await popup.close();
  }
  await expect(dialog).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("media-gallery.png"), animations: "disabled" });
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "View media for LEGACY (1 file)", exact: true }).click();
  const legacyRequest = page.waitForRequest(request => new URL(request.url()).pathname === "/uploads/old%20chart.png");
  const legacyPopupOpened = page.waitForEvent("popup");
  await dialog.getByRole("button", { name: "Open old chart.png", exact: true }).click();
  expect((await legacyRequest).headers().authorization).toBe("Bearer media-test-token");
  const legacyPopup = await legacyPopupOpened;
  await expect(legacyPopup).toHaveURL(/^blob:/);
  await legacyPopup.close();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});
