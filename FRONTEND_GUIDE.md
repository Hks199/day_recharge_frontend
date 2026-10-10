# Codex implementation prompt: complete Recharge SaaS frontend

## Mission

Act as a senior React developer, product designer, and frontend architect. Build the **complete working frontend** for this existing multi-tenant Recharge and Bill Payment SaaS backend. Start with an attractive landing page and one shared login UI, then implement all supported role-specific dashboards and workflows. Continue through all phases; do not stop at a landing page, scaffolding, or dashboard placeholders.

Actually create project files, install dependencies, integrate the real APIs, run checks, and document setup. Preserve existing compatible frontend work if present. Make reasonable implementation decisions without repeatedly asking for confirmation.

The backend repository is `day_recharge_backend`; its current workspace path is `D:/day_recharge/day_recharge_backend`. Prefer an existing frontend repository if supplied. Otherwise create a separate sibling project at `../day_recharge_frontend`. Keep the backend package and source separate. If working elsewhere, locate the backend or use the supplied equivalent path before proceeding.

This document is the frontend implementation specification. Read it completely before starting.

## 1. Inspect the backend first

Read these files from the backend repository:

- `README.md`
- `GUIDE.md`
- `docs/API_SPEC.md`
- `docs/RBAC.md`
- `docs/TENANT_RESOLUTION.md`
- `docs/WALLET_AND_LEDGER.md`
- `docs/RECHARGE_FLOW.md`
- `docs/COMMISSION_ENGINE.md`
- `docs/SECURITY.md`
- `docs/IMPLEMENTATION_STATUS.md`
- `src/openapi.ts`
- `src/app.ts`
- `src/middleware/security.ts`
- Relevant `src/modules/*/routes.ts`, validation files, and services

When available, inspect the running `/api/openapi.json` and `/api/docs` too. Route source and validators are authoritative when documentation is less specific or outdated. Match actual methods, field names, response shapes, permissions, and error codes. Do not invent endpoints, role permissions, response fields, or provider integrations.

Produce a short implementation checklist and API-to-page mapping, then begin implementation. Preserve the checklist in frontend documentation and update it as work progresses.

## 2. Required frontend stack

- React with strict TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query for server state
- React Hook Form with Zod for forms
- Lucide React for consistent icons
- Recharts for charts supported by real backend data
- Vitest and React Testing Library for component and behavior tests
- Playwright for browser flows and responsive verification

Use stable compatible versions and follow the installed versions' official setup instructions, especially for Tailwind and Vite. Use accessible headless primitives, such as Radix UI or shadcn/ui components, when they help. Customize them into a coherent design rather than displaying an unmodified component catalogue.

Use a single typed fetch or Axios client. Choose one approach and use it consistently. Avoid unnecessary state libraries; use a focused auth/context store and TanStack Query unless additional state management is justified.

## 3. Product and tenant model

This is a white-label Indian mobile recharge and bill payment platform. One frontend build and one backend deployment serve multiple businesses on verified custom domains.

There are exactly four roles:

| Role | Scope | Post-login route |
| --- | --- | --- |
| `DEVELOPER` | SaaS platform owner | `/platform/dashboard` |
| `SUPER_ADMIN` | One tenant's designated business owner | `/admin/dashboard` |
| `DISTRIBUTOR` | Own account and authorized direct Retailers | `/distributor/dashboard` |
| `RETAILER` | Own account and payments | `/retailer/dashboard` |

Do not introduce any additional business role. Developer is a platform-scoped account, not a universal tenant login or impersonation mechanism.

### Tenant branding and routing context

For tenant hostnames, load `GET /api/public/tenant-config` before showing tenant-specific content. Use the returned tenant name, logo, primary/secondary colors, domain, public features, and support contacts. Configure branding through CSS variables so all screens use the same tenant theme.

For explicitly configured platform hostnames, use platform branding from public frontend configuration and the platform authentication prefix. Do not call tenant configuration as a prerequisite for platform login.

Support both deployment patterns:

1. Same hostname: frontend serves `/`, and a reverse proxy forwards `/api` to the shared backend.
2. Shared API hostname: frontend calls a configured API base URL, with verified browser Origin mapping and credentialed CORS.

