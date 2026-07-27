import { expect, test } from "@playwright/test";

const plans = [
  {
    id: "plan-basic",
    planCode: "RA_BASIC",
    displayName: "Basic",
    description: "Essential tools for an independent Research Analyst.",
    audienceType: "RA",
    tierCode: "BASIC",
    pricePaise: 49900,
    currency: "INR",
    durationDays: 30,
    planVersion: 1,
    features: [
      {
        key: "RA_RESEARCH_CALLS",
        displayName: "Research calls",
        description: null,
        enabled: true,
        value: true,
      },
    ],
    limits: [
      {
        key: "RA_RESEARCH_CALLS_PER_MONTH",
        displayName: "Monthly research calls",
        value: 25,
        unlimited: false,
      },
    ],
  },
  {
    id: "plan-pro",
    planCode: "RA_PRO",
    displayName: "Professional",
    description: "Higher limits for growing advisory practices.",
    audienceType: "RA",
    tierCode: "PRO",
    pricePaise: 99900,
    currency: "INR",
    durationDays: 30,
    planVersion: 1,
    features: [
      {
        key: "RA_RESEARCH_CALLS",
        displayName: "Research calls",
        description: null,
        enabled: true,
        value: true,
      },
    ],
    limits: [
      {
        key: "RA_RESEARCH_CALLS_PER_MONTH",
        displayName: "Monthly research calls",
        value: 100,
        unlimited: false,
      },
    ],
  },
];

test("login page visual contract", async ({ page }) => {
  await page.goto("/login");
  await expect(
    page.getByRole("button", { name: /^login$/i })
  ).toBeVisible();

  await expect(page).toHaveScreenshot("login-page.png", {
    fullPage: true,
  });
});

test("RA subscription plans visual contract", async ({ page }) => {
  await page.route(
    "http://localhost:3000/api/subscription-plans?audienceType=RA",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ plans }),
      });
    }
  );

  await page.addInitScript(() => {
    sessionStorage.setItem(
      "registration_application_id",
      "application-test"
    );
    sessionStorage.setItem(
      "registration_token",
      "registration-token-test"
    );
    sessionStorage.setItem(
      "registration_token_expires_at",
      "2099-01-01T00:00:00.000Z"
    );
    sessionStorage.setItem("registration_audience_type", "RA");
  });

  await page.goto("/registration/subscription");
  await expect(page.getByText("Professional")).toBeVisible();
  await expect(page.getByText("Basic")).toBeVisible();

  await expect(page).toHaveScreenshot(
    "ra-subscription-plans.png",
    { fullPage: true }
  );
});
