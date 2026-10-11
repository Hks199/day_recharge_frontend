import { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Activity,
  Bell,
  Building2,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  FileClock,
  Globe2,
  Headphones,
  LayoutDashboard,
  LogOut,
  Menu,
  Network,
  PanelLeftClose,
  ReceiptText,
  Settings,
  ShieldCheck,
  Smartphone,
  UserCircle,
  Wallet,
  X,
  ArrowLeftRight,
} from "lucide-react";
import { Brand } from "../../features/landing/Landing";
import { useAuth } from "../../app/providers";
import { api } from "../../lib/api/client";
import { homes, navigation, roleLabel } from "../../lib/permissions";
import { Button, Confirm, OnlineState } from "../ui";
const icons = {
  dashboard: LayoutDashboard,
  payments: Smartphone,
  transactions: ReceiptText,
  users: Network,
  wallet: Wallet,
  transfers: ArrowLeftRight,
  funding: CreditCard,
  commissions: CircleDollarSign,
  rules: ShieldCheck,
  support: Headphones,
  notifications: Bell,
  plans: Building2,
  subscriptions: FileClock,
  providers: Activity,
  audit: FileClock,
  domains: Globe2,
  settings: Settings,
  profile: UserCircle,
};
export default function Shell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false),
    [collapsed, setCollapsed] = useState(false);
  const location = useLocation(),
    navigate = useNavigate();
  const drawerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const drawer = drawerRef.current;
    const focusable = () =>
      Array.from(
        drawer?.querySelectorAll<HTMLElement>(
          "a[href],button:not([disabled])",
        ) ?? [],
      ).filter((el) => el.getClientRects().length > 0);
    focusable()[0]?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab") return;
      const items = focusable(),
        first = items[0],
        last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", keyboard);
    return () => {
      document.removeEventListener("keydown", keyboard);
      previous?.focus();
    };
  }, [open]);
  if (!user) return null;
  const home = homes[user.role];
  const active = navigation.find((n) =>
    location.pathname.startsWith(`${home}/${n.path}`),
  );
  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      {open && (
        <button
          className="drawer-backdrop"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        ref={drawerRef}
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
        className={`sidebar ${open ? "drawer-open" : ""}`}
        aria-label="Workspace navigation"
      >
        <Link to={`${home}/dashboard`} className="sidebar-brand">
          <Brand inverse />
        </Link>
        <div className="sidebar-context">
          <span className="context-dot" />
          {roleLabel[user.role]} workspace
        </div>
        <Button
          className="drawer-close"
          variant="ghost"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        >
          <X size={20} />
        </Button>
        <nav aria-label="Workspace">
          {navigation
            .filter((n) => n.roles.includes(user.role))
            .map((n) => {
              const Icon = icons[n.icon as keyof typeof icons];
              return (
                <NavLink
                  title={n.label}
                  key={n.path}
                  to={`${home}/${n.path}`}
                  onClick={() => setOpen(false)}
                >
                  <Icon size={19} />
                  <span>{n.label}</span>
                </NavLink>
              );
            })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-security">
            <ShieldCheck size={19} />
            <span>
              Scoped to your business
              <br />
              <small>Permissions stay with your account</small>
            </span>
          </div>
          <Button
            variant="ghost"
            className="collapse-button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Toggle sidebar width"
          >
            <PanelLeftClose size={18} />
            <span>Collapse sidebar</span>
          </Button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <Button
              variant="ghost"
              className="mobile-menu"
              aria-label="Open navigation"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <Menu size={22} />
            </Button>
            <span className="breadcrumb">
              Workspace <ChevronRight size={14} />{" "}
              <strong>{active?.label ?? "Details"}</strong>
            </span>
          </div>
          <div className="topbar-right">
            {user.role !== "DEVELOPER" && (
              <Link
                className="icon-button"
                to={`${home}/notifications`}
                aria-label="Notifications"
              >
                <Bell size={20} />
              </Link>
            )}
            <Link to={`${home}/profile`} className="account-chip">
              <span>{user.name.slice(0, 1)}</span>
              <div>
                {user.name}
                <small>{roleLabel[user.role]}</small>
              </div>
            </Link>
            <Confirm
              title="Sign out?"
              description="Your local access will be cleared and the server will be asked to revoke this session."
              onConfirm={async () => {
                let failed = false;
                try {
                  await api.logout();
                } catch {
                  failed = true;
                }
                navigate(`/login${failed ? "?logout=unconfirmed" : ""}`, {
                  replace: true,
                  flushSync: true,
                });
              }}
            >
              {
                <>
                  <LogOut size={17} />
                  <span className="sr-only">Sign out</span>
                </>
              }
            </Confirm>
          </div>
        </header>
        <main id="main-content" className="workspace-main">
          <OnlineState />
          {import.meta.env.VITE_DEMO_MODE === "true" && (
            <div className="demo-banner">
              Demonstration deployment · Provider outcomes are simulated by the
              backend.
            </div>
          )}
          <Outlet />
        </main>
        <footer className="workspace-footer">
          Your business workspace{" "}
          <span>Amounts in INR · Status confirmed by server</span>
        </footer>
      </div>
    </div>
  );
}
