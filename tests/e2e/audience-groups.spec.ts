import { expect, test } from "@playwright/test";

const clientId = "00000000-0000-4000-8000-000000000011";
const brokerId = "00000000-0000-4000-8000-000000000012";
const groupId = "00000000-0000-4000-8000-000000000013";
const telegramId = "00000000-0000-4000-8000-000000000014";
const whatsappId = "00000000-0000-4000-8000-000000000015";

test("analyst creates a mixed platform and channel audience group", async ({ page }) => {
  let created = false;
  let submitted: any = null;
  await page.addInitScript(() => {
    localStorage.setItem("token", "ra-audience-test-token");
    localStorage.setItem("role", "RESEARCH_ANALYST");
  });
  await page.route("**/api/**", async route => {
    const url = new URL(route.request().url());
    const pathname = url.pathname.slice(url.pathname.indexOf("/api/"));
    if (pathname === "/api/auth/me") return route.fulfill({ json: { role: "RESEARCH_ANALYST" } });
    if (pathname === "/api/ra/dashboard/clients") return route.fulfill({ json: { clients: [] } });
    if (pathname === "/api/ra/dashboard/broker-requests") return route.fulfill({ json: [] });
    if (pathname === "/api/ra/dashboard/broker-connections") return route.fulfill({ json: [] });
    if (pathname === "/api/ra/dashboard/audience-groups/connections") {
      return route.fulfill({ json: {
        clients: [
          { id: clientId, name: "Client One", email: "client@example.test" },
          ...Array.from({ length: 7 }, (_, index) => ({
            id: `00000000-0000-4000-8000-00000000002${index}`,
            name: `Additional Client ${index + 1}`,
            email: `additional${index + 1}@example.test`,
          })),
        ],
        brokers: [{ id: brokerId, name: "Broker One", sebiRegistration: "INZ000000001" }],
        telegram: [{ id: telegramId, name: "Telegram One", entityType: "USER", channelDetail: "123456" }],
        whatsapp: [{ id: whatsappId, name: "WhatsApp One", channelDetail: "+919999999999" }],
      } });
    }
    if (pathname === "/api/ra/dashboard/audience-groups" && route.request().method() === "POST") {
      submitted = route.request().postDataJSON(); created = true;
      return route.fulfill({ status: 201, json: { success: true, groupId } });
    }
    if (pathname === "/api/ra/dashboard/audience-groups") {
      return route.fulfill({ json: { groups: created ? [{ id: groupId, name: "Priority Desk", description: "Priority distribution", createdAt: "2026-10-03", updatedAt: "2026-10-03", members: [{ type: "CLIENT", id: clientId, name: "Client One" }, { type: "BROKER", id: brokerId, name: "Broker One" }] }] : [] } });
    }
    return route.fulfill({ json: { success: true } });
  });

  await page.goto("/ra/clients#groups");
  await expect(page.getByRole("tab", { name: "Groups", exact: true })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("button", { name: "Create group", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Create audience group" });
  await dialog.getByLabel("Group name").fill("Priority Desk");
  await dialog.getByLabel("Description").fill("Priority distribution");
  await expect(dialog.getByRole("button", { name: "Go to page 2" })).toBeVisible();
  await dialog.getByLabel("Search clients").fill("Client One");
  await expect(dialog.getByText("1 of 8 available")).toBeVisible();
  await dialog.getByLabel(/Client One/).check();
  await dialog.getByRole("tab", { name: /^Brokers/ }).click();
  await dialog.getByLabel(/Broker One/).check();
  await dialog.getByRole("tab", { name: /^Telegram/ }).click();
  await dialog.getByLabel(/Telegram One/).check();
  await dialog.getByRole("tab", { name: /^WhatsApp/ }).click();
  await dialog.getByLabel(/WhatsApp One/).check();
  await dialog.getByRole("button", { name: "Save group", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Priority Desk" })).toBeVisible();
  expect(submitted).toMatchObject({
    name: "Priority Desk",
    members: [
      { type: "CLIENT", id: clientId },
      { type: "BROKER", id: brokerId },
      { type: "TELEGRAM", id: telegramId },
      { type: "WHATSAPP", id: whatsappId },
    ],
  });
});

test("publish preview requires and summarizes the selected audience groups", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("token", "ra-audience-test-token");
    localStorage.setItem("role", "RESEARCH_ANALYST");
  });

  await page.route("**/api/**", async route => {
    const url = new URL(route.request().url());
    const pathname = url.pathname.slice(url.pathname.indexOf("/api/"));
    if (pathname === "/api/auth/me") return route.fulfill({ json: { role: "RESEARCH_ANALYST" } });
    if (pathname === "/api/research/calls/my") return route.fulfill({ json: [] });
    if (pathname === "/api/research/ra/message-profile") {
      return route.fulfill({ json: { data: { salutation: "Mr", first_name: "Test", surname: "Analyst", org_name: "Tarkashh", sebi_reg_no: "INH000000001", mobile: "9999999999", email: "analyst@example.test" } } });
    }
    if (pathname === "/api/research/message-templates") return route.fulfill({ json: { data: {} } });
    if (pathname === "/api/ra/dashboard/audience-groups/connections") {
      return route.fulfill({ json: { clients: [{ id: clientId, name: "Client One" }], brokers: [{ id: brokerId, name: "Broker One" }] } });
    }
    if (pathname === "/api/ra/dashboard/audience-groups") {
      return route.fulfill({ json: { groups: [{ id: groupId, name: "Priority Desk", description: "", createdAt: "2026-10-03", updatedAt: "2026-10-03", members: [{ type: "CLIENT", id: clientId, name: "Client One" }, { type: "BROKER", id: brokerId, name: "Broker One" }] }] } });
    }
    return route.fulfill({ json: { success: true, data: [] } });
  });

  await page.goto("/recommendations");
  await expect(page.getByRole("button", { name: "Preview Message", exact: true })).toBeVisible();
  await page.evaluate(() => (window as any).populateForm());
  await page.getByRole("button", { name: "Preview Message", exact: true }).click();

  const dialog = page.getByRole("dialog", { name: "Research Call Message Preview" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Selected groups").check();
  await dialog.getByRole("combobox", { name: "Groups" }).click();
  await page.getByRole("option", { name: /Priority Desk/ }).click();
  await page.keyboard.press("Escape");
  await expect(dialog.getByText("1 clients, 1 brokers, 0 Telegram and 0 WhatsApp selected")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Publish Call", exact: true })).toBeEnabled();
});

test("errata preview preselects the original groups and allows changing them", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("token", "ra-audience-test-token");
    localStorage.setItem("role", "RESEARCH_ANALYST");
  });

  await page.route("**/api/**", async route => {
    const url = new URL(route.request().url());
    const pathname = url.pathname.slice(url.pathname.indexOf("/api/"));
    if (pathname === "/api/auth/me") return route.fulfill({ json: { role: "RESEARCH_ANALYST" } });
    if (pathname === "/api/research/calls/my") {
      return route.fulfill({ json: [{
        id: "00000000-0000-4000-8000-000000000099",
        status: "PUBLISHED", created_at: "2026-10-03T08:00:00.000Z", version_type: "ORIGINAL",
        exchange: "NSE", instrument: "STOCK", symbol: "TEST", name: "Test Limited",
        action: "BUY", call_type: "Cash", trade_type: "Short Term",
        entry: { ideal: "100", low: null, high: null }, targets: ["110"], stop_losses: ["95"],
        holding_period: "30 Days", rationale: "Breakout", underlying_study: "RSI + Volume Confirmation",
        audience_mode: "GROUPS", audience_groups_snapshot: [{ id: groupId, name: "Priority Desk" }],
      }] });
    }
    if (pathname === "/api/research/ra/message-profile") {
      return route.fulfill({ json: { data: { salutation: "Mr", first_name: "Test", surname: "Analyst", org_name: "Tarkashh", sebi_reg_no: "INH000000001", mobile: "9999999999", email: "analyst@example.test" } } });
    }
    if (pathname === "/api/research/message-templates") return route.fulfill({ json: { data: {} } });
    if (pathname === "/api/ra/dashboard/audience-groups/connections") {
      return route.fulfill({ json: { clients: [{ id: clientId, name: "Client One" }], brokers: [], telegram: [], whatsapp: [] } });
    }
    if (pathname === "/api/ra/dashboard/audience-groups") {
      return route.fulfill({ json: { groups: [{ id: groupId, name: "Priority Desk", description: "", createdAt: "2026-10-03", updatedAt: "2026-10-03", members: [{ type: "CLIENT", id: clientId, name: "Client One" }] }] } });
    }
    return route.fulfill({ json: { success: true, data: [] } });
  });

  await page.goto("/recommendations");
  await page.getByRole("button", { name: "Modify/Errata", exact: true }).click();
  await page.getByPlaceholder("Research Analyst's Remarks").fill("Correcting the target");
  await page.getByPlaceholder("Research Analyst's Remarks").blur();
  await page.getByRole("button", { name: "Preview Errata", exact: true }).click();

  const dialog = page.getByRole("dialog", { name: "Errata Message Preview" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Selected groups")).toBeChecked();
  await expect(dialog.getByRole("combobox", { name: "Groups" })).toContainText("Priority Desk");
  await expect(dialog.getByText("1 clients, 0 brokers, 0 Telegram and 0 WhatsApp selected")).toBeVisible();
});
