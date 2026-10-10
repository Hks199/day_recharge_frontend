import { test, expect } from "@playwright/test";
import { fixtures } from "./fixtures";

test("Public navbar keeps its links, actions, and size when navigating to About and other pages", async ({
  page,
}) => {
  test.setTimeout(60000);
  await fixtures(page);
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    let headerHeight: number | undefined;
    for (const [label, path] of [
      ["About", "/aboutus"],
      ["Contact", "/contactus"],
      ["Terms", "/terms"],
      ["Home", "/"],
    ]) {
      if (width < 1000)
        await page.getByRole("button", { name: "Open navigation" }).click();
      const nav = page.getByRole("navigation", { name: "Main navigation" });
      await expect(nav.locator("a").filter({ visible: true })).toHaveText(
        width < 1000
          ? [
              "Home",
              "About",
              "Contact",
              "Terms",
              "Login to your account",
              "Get Started",
            ]
          : ["Home", "About", "Contact", "Terms"],
      );
      const header = page.locator(".marketing-header");
      const height = (await header.boundingBox())!.height;
      headerHeight ??= height;
      expect(height).toBe(headerHeight);
      await expect(
        header
          .getByRole("link", { name: "Get Started", exact: true })
          .filter({ visible: true }),
      ).toHaveAttribute("href", "/register");
      await nav.getByRole("link", { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      if (width < 1000) {
        await expect(
          page.getByRole("button", { name: "Open navigation" }),
        ).toHaveAttribute("aria-expanded", "false");
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
    }
  }
});
