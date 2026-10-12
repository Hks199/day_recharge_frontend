import { z } from "zod";
import { sessionSchema, type Session } from "../../types/contracts";
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public requestId?: string,
    public issues: { path: (string | number)[]; message: string }[] = [],
  ) {
    super(errorMessage(code));
  }
}
const messages: Record<string, string> = {
  WEBSITE_VERSION_CONFLICT:
    "The website was changed by another administrator. Reload before saving.",
  NETWORK_ERROR:
    "The server could not be reached. Check your connection. If you submitted funds, the outcome is uncertain; retry the same intent only.",
  INVALID_CREDENTIALS: "Email or password is incorrect.",
  AUTH_REQUIRED: "Please sign in to continue.",
  SESSION_REVOKED: "Your session was revoked. Please sign in again.",
  UNKNOWN_OR_UNVERIFIED_DOMAIN:
    "This domain is unknown or has not been verified. Contact your business owner.",
  TENANT_SUSPENDED:
    "This business is suspended. New access is blocked; existing financial settlement can continue.",
  SUBSCRIPTION_INACTIVE:
    "This business subscription is inactive. Contact your business owner.",
  ORIGIN_NOT_ALLOWED:
    "This deployment origin is not allowed by the API. Contact your administrator.",
  IMAGE_STORAGE_NOT_CONFIGURED:
    "Image uploads are not configured. Set S3_REGION, S3_BUCKET, and S3_PUBLIC_BASE_URL in the backend environment.",
  IMAGE_STORAGE_UNAVAILABLE:
    "Image storage is unavailable. Check the backend AWS credentials and S3 settings.",
  INVALID_ORIGIN: "This deployment origin is invalid.",
  UNKNOWN_PLATFORM_HOST: "The API does not recognize this platform hostname.",
  INSUFFICIENT_BALANCE:
    "The wallet has insufficient balance for this operation.",
  WALLET_BLOCKED: "This wallet is blocked for new operations.",
  IDEMPOTENCY_CONFLICT:
    "This key belongs to a different payment intent. Do not submit another charge.",
  RESET_DELIVERY_NOT_CONFIGURED:
    "Password reset delivery has not been configured. Contact your administrator.",
  RESET_DELIVERY_FAILED:
    "Reset delivery is unavailable. Please try again later.",
  RATE_LIMITED: "Too many requests. Wait a minute before trying again.",
  INVALID_RESPONSE:
    "The server returned an unexpected response. Contact support.",
  FORBIDDEN: "You do not have permission for this operation.",
  INVALID_INPUT: "Review the highlighted fields.",
  INSUFFICIENT_BALANCE_OR_WALLET_BLOCKED:
    "An affected wallet has insufficient funds, is blocked, or cannot accept this amount. Check your wallet and contact the owner if needed.",
  INVALID_OR_EXPIRED_BILL:
    "This inquiry is expired, already consumed, or does not match the submitted account and amount. Check transaction history before fetching another bill.",
  FUNDING_ALREADY_DECIDED:
    "This funding request already has a different recorded decision. Refresh the request history.",
  COMMISSION_BUDGET_EXCEEDED:
    "These direct payouts exceed the operator commission budget. Review the amounts and beneficiary rules.",
  SELF_FUNDING_APPROVAL_FORBIDDEN:
    "You cannot approve your own funding request. An authorized platform owner must review it.",
  PLATFORM_SERVICE_RESTRICTED:
    "The platform has restricted this service or amount. Contact your business administrator.",
  SERVICE_DISABLED: "This service is disabled for your business.",
};
export function errorMessage(code: string) {
  return (
    messages[code] ??
    code
      .toLowerCase()
      .replaceAll("_", " ")
      .replace(/^./, (s) => s.toUpperCase()) + "."
  );
}
type Options = {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
  public?: boolean;
  key?: string;
  csrf?: boolean;
};
type Fetcher = typeof fetch;
const errorSchema = z.object({
  error: z.object({
    code: z.string(),
    issues: z
      .array(
        z.object({
          path: z.array(z.union([z.string(), z.number()])),
          message: z.string(),
        }),
      )
      .optional(),
  }),
  requestId: z.string().optional(),
});
export class ApiClient {
  private session: Session | null = null;
  private refreshFlight: Promise<void> | null = null;
  private generation = 0;
  onSession: (session: Session | null) => void = () => {};
  onRotate: () => void = () => {};
  constructor(
    public base: string,
    public prefix: "/auth" | "/platform/auth",
    private fetcher: Fetcher = (...args) => fetch(...args),
  ) {}
  getSession() {
    return this.session;
  }
  setSession(session: Session | null) {
    this.generation++;
    this.session = session;
    this.onSession(session);
  }
  clear() {
    this.setSession(null);
  }
  private async raw(
    path: string,
    options: Options,
    token?: string,
  ): Promise<unknown> {
    let response: Response;
    try {
      response = await this.fetcher(`${this.base.replace(/\/$/, "")}${path}`, {
        method: options.method ?? "GET",
        credentials: "include",
        headers: {
          ...(options.body !== undefined
            ? { "Content-Type": "application/json" }
            : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.csrf && this.session
            ? { "X-CSRF-Token": this.session.csrfToken }
            : {}),
          ...(options.key ? { "Idempotency-Key": options.key } : {}),
        },
        body:
          options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: options.signal
          ? AbortSignal.any([options.signal, AbortSignal.timeout(25000)])
          : AbortSignal.timeout(25000),
      });
    } catch (e) {
      if (options.signal?.aborted) throw e;
      throw new ApiError(0, "NETWORK_ERROR");
    }
    if (response.status === 204) return undefined;
    const data: unknown = await response.json().catch(() => undefined);
    if (!response.ok) {
      const parsed = errorSchema.safeParse(data);
      throw new ApiError(
        response.status,
        parsed.success
          ? parsed.data.error.code
          : response.status === 429
            ? "RATE_LIMITED"
            : "SERVER_UNAVAILABLE",
        parsed.success
          ? parsed.data.requestId
          : (response.headers.get("X-Request-ID") ?? undefined),
        parsed.success ? parsed.data.error.issues : [],
      );
    }
    return data;
  }
  async refresh() {
    if (!this.session) throw new ApiError(401, "AUTH_REQUIRED");
    if (!this.refreshFlight) {
      const generation = this.generation;
      const rotate = async () => {
        if (generation !== this.generation || !this.session)
          throw new ApiError(401, "AUTH_REQUIRED");
        this.onRotate();
        try {
          const next = sessionSchema.parse(
            await this.raw(`${this.prefix}/refresh`, {
              method: "POST",
              public: true,
              csrf: true,
            }),
          );
          if (generation !== this.generation)
            throw new ApiError(401, "AUTH_REQUIRED");
          this.setSession(next);
        } catch (e) {
          if (generation === this.generation) this.clear();
          throw e;
        }
      };
      this.refreshFlight = (
        typeof navigator !== "undefined" && navigator.locks
          ? navigator.locks
              .request("recharge-cookie-rotation", rotate)
              .then(() => undefined)
          : rotate()
      ).finally(() => {
        this.refreshFlight = null;
      });
    }
    return this.refreshFlight;
  }
  async request<T>(
    path: string,
    schema: z.ZodType<T>,
    options: Options = {},
  ): Promise<T> {
    const token = options.public ? undefined : this.session?.accessToken;
    const generation = this.generation;
    const identity = this.session
      ? `${this.session.user.tenantId}:${this.session.user.id}`
      : null;
    if (!options.public && !token) throw new ApiError(401, "AUTH_REQUIRED");
    let data: unknown;
    try {
      data = await this.raw(path, options, token);
    } catch (e) {
      if (
        !options.public &&
        (!this.session ||
          identity !== `${this.session.user.tenantId}:${this.session.user.id}`)
      )
        throw new ApiError(401, "AUTH_REQUIRED");
      const authPath = ["login", "refresh", "logout"].some(
        (action) => path === `${this.prefix}/${action}`,
      );
      if (
        e instanceof ApiError &&
        e.status === 401 &&
        !options.public &&
        !authPath &&
        this.session
      ) {
        if (
          ["SESSION_REVOKED", "USER_INACTIVE", "SESSION_EXPIRED"].includes(
            e.code,
          )
        ) {
          this.clear();
          throw e;
        }
        if (token === this.session.accessToken) await this.refresh();
        try {
          data = await this.raw(path, options, this.session?.accessToken);
        } catch (retryError) {
          if (retryError instanceof ApiError && retryError.status === 401)
            this.clear();
          throw retryError;
        }
      } else {
        if (
          e instanceof ApiError &&
          e.status === 401 &&
          !options.public &&
          generation === this.generation
        )
          this.clear();
        throw e;
      }
    }
    if (!options.public && !this.session)
      throw new ApiError(401, "AUTH_REQUIRED");
    if (
      !options.public &&
      this.session &&
      identity !== `${this.session.user.tenantId}:${this.session.user.id}`
    )
      throw new ApiError(401, "AUTH_REQUIRED");
    const parsed = schema.safeParse(data);
    if (!parsed.success) throw new ApiError(502, "INVALID_RESPONSE");
    return parsed.data;
  }
  async login(email: string, password: string) {
    const session = await this.request(`${this.prefix}/login`, sessionSchema, {
      method: "POST",
      body: { email, password },
      public: true,
    });
    if (
      (this.prefix === "/platform/auth") !==
      (session.user.role === "DEVELOPER")
    )
      throw new ApiError(403, "TENANT_MISMATCH");
    this.onRotate();
    this.setSession(session);
    return session.user;
  }
  async logout() {
    try {
      await this.request(`${this.prefix}/logout`, z.unknown(), {
        method: "POST",
        csrf: true,
        public: true,
      });
    } finally {
      this.onRotate();
      this.clear();
    }
  }
}
export const platformHosts = (
  import.meta.env.VITE_PLATFORM_HOSTS ?? "localhost,platform.localhost"
)
  .split(",")
  .map((s: string) => s.trim().toLowerCase())
  .filter(Boolean);
export const isPlatform = platformHosts.includes(
  window.location.hostname.toLowerCase(),
);
export const api = new ApiClient(
  import.meta.env.VITE_API_BASE_URL ?? "/api",
  isPlatform ? "/platform/auth" : "/auth",
);