Browser Origin is controlled by the browser; do not attempt to forge Host or Origin from JavaScript. The backend prioritizes Origin over X-Tenant-Domain on shared API hosts. A frontend tenant ID or domain selector cannot override authentication scope.

Show dedicated states for unknown/unverified domains, suspended tenants, inactive subscriptions, network failures, and disallowed deployment origins. Do not fall back to another tenant or silently switch a failed tenant request into platform context.

Scope query keys by deployment/tenant context and authenticated user. Clear sensitive caches and auth state on logout, user change, or tenant change.

## 4. Visual direction: attractive, modern, and practical

Create a polished fintech product, with a distinctive marketing page and a calm, efficient application workspace. The UI should look intentionally designed and ready for real business users.

### Design system

- Default palette: deep navy `#0F172A`, primary blue `#2563EB`, restrained teal accents, and soft slate backgrounds. Verified tenant branding overrides primary and secondary colors.
- Use a readable modern font such as Inter or a suitable local/system fallback. Do not require external fonts for the application to function.
- Strong type hierarchy, generous whitespace, consistent 4/8px spacing, subtle borders, rounded corners, and restrained shadows.
- Use a clean light theme as the primary experience. A well-executed dark theme is optional after core workflows are complete; it must not delay functionality.
- Use color consistently for status, with text and icons so color is never the only signal.
- Use real icon components, not emoji substitutes.
- Keep forms, tables, and financial details readable; avoid decorative gradients behind dense data.
- Give primary actions clear hierarchy. Avoid overcrowding every card with several competing buttons.
- Use subtle transitions around 150-250ms. Respect reduced-motion preferences.
- Meet WCAG AA contrast, keyboard navigation, visible focus, labelled inputs, and accessible dialogs. Choose readable foreground colors even when tenant brand colors have poor contrast.

### Responsive behavior

- Verify layouts around 360px, 768px, 1024px, and 1440px widths.
- Desktop: collapsible sidebar, top bar, breadcrumbs, page title, and contextual actions.
- Mobile: accessible navigation drawer, compact top bar, full-width forms, and easy-to-tap controls.
- Tables must use deliberate horizontal scrolling or mobile record cards; do not shrink everything until it becomes unreadable.
- Avoid page-level horizontal overflow, unstable layout shifts, and clipped dialogs.

### Reusable components

Build buttons, inputs, password inputs, selects, money inputs, date ranges, cards, badges, tabs, data tables, pagination, drawers, dialogs, confirmation dialogs, skeletons, empty states, alerts, toasts, and error panels. Include pending/disabled/error variants. Keep page-specific logic out of shared UI primitives.

## 5. Phase one: landing page and shared login

Implement and verify this phase first, then continue with the complete application.

### Landing page at `/`

Include:

1. Sticky responsive navbar with tenant/platform branding, section links, and Login action.
2. Strong hero headline about running a recharge and bill payment business, concise supporting copy, Login CTA, and a secondary link to services or contact.
3. An attractive dashboard-style illustration built with HTML/CSS/SVG. Any illustrative figures must be clearly presented as an illustration, not live balances or customer statistics.
4. Service cards for mobile prepaid, DTH, postpaid, electricity, and supported bill payments.
5. Benefits covering wallet management, business hierarchy, commissions, transaction tracking, and tenant branding.
6. Three-step “How it works” section: receive an authorized account, fund your wallet through the supported workflow, submit and track payments.
7. Helpful FAQ accordion.
8. Support/contact section using verified public contacts and functional email/phone links where present.
9. Footer with branding and functional navigation.

Use thoughtful section composition, a subtle hero background, refined service icons, and consistent spacing. Keep marketing copy concise and credible. Do not invent customer counts, testimonials, certifications, provider partnerships, live payment availability, public prices, or legal policies. Avoid public pricing that would require a nonexistent unauthenticated plans API. Do not add a contact form that claims to submit without a delivery endpoint.

The landing page must offer access to the shared login UI. Use the same reusable login component for a desktop login panel/dialog if included and the canonical `/login` page. Mobile must have a clean dedicated login experience.

