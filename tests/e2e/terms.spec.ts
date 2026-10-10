import { test, expect } from "@playwright/test";
import { fixtures } from "./fixtures";

test("Terms page supports both URLs and stays responsive and local", async ({
  page,
}) => {
  test.setTimeout(60000);
  await fixtures(page);
  const external: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).hostname.endsWith("dayrecharge.com"))
      external.push(request.url());
  });
  await page.goto("/term");
  await expect(page).toHaveURL(/\/terms$/);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/terms");
    await expect(page).toHaveTitle("Terms & Conditions | Day Recharge");
    await expect(
      page.getByRole("heading", { name: "Terms & Conditions", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".terms-section")).toHaveCount(5);
    await expect(
      page.getByRole("heading", { name: "4. Wallet & Transactions" }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
    await page.screenshot({
      path: `docs/screenshots/terms-${width}.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(
    nav.getByRole("link", { name: "Terms", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await nav.getByRole("link", { name: "Home", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page
    .getByRole("navigation", { name: "Footer company" })
    .getByRole("link", { name: "Terms & Conditions" })
    .click();
  await expect(page).toHaveURL(/\/terms$/);
  await page
    .getByRole("navigation", { name: "Footer legal" })
    .getByRole("link", { name: "Terms", exact: true })
    .click();
  await expect(page).toHaveURL(/\/terms$/);
  expect(external).toEqual([]);
});
