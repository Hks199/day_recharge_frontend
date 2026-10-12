import { test, expect } from "@playwright/test";
import { fixtures, login } from "./fixtures";
import { websiteFixture } from "../fixtures/website";

test("Editor fields have clear locations, searchable names, and a responsive layout", async ({
  page,
}) => {
  await fixtures(page);
  await login(page, "DEVELOPER");
  await page.getByRole("link", { name: "Public website", exact: true }).click();
  await expect(page.getByLabel("Business name", { exact: true })).toBeVisible();
  await expect(
    page.getByLabel("Business address", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /View public page/ }),
  ).toHaveAttribute("href", "/contactus");
  for (const name of [
    "Home page",
    "About us",
    "Contact page",
    "Terms & conditions",
    "Privacy policy",
    "Header & navigation",
    "Footer",
    "Login & registration",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    const labels = await page
      .locator(".website-editor-fields label")
      .allTextContents();
    expect(labels.length).toBeGreaterThan(0);
    expect(
      labels.every(
        (label) =>
          !/^(h[1-6]|text|p|span|title|to|src|Link)$/.test(label.trim()),
      ),
    ).toBe(true);
    await expect(page.locator(".website-editor")).not.toContainText(
      "home.h1.53",
    );
  }
  await page.getByRole("button", { name: "Home page", exact: true }).click();
  await page.getByLabel("Find a field in this section").fill("main headline");
  await expect(page.locator(".website-editor-section")).toHaveCount(1);
  await page
    .getByLabel("Main headline", { exact: true })
    .fill("Clear and understandable");
  await page
    .getByLabel("Find a field in this section")
    .fill("missing-field-name");
  await expect(page.getByText(/No fields match/)).toBeVisible();
  await page.getByRole("button", { name: "clear the search" }).click();
  await expect(page.getByLabel("Main headline", { exact: true })).toHaveValue(
    "Clear and understandable",
  );
  await page
    .getByRole("button", { name: "Terms & conditions", exact: true })
    .click();
  await expect(
    page.getByLabel("Last updated date", { exact: true }),
  ).toHaveCount(1);
  await expect(
    page.getByLabel("Formatted update date", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Brand & contact details", exact: true })
    .click();
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    if (width === 390) await expect.poll(async () => {
      const box = await page.locator(".sidebar").boundingBox();
      return box ? box.x + box.width : 0;
    }).toBeLessThanOrEqual(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "docs/screenshots/website-editor-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "docs/screenshots/website-editor-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
});

test("Tenant website editor saves to tenant APIs and shows field names for validation errors", async ({
  page,
}) => {
  await fixtures(page, "SUPER_ADMIN");
  let website = websiteFixture(false);
  let rejectSave = true;
  await page.route("**/api/tenant/website", async (route) => {
    if (route.request().method() === "PATCH") {
      if (rejectSave)
        return route.fulfill({
          status: 400,
          json: {
            error: {
              code: "VALIDATION_ERROR",
              issues: [
                {
                  path: ["values", "about.h2.11"],
                  message: "Please enter a shorter heading.",
                },
              ],
            },
          },
        });
      website = { ...website, ...route.request().postDataJSON(), revision: 1 };
    }
    await route.fulfill({ json: website });
  });
  await login(page, "SUPER_ADMIN");
  await page.getByRole("link", { name: "Public website", exact: true }).click();
  await page.getByRole("button", { name: "About us", exact: true }).click();
  await page
    .getByLabel("Company story heading", { exact: true })
    .fill("Our tenant story");
  await page.getByRole("button", { name: "Save website" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "About us: Company story heading",
  );
  await expect(page.getByRole("alert")).not.toContainText("about.h2.11");
  await expect(
    page.getByLabel("Company story heading", { exact: true }),
  ).toHaveValue("Our tenant story");
  rejectSave = false;
  await page.getByRole("button", { name: "Save website" }).click();
  await expect(page.getByRole("status")).toContainText("Website saved");
  expect(website.values["about.h2.11"]).toBe("Our tenant story");
});

test("One logo uploads to S3 and publishes only when the owner saves", async ({
  page,
}) => {
  await fixtures(page);
  let website = websiteFixture();
  const imageUrl = "https://images.example.test/website/platform/test.png";
  let uploads = 0;
  await page.route("**/api/platform/public/website", (route) =>
    route.fulfill({ json: website }),
  );
  await page.route("**/api/platform/website", async (route) => {
    if (route.request().method() === "PATCH") {
      const input = route.request().postDataJSON();
      expect(input.brand.authLogo).toBeUndefined();
      website = { ...website, ...input, revision: 1 };
    }
    await route.fulfill({ json: website });
  });
  await page.route("**/api/platform/website/images/upload", async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      field: "logo",
      contentType: "image/png",
      size: 8,
    });
    await route.fulfill({
      json: {
        url: "https://test-images.s3.ap-south-1.amazonaws.com/",
        fields: { key: "website/platform/test.png", Policy: "test-policy" },
        publicUrl: imageUrl,
        expiresIn: 120,
      },
    });
  });
  await page.route(
    "https://test-images.s3.ap-south-1.amazonaws.com/",
    async (route) => {
      uploads++;
      expect(route.request().headers().authorization).toBeUndefined();
      expect(route.request().headers()["content-type"]).toContain(
        "multipart/form-data",
      );
      await route.fulfill({
        status: 204,
        headers: { "Access-Control-Allow-Origin": "http://localhost:5179" },
      });
    },
  );
  await page.route(imageUrl, (route) =>
    route.fulfill({
      status: 200,
      contentType: "image/png",
      body: Buffer.from("89504e470d0a1a0a", "hex"),
    }),
  );
  await login(page, "DEVELOPER");
  await page.getByRole("link", { name: "Public website", exact: true }).click();
  await expect(
    page.getByLabel("Login logo image URL", { exact: true }),
  ).toHaveCount(0);
  const oldLogo = website.brand.logo;
  await page.getByLabel("Upload logo", { exact: true }).setInputFiles({
    name: "logo.png",
    mimeType: "image/png",
    buffer: Buffer.from("89504e470d0a1a0a", "hex"),
  });
  await expect(page.getByLabel("Logo", { exact: true })).toHaveValue(imageUrl);
  expect(uploads).toBe(1);
  expect(website.brand.logo).toBe(oldLogo);
  await page.getByRole("button", { name: "Save website" }).click();
  await expect(
    page.getByText("Website saved. Public pages now use your updated content."),
  ).toBeVisible();
  expect(website.brand.logo).toBe(imageUrl);
  await page.goto("/login");
  await expect(page.locator(".login-brand img")).toHaveAttribute(
    "src",
    imageUrl,
  );
});

test("Missing S3 settings preserve the existing logo and explain how to configure uploads", async ({
  page,
}) => {
  await fixtures(page);
  await page.route("**/api/platform/website/images/upload", (route) =>
    route.fulfill({
      status: 503,
      json: { error: { code: "IMAGE_STORAGE_NOT_CONFIGURED" } },
    }),
  );
  await login(page, "DEVELOPER");
  await page.getByRole("link", { name: "Public website", exact: true }).click();
  const oldLogo = await page.getByLabel("Logo", { exact: true }).inputValue();
  await page.getByLabel("Upload logo", { exact: true }).setInputFiles({
    name: "logo.png",
    mimeType: "image/png",
    buffer: Buffer.from("89504e470d0a1a0a", "hex"),
  });
  await expect(page.getByRole("alert")).toContainText("S3_REGION");
  await expect(page.getByLabel("Logo", { exact: true })).toHaveValue(oldLogo);
  await expect(
    page.getByRole("button", { name: "Save website" }),
  ).toBeDisabled();
});

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
  await page.getByRole("button", { name: "Home page", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Main headline", exact: true })
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
