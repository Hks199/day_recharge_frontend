import {
  afterAll,
  beforeAll,
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { LoginForm } from "../src/features/auth/AuthPages";
import { Confirm, Form, ErrorPanel } from "../src/components/ui";
import { Providers, queryClient } from "../src/app/providers";
import { Guard } from "../src/app/router";
import { api, ApiError } from "../src/lib/api/client";
import { type Role, type Session } from "../src/types/contracts";
import { homes } from "../src/lib/permissions";
import { websiteFixture } from './fixtures/website';
const server = setupServer(http.get('*/api/platform/public/website', () => HttpResponse.json(websiteFixture())));
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  api.clear();
  queryClient.clear();
});
afterAll(() => server.close());
const makeSession = (role: Role): Session => ({
  accessToken: "access",
  csrfToken: "csrf",
  expiresIn: 600,
  user: {
    id: "aaaaaaaaaaaaaaaaaaaaaaaa",
    name: "Test User",
    role,
    tenantId: role === "DEVELOPER" ? null : "bbbbbbbbbbbbbbbbbbbbbbbb",
  },
});
function loginRender() {
  const router = createMemoryRouter(
    [
      { path: "/login", element: <LoginForm /> },
      ...Object.entries(homes).map(([role, home]) => ({
        path: `${home}/dashboard`,
        element: <div>{role} workspace</div>,
      })),
    ],
    { initialEntries: ["/login"] },
  );
  return render(<RouterProvider router={router} />);
}
describe("Login and form behavior", () => {
  it("validates login without imposing new-account complexity", async () => {
    const u = userEvent.setup();
    const login = vi
      .spyOn(api, "login")
      .mockResolvedValue(makeSession("RETAILER").user);
    loginRender();
    await u.click(
      screen.getByRole("button", { name: "Sign In" }),
    );
    expect(login).not.toHaveBeenCalled();
    await u.type(
      screen.getByLabelText("Email address"),
      "retailer@example.com",
    );
    await u.type(screen.getByLabelText("Password", { exact: true }), "x");
    await u.click(
      screen.getByRole("button", { name: "Sign In" }),
    );
    await waitFor(() =>
      expect(login).toHaveBeenCalledWith("retailer@example.com", "x"),
    );
    expect(await screen.findByText("RETAILER workspace")).toBeInTheDocument();
  });
  it("hides password by default and permits keyboard submission", async () => {
    const u = userEvent.setup();
    vi.spyOn(api, "login").mockResolvedValue(makeSession("RETAILER").user);
    loginRender();
    const password = screen.getByLabelText("Password", { exact: true });
    expect(password).toHaveAttribute("type", "password");
    await u.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
    await u.type(screen.getByLabelText("Email address"), "r@example.com");
    await u.type(password, "short{Enter}");
    expect(await screen.findByText("RETAILER workspace")).toBeInTheDocument();
  });
  it("uses MSW only in tests and displays safe API validation errors", async () => {
    server.use(
      http.post("*/api/platform/auth/login", () =>
        HttpResponse.json(
          { error: { code: "INVALID_CREDENTIALS" }, requestId: "support-id" },
          { status: 401 },
        ),
      ),
      http.post("*/api/auth/login", () =>
        HttpResponse.json(
          { error: { code: "INVALID_CREDENTIALS" }, requestId: "support-id" },
          { status: 401 },
        ),
      ),
    );
    loginRender();
    const u = userEvent.setup();
    await u.type(screen.getByLabelText("Email address"), "r@example.com");
    await u.type(
      screen.getByLabelText("Password", { exact: true }),
      "password",
    );
    await u.click(
      screen.getByRole("button", { name: "Sign In" }),
    );
    expect(
      await screen.findByText("Email or password is incorrect."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Support reference: support-id"),
    ).toBeInTheDocument();
  });
  it("blocks duplicate clicks during form submission", async () => {
    let resolve: (() => void) | undefined;
    const submit = vi.fn(
      () =>
        new Promise<void>((r) => {
          resolve = r;
        }),
    );
    const u = userEvent.setup();
    render(
      <Form
        fields={[{ name: "value", label: "Value", defaultValue: "valid" }]}
        onSubmit={submit}
      />,
    );
    await u.dblClick(screen.getByRole("button", { name: "Save changes" }));
    expect(submit).toHaveBeenCalledTimes(1);
    resolve!();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Save changes" }),
      ).toBeEnabled(),
    );
  });
});
describe("Permissions and cache isolation", () => {
  it.each(["DEVELOPER", "SUPER_ADMIN", "DISTRIBUTOR", "RETAILER"] as const)(
    "guards the %s workspace and clears data on logout",
    async (role) => {
      api.setSession(makeSession(role));
      const router = createMemoryRouter(
        [
          {
            element: <Guard role={role} />,
            path: homes[role],
            children: [
              { path: "dashboard", element: <div>Authorized dashboard</div> },
            ],
          },
          { path: "/login", element: <div>Login required</div> },
        ],
        { initialEntries: [`${homes[role]}/dashboard`] },
      );
      render(
        <Providers>
          <RouterProvider router={router} />
        </Providers>,
      );
      expect(
        await screen.findByText("Authorized dashboard"),
      ).toBeInTheDocument();
      queryClient.setQueryData(["sensitive"], "private");
      api.clear();
      expect(await screen.findByText("Login required")).toBeInTheDocument();
      expect(queryClient.getQueryData(["sensitive"])).toBeUndefined();
      expect(queryClient.getQueryData([window.location.host, 'public-website'])).toBeDefined();
    },
  );
  it("rejects a forbidden direct route", async () => {
    api.setSession(makeSession("RETAILER"));
    const router = createMemoryRouter(
      [
        {
          path: "/admin",
          element: <Guard role="SUPER_ADMIN" />,
          children: [{ path: "dashboard", element: <div>Owner data</div> }],
        },
      ],
      { initialEntries: ["/admin/dashboard"] },
    );
    render(
      <Providers>
        <RouterProvider router={router} />
      </Providers>,
    );
    expect(
      await screen.findByText("This page is outside your role."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Owner data")).not.toBeInTheDocument();
  });
});
describe("Accessible financial confirmation", () => {
  it("requires explicit attestation, traps focus, and returns focus", async () => {
    const u = userEvent.setup();
    const confirm = vi.fn().mockResolvedValue(undefined);
    render(
      <Confirm
        title="Approve funds?"
        description="Credit ₹100 to recipient ABC."
        attestation="I checked the external deposit."
        onConfirm={confirm}
      >
        Approve
      </Confirm>,
    );
    const trigger = screen.getByRole("button", { name: "Approve" });
    await u.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Approve funds?" });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
    await u.click(screen.getByRole("checkbox"));
    await u.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(confirm).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
  });
  it("displays field issues and request ID", () => {
    render(
      <ErrorPanel
        error={
          new ApiError(400, "INVALID_INPUT", "req-test", [
            { path: ["amountMinor"], message: "Invalid integer amount" },
          ])
        }
      />,
    );
    expect(
      screen.getByText("amountMinor: Invalid integer amount"),
    ).toBeInTheDocument();
    expect(screen.getByText("Support reference: req-test")).toBeInTheDocument();
  });
});
