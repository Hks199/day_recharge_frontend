import { test, expect } from "@playwright/test";
import { fixtures, ids, login } from "./fixtures";

test("Uncertain payment retries preserve exact payload and idempotency reference", async ({
  page,
}) => {
  await fixtures(page, "RETAILER", "PROCESSING");
  await login(page, "RETAILER");
  await page
    .getByRole("link", { name: "Recharge & bills", exact: true })
    .click();
  await page.getByLabel("Operator", { exact: true }).selectOption(ids.operator);
  await page.getByLabel("Mobile / customer account").fill("9876549999");
  await page.getByLabel("Recharge amount (₹)").fill("123.45");
  await page.getByRole("button", { name: "Review recharge" }).click();
  const requests: { key: string; body: unknown }[] = [];
  await page.route(
    (url) => url.pathname === "/api/recharges",
    async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      requests.push({
        key: route.request().headers()["idempotency-key"],
        body: route.request().postDataJSON(),
      });
      if (requests.length === 1) return route.abort("failed");
      return route.fulfill({
        status: 202,
        contentType: "application/json",
        body: JSON.stringify({
          _id: ids.transaction,
          userId: ids.user,
          operatorId: ids.operator,
          serviceType: "MOBILE",
          amountMinor: 12345,
          status: "PENDING",
        }),
      });
    },
  );
  await page.getByRole("button", { name: "Confirm & submit" }).dblclick();
  await expect(
    page.getByRole("heading", { name: "Outcome not yet confirmed" }),
  ).toBeVisible();
  expect(requests).toHaveLength(1);
  await page.getByRole("button", { name: "Retry same intent" }).click();
  await expect(
    page.getByRole("heading", { name: "Transaction details" }),
  ).toBeVisible();
  expect(requests).toHaveLength(2);
  expect(requests[0]).toEqual(requests[1]);
  expect(requests[0].body).toMatchObject({
    amountMinor: 12345,
    account: "9876549999",
  });
  expect(
    await page.evaluate(() =>
      Object.keys(sessionStorage).filter((k) =>
        k.startsWith("recharge-intent:"),
      ),
    ),
  ).toHaveLength(0);
});

test("Admin funding requests do not offer self approval", async ({ page }) => {
  await fixtures(page, "SUPER_ADMIN");
  await login(page, "SUPER_ADMIN");
  await page
    .getByRole("link", { name: "Funding requests", exact: true })
    .click();
  await expect(page.getByText("Awaiting authorized approval")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Approve", exact: true }),
  ).toHaveCount(0);
});

test("Distributor can create Retailers and cannot open payment submission", async ({
  page,
}) => {
  await fixtures(page, "DISTRIBUTOR");
  await login(page, "DISTRIBUTOR");
  await page
    .getByRole("link", { name: "Business network", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Distributor", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Retailer", exact: true }).click();
  await page.getByLabel("Full name", { exact: true }).fill("New Retailer");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("new@example.com");
  await page.getByLabel("Phone number", { exact: true }).fill("9876543210");
  await page
    .getByLabel("Initial password", { exact: true })
    .fill("a-secure-initial-password");
  const request = page.waitForRequest(
    (r) => r.method() === "POST" && r.url().endsWith("/api/users/retailers"),
  );
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  expect((await request).postDataJSON()).toEqual({
    name: "New Retailer",
    email: "new@example.com",
    phone: "9876543210",
    password: "a-secure-initial-password",
  });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  // SPA transition retains memory-only auth and exercises the guard, unlike a full reload.
  await page.evaluate(() => {
    window.history.pushState({}, "", "/distributor/payments");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(
    page.getByRole("heading", { name: "This page is outside your role." }),
  ).toBeVisible();
});

test("Tenant provisioning uses nested owner and selected plan", async ({
  page,
}) => {
  await fixtures(page, "DEVELOPER");
  await login(page, "DEVELOPER");
  await page.getByRole("link", { name: "Businesses", exact: true }).click();
  await page
    .getByRole("button", { name: "Provision business", exact: true })
    .click();
  await page.getByLabel("Business name", { exact: true }).fill("New Recharge");
  await page.getByLabel("Unique slug", { exact: true }).fill("new-recharge");
  await page
    .getByLabel("Subscription plan", { exact: true })
    .selectOption(ids.plan);
  await page
    .getByLabel("Owner full name", { exact: true })
    .fill("Business Owner");
  await page
    .getByLabel("Owner email address", { exact: true })
    .fill("owner@example.com");
  await page
    .getByLabel("Owner phone number", { exact: true })
    .fill("9876543210");
  await page
    .getByLabel("Owner initial password", { exact: true })
    .fill("a-secure-owner-password");
  const request = page.waitForRequest(
    (r) => r.method() === "POST" && r.url().endsWith("/api/platform/tenants"),
  );
  await page
    .getByRole("button", { name: "Provision business & owner" })
    .click();
  expect((await request).postDataJSON()).toEqual({
    name: "New Recharge",
    slug: "new-recharge",
    planId: ids.plan,
    owner: {
      name: "Business Owner",
      email: "owner@example.com",
      phone: "9876543210",
      password: "a-secure-owner-password",
    },
  });
});

test("Login in another tab requires reauthentication in the previous tab", async ({
  page,
  context,
}) => {
  await fixtures(page, "RETAILER");
  await login(page, "RETAILER");
  const other = await context.newPage();
  await fixtures(other, "RETAILER");
  await login(other, "RETAILER");
  await expect(page).toHaveURL(/login\?reason=session/);
  await expect(page.getByText(/Your session ended/)).toBeVisible();
  await other.close();
});

test("Failed server logout is clearly reported after local cleanup", async ({
  page,
}) => {
  await fixtures(page, "RETAILER");
  await login(page, "RETAILER");
  await page.route(
    (url) => url.pathname === "/api/auth/logout",
    (route) => route.abort("failed"),
  );
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(
    page.getByText(/Server session revocation could not be confirmed/),
  ).toBeVisible();
});

for (const status of ["SUCCESS", "FAILED", "REFUNDED"] as const) {
  test(`Receipt presents backend ${status} faithfully`, async ({ page }) => {
    await fixtures(page, "RETAILER", status);
    await login(page, "RETAILER");
    await page
      .getByRole("navigation", { name: "Workspace", exact: true })
      .getByRole("link", { name: "Transactions", exact: true })
      .click();
    await page
      .getByRole("link", { name: ids.transaction, exact: true })
      .click();
    await expect(page.locator(".receipt .badge")).toHaveText(status);
    await expect(page.getByText("MOCK-123")).toBeVisible();
    if (status === "REFUNDED")
      await expect(
        page.getByText("The backend confirms that this payment was refunded."),
      ).toBeVisible();
  });
}