### One shared login UI for every role

Fields and behavior:

- Email and password only; no role selector.
- Show/hide password, password-manager autocomplete, accessible labels, and keyboard submission.
- Forgot-password link and clear submit loading state.
- Client validation matching login constraints; do not impose new-account password complexity on existing-account login.
- Human-readable errors without exposing credentials or raw internal exceptions.
- Do not add public registration, default credentials, or an unsupported “Remember me” control.

Use deployment context to select the auth prefix:

- Platform hostname: `/api/platform/auth`
- Verified tenant hostname: `/api/auth`

Submit `POST <prefix>/login` with `{ email, password }`. The backend determines the role. Do not retry credentials against the other prefix. Developer logs in on a platform hostname; the other three roles log in on their tenant hostname, all through the same component design.

Redirect only according to the authenticated response. Reject unknown roles safely. Validate any return-to URL as a local, permitted application route.

### Authentication integration

Inspect the actual response, which currently contains `accessToken`, `expiresIn`, `csrfToken`, `user`, and `requestId`. Login user identifiers use `id`, while full profile/model responses may use `_id`; normalize these in the API layer.

- Keep access and CSRF tokens in memory.
- Let the backend manage refresh tokens in its HTTP-only cookie. Never read or persist a refresh token in browser storage.
- Include credentials on applicable API requests and send the bearer access token on protected requests.
- Refresh and logout require the current `X-CSRF-Token` header and the correct auth prefix.
- Implement one shared in-flight refresh operation, bounded retry, and safe handling of requests sent with an already replaced access token. Do not run parallel refresh calls that can trigger token-family reuse detection.
- Do not intercept login, refresh, or logout errors into recursive refresh loops. Distinguish 401 from tenant/permission failures; a 403 is not a reason to keep refreshing.
- Clear auth and user-specific cached data when sessions are revoked. Do not show a protected page before auth context is established.
- Implement backend logout and local cleanup. If network failure prevents server revocation, explain that sign-out on the server could not be confirmed; do not claim it succeeded.
- Inspect multi-tab behavior. Do not automatically reuse an old tab's refresh credentials after another login/rotation; coordinate sign-out or require reauthentication where necessary.

**Current session-restoration limitation:** the backend returns the CSRF token through login/refresh responses and has no dedicated CSRF bootstrap endpoint. After a full browser reload, memory-only auth loses this token. Unless the inspected backend has gained a supported bootstrap mechanism, require login again after reload and document it. Do not invent a session-restoration endpoint, send a dummy CSRF token, or persist access tokens to work around the limitation. Do not modify backend auth silently.

### Password and profile pages

- Forgot-password request and reset confirmation through `<prefix>/password-reset/request` and `<prefix>/password-reset/confirm`.
- Use the generic request-success message; show the actual error when reset delivery is unconfigured or unavailable. Do not claim an email was sent after a 503.
- Handle reset tokens without logging them or forwarding them to analytics. Remove sensitive token parameters from the visible URL when practical after capture.
- Profile read/update through `<prefix>/me`; only name and phone are editable through the current update contract.
- Change password through `<prefix>/change-password`; handle session revocation after success.
- Revoke all sessions through `DELETE <prefix>/sessions`, with a clear confirmation and subsequent sign-out.

## 6. Application shell and authorization

Build protected layouts for the platform and tenant workspaces. Reuse the design system and shell components; derive permitted navigation and actions from the authenticated role.

Include tenant/platform logo, role label, breadcrumbs, profile menu, sign-out, and notifications where the role has a supported inbox. Show wallet summary only for roles with wallet endpoints. Developer must not call tenant notification or wallet endpoints.

Use route guards and action guards consistently. Backend authorization remains authoritative. Do not treat hidden buttons as security, allow role changes through form fields, or offer a cross-tenant impersonation switch.

Implement branded 404, forbidden, session-expired, tenant-unavailable, offline/network-error, and route-error states. Every route must have loading, empty, success, and failure behavior as appropriate.

## 7. Developer workspace

Implement all supported platform administration flows:

