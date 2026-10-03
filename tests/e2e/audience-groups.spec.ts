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
        clients: [{ id: clientId, name: "Client One", email: "client@example.test" }],
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
  await dialog.getByLabel(/Client One/).check();
  await dialog.getByLabel(/Broker One/).check();
  await dialog.getByLabel(/Telegram One/).check();
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
