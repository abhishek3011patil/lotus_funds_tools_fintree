import { expect, test, type Page } from "@playwright/test";

const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64");
const profile = { first_name: "Ananya", surname: "Research", email: "analyst@example.test", profile_image: "existing.png" };
async function setup(page: Page, role: string) {
  const mutations: { path: string; body: string }[] = [];
  await page.addInitScript(role => { localStorage.setItem("token", "picture-test-token"); localStorage.setItem("role", role); }, role);
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    let json: unknown = { success: true, data: [], participants: [], history: [], plans: [] };
    if (path.endsWith("/auth/me")) json = { role };
    if (path.endsWith("/registration/profile") || path.endsWith("/registration/ra/test-ra")) json = { data: profile };
    if (["PUT", "POST"].includes(route.request().method())) {
      mutations.push({ path, body: route.request().postDataBuffer()?.toString("latin1") || "" });
      json = { profileImage: "saved.jpg", message: "Saved" };
    }
    await route.fulfill({ json });
  });
  await page.route("**/uploads/**", route => route.fulfill({ contentType: "image/png", body: png }));
  return mutations;
}

async function choosePicture(page: Page) {
  const data = await page.evaluate(() => {
    const canvas = document.createElement("canvas"); canvas.width = 800; canvas.height = 600;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createLinearGradient(0, 0, 800, 600); gradient.addColorStop(0, "#5271ff"); gradient.addColorStop(1, "#fbbf24");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(400, 230, 100, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(220, 370, 360, 230);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page.getByLabel("Choose profile picture").setInputFiles({ name: "portrait.png", mimeType: "image/png", buffer: Buffer.from(data, "base64") });
  const dialog = page.getByRole("dialog", { name: "Adjust profile picture" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByAltText("Avatar preview")).toBeVisible();
  return dialog;
}

test("admin crops a picture at the top and saves it with the RA registration", async ({ page }, testInfo) => {
  const mutations = await setup(page, "ADMIN");
  await page.goto("/admin/edit/RA/test-ra");
  await expect(page.getByRole("region", { name: "Profile picture" })).toBeVisible();
  await expect(page.getByText("Upload Profile Image", { exact: true })).toHaveCount(0);
  const dialog = await choosePicture(page);
  await dialog.getByRole("slider", { name: "Picture zoom" }).focus(); await page.keyboard.press("ArrowRight");
  await dialog.getByRole("button", { name: "Rotate", exact: true }).click();
  await dialog.getByRole("button", { name: "Flip", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Flip", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({ path: testInfo.outputPath("picture-editor.png") });
  await dialog.getByRole("button", { name: "Use picture" }).click();
  await expect(page.getByText("Ready to submit", { exact: true })).toBeVisible();
  await expect.poll(() => page.getByAltText("Ananya Research profile picture").evaluate((img: HTMLImageElement) => [img.naturalWidth, img.naturalHeight])).toEqual([512, 512]);
  expect(mutations).toHaveLength(0);
  await page.getByRole("button", { name: "Save Changes", exact: true }).click();
  await expect.poll(() => mutations.length).toBe(1);
  expect(mutations[0].path).toContain("/edit/ra/test-ra");
  expect(mutations[0].body).toContain('filename="profile-picture.jpg"');
  expect(mutations[0].body).toContain("Content-Type: image/jpeg");
});

test("RA saves a picture immediately, keeps other edits pending, and can retry a failed save", async ({ page }) => {
  const mutations = await setup(page, "RESEARCH_ANALYST");
  await page.goto("/ra/profile/edit");
  await page.getByLabel("FIRST NAME", { exact: true }).fill("Updated name");
  const dialog = await choosePicture(page);
  await page.route("**/api/registration/profile-picture", route => route.fulfill({ status: 500, json: { message: "Please retry saving" } }), { times: 1 });
  await dialog.getByRole("button", { name: "Save picture" }).click();
  await expect(dialog.getByText("Please retry saving", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Save picture" }).click();
  await expect(page.getByText("Profile picture updated successfully.")).toBeVisible();
  expect(mutations).toHaveLength(1);
  expect(mutations[0].path).toContain("/profile-picture");
  expect(mutations[0].body).not.toContain('name="first_name"');
  await expect(page.getByLabel("FIRST NAME", { exact: true })).toHaveValue("Updated name");
  await page.getByRole("button", { name: "Send Request", exact: true }).click();
  await expect.poll(() => mutations.length).toBe(2);
  expect(mutations[1].path).toContain("/profile-update-request");
  expect(mutations[1].body).toContain('name="first_name"');
  expect(mutations[1].body).not.toContain('name="profile_image"');
});

test("rejects invalid images and cancelling the crop leaves the original picture intact", async ({ page }) => {
  const mutations = await setup(page, "RESEARCH_ANALYST");
  await page.goto("/ra/profile/edit");
  await page.getByLabel("Choose profile picture").setInputFiles({ name: "document.pdf", mimeType: "application/pdf", buffer: Buffer.from("not an image") });
  await expect(page.getByText("Choose a JPG, PNG, or WebP image.")).toBeVisible();
  const dialog = await choosePicture(page);
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  expect(mutations).toHaveLength(0);
  await expect(page.getByAltText("Ananya Research profile picture")).toBeVisible();
});

test("RA can update the picture directly at the top of Settings", async ({ page }, testInfo) => {
  const mutations = await setup(page, "RESEARCH_ANALYST");
  await page.goto("/settings");
  await expect(page.getByRole("region", { name: "Profile picture" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  const dialog = await choosePicture(page);
  await dialog.getByRole("button", { name: "Reset", exact: true }).click();
  await dialog.getByRole("button", { name: "Save picture" }).click();
  await expect(page.getByText("Profile picture updated successfully.")).toBeVisible();
  expect(mutations).toHaveLength(1);
  expect(mutations[0].path).toContain("/profile-picture");
  await expect(dialog).not.toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("settings-profile-picture.png"), animations: "disabled" });
});
