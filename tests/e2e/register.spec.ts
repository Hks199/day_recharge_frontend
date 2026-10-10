import { test, expect } from "@playwright/test";
import { fixtures } from "./fixtures";

test("Tenant registration requires that tenant's support contact", async ({
  page,
}) => {
  await fixtures(page, "RETAILER");
  await page.goto("http://127.0.0.1:5179/register");
  await expect(page).toHaveTitle("Create Account | Connected Recharge");
  await expect(
    page.getByRole("button", { name: "Request Account Access" }),
  ).toBeEnabled();
  await page.route("**/api/public/tenant-config", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        name: "Connected Recharge",
        features: [],
        support: {},
      }),
    }),
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Request Account Access" }),
  ).toBeDisabled();
  await expect(
    page.getByText("Support email has not been configured.", { exact: false }),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText("dayrecharge@gmail.com");
});

test("Register page matches the responsive auth layout and stays local", async ({
  page,
}) => {
  test.setTimeout(60000);
  await fixtures(page);
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).hostname.endsWith("dayrecharge.com"))
      externalRequests.push(request.url());
  });
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/register");
    await expect(
      page.getByRole("heading", { name: "Create Account", exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("Full name")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `docs/screenshots/register-${width}.png`,
      fullPage: true,
    });
  }
  await page.getByRole("link", { name: "Terms", exact: true }).click();
  await expect(page).toHaveURL(/\/terms$/);
  await expect(
    page.getByRole("heading", { name: "Terms & Conditions", exact: true }),
  ).toBeVisible();
  await page.goBack();
  await page.getByRole("link", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole("link", { name: "Register now" }).click();
  await expect(page).toHaveURL(/\/register$/);
  expect(externalRequests).toEqual([]);
});

test("Account request validates details and opens an email draft without creating an account", async ({
  page,
}) => {
  await fixtures(page);
  await page.goto("/register");
  await page.evaluate(() => {
    window.open = (url?: string | URL) => {
      document.body.dataset.emailDraft = String(url);
      return null;
    };
  });
  const posts: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") posts.push(request.url());
  });
  const submit = page.getByRole("button", { name: "Request Account Access" });
  await submit.click();
  await expect(page.getByText("Enter your full name.")).toBeVisible();
  await expect(page.getByText("Select your preferred role.")).toBeVisible();
  expect(
    await page.locator("body").getAttribute("data-email-draft"),
  ).toBeNull();
  await page.getByLabel("Full name").fill("Asha Sharma");
  await page.getByLabel("Mobile number").fill("9876543210");
  await page.getByLabel("Email address").fill("asha@example.com");
  await page.getByLabel("Preferred role").selectOption("RETAILER");
  await submit.click();
  await expect(page.getByRole("status")).toContainText(
    "No account has been created yet",
  );
  const draft = decodeURIComponent(
    (await page.locator("body").getAttribute("data-email-draft"))!,
  );
  expect(draft).toContain("mailto:dayrecharge@gmail.com");
  expect(draft).toContain("Full name: Asha Sharma");
  expect(draft).toContain("Preferred role: Retailer");
  expect(draft).not.toContain("password");
  expect(posts).toEqual([]);
});
