# Backend gaps and external dependencies

These are explicit integration limits, not invented frontend endpoints:

- No CSRF bootstrap endpoint. After reload, memory-only access/CSRF tokens are unavailable, so login is required. The frontend does not persist tokens or attempt dummy-token refresh.
- Developer has no funding-request listing/detail API. The platform exposes only an explicit tenant/request-ID decision form with operational evidence attestation. Amount and beneficiary cannot be independently inspected through a platform API.
- Developer has no operator list/edit endpoint. Operator creation returns a record, displayed for saving its ID. Tenant catalogue APIs are never called with a Developer token.
- No support ticket detail API. Full returned ticket messages/responses are displayed from the authorized paginated list.
- No arbitrary user balance API. Authorized downline ledger access does not claim to reveal current wallet balance. Owner dashboard aggregate wallets are labelled separately from own spendable wallet.
- No historical reporting series or revenue endpoint. Charts show real current status distributions only.
- Plain-array list APIs provide no total. The UI shows loaded record counts, bounds each page, and never fabricates totals. Plan API returns at most 100 plans. Provider/domain lists return the documented array.
- Domain challenge secrets are returned only on add, not later list. The add result shows TXT instructions and asks operators to save them. Existing lost challenge values cannot be recovered from the frontend.
- Settings cannot rename a tenant or edit arbitrary public feature flags; only actual branding and operational support/service fields are editable. Empty optional support-email removal is not supported by the current validator; omitting it preserves an existing value.
- Only MOCK payment provider exists. Live recharge/BBPS agreements, provider credentials, certification, and validation remain external deployment dependencies. Development suffixes 0000 (failure/refund), 9999 (ambiguous), 8888 (pending) are backend testing behavior only; no frontend response is manufactured.
- Bank funding/reversals are audited manual workflows, not banking/cancellation integrations. Subscription assignment does not collect payments or issue invoices.
- Reset delivery returns 503 unless the backend delivery service is configured. The frontend displays that failure and never claims an email was sent.
- DNS verification, TLS, cookie/CORS and verified hostname setup are required for tenant integration. No bypass was added.

No permitted real test credentials were supplied. Browser automation uses isolated API fixtures. Actual authenticated, worker/provider, cookie, DNS and financial end-to-end integration is not claimed verified by frontend tests.