| Page / workflow | Backend contract family |
| --- | --- |
| Dashboard with tenant, subscription, and transaction status summaries | `GET /api/platform/dashboard` |
| Tenant directory and tenant details | `GET /api/platform/tenants`, `GET /api/platform/tenants/:id` |
| Provision tenant with designated owner and selected plan | `POST /api/platform/tenants` |
| Activate/suspend tenant with confirmation | `PATCH /api/platform/tenants/:id/status` |
| List/add/verify/set-primary/remove tenant domains | `/api/platform/tenants/:id/domains` and documented subroutes |
| List/create/edit/activate/deactivate subscription plans | `/api/platform/plans` |
| Assign/renew subscription and view tenant-filtered history | `/api/platform/subscriptions` |
| List/create/enable/disable supported providers | `/api/platform/providers` |
| Create operators with service, amount bounds, provider, and commission budget | `POST /api/platform/operators` |
| View/edit global service restrictions and maximum recharge amount | `/api/platform/settings` |
| Paginated platform audit logs | `GET /api/platform/audit-logs` |
| Approve/reject an externally verified funding request using supplied IDs | `POST /api/platform/tenants/:id/funding-requests/:fundingId/decision` |
| Own profile, password, sessions | `/api/platform/auth` |

Tenant provisioning must match the actual nested owner input, not a fabricated registration schema. Subscription forms must validate start/end dates. Describe suspension as blocking new tenant access while existing financial settlement can continue.

**Current API gaps:** Developer has no platform funding-request listing/detail endpoint, and no platform operator listing/edit endpoint. Do not fabricate a complete approval inbox or editable operator catalogue. Provide only the supported explicit-ID approval form with external-verification attestation and a clear explanation of the limited evidence available in-app. For operator creation, show the successful created record; document unavailable listing/edit capabilities. Do not use tenant-only APIs with a Developer token.

Platform dashboard data is grouped by status; charts can show actual distributions. Do not invent revenue, monthly growth, or time-series data.

## 8. Super Admin workspace

Implement:

- Tenant dashboard with user counts, transaction count/volume by status, commission totals, and tenant wallet summary from `/api/reports/dashboard`.
- Distributor and Retailer directories, supported role/status filters, pagination, details, and direct downline view.
- Create Distributor with `POST /api/users/distributors`.
- Create direct Retailer with `POST /api/users/retailers`.
- Edit permitted user profile fields and activate/block authorized users. Protect the designated owner from unsupported management actions.
- Own wallet balance and ledger; authorized downline ledger using the supported `userId` filter.
- Transfer own wallet funds to authorized downline, transfer history, and supported transfer reversal.
- Funding-request creation, tenant request list, and approve/reject workflow for eligible downline requests. Self approval must be unavailable.
- Wallet block/activate action for authorized users through `/api/wallet/:userId/status`.
- Tenant transaction history/details and filters; confirmed provider reversal workflow where permitted.
- Commission-rule list/create/disable, and commission-record reporting.
- Tenant branding, public support contacts, and enabled service settings.
- Domain management with TXT instructions, verification, primary selection, and non-primary removal.
- Tenant support ticket inbox, response, and close/reopen workflow.
- Own notifications, profile, password, session revocation, and sign-out.

`GET /api/wallet` returns the caller's wallet. Do not invent arbitrary user wallet balances from a user directory or ledger page. Separate the tenant's aggregate wallet total from the owner's spendable wallet balance.

## 9. Distributor workspace

Implement:

- Role-scoped dashboard showing actual direct Retailer counts, permitted transaction summaries, own commission earnings, and own wallet balance.
- Create Retailers, list/view/update/block authorized direct Retailers, and view downline.
- Own wallet and ledger, authorized Retailer ledger, transfers to direct Retailers, and visible transfer history.
- Own funding-request creation and history; no funding approval action.
- Permitted downline transaction list/details and report filters.
- Own commission-record list, own notifications, own support tickets, profile, password, and sign-out.

Do not allow Distributor creation, Super Admin creation, tenant settings, commission-rule management, or management of another Distributor's Retailers. Do not add recharge submission for this role; current backend restricts payment submission to Retailers.

## 10. Retailer workspace

Implement:

