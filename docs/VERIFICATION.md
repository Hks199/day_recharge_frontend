# Verification evidence

Verified on 10 October 2026 in the supplied Windows workspace.

| Check | Evidence |
| --- | --- |
| TypeScript | Strict `tsc --noEmit` passed; also part of production build |
| ESLint | `npm run lint` passed |
| Unit / component | 49 tests passed across 3 files (Vitest, RTL, MSW) |
| Browser | 17 Chromium flows passed against the development build; all 17 also passed against the final production preview |
| Production | `npm run build` passed, with lazy feature/chart chunks and separate React/validation vendors |
| Dependency audit | `npm audit` reported zero vulnerabilities after upgrading the test toolchain |
| Real backend, read-only | `/api/openapi.json`, `/api/docs/`, and `/ready` responded HTTP 200; ready status confirmed |
| Visual review | Landing/login screenshots at 360, 768, 1024 and 1440px; all four mobile dashboards inspected through browser automation; desktop landing and mobile Retailer screenshot visually reviewed |

Screenshots are in [screenshots](screenshots). The running backend's public contract is preserved in [backend-openapi.json](backend-openapi.json). Tests never replace production API calls: MSW exists only in test imports, and browser interception is installed only by Playwright fixtures. Unexpected fixture paths and cross-scope platform/tenant calls fail the browser tests.

## Covered behaviors

- Login email/password validation, password visibility, keyboard submission, no minimum new-account complexity at login, platform/tenant prefix selection, four role redirects and forbidden routes.
- Unknown/unverified, suspended, inactive-subscription and disallowed-origin states fail closed.
- Single refresh flight, late old-token responses, bounded retry, revoked sessions, refresh failure, reload requiring login, logout failure/local cleanup, and cross-tab sign-out.
- Cache clearing on sign-out and preventing financial replay with another user's replacement credentials.
- Exact rupee/paise conversion, safe-integer boundary, invalid decimals and percentages/basis points.
- User creation matrix, authorized direct Retailer management, nested tenant owner input and selected plan.
- Duplicate-submit lock, immutable financial payloads and preserved idempotency reference after uncertain network failure.
- 202 acceptance versus definitive SUCCESS/FAILED/REFUNDED receipts; backend bill amount/reference submitted exactly; inquiry expiry/consumption validation.
- Funding self-approval restrictions; explicit attestation, confirmation focus management, and server field issues/support IDs.
- Array versus paginated normalization without invented totals, responsive navigation and no page-level overflow.

## Integration limits

No permitted real account credentials or isolated authenticated backend were supplied. Authenticated browser tests use contract fixtures; they do **not** demonstrate real refresh-cookie rotation, DNS verification, MongoDB/BullMQ settlement, banking evidence, external reset delivery, or live provider integration. Those require controlled accounts and deployment configuration. Real backend reads prove reachability and contract availability only.

Initial concurrent checks exhausted available host memory. Sequential checks and single-worker tests succeeded. An unrelated application already used localhost's IPv6 port 5173, so this frontend uses **5179**. Initial browser fixtures also matched a source module path containing `/api/`; interception was corrected to match only API pathname prefixes. Component tests caught and verified the fix for dialog focus restoration. Dependency annotation comments in the installed Zod build produce harmless Rollup warnings; the build succeeds and no chunk exceeds the configured 500 kB warning threshold.

Production preview browser result: **17/17 passed** against the final built artifacts. Docker/nginx packaging is supplied as a deployment example and was not executed in this frontend verification.
