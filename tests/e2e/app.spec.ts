import { test, expect } from "@playwright/test";
import { fixtures, ids, login } from "./fixtures";
import type { Role } from "../../src/types/contracts";
test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) =>
    console.error("Browser runtime error:", error.message),
  );
  page.on("console", (message) => {
    if (message.type() === "error")
      console.error("Browser console error:", message.text());
  });
});
test("Landing and login across phone, tablet, and desktop widths", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await fixtures(page);
  for (const width of [320, 360, 390, 640, 768, 900, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Power Your Business/ }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.evaluate(() =>
      window.scrollTo({ left: 200, behavior: "instant" }),
    );
    expect(await page.evaluate(() => window.scrollX)).toBe(0);
    await page.screenshot({
      path: `docs/screenshots/landing-${width}.png`,
      fullPage: true,
    });
    await page.goto("/login");
    await expect(page.getByLabel("Email address")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `docs/screenshots/login-${width}.png`,
      fullPage: true,
    });
  }
  expect(errors).toEqual([]);
});
test("Home actions use local routes and reference images load locally", async ({
  page,
}) => {
  await fixtures(page);
  const referenceRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).hostname.endsWith("dayrecharge.com"))
      referenceRequests.push(request.url());
  });
  await page.goto("/");
  await expect(page.locator(".home-benefit")).toHaveCount(6);
  await expect(page.locator(".home-role")).toHaveCount(3);
  await page.locator(".home-services").scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      page
        .locator(".home-service img")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  await page
    .getByRole("link", { name: "Get Started Now", exact: true })
    .click();
  await expect(page).toHaveURL(/\/register$/);
  await page.goto("/");
  await page
    .getByRole("link", { name: "Login to Dashboard", exact: true })
    .click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/");
  await page.getByRole("link", { name: "Talk to Sales", exact: true }).click();
  await expect(page).toHaveURL(/\/contactus$/);
  expect(referenceRequests).toEqual([]);
});
test("Landing mobile navigation, service links, and terms work on a phone", async ({
  page,
}) => {
  await fixtures(page);
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/");
  const menu = page.getByRole("button", { name: /^(Open|Close) navigation$/ });
  const navigation = page.getByRole("navigation", { name: "Main navigation" });
  await expect(navigation).toBeHidden();
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await expect(navigation).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    360,
  );
  await page.evaluate(() =>
    window.scrollTo({ left: 200, behavior: "instant" }),
  );
  expect(await page.evaluate(() => window.scrollX)).toBe(0);
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await expect(navigation).toBeHidden();
  await menu.click();
  await navigation.getByRole("link", { name: "Terms", exact: true }).click();
  await expect(page).toHaveURL(/\/terms$/);
  await expect(
    page.getByRole("heading", { name: "Terms & Conditions", exact: true }),
  ).toBeVisible();
  await page.goBack();
  const cards = page.locator(".lp-service");
  await expect(cards).toHaveCount(6);
  for (const card of await cards.all()) {
    const box = await card.boundingBox();
    expect(box?.x).toBeGreaterThanOrEqual(0);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(360);
  }
  await cards.first().click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel("Email address")).toBeVisible();
});
for (const [role, root, paths] of [
  [
    "DEVELOPER",
    "platform",
    [
      "tenants",
      "plans",
      "subscriptions",
      "providers",
      "operators",
      "audit",
      "settings",
      "funding",
    ],
  ],
  [
    "SUPER_ADMIN",
    "admin",
    [
      "users",
      "wallet",
      "transfers",
      "funding",
      "transactions",
      "commissions",
      "rules",
      "domains",
      "settings",
      "support",
      "notifications",
    ],
  ],
  [
    "DISTRIBUTOR",
    "distributor",
    [
      "users",
      "wallet",
      "transfers",
      "funding",
      "transactions",
      "commissions",
      "support",
      "notifications",
    ],
  ],
  [
    "RETAILER",
    "retailer",
    [
      "payments",
      "wallet",
      "transfers",
      "funding",
      "transactions",
      "commissions",
      "support",
      "notifications",
    ],
  ],
] as const) {
  test(`${role} login, page navigation, profile, responsive shell and reload`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await fixtures(page, role as Role);
    await login(page, role as Role);
    for (const path of paths) {
      await page
        .getByRole("navigation", { name: "Workspace", exact: true })
        .getByRole("link", {
          name: {
            users: "Business network",
            wallet: "Wallet & ledger",
            transfers: "Transfers",
            funding: "Funding requests",
            transactions: "Transactions",
            commissions: "Commission records",
            rules: "Commission rules",
            domains: "Custom domains",
            settings: "Settings",
            support: "Support tickets",
            notifications: "Notifications",
            payments: "Recharge & bills",
            tenants: "Businesses",
            plans: "Subscription plans",
            subscriptions: "Subscriptions",
            providers: "Providers",
            operators: "Create operator",
            audit: "Audit trail",
          }[path],
        })
        .click();
      await expect(page.locator(".loading")).toHaveCount(0);
      await expect(page.locator(".error-panel")).toHaveCount(0);
    }
    await page
      .getByRole("navigation", { name: "Workspace", exact: true })
      .getByRole("link", { name: "My account" })
      .click();
    await expect(
      page.getByRole("heading", { name: "My account" }),
    ).toBeVisible();
    await page.setViewportSize({ width: 360, height: 800 });
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(
      page.getByRole("navigation", { name: "Workspace", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("navigation", { name: "Workspace", exact: true })
      .getByRole("link", { name: "Overview" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Good to see you, Asha." }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `docs/screenshots/${root}-mobile.png`,
      fullPage: true,
    });
    await page.reload();
    await expect(page).toHaveURL(/login/);
    expect(errors).toEqual([]);
  });
}
test("Retailer recharge returns accepted/pending and receipt is backend-derived", async ({
  page,
}) => {
  await fixtures(page, "RETAILER", "PROCESSING");
  await login(page, "RETAILER");
  await page
    .getByRole("link", { name: "Recharge & bills", exact: true })
    .click();
  await page.getByLabel("Operator", { exact: true }).selectOption(ids.operator);
  await page.getByLabel("Mobile / customer account").fill("9876543210");
  await page.getByLabel("Recharge amount (₹)").fill("100.00");
  await page.getByRole("button", { name: "Review recharge" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("₹100.00");
  let key = "";
  page.on("request", (req) => {
    if (req.method() === "POST" && req.url().endsWith("/api/recharges"))
      key = req.headers()["idempotency-key"];
  });
  await page.getByRole("button", { name: "Confirm & submit" }).click();
  await expect(
    page.getByRole("heading", { name: "Transaction details" }),
  ).toBeVisible();
  await expect(page.getByText(/Accepted for processing/)).toBeVisible();
  expect(key).toMatch(/^[\w.-]{8,128}$/);
});
test("Retailer bill payment uses exact inquiry amount and bill ID", async ({
  page,
}) => {
  await fixtures(page, "RETAILER");
  await login(page, "RETAILER");
  await page
    .getByRole("link", { name: "Recharge & bills", exact: true })
    .click();
  await page.getByRole("button", { name: "Electricity", exact: true }).click();
  await page.getByLabel("Operator", { exact: true }).selectOption(ids.plan);
  await page.getByLabel("Mobile / customer account").fill("ELEC12345");
  await page.getByRole("button", { name: "Fetch bill" }).click();
  await expect(page.getByText("BILL-123")).toBeVisible();
  await page.getByRole("button", { name: "Review bill payment" }).click();
  const submitted = page.waitForRequest(
    (r) => r.method() === "POST" && r.url().endsWith("/api/bill-payments"),
  );
  await page.getByRole("button", { name: "Confirm & submit" }).click();
  const request = await submitted;
  expect(request.postDataJSON()).toEqual({
    serviceType: "ELECTRICITY",
    operatorId: ids.plan,
    account: "ELEC12345",
    amountMinor: 10000,
    billId: ids.other,
  });
});
test("Unknown, suspended, subscription, and origin errors fail closed", async ({
  page,
}) => {
  for (const [code, text] of [
    ["UNKNOWN_OR_UNVERIFIED_DOMAIN", /unknown or has not been verified/],
    ["TENANT_SUSPENDED", /business is suspended/],
    ["SUBSCRIPTION_INACTIVE", /subscription is inactive/],
    ["ORIGIN_NOT_ALLOWED", /origin is not allowed/],
  ] as const) {
    await page.route("**/api/public/tenant-config", (r) =>
      r.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ error: { code }, requestId: "domain-error" }),
      }),
    );
    await page.goto("http://127.0.0.1:5179/");
    await expect(page.getByText(text)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Power everyday/ }),
    ).toHaveCount(0);
    await page.unroute("**/api/public/tenant-config");
  }
});