- Dashboard with own wallet, transaction status summaries, commission earnings, and service shortcuts.
- Mobile prepaid recharge and DTH recharge.
- Postpaid, electricity, and supported bill payment inquiry/payment flows.
- Own transaction history, transaction detail/status screen, and a readable receipt view derived from real returned fields.
- Own wallet ledger, visible transfer history, funding requests, and commission records.
- Own notification inbox with mark-read action.
- Create/view own support tickets and show responses.
- Profile, password, session revocation, and sign-out.

Retailers cannot create users, transfer funds, approve funding, configure rules/settings, or access another user's financial details.

## 11. Money, transfers, funding, and reversals

All money is INR in integer paise. Display localized rupees and Indian grouping, but keep API amounts as safe integers.

- Parse money input as a decimal string, validate at most two fractional digits, and convert through integer/string arithmetic. Do not use `parseFloat(value) * 100` for financial request values.
- Check safe integer bounds and backend amount constraints. Clearly distinguish rupees from paise.
- Format percentages as human-readable percent values; convert exactly to integer basis points for API input. For example, 1.25% equals 125 basis points.
- Confirmation dialogs must identify recipient, amount, operation, and consequences.
- Do not optimistically change wallet balances or mark transactions successful before server confirmation. Invalidate/refetch relevant query data after mutations.
- Generate a unique valid Idempotency-Key per transfer/payment intent. Preserve that same key and exact payload for retry of an uncertain submission. Do not issue a new key just because a request timed out.
- Disable duplicate submissions and automatic financial mutation retries. A changed payload requires a new confirmed intent; a key conflict must produce a clear error.
- Keep pending-operation recovery context separate from auth secrets. If preserving financial intent metadata across reloads, minimize stored personal information and clear it after resolution. Explain any reload limitation instead of risking a duplicate debit.
- Treat funding as a request for approval of externally verified funds. Do not show a fake payment gateway, arbitrary “add balance” button, or claim approval means a bank API was contacted.
- Provider/transfer reversals require supported permissions, explicit confirmation, and accurate backend evidence requirements. Do not describe an administrative confirmation checkbox as independently verified provider evidence.
- Insufficient balance, blocked wallet, duplicate reference, already decided request, and reversal conflicts need useful inline messages.

### Commission UI

Rules represent direct payouts funded by the tenant owner's wallet, not cumulative commission tiers. Support fixed paise and percentage basis-point inputs, actual operator/service/beneficiary roles, effective dates, and disabling rules. Display budget failures accurately. Do not sum percentages into invented margins or calculate credited earnings in the browser as if they were final. Existing transaction snapshots are not changed by editing rules.

## 12. Recharge and bill payment flows

### Recharge

1. Load permitted operators through the documented tenant catalogue endpoint.
2. Select service and matching enabled operator.
3. Validate account, amount, and operator bounds against actual validators. Avoid inventing universal account formats for all billers/services.
4. Present a review step with service, operator, masked account where appropriate, amount, and wallet context.
5. Submit with an Idempotency-Key and the exact recharge schema.
6. Treat HTTP 202 as accepted/pending, not successful payment.
7. Navigate to a transaction-status page and poll the supported detail endpoint while PENDING/PROCESSING, with backoff and sensible limits. Pause in hidden/offline states and provide manual refresh after long waits.
8. Show SUCCESS, FAILED, or REFUNDED only when returned by the backend. Distinguish a network error from definitive payment failure.

A provider timeout does not imply a refund. Preserve the pending reference and explain that reconciliation is in progress. Never trigger a new charge automatically to resolve an uncertain result. Do not repeatedly toast on every poll.

### Bills

First call `POST /api/bill-payments/inquiries` with the supported operator/account input. Show the returned amount, provider reference, and expiry. Submit payment with the same account/operator, exact returned amount, and `billId`. Bill inquiries are single-use and expire; handle consumption, expiry, or mismatch without silently requesting and paying another bill. Do not invent biller customer/address/fee fields that are absent from the response.

### Mock integration boundaries

The backend currently implements MOCK only. Known development account suffixes are 0000 for failure/refund, 9999 for ambiguous timeout, 8888 for pending, and other valid accounts for success. Mock bill inquiry currently returns 10,000 paise. Use these for documented testing, not as hidden application logic that manufactures a successful API response.

