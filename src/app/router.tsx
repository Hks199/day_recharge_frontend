import { Component, Suspense, lazy, type ReactNode } from "react";
import {
  createBrowserRouter,
  Link,
  Navigate,
  Outlet,
  useLocation,
  useRouteError,
} from "react-router-dom";
import { useAuth } from "./providers";
import { allowedPath, homes } from "../lib/permissions";
import { Alert, Button, Card, ErrorPanel, Loading } from "../components/ui";
import type { Role } from "../types/contracts";
const Landing = lazy(() => import("../features/landing/Landing"));
const About = lazy(() => import("../features/landing/About"));
const Contact = lazy(() => import("../features/landing/Contact"));
const Terms = lazy(() => import("../features/landing/Terms"));
const Privacy = lazy(() => import("../features/landing/Privacy"));
const AuthPage = lazy(() => import("../features/auth/AuthPages"));
const RegisterPage = lazy(() => import("../features/auth/RegisterPage"));
const Shell = lazy(() => import("../components/layout/Shell"));
const Dashboard = lazy(() => import("../features/reports/Dashboard"));
function named<T extends Record<string, unknown>, K extends keyof T>(
  loader: () => Promise<T>,
  key: K,
) {
  return lazy(async () => ({
    default: (await loader())[key] as React.ComponentType,
  }));
}
const Profile = named(
  () => import("../features/auth/AuthPages"),
  "ProfilePage",
);
const Wallet = named(
  () => import("../features/wallets/WalletPages"),
  "WalletPage",
);
const Transfers = named(
  () => import("../features/wallets/WalletPages"),
  "TransfersPage",
);
const Funding = named(
  () => import("../features/wallets/WalletPages"),
  "FundingPage",
);
const Payments = named(
  () => import("../features/recharges/PaymentPages"),
  "PaymentsPage",
);
const Transactions = named(
  () => import("../features/recharges/PaymentPages"),
  "TransactionsPage",
);
const TransactionDetail = named(
  () => import("../features/recharges/PaymentPages"),
  "TransactionDetail",
);
const Users = named(() => import("../features/users/UserPages"), "UsersPage");
const UserDetail = named(
  () => import("../features/users/UserPages"),
  "UserDetail",
);
const Commissions = named(
  () => import("../features/commissions/CommissionPages"),
  "CommissionsPage",
);
const Rules = named(
  () => import("../features/commissions/CommissionPages"),
  "RulesPage",
);
const Support = named(
  () => import("../features/support/SupportPages"),
  "SupportPage",
);
const Notifications = named(
  () => import("../features/support/SupportPages"),
  "NotificationsPage",
);
const Settings = named(
  () => import("../features/settings/SettingsPages"),
  "SettingsPage",
);
const Domains = named(
  () => import("../features/settings/SettingsPages"),
  "DomainsPage",
);
const Tenants = named(
  () => import("../features/platform/PlatformPages"),
  "TenantsPage",
);
const TenantDetail = named(
  () => import("../features/platform/PlatformPages"),
  "TenantDetail",
);
const Plans = named(
  () => import("../features/platform/PlatformPages"),
  "PlansPage",
);
const Subscriptions = named(
  () => import("../features/platform/PlatformPages"),
  "SubscriptionsPage",
);
const Providers = named(
  () => import("../features/platform/PlatformPages"),
  "ProvidersPage",
);
const Operators = named(
  () => import("../features/platform/PlatformPages"),
  "OperatorsPage",
);
const Audit = named(
  () => import("../features/platform/PlatformPages"),
  "AuditPage",
);
export function Guard({ role }: { role: Role }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user)
    return (
      <Navigate
        to={`/login?reason=session&returnTo=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  if (
    user.role !== role ||
    !allowedPath(location.pathname.slice(homes[role].length + 1), role)
  )
    return <Forbidden />;
  return <Outlet />;
}
export function Forbidden() {
  const { user } = useAuth();
  return (
    <div className="center-page">
      <Card>
        <p className="eyebrow">403 · ACCESS RESTRICTED</p>
        <h1>This page is outside your role.</h1>
        <p>Your account can access the pages in your own workspace.</p>
        <Link
          className="btn btn-primary"
          to={user ? `${homes[user.role]}/dashboard` : "/login"}
        >
          Back to your workspace
        </Link>
      </Card>
    </div>
  );
}
function NotFound() {
  return (
    <div className="center-page">
      <Card>
        <p className="eyebrow">404 · PAGE NOT FOUND</p>
        <h1>Let’s get you back on track.</h1>
        <p>This page does not exist.</p>
        <Link className="btn btn-primary" to="/">
          Back to home
        </Link>
      </Card>
    </div>
  );
}
function RouteError() {
  const error = useRouteError();
  return (
    <div className="center-page">
      <Card>
        <h1>This page could not load.</h1>
        <ErrorPanel error={error} />
        <Button onClick={() => window.location.reload()}>Reload page</Button>
      </Card>
    </div>
  );
}
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="center-page">
        <Alert>
          Something went wrong while displaying this page. Reload to sign in
          again.
        </Alert>
        <Button onClick={() => window.location.reload()}>Reload</Button>
      </div>
    ) : (
      this.props.children
    );
  }
}
const pages = [
  { path: "dashboard", element: <Dashboard /> },
  { path: "profile", element: <Profile /> },
  { path: "wallet", element: <Wallet /> },
  { path: "transfers", element: <Transfers /> },
  { path: "funding", element: <Funding /> },
  { path: "payments", element: <Payments /> },
  { path: "transactions", element: <Transactions /> },
  { path: "transactions/:id", element: <TransactionDetail /> },
  { path: "users", element: <Users /> },
  { path: "users/:id", element: <UserDetail /> },
  { path: "commissions", element: <Commissions /> },
  { path: "rules", element: <Rules /> },
  { path: "support", element: <Support /> },
  { path: "notifications", element: <Notifications /> },
  { path: "settings", element: <Settings /> },
  { path: "domains", element: <Domains /> },
  { path: "tenants", element: <Tenants /> },
  { path: "tenants/:id", element: <TenantDetail /> },
  { path: "plans", element: <Plans /> },
  { path: "subscriptions", element: <Subscriptions /> },
  { path: "providers", element: <Providers /> },
  { path: "operators", element: <Operators /> },
  { path: "audit", element: <Audit /> },
];
export const router = createBrowserRouter([
  {
    element: (
      <Boundary>
        <Suspense fallback={<Loading full />}>
          <Outlet />
        </Suspense>
      </Boundary>
    ),
    errorElement: <RouteError />,
    children: [
      { path: "/", element: <Landing /> },
      { path: "/aboutus", element: <About /> },
      { path: "/contactus", element: <Contact /> },
      { path: "/terms", element: <Terms /> },
      { path: "/privacy", element: <Privacy /> },
      { path: "/term", element: <Navigate to="/terms" replace /> },
      { path: "/login", element: <AuthPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/forgot-password", element: <AuthPage mode="forgot" /> },
      { path: "/reset-password", element: <AuthPage mode="reset" /> },
      ...Object.entries(homes).map(([role, home]) => ({
        path: home,
        element: <Guard role={role as Role} />,
        children: [{ element: <Shell />, children: pages }],
      })),
      { path: "*", element: <NotFound /> },
    ],
  },
]);
