import { expect, test } from "@playwright/test";

const token = "a".repeat(64);
const ra = { id: "00000000-0000-4000-8000-000000000001", name: "Ananya Research", sebiRegistration: "INH000001234", category: "Equity", registrationExpiry: "2028-12-31", status: "ACTIVE", onboardingMethod: "EXISTING" };

test.beforeEach(async ({ page }) => {
  let linked = false;
  await page.addInitScript(() => {
    localStorage.setItem("token", "broker-test-token");
    localStorage.setItem("role", "BROKER");
  });
  await page.route("**/api/**", async route => {
    const url = new URL(route.request().url());
    const pathname = url.pathname.slice(url.pathname.indexOf("/api/"));
    let json: unknown = {};
    if (pathname === "/api/auth/me") json = { role: "BROKER" };
    if (pathname === "/api/broker/research-analysts") {
      if (route.request().method() === "POST") { linked = true; json = { message: "Added" }; }
      else json = linked ? [ra] : [];
    }
    if (pathname === "/api/broker/research-analysts/search") json = linked ? [] : [ra];
    if (pathname === `/api/broker/research-analysts/${ra.id}` && route.request().method() === "DELETE") {
      linked = false;
      await route.fulfill({ status: 204 });
      return;
    }
    if (pathname === "/api/broker/ra-invitations") json = { registrationPath: `/registration?brokerInvite=${token}`, expiresAt: "2026-09-29T10:00:00Z", emailSent: Boolean(route.request().postDataJSON()?.sendEmail) };
    if (pathname === `/api/broker/ra-invitations/${token}`) json = { brokerName: "Test Brokerage", email: null };
    if (pathname === "/api/broker/research-calls") json = linked ? [{ date_time: "2026-09-22T09:00:00Z", action: "BUY", exchange: "NSE", type: "Cash", category: "Intraday", instrument: "Example equity", symbol: "TESTCALL", entry: 100, status: "PUBLISHED", researcher_name: ra.name }] : [];
    await route.fulfill({ json });
  });
});

test("adds an existing RA and shows their calls in the performance table", async ({ page }) => {
  const unscoped: string[] = [];
  page.on("request", request => { if (/\/api\/(history|researchers)/.test(request.url())) unscoped.push(request.url()); });
  await page.goto("/broker/research-analysts");
  await page.getByRole("button", { name: "Add Research Analyst", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: /^Add here/ })).toBeVisible();
  await expect(dialog.getByRole("button", { name: /^Send registration link/ })).toBeVisible();
  await dialog.getByRole("button", { name: /^Add existing RA/ }).click();
  await dialog.getByLabel("Name or SEBI registration").fill("Ananya");
  await dialog.getByRole("button", { name: "Search", exact: true }).click();
  await dialog.getByRole("button", { name: "Add Ananya Research", exact: true }).click();
  await expect(page.getByRole("table").getByText(ra.name)).toBeVisible();
  await page.goto("/broker/research-calls");
  await expect(page.getByRole("cell", { name: "TESTCALL", exact: true })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Researcher Name" })).toBeVisible();
  await page.getByLabel("Search calls, symbols or Research Analysts").fill("missing");
  await expect(page.getByText("No records found", { exact: true })).toBeVisible();
  expect(unscoped).toEqual([]);
});

test("confirms removal, hides associated calls, and allows adding the RA again", async ({ page }) => {
  const addExisting = async () => {
    await page.getByRole("button", { name: "Add Research Analyst", exact: true }).click();
    await page.getByRole("button", { name: /^Add existing RA/ }).click();
    await page.getByLabel("Name or SEBI registration").fill("Ananya");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await page.getByRole("button", { name: "Add Ananya Research", exact: true }).click();
    await expect(page.getByRole("table").getByText(ra.name)).toBeVisible();
  };
  await page.goto("/broker/research-analysts");
  await addExisting();
  await page.getByRole("button", { name: "Remove Ananya Research", exact: true }).click();
  const confirm = page.getByRole("dialog", { name: "Remove Research Analyst?" });
  await confirm.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("table").getByText(ra.name)).toBeVisible();
  await page.getByRole("button", { name: "Remove Ananya Research", exact: true }).click();
  // A failed API request keeps the association visible and allows retrying.
  await page.route(`**/api/broker/research-analysts/${ra.id}`, route => route.fulfill({ status: 500, json: { message: "Removal unavailable" } }), { times: 1 });
  await confirm.getByRole("button", { name: "Remove RA", exact: true }).click();
  await expect(confirm.getByText("Removal unavailable", { exact: true })).toBeVisible();
  await expect(page.getByRole("table", { includeHidden: true }).getByText(ra.name)).toBeVisible();
  await confirm.getByRole("button", { name: "Remove RA", exact: true }).click();
  await expect(confirm).toHaveCount(0);
  await expect(page.getByRole("table").getByText(ra.name)).toHaveCount(0);
  await page.goto("/broker/research-calls");
  await expect(page.getByText(/No published calls yet/)).toBeVisible();
  await expect(page.getByRole("cell", { name: "TESTCALL", exact: true })).toHaveCount(0);
  await page.goto("/broker/research-analysts");
  await addExisting();
  await page.goto("/broker/research-calls");
  await expect(page.getByRole("cell", { name: "TESTCALL", exact: true })).toBeVisible();
});

test("opens the registration form with broker association", async ({ page }) => {
  await page.goto("/broker/research-analysts");
  await page.getByRole("button", { name: "Add Research Analyst", exact: true }).click();
  await page.getByRole("button", { name: /^Add here/ }).click();
  await expect(page).toHaveURL(new RegExp(`brokerInvite=${token}`));
  await expect(page.getByText(/Registering with Test Brokerage/)).toBeVisible();
});

test("generates and emails registration links", async ({ page }) => {
  await page.goto("/broker/research-analysts");
  await page.getByRole("button", { name: "Add Research Analyst", exact: true }).click();
  await page.getByRole("button", { name: /^Send registration link/ }).click();
  await page.getByRole("button", { name: "Generate link", exact: true }).click();
  await expect(page.getByLabel("Registration link", { exact: true })).toHaveValue(new RegExp(`brokerInvite=${token}`));
  await page.getByLabel("RA email address").fill("ra@example.test");
  await page.getByRole("button", { name: "Send link by email", exact: true }).click();
  await expect(page.getByText("Registration link sent by email.", { exact: true })).toBeVisible();
  await page.screenshot({ path: `tmp/broker-onboarding-${test.info().project.name}.png`, fullPage: true });
});

test("shows API errors without sample calls and rejects expired invitations", async ({ page }) => {
  await page.route("**/api/broker/research-calls", route => route.fulfill({ status: 500, json: { message: "Calls unavailable" } }));
  await page.goto("/broker/research-calls");
  await expect(page.getByText("Calls unavailable", { exact: true })).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
  await page.route(`**/api/broker/ra-invitations/${token}`, route => route.fulfill({ status: 410, json: { message: "Registration link expired" } }));
  await page.goto(`/registration?brokerInvite=${token}`);
  await expect(page.getByText("Registration link expired", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save & Continue", exact: true })).toHaveCount(0);
});