Any demonstration indication must come from explicit deployment configuration or confirmed provider context. Never put webhook signing secrets in the frontend or call signed provider webhooks from a browser. Pending callbacks can be simulated only through authorized backend testing tools.

## 13. API client, data state, and reporting

- Define typed API DTOs and validate important boundaries. Avoid pervasive `any` and unchecked response casts.
- Support both `{data,total,...}` pagination responses and documented plain arrays; do not assume every list is wrapped.
- Default page/limit are 1/20, maximum 100. Use server-provided totals where available. Do not fabricate total counts for array endpoints.
- Apply only supported backend query filters and sort parameters. If local filtering is offered, label it as filtering the currently loaded records.
- Keep table filters in URL search parameters where useful; never put credentials or sensitive account details there.
- Show errors from `{error:{code,issues?},requestId}` safely. Map validation issues to fields, expose request IDs for support, and handle non-JSON infrastructure errors.
- Handle 204 without attempting JSON parsing and handle 429 with measured retry guidance.
- Cancel obsolete requests when changing filters/routes, use bounded caching, and refresh relevant resources after mutations.
- Derive charts only from returned aggregates or explicitly labelled loaded data. Current reports do not provide complete historical time series.
- Show status categories faithfully: REFUNDED is not interchangeable with FAILED, and pending is not success.
- Never export records the user has not fetched or is not authorized to see. If CSV export is implemented, clearly state its scope and escape spreadsheet formula-leading cells.

## 14. Project structure

Use a modular structure similar to:

```text
src/
  app/
    providers.tsx
    router.tsx
  assets/
  components/
    ui/
    layout/
    data-table/
    feedback/
  features/
    auth/
    tenant-context/
    landing/
    platform/
    users/
    wallets/
    recharges/
    bill-payments/
    commissions/
    subscriptions/
    reports/
    notifications/
    support/
    settings/
  layouts/
  lib/
    api/
    money.ts
    permissions.ts
    query-keys.ts
  hooks/
  types/
  styles/
  main.tsx
tests/
  e2e/
docs/
```

Each substantial feature should separate API functions, types/validation, hooks, forms, and pages. Keep routing and permissions declarative. Avoid huge page components, duplicated auth clients, scattered endpoint strings, and copied money conversion logic.

Lazy-load substantial role areas and chart-heavy pages. Use an error boundary and useful fallback. Do not add a service worker that caches authenticated financial responses.

## 15. Environment, local development, and deployment

Create `.env.example` with public configuration only. Suggested variables, adjusted consistently to the implementation:

```dotenv
VITE_API_BASE_URL=/api
VITE_PLATFORM_HOSTS=localhost,platform.localhost
VITE_PLATFORM_NAME=Recharge Platform
VITE_DEMO_MODE=false
```

Define whether the API base includes `/api`; avoid double-prefix URLs. Parse comma-separated platform hostnames correctly. Do not put JWT signing secrets, provider keys, database URLs/credentials, webhook secrets, or reset-delivery credentials into any VITE variable.

For Vite proxy development, preserve the intended host context and document how Origin is handled by the backend's verified-domain rules. `changeOrigin: true` can change tenant resolution, so do not blindly enable it. Do not add wildcard CORS or a production DNS verification bypass to make local development appear to work.

Document exact platform/tenant hostname setup, ports, CORS allowlisting, shared API mapping, and secure-cookie behavior. The current backend defaults to port 3000; its generated local MongoDB configuration may use 27018. The frontend does not connect to MongoDB directly.

Use HTTPS in production. Explain cross-domain third-party-cookie restrictions and recommend same-host `/api` reverse proxy where appropriate. Configure SPA history fallback while preserving API routing. Provide build/preview scripts and a deployment example; add Docker/nginx packaging if useful for the target deployment.

Do not modify backend business logic, weaken authorization, bypass DNS verification, or invent new endpoints to complete a screen. Record integration gaps in `docs/BACKEND_GAPS.md`. If a gap blocks one capability, finish the independent supported work and explain the precise limitation.

