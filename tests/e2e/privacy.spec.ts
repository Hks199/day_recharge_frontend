import { test, expect } from "@playwright/test";
import { fixtures } from "./fixtures";

test("Privacy page is responsive and loads without reference-site requests", async ({
  page,
}) => {
  test.setTimeout(60000);
  await fixtures(page);
  const external: string[] = [];
  const errors: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).hostname.endsWith("dayrecharge.com"))
      external.push(request.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/privacy");
    await expect(page).toHaveTitle("Privacy Policy | Day Recharge");
    await expect(
      page.getByRole("heading", { name: "Privacy Policy", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".terms-section")).toHaveCount(5);
    await expect(
      page.getByRole("heading", { name: "1. Information We Collect" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "5. Contact" }),
    ).toBeVisible();
    await expect(page.locator("time")).toHaveAttribute(
      "datetime",
      "2026-10-10",
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
    await page.evaluate(() =>
      window.scrollTo({ left: 200, behavior: "instant" }),
    );
    expect(await page.evaluate(() => window.scrollX)).toBe(0);
    await page.screenshot({
      path: `docs/screenshots/privacy-${width}.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Terms", exact: true })
    .click();
  await expect(page).toHaveURL(/\/terms$/);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test("Footer and registration Privacy links open the local page with a working contact link", async ({
  page,
}) => {
  await fixtures(page);
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Footer company" })
    .getByRole("link", { name: "Privacy Policy" })
    .click();
  await expect(page).toHaveURL(/\/privacy$/);
  await page
    .getByRole("navigation", { name: "Footer legal" })
    .getByRole("link", { name: "Privacy", exact: true })
    .click();
  await expect(page).toHaveURL(/\/privacy$/);
  await page.getByRole("link", { name: "Contact page", exact: true }).click();
  await expect(page).toHaveURL(/\/contactus$/);
  await page.goto("/register");
  await page.getByRole("link", { name: "Privacy Policy", exact: true }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(
    page.getByRole("heading", { name: "Privacy Policy", exact: true }),
  ).toBeVisible();
  expect(await page.getByRole("dialog").count()).toBe(0);
});
