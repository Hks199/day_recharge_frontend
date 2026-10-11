import { type Page, expect } from "@playwright/test";
import { websiteFixture } from '../fixtures/website';
import type { Role } from "../../src/types/contracts";
export const ids = {
  user: "aaaaaaaaaaaaaaaaaaaaaaaa",
  tenant: "bbbbbbbbbbbbbbbbbbbbbbbb",
  operator: "cccccccccccccccccccccccc",
  transaction: "dddddddddddddddddddddddd",
  other: "eeeeeeeeeeeeeeeeeeeeeeee",
  plan: "ffffffffffffffffffffffff",
};
export async function fixtures(
  page: Page,
  role: Role = "DEVELOPER",
  status = "SUCCESS",
) {
  const user = {
    id: ids.user,
    _id: ids.user,
    name: "Asha Sharma",
    email: "asha@example.com",
    phone: "9876543210",
    role,
    tenantId: role === "DEVELOPER" ? null : ids.tenant,
    status: "ACTIVE",
  };
  const transaction = {
    _id: ids.transaction,
    userId: ids.user,
    operatorId: ids.operator,
    serviceType: "MOBILE",
    amountMinor: 10000,
    status,
    createdAt: "2026-10-10T08:00:00Z",
    providerTransactionId: "MOCK-123",
  };
  await page.route(
    (url) => url.pathname.startsWith("/api/"),
    async (route) => {
      const req = route.request(),
        url = new URL(req.url()),
        path = url.pathname,
        method = req.method();
      if (role === 'DEVELOPER' && !path.startsWith('/api/platform/')) throw new Error(`Developer called tenant API: ${path}`);
      if (role !== 'DEVELOPER' && path.startsWith('/api/platform/')) throw new Error(`Tenant user called platform API: ${path}`);
      let body: unknown;
      if (path.endsWith('/public/website') || path.endsWith('/website')) body = websiteFixture(role === 'DEVELOPER');
      else if (path.endsWith("/public/tenant-config"))
        body = {
          name: "Connected Recharge",
          features: ["Recharge"],
          support: { email: "support@example.com" },
          primaryColor: "#2563eb",
          secondaryColor: "#0d9488",
        };
      else if (path.endsWith("/auth/login") || path.endsWith("/auth/refresh"))
        body = {
          accessToken: "test-access",
          csrfToken: "test-csrf",
          expiresIn: 600,
          user,
          requestId: "test-request",
        };
      else if (path.endsWith("/auth/me")) body = user;
      else if (path.endsWith("/dashboard"))
        body = {
          users: [{ _id: "RETAILER", count: role === 'RETAILER' ? 1 : 3 }, ...(role === 'DISTRIBUTOR' || role === 'SUPER_ADMIN' ? [{ _id: role, count: 1 }] : [])],
          tenants: [{ _id: "ACTIVE", count: 1 }],
          subscriptions: [{ _id: "ACTIVE", count: 1 }],
          transactions: [{ _id: status, count: 1, volumeMinor: 10000 }],
          commissions: [{ _id: "PAID", amountMinor: 125 }],
          wallets: [{ _id: "INR", balanceMinor: role === 'SUPER_ADMIN' ? 200000 : 50000 }],
        };
      else if (path === "/api/wallet")
        body = {
          _id: ids.other,
          userId: ids.user,
          balanceMinor: 50000,
          currency: "INR",
          status: "ACTIVE",
        };
      else if (['/api/recharges/operators', '/api/bill-payments/operators'].includes(path))
        body = [
          {
            _id: ids.operator,
            name: "Mock Mobile",
            code: "MOB",
            providerId: ids.other,
            serviceType: "MOBILE",
            minMinor: 100,
            maxMinor: 100000,
            enabled: true,
          },
          {
            _id: ids.plan,
            name: "Mock Electricity",
            code: "ELEC",
            providerId: ids.other,
            serviceType: "ELECTRICITY",
            minMinor: 100,
            maxMinor: 100000,
            enabled: true,
          },
        ];
      else if (path.endsWith("/inquiries"))
        body = {
          _id: ids.other,
          operatorId: ids.plan,
          amountMinor: 10000,
          providerReference: "BILL-123",
          expiresAt: new Date(Date.now() + 900000).toISOString(),
        };
      else if (path === "/api/recharges" || path === "/api/bill-payments")
        body =
          method === "POST"
            ? { ...transaction, status: "PENDING" }
            : { data: [transaction], total: 1, page: 1, limit: 20 };
      else if (path === `/api/recharges/${ids.transaction}`) body = transaction;
      else if (
        method === "POST" &&
        ["/api/users/retailers", "/api/users/distributors"].includes(path)
      ) {
        const input = req.postDataJSON() as Record<string, string>;
        body = {
          _id: ids.other,
          name: input.name,
          email: input.email,
          phone: input.phone,
          role: path.endsWith("/retailers") ? "RETAILER" : "DISTRIBUTOR",
          tenantId: ids.tenant,
          parentId: ids.user,
          status: "ACTIVE",
        };
      } else if (path === "/api/users" || path.endsWith("/downline"))
        body = {
          data: [
            {
              ...user,
              _id: ids.other,
              id: ids.other,
              name: "Ravi Retailer",
              role: "RETAILER",
              parentId: ids.user,
            },
          ],
          total: 1,
        };
      else if (path === `/api/users/${ids.other}`)
        body = {
          ...user,
          id: ids.other,
          name: "Ravi Retailer",
          role: "RETAILER",
          parentId: ids.user,
        };
      else if (path === "/api/platform/tenants" && method === "POST") {
        const input = req.postDataJSON() as Record<string, unknown>;
        body = {
          _id: ids.tenant,
          name: input.name,
          slug: input.slug,
          ownerId: ids.user,
          status: "ACTIVE",
        };
      } else if (path === "/api/platform/tenants")
        body = {
          data: [
            {
              _id: ids.tenant,
              name: "Connected Recharge",
              slug: "connected",
              ownerId: ids.user,
              status: "ACTIVE",
            },
          ],
          total: 1,
        };
      else if (
        path === `/api/platform/tenants/${ids.tenant}` ||
        path === "/api/tenant"
      )
        body = {
          _id: ids.tenant,
          name: "Connected Recharge",
          slug: "connected",
          ownerId: ids.user,
          status: "ACTIVE",
        };
      else if (path === "/api/platform/plans")
        body = [
          {
            _id: ids.plan,
            name: "Business",
            priceMinor: 100000,
            durationDays: 30,
            features: ["Recharge"],
            active: true,
          },
        ];
      else if (path.endsWith("/settings"))
        body = {
          enabledServices: ["MOBILE", "DTH"],
          maxRechargeMinor: 100000,
          supportEmail: "support@example.com",
        };
      else if (path.endsWith("/providers"))
        body = [
          {
            _id: ids.other,
            name: "Development provider",
            code: "MOCK",
            enabled: true,
          },
        ];
      else if (path === "/api/wallet/funding-requests")
        body = [
          {
            _id: ids.other,
            userId: ids.user,
            amountMinor: 10000,
            reference: "BANK-123456",
            status: "REQUESTED",
          },
        ];
      else if (
        path === "/api/wallet/ledger" ||
        path === "/api/wallet/transfers"
      )
        body = { data: [], total: 0 };
      else if (
        [
          "/api/commissions/rules",
          "/api/commissions/records",
          "/api/support-tickets",
          "/api/notifications",
          "/api/tenant/domains",
          "/api/platform/subscriptions",
          "/api/platform/audit-logs",
        ].includes(path) ||
        /^\/api\/platform\/tenants\/[a-f\d]{24}\/domains$/.test(path)
      )
        body = [];
      else throw new Error(`Unhandled test API: ${method} ${path}`);
      await route.fulfill({
        status:
          method === "POST" &&
          ["/api/recharges", "/api/bill-payments"].includes(path)
            ? 202
            : method === "POST" &&
                !path.endsWith("/auth/login") &&
                !path.endsWith("/auth/refresh")
              ? 201
              : 200,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    },
  );
}
export async function login(page: Page, role: Role) {
  const tenant = role !== "DEVELOPER";
  await page.goto(`${tenant ? "http://127.0.0.1:5179" : ""}/login`);
  await page.getByLabel("Email address").fill("asha@example.com");
  await page
    .getByLabel("Password", { exact: true })
    .fill("test-account-password");
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(
    page.getByRole("heading", { name: "Good to see you, Asha." }),
  ).toBeVisible();
}
