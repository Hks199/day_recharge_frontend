# Day Recharge frontend

React, strict TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form/Zod, Lucide, Recharts, and Radix dialogs. Integrates with `../day_recharge_backend`, including backend-managed website content and S3 image upload authorization.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:5179` for the **platform**. The backend must accept `localhost` in `PLATFORM_HOSTS` and `http://localhost:5179` in `PLATFORM_ORIGINS`. Start the backend separately on port 3000. The frontend never connects to MongoDB.

The **Public website** editor uses one logo across the site and offers S3 uploads for the logo and home-page images. Set `S3_REGION`, `S3_BUCKET`, and `S3_PUBLIC_BASE_URL` in the backend environment, configure backend AWS credentials and bucket CORS, and restart the backend. Full instructions are in `../day_recharge_backend/docs/WEBSITE_IMAGES.md`. The editor uploads images before saving; **Save website** publishes their URLs. AWS credentials are never configured in the frontend.

Tenant access requires an actual DNS-verified domain in the backend and an active tenant/subscription. Map that verified hostname to your local frontend when developing, and configure Vite `server.allowedHosts` for that exact controlled hostname. Unknown domains deliberately fail closed. The browser supplies Origin; the frontend does not spoof it. See [deployment](docs/DEPLOYMENT.md).

All roles use `/login`: Developer on a platform hostname; Super Admin, Distributor, and Retailer on their verified tenant hostname. There is no registration, role selector, seeded password, or tenant impersonation. Receive credentials through your authorized administrator; bootstrap Developer through the backend CLI.

Access/CSRF tokens stay in memory. **Reload requires login again**, because the backend has no CSRF bootstrap endpoint. Other tabs sign out locally when the shared refresh cookie changes. Server logout is attempted; failure is explicitly reported. Uncertain financial requests retain their idempotency key and payload while the financial form remains open. After reload, a minimal reference guard directs the user to resolve the previous operation before submitting again.

```powershell
npm run typecheck
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npm run build
npm run preview
```

Run resource-intensive checks sequentially on memory-constrained Windows machines. Unit/component tests use isolated test fixtures; browser tests intercept API requests inside Playwright only. These fixtures are never bundled into the application. Screenshots are saved in `docs/screenshots`. No real accounts or financial records are created by frontend tests.

The backend currently supports MOCK only. No real bank collection, live recharge/BBPS integration, or public pricing endpoint is assumed. Password reset delivery requires backend configuration.

Documentation: [implementation checklist](docs/IMPLEMENTATION_CHECKLIST.md), [API integration](docs/API_INTEGRATION.md), [design system](docs/DESIGN_SYSTEM.md), [deployment](docs/DEPLOYMENT.md), [backend gaps](docs/BACKEND_GAPS.md), [verification](docs/VERIFICATION.md).

Public pages now require the backend website-content endpoints. Start the backend with `npm run dev` from `D:/day_recharge/day_recharge_backend` (with its configured MongoDB/Redis services available). Sign in as a platform or business owner and select **Public website** to edit branding, pages, navigation, and footer content. See [website content setup](../day_recharge_backend/docs/PUBLIC_WEBSITE.md). Existing content is provided as backend defaults and saved to MongoDB on the first publish.

Latest public website update: both projects passed production builds and ESLint; 40 backend integration tests and 49 frontend unit/component tests passed. All 38 browser scenarios were verified through the full run and a targeted navigation rerun, as recorded in [verification](docs/VERIFICATION.md). Browser flows use isolated API fixtures; backend integration uses an ephemeral MongoDB replica set.
