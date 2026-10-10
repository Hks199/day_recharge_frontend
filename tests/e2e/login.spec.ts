import { test, expect } from "@playwright/test";
import { fixtures, login } from "./fixtures";
import { homes } from "../../src/lib/permissions";
import type { Role } from "../../src/types/contracts";

for (const role of Object.keys(homes) as Role[]) {
  test(`Redesigned login opens the ${role} workspace`, async ({ page }) => {
    await fixtures(page, role);
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page, role);
    await expect(page).toHaveURL(new RegExp(`${homes[role]}/dashboard$`));
  });
}

test("Login validation, password visibility, and local navigation", async ({
  page,
}) => {
  await fixtures(page);
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).hostname.endsWith("dayrecharge.com"))
      externalRequests.push(request.url());
  });
  await page.goto("/login?reason=session");
  await expect(page.getByRole("alert")).toContainText("Your session ended");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page.getByText("Enter your password.")).toBeVisible();
  const password = page.getByLabel("Password", { exact: true });
  await password.fill("sample-password");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(password).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Hide password" }).click();
  await expect(password).toHaveAttribute("type", "password");
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
  await expect(page.getByLabel("Account email")).toBeVisible();
  await page.goto("/login");
  await page.getByRole("link", { name: "Register now" }).click();
  await expect(page).toHaveURL(/\/register$/);
  expect(externalRequests).toEqual([]);
});
