# API integration

`VITE_API_BASE_URL` includes `/api` (default `/api`). Client paths omit that prefix. API requests use one `ApiClient` with credentials included, a 25-second timeout, runtime Zod validation at read boundaries, and normalized infrastructure errors. S3 image bytes are sent separately using the authorized POST fields, with credentials omitted and a 120-second timeout. No request supplies Host, Origin, or tenant IDs as authority. Tenant IDs appear only where an explicit platform contract requires them.

## Authentication

Configured platform hostnames select `/platform/auth` and load `/platform/public/website`; all other hosts require the domain-scoped `/public/website` endpoint and select `/auth`. Credentials are never retried against another prefix. Login/refresh normalize `user.id` and model `_id`. Unknown roles are rejected. Roles redirect to `/platform/dashboard`, `/admin/dashboard`, `/distributor/dashboard`, or `/retailer/dashboard`. Guards apply to role and permitted route, including direct URL entry.

Bearer and CSRF tokens remain in memory, refresh remains an HTTP-only cookie. Protected 401s share one refresh flight; a late response with an old bearer retries with the replacement token. Explicit revocation clears the session. A retry is bounded to one; 403 and auth endpoints never enter a refresh loop. Web Locks serialize refresh cookie rotation across tabs, and BroadcastChannel invalidates other tabs when the cookie changes. No automatic reload restoration exists because no CSRF bootstrap endpoint exists. Logout calls the backend and clears local credentials/cache even on network failure, with an unconfirmed-revocation message.

Private query keys include deployment host, authenticated tenant ID, and user ID. Private queries and mutations are cleared on logout and identity change. Only the host's public website query is retained, so authentication does not unmount public branding or interrupt navigation. Response completion cannot deliver another user's protected data after identity changes. Profile supports only name/phone, password change revokes sessions, DELETE sessions signs out, reset request uses the generic success message only after API acceptance. Reset token URL is removed immediately after capture, without analytics.

## Page mapping

Website editor field definitions come from the owner GET endpoint and include a stable key plus a readable label, section, description, and optional example. The UI uses these definitions for grouping, search, accessible labels, and readable validation errors; only `{ revision, brand, values }` is sent when publishing. The backend formats visible Terms/Privacy dates from their effective-date inputs. Platform and tenant editors retain their separate endpoints and authenticated cache scopes.

