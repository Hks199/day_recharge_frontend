import { test, expect } from "@playwright/test";
import { fixtures, login } from "./fixtures";
import { websiteFixture } from "../fixtures/website";

test("Login keeps public content mounted while clearing private session data", async ({
  page,
}) => {
  await fixtures(page, "RETAILER");
  let publicReads = 0;
  await page.route("**/api/public/website", (route) => {
    publicReads++;
    return route.fulfill({ json: websiteFixture(false) });
  });
  await page.goto("http://127.0.0.1:5179/login");
  await page.getByLabel("Email address").fill("asha@example.com");
  await page
    .getByLabel("Password", { exact: true })
    .fill("test-account-password");
  const readsBeforeLogin = publicReads;
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Good to see you, Asha." }),
  ).toBeVisible();
  expect(publicReads).toBe(readsBeforeLogin);
});

test("Backend content controls the public pages, shared navigation, logo and support on mobile", async ({
  page,
}) => {
  await fixtures(page);
  const website = websiteFixture();
  website.brand.name = "Custom Business";
  website.brand.logo = "/images/recharge.png";
  website.brand.address = "42 Dynamic Street";
  website.brand.support.email = "dynamic@example.com";
  Object.assign(website.values, {
    "home.h1.53": "A custom recharge business",
    "about.h2.11": "Our backend story",
    "navigation.label.4": "Our story",
    "terms.text.2": "Custom terms for {{brand}}.",
    "privacy.text.2": "Custom privacy statement.",
    "footer.p.3": "<script>window.attacked = true</script>",
  });
  await page.route("**/api/platform/public/website", (route) =>
    route.fulfill({ json: website }),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [path, text] of [
    ["/", "A custom recharge business"],
    ["/aboutus", "Our backend story"],
    ["/contactus", "42 Dynamic Street"],
    ["/terms", "Custom terms for Custom Business."],
    ["/privacy", "Custom privacy statement."],
  ]) {
    await page.goto(path);
    await expect(page.locator("main")).toContainText(text);
    await expect(page.locator(".marketing-header img")).toHaveAttribute(
      "src",
      "/images/recharge.png",
    );
    await expect(page.locator(".dr-footer-logo")).toHaveAttribute(
      "src",
      "/images/recharge.png",
    );
    await expect(page.locator(".dr-footer")).toContainText(
      "<script>window.attacked = true</script>",
    );
    await expect(
      page.locator('.dr-footer a[href="mailto:dynamic@example.com"]'),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(await page.evaluate(() => "attacked" in window)).toBe(false);
  }
});

test("Website editor publishes a validated payload and updates public content immediately", async ({
  page,
}) => {
  await fixtures(page);
  let website = websiteFixture();
  await page.route("**/api/platform/public/website", (route) =>
    route.fulfill({ json: website }),
  );
  await page.route("**/api/platform/website", async (route) => {
    if (route.request().method() === "PATCH") {
      const input = route.request().postDataJSON();
      expect(input.fields).toBeUndefined();
      expect(input.revision).toBe(0);
      website = { ...website, ...input, revision: 1 };
    }
    await route.fulfill({ json: website });
  });
  await login(page, "DEVELOPER");
  await page.getByRole("link", { name: "Public website", exact: true }).click();
  await page
    .getByLabel("Business name", { exact: true })
    .fill("Edited Business");
  await page.getByRole("button", { name: "home", exact: true }).click();
  await page
    .getByRole("textbox", { name: /Power Your Business/ })
    .fill("Published by the owner");
  await page.getByRole("button", { name: "Save website" }).click();
  await expect(page.getByRole("status")).toContainText("Website saved");
  expect(website.brand.name).toBe("Edited Business");
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Published by the owner",
  );
});

test("A save conflict preserves the draft and offers a reload", async ({
  page,
}) => {
  await fixtures(page);
  await login(page, "DEVELOPER");
  await page.route("**/api/platform/website", (route) =>
    route.request().method() === "PATCH"
      ? route.fulfill({
          status: 409,
          json: { error: { code: "WEBSITE_VERSION_CONFLICT" } },
        })
      : route.fulfill({ json: websiteFixture() }),
  );
  await page.getByRole("link", { name: "Public website", exact: true }).click();
  await page.getByLabel("Business name", { exact: true }).fill("Unsaved draft");
  await page.getByRole("button", { name: "Save website" }).click();
  await expect(page.getByRole("alert")).toContainText("Another administrator");
  await expect(page.getByLabel("Business name", { exact: true })).toHaveValue(
    "Unsaved draft",
  );
  await page.getByRole("button", { name: "Reload latest version" }).click();
  await expect(page.getByLabel("Business name", { exact: true })).toHaveValue(
    "Day Recharge",
  );
});
