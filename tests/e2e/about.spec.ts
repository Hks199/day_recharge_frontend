import { test, expect } from "@playwright/test";
import { fixtures } from "./fixtures";

test("About Us is responsive, linked locally, and works on direct visits", async ({
  page,
}) => {
  test.setTimeout(60000);
  await fixtures(page);
  const referenceRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).hostname === "dayrecharge.com")
      referenceRequests.push(request.url());
  });
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Footer company" })
    .getByRole("link", { name: "About Us" })
    .click();
  await expect(page).toHaveURL(/\/aboutus$/);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/aboutus");
    await expect(
      page.getByRole("heading", { name: "About Us", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Who We Are" }),
    ).toBeVisible();
    await expect(page.locator(".about-feature")).toHaveCount(4);
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
            .map((element) => (element as HTMLAnchorElement).href)
            .filter(
              (a) =>
                a.startsWith("http") && new URL(a).origin !== location.origin,
            ),
        ),
    ).toEqual([]);
    await page.screenshot({
      path: `docs/screenshots/about-${width}.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(
    page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "About", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "Day Recharge home" }).first().click();
  await expect(page).toHaveURL(/\/$/);
  expect(referenceRequests).toEqual([]);
});