| UI                                  | Endpoint paths relative to API base                                                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public website and branding          | GET `/platform/public/website` or `/public/website`, selected by host |
| Public website editor                | GET/PATCH `/platform/website` (DEVELOPER) or `/tenant/website` (SUPER_ADMIN), with revision checks |
| Website image upload authorization | POST `/platform/website/images/upload` or `/tenant/website/images/upload`; returns S3 POST fields and permanent image URL |
| Shared login/profile/security/reset | `/auth/*` or `/platform/auth/*` matching deployment                                                                                                     |
| Tenant dashboard                    | GET `/reports/dashboard`, GET `/wallet`, GET `/recharges`                                                                                               |
| Developer dashboard                 | GET `/platform/dashboard` only; never tenant wallet/notifications                                                                                       |
| Network                             | GET `/users`, GET `/users/:id`, GET `/users/:id/downline`; POST `/users/distributors` or `/users/retailers`; PATCH `/users/:id` and `/users/:id/status` |
| Wallet                              | GET `/wallet`, GET `/wallet/ledger?userId=...`; PATCH `/wallet/:userId/status`                                                                          |
| Transfers                           | GET/POST `/wallet/transfers`; POST `/wallet/transfers/:id/reverse`                                                                                      |
| Funding                             | GET/POST `/wallet/funding-requests`; POST `/wallet/funding-requests/:id/decision` (owner downline only)                                                 |
| Developer funding decision          | POST `/platform/tenants/:id/funding-requests/:fundingId/decision` with external attestation                                                             |
| Recharge                            | GET `/recharges/operators`; POST `/recharges`; GET `/recharges/:id`                                                                                     |
| Bills                               | POST `/bill-payments/inquiries`, POST `/bill-payments` with exact inquiry amount/account/operator/billId                                                |
| Transactions/receipt                | GET `/recharges?status=&from=&to=&page=&limit=`, GET `/recharges/:id`; POST `/recharges/:id/reverse`                                                    |
| Commissions                         | GET `/commissions/records`; owner GET/POST `/commissions/rules`, PATCH `/commissions/rules/:id` to INACTIVE                                             |
| Support                             | GET/POST `/support-tickets`; owner PATCH `/support-tickets/:id` with status and response                                                                |
| Notifications                       | GET `/notifications`, PATCH `/notifications/:id/read`                                                                                                   |
| Business settings                   | GET `/tenant`, GET/PATCH `/tenant/settings`, PATCH `/tenant/branding`                                                                                   |
| Tenant domains                      | GET/POST `/tenant/domains`, POST `/:id/verify`, PATCH `/:id/primary`, DELETE `/:id`                                                                     |
| Platform tenants                    | GET/POST `/platform/tenants`, GET `/:id`, PATCH `/:id/status`; owner input is nested                                                                    |
| Platform domains                    | `/platform/tenants/:id/domains` and `/:domainId/verify`, `/:domainId/primary`, DELETE `/:domainId`                                                      |
| Plans                               | GET/POST `/platform/plans`, PATCH `/platform/plans/:id`                                                                                                 |
| Subscriptions                       | GET `/platform/subscriptions?tenantId=...`, POST same prefix with dates                                                                                 |
| Providers/operators                 | GET/POST `/platform/providers`, PATCH `/:id` enabled; POST `/platform/operators` only                                                                   |
| Global settings/audit               | GET/PATCH `/platform/settings`, GET `/platform/audit-logs`                                                                                              |

## Financial semantics

Money is integer paise, percentage is integer basis points. Decimal parsing uses BigInt/string arithmetic, never floating-point request conversion. Request maximum is 1,000,000,000 paise. Commission value maximum is 10,000 for either FIXED paise or PERCENTAGE basis points. Owner-funded direct payouts are never presented as cumulative tiers.

Transfers and payments require review. A `FinancialIntent` clones the payload and creates one UUID (or cryptographically random 128-bit fallback) Idempotency-Key. No automatic financial mutation retry occurs. An uncertain error keeps the same payload/key and permits explicit retry. Response shape is validated before resolving the intent. Wallet data is refetched after mutations; it is never optimistically edited. A sessionStorage guard contains only the key, scoped by host/user, not an account or token. Navigating away, closing, or reloading loses the payload; the user must reconcile the reference with history/support. Funding is a request for externally verified funds. The approval checkbox is an administrative attestation, not independently verified evidence.

202 means acceptance, not success. Detail queries poll PENDING/PROCESSING with 3–15 second backoff for up to 3 minutes, pause in hidden/offline tabs, and expose manual refresh. A provider timeout never initiates a second charge/refund. Bills are single-use; the exact fetched amount and reference are submitted. The backend rechecks expiry/consumption at acceptance.

## Lists, errors, and reporting

Both arrays and `{data,total,...}` lists are normalized. Array lists never invent a total; Next uses page capacity and can end on an empty page. Default page/limit is 1/20. User filters are role/status/sort/direction; transaction filters are status/from/to; ledger userId and subscription tenantId are the other explicit filters. Search parameters never contain credentials/account numbers. Queries forward cancellation signals. No CSV export or service worker caches private financial data.

Errors include safe human-readable code messages, field issues, and request IDs. 204 skips JSON parsing; non-JSON gateway errors are normalized; 429 asks users to wait. Charts show only actual status aggregates, not invented growth/revenue. Tenant total wallet balance is explicitly separate from the owner's spendable wallet.
