import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ApiClient, ApiError } from "../src/lib/api/client";
import type { Session } from "../src/types/contracts";
const session = (token = "old"): Session => ({
  accessToken: token,
  csrfToken: "csrf-token",
  expiresIn: 600,
  user: { id: "user", name: "User", role: "RETAILER" },
});
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
const denied = (code = "INVALID_TOKEN", status = 401) =>
  json({ error: { code }, requestId: "request-123" }, status);
afterEach(() => vi.restoreAllMocks());
describe("Typed API client", () => {
  it("selects correct prefix and never retries login elsewhere", async () => {
    for (const prefix of ["/auth", "/platform/auth"] as const) {
      const fetcher = vi
        .fn<typeof fetch>()
        .mockResolvedValue(denied("INVALID_CREDENTIALS"));
      const client = new ApiClient("/api", prefix, fetcher);
      await expect(client.login("u@example.com", "x")).rejects.toMatchObject({
        code: "INVALID_CREDENTIALS",
      });
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(fetcher.mock.calls[0][0]).toBe(`/api${prefix}/login`);
    }
  });
  it("shares one refresh across concurrent 401 responses and sends CSRF", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async (url, options) => {
        if (String(url).endsWith("/refresh")) {
          await new Promise((resolve) => setTimeout(resolve, 10));
          expect(options?.headers).toMatchObject({
            "X-CSRF-Token": "csrf-token",
          });
          return json(session("new"));
        }
        return (options?.headers as Record<string, string>)?.Authorization ===
          "Bearer new"
          ? json({ ok: true })
          : denied();
      });
    const client = new ApiClient("/api", "/auth", fetcher);
    client.setSession(session());
    await Promise.all([
      client.request("/auth/me", z.object({ ok: z.boolean() })),
      client.request("/two", z.object({ ok: z.boolean() })),
    ]);
    expect(
      fetcher.mock.calls.filter((c) => String(c[0]).endsWith("/refresh")),
    ).toHaveLength(1);
  });
  it("does not rotate again for a late response sent with the replaced token", async () => {
    let release: (() => void) | undefined;
    const gate = new Promise<void>((r) => {
      release = r;
    });
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async (url, options) => {
        const auth = (options?.headers as Record<string, string>)
          ?.Authorization;
        if (String(url).endsWith("/refresh")) return json(session("new"));
        if (String(url).endsWith("/late") && auth === "Bearer old") await gate;
        return auth === "Bearer new" ? json("ok") : denied();
      });
    const client = new ApiClient("/api", "/auth", fetcher);
    client.setSession(session());
    const late = client.request("/late", z.string());
    await client.request("/early", z.string());
    release!();
    await late;
    expect(
      fetcher.mock.calls.filter((c) => String(c[0]).endsWith("/refresh")),
    ).toHaveLength(1);
  });
  it("bounds retry and clears revoked sessions", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async (url) =>
        String(url).endsWith("/refresh") ? json(session("new")) : denied(),
      );
    const client = new ApiClient("/api", "/auth", fetcher);
    client.setSession(session());
    await expect(
      client.request("/resource", z.string()),
    ).rejects.toBeInstanceOf(ApiError);
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(client.getSession()).toBeNull();
  });
  it("never refreshes on 403 or explicit revocation", async () => {
    for (const [code, status] of [
      ["FORBIDDEN", 403],
      ["SESSION_REVOKED", 401],
    ] as const) {
      const fetcher = vi
        .fn<typeof fetch>()
        .mockResolvedValue(denied(code, status));
      const client = new ApiClient("/api", "/auth", fetcher);
      client.setSession(session());
      await expect(
        client.request("/resource", z.string()),
      ).rejects.toMatchObject({ code });
      expect(fetcher).toHaveBeenCalledTimes(1);
      if (status === 401) expect(client.getSession()).toBeNull();
    }
  });
  it("requires reauthentication after reload without attempting cookie refresh", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const client = new ApiClient("/api", "/auth", fetcher);
    await expect(client.request("/wallet", z.unknown())).rejects.toMatchObject({
      code: "AUTH_REQUIRED",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("never retries a previous user financial command with a replacement user token", async () => {
    let release: (() => void) | undefined;
    const gate = new Promise<void>((r) => {
      release = r;
    });
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => {
      await gate;
      return denied();
    });
    const client = new ApiClient("/api", "/auth", fetcher);
    client.setSession(session());
    const request = client.request("/wallet/transfers", z.unknown(), {
      method: "POST",
      body: { toUserId: "old-recipient", amountMinor: 100 },
    });
    client.setSession({
      ...session("replacement"),
      user: { ...session().user, id: "another-user" },
    });
    release!();
    await expect(request).rejects.toMatchObject({ code: "AUTH_REQUIRED" });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("clears session when refresh fails and does not retry it recursively", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(denied());
    const client = new ApiClient("/api", "/auth", fetcher);
    client.setSession(session());
    await expect(client.request("/wallet", z.unknown())).rejects.toMatchObject({
      status: 401,
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(client.getSession()).toBeNull();
  });
  it("cleans local state when server logout cannot be confirmed", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new TypeError("offline"));
    const client = new ApiClient("/api", "/auth", fetcher);
    client.setSession(session());
    await expect(client.logout()).rejects.toMatchObject({
      code: "NETWORK_ERROR",
    });
    expect(client.getSession()).toBeNull();
  });
  it("handles 204 and non-JSON infrastructure failures", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response("<html>Bad gateway</html>", { status: 502 }),
      );
    const client = new ApiClient("/api", "/auth", fetcher);
    client.setSession(session());
    await expect(
      client.request("/delete", z.unknown(), { method: "DELETE" }),
    ).resolves.toBeUndefined();
    await expect(
      client.request("/resource", z.unknown()),
    ).rejects.toMatchObject({ status: 502, code: "SERVER_UNAVAILABLE" });
  });
  it("maps validation issues without losing support reference", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      json(
        {
          error: {
            code: "INVALID_INPUT",
            issues: [{ path: ["name"], message: "Too short" }],
          },
          requestId: "req-1",
        },
        400,
      ),
    );
    const client = new ApiClient("/api", "/auth", fetcher);
    client.setSession(session());
    await expect(
      client.request("/resource", z.unknown()),
    ).rejects.toMatchObject({
      requestId: "req-1",
      issues: [{ path: ["name"], message: "Too short" }],
    });
  });
});