## 16. Verification

Provide scripts for development, type checking, lint, unit/component tests, browser tests, production build, and preview.

Write meaningful tests for:

- Shared login validation and platform/tenant auth-prefix selection.
- All four role redirects and forbidden direct-route access.
- Unknown/unverified/suspended tenant handling.
- Single in-flight refresh, bounded retry, revoked sessions, logout, and reload behavior.
- Cache clearing and preventing data leakage between users/tenants.
- Exact rupee/paise and percent/basis-point conversion, including invalid and boundary inputs.
- User-creation permissions and downline action visibility.
- Duplicate-click prevention and stable idempotency keys on uncertain financial retries.
- Recharge acceptance versus success, failure/refund, and pending/timeout presentation.
- Bill inquiry expiry, single-use behavior, and exact payment amount.
- Funding self-approval restrictions and reversal confirmations.
- Array versus paginated list handling and field validation errors.
- Accessible dialogs, keyboard navigation, and responsive layouts.

Use MSW or equivalent isolated API fixtures for component tests. Fixtures must follow real contracts and must never silently replace production API calls. Keep them in test/development-only code.

Use Playwright to verify the landing/login at desktop and mobile widths, and representative workflows for each role. When permitted real test accounts and an isolated backend are available, run real API browser integration. Do not create or mutate production tenants or balances for testing. If credentials or DNS setup are unavailable, run contract-based tests, document the missing real integration evidence, and never claim live end-to-end verification.

Run TypeScript checks, lint, relevant tests, and production build; inspect the browser for console/runtime errors when browser tooling is available. Capture screenshots for review where possible. Fix issues found. A formatting-only check is not proof that a payment workflow works.

## 17. Implementation phases and deliverables

| Phase | Deliverables |
| --- | --- |
| 1 | Inspect backend, initialize frontend, establish design tokens, API client, tenant context |
| 2 | Finished responsive landing page, shared login UI, auth/profile/reset, guarded role shells |
| 3 | Wallet/ledger/funding/transfer components and full Retailer recharge/bill/status workflows |
| 4 | Distributor downline, management, earnings, reports, and support workflows |
| 5 | Super Admin users, finance, commissions, branding/domains/settings, and support management |
| 6 | Developer tenants, plans/subscriptions, domains, providers/operators, settings, audit, analytics |
| 7 | Notifications, report refinements, responsive/accessibility polish, full verification and handoff |

At each phase, report what changed, checks run, failures fixed, and remaining gaps. Continue automatically through all phases where possible. Later phases may refine earlier shared components; do not leave early placeholder screens in the final deliverable.

Create frontend documentation:

- `README.md`: install, environment, run/build/test, host setup, role login, and verification results.
- `docs/API_INTEGRATION.md`: actual endpoint mapping, response normalization, auth, errors, and idempotency.
- `docs/DESIGN_SYSTEM.md`: colors, typography, spacing, components, accessibility, tenant theming.
- `docs/DEPLOYMENT.md`: SPA/API routing, custom domains, TLS, CORS, cookies, environment.
- `docs/BACKEND_GAPS.md`: unsupported listing/data/auth capabilities and external integration dependencies.

## 18. Final acceptance criteria

- The landing page is attractive, modern, responsive, tenant-aware, and connected to the shared login experience.
- All four roles use the same login component; endpoint context and returned role determine authentication and routing.
- All supported role-specific workflows are implemented with real API integration, not static dashboard mockups.
- Permissions, tenant boundaries, money units, commission semantics, and payment state transitions match this backend.
- No fake success states, invented metrics, disconnected primary actions, leaked secrets, or production API replacement fixtures exist.
- Every page handles loading, empty, validation, forbidden, network, and relevant pending states.
- Forms, navigation, dialogs, tables, and dashboards are usable on mobile and with a keyboard.
- TypeScript, lint, automated tests, and production build pass; actual browser/integration evidence and limits are documented.
- Backend gaps are clearly identified, and no unsupported capability is presented as working.

Start by inspecting the backend and existing frontend workspace. Then implement the whole frontend systematically, beginning with the landing page and shared login. Do not stop after producing a plan or a visual prototype.
