# Deployment

Build with Node 24 and `npm ci && npm run build`. Serve `dist/` over HTTPS. Public build-time variables are listed in `.env.example`; the API base **includes `/api`**. Never put JWT keys, provider secrets, MongoDB URLs, webhook secrets or reset delivery credentials in VITE variables.

## Recommended same-host API routing

Serve frontend `/` and reverse-proxy `/api/` to the shared backend, preserving the validated original hostname. Configure the backend's exact trusted proxy addresses. Unknown domains must be rejected by the edge and backend. Set a separate vhost for each verified tenant domain, plus explicit platform hostnames. SPA history fallback must not intercept `/api`.

`deploy/nginx.conf` is a routing example for a controlled deployment. Replace the example server name and add TLS certificates; it is not a DNS verification bypass. Configure the backend with the actual edge's IP/CIDR and strip untrusted forwarded headers. `deploy/Dockerfile` packages the static frontend. Build variables must be provided at build time, not expected to change inside already compiled JavaScript.

## Shared API host

Use an absolute `VITE_API_BASE_URL=https://api.example.com/api`. Configure that API hostname under backend `SHARED_API_HOSTS`. Verified browser Origin mapping selects the tenant, and the token must still match. The application does not send X-Tenant-Domain or override Host/Origin. Tenant IDs cannot override scope. Configure exact `PLATFORM_HOSTS`/`PLATFORM_ORIGINS` for Developer requests to the platform API hostname.

Credentialed CORS requires an explicit allowed origin, never `*`. Refresh cookies use Secure/HttpOnly/SameSite=None over HTTPS; third-party cookies across unrelated domains may be blocked by browsers. Prefer same-host reverse proxy. Deliberate backend localhost HTTP development uses Lax cookies with COOKIE_SECURE=false. Do not use that setting in production.

## Local host setup

Vite listens on 5179 and proxies `/api` to `http://localhost:3000` with `changeOrigin:false`; intended Host and browser Origin remain intact. Backend defaults to port 3000. Existing backend MongoDB may use 27018; this frontend never connects directly.

For platform development, include `localhost` in backend PLATFORM_HOSTS, `http://localhost:5179` in PLATFORM_ORIGINS, and `localhost` in frontend VITE_PLATFORM_HOSTS. For another platform hostname such as platform.localhost, configure both sides explicitly. For a tenant, use a real DNS zone you control: obtain and publish the TXT challenge through the platform, verify it, map the verified hostname to loopback in your OS, and add that exact name to Vite server.allowedHosts. Backend CORS still requires a verified matching hostname; simply adding a hosts-file entry does not verify ownership. Never add wildcard allowedHosts/CORS or disable DNS checks.

Configure API and worker services separately, secure infrastructure, TLS renewal, and production operational verification in the backend deployment. The frontend does not start services or provision accounts automatically.
