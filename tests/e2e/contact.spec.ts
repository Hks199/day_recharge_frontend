import { test, expect } from "@playwright/test";
import { fixtures } from "./fixtures";

test("Contact page matches the layout and stays local across screen sizes", async ({
  page,
}) => {
  test.setTimeout(60000);
  await fixtures(page);
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).hostname === "dayrecharge.com")
      externalRequests.push(request.url());
  });
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Footer company" })
    .getByRole("link", { name: "Contact", exact: true })
    .click();
  await expect(page).toHaveURL(/\/contactus$/);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/contactus");
    await expect(
      page.getByRole("heading", { name: "Contact Us", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Ravi Shankar Nagar Korba Chhattisgarh Pin - 495677", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByLabel("Your Name")).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
    await page.evaluate(() =>
      window.scrollTo({ left: 200, behavior: "instant" }),
    );
    expect(await page.evaluate(() => window.scrollX)).toBe(0);
    expect(
      await page
        .locator("a")
        .evaluateAll((links) =>
          links
            .map((a) => (a as HTMLAnchorElement).href)
            .filter(
              (href) =>
                href.startsWith("http") &&
                new URL(href).origin !== location.origin,
            ),
        ),
    ).toEqual([]);
    await page.screenshot({
      path: `docs/screenshots/contact-${width}.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  const navigation = page.getByRole("navigation", { name: "Main navigation" });
  await expect(
    navigation.getByRole("link", { name: "Home", exact: true }),
  ).toBeVisible();
  await expect(
    navigation.getByRole("link", { name: "About", exact: true }),
  ).toBeVisible();
  await navigation.getByRole("link", { name: "Terms", exact: true }).click();
  await expect(page).toHaveURL(/\/terms$/);
  await expect(
    page.getByRole("heading", { name: "Terms & Conditions", exact: true }),
  ).toBeVisible();
  await page.goBack();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await navigation.getByRole("link", { name: "Login to your account" }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(externalRequests).toEqual([]);
});

test("Contact form validates input and prepares an email without submitting to the reference site", async ({
  page,
}) => {
  await fixtures(page);
  await page.addInitScript(() => {
    window.open = (url) => {
      document.body.dataset.emailDraft = String(url);
      return null;
    };
  });
  await page.goto("/contactus");
  await page.getByRole("button", { name: "Send Message", exact: true }).click();
  await expect(
    page.getByText("Enter your name.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Enter a valid email address.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Enter your message.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Your Name").fill("Asha Sharma");
  await page.getByLabel("Email Address").fill("asha@example.com");
  await page
    .getByLabel("Message", { exact: true })
    .fill("Please help me access my business workspace.");
  await page.getByRole("button", { name: "Send Message", exact: true }).click();
  const draft = await page.locator("body").getAttribute("data-email-draft");
  expect(draft).toBeTruthy();
  const email = new URL(draft!);
  expect(email.protocol).toBe("mailto:");
  expect(email.pathname).toBe("dayrecharge@gmail.com");
  expect(email.searchParams.get("subject")).toContain("Asha Sharma");
  expect(email.searchParams.get("body")).toContain("asha@example.com");
  expect(email.searchParams.get("body")).toContain(
    "Please help me access my business workspace.",
  );
  await expect(page.getByRole("status")).toContainText(
    "Continue in your email app",
  );
  await expect(page).toHaveURL(/\/contactus$/);
});
