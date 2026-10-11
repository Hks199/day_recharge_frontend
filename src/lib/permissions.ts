import type { Role, User } from "../types/contracts";
export const homes: Record<Role, string> = {
  DEVELOPER: "/platform",
  SUPER_ADMIN: "/admin",
  DISTRIBUTOR: "/distributor",
  RETAILER: "/retailer",
};
export const roleLabel: Record<Role, string> = {
  DEVELOPER: "Platform owner",
  SUPER_ADMIN: "Business owner",
  DISTRIBUTOR: "Distributor",
  RETAILER: "Retailer",
};
export const canCreate = (role: Role, target: Role) =>
  (role === "SUPER_ADMIN" && ["DISTRIBUTOR", "RETAILER"].includes(target)) ||
  (role === "DISTRIBUTOR" && target === "RETAILER");
export const canManage = (actor: User, target: User) =>
  target.role !== "SUPER_ADMIN" &&
  actor.id !== target.id &&
  (actor.role === "SUPER_ADMIN" ||
    (actor.role === "DISTRIBUTOR" &&
      target.role === "RETAILER" &&
      target.parentId === actor.id));
export function safeReturnTo(value: string | null, role: Role) {
  const base = homes[role];
  if (
    !value ||
    !value.startsWith(`${base}/`) ||
    value.includes("\\") ||
    value.includes("//") ||
    !allowedPath(value.slice(base.length + 1).split("?")[0], role)
  )
    return `${base}/dashboard`;
  return value;
}
export type NavItem = {
  path: string;
  label: string;
  icon: string;
  roles: Role[];
};
const tenant: Role[] = ["SUPER_ADMIN", "DISTRIBUTOR", "RETAILER"];
const managers: Role[] = ["SUPER_ADMIN", "DISTRIBUTOR"];
export const navigation: NavItem[] = [
  { path: 'website', label: 'Public website', icon: 'domains', roles: ['DEVELOPER', 'SUPER_ADMIN'] },
  {
    path: "dashboard",
    label: "Overview",
    icon: "dashboard",
    roles: [...tenant, "DEVELOPER"],
  },
  {
    path: "payments",
    label: "Recharge & bills",
    icon: "payments",
    roles: ["RETAILER"],
  },
  {
    path: "transactions",
    label: "Transactions",
    icon: "transactions",
    roles: tenant,
  },
  { path: "users", label: "Business network", icon: "users", roles: managers },
  { path: "wallet", label: "Wallet & ledger", icon: "wallet", roles: tenant },
  { path: "transfers", label: "Transfers", icon: "transfers", roles: tenant },
  {
    path: "funding",
    label: "Funding requests",
    icon: "funding",
    roles: [...tenant, "DEVELOPER"],
  },
  {
    path: "commissions",
    label: "Commission records",
    icon: "commissions",
    roles: tenant,
  },
  {
    path: "rules",
    label: "Commission rules",
    icon: "rules",
    roles: ["SUPER_ADMIN"],
  },
  { path: "support", label: "Support tickets", icon: "support", roles: tenant },
  {
    path: "notifications",
    label: "Notifications",
    icon: "notifications",
    roles: tenant,
  },
  { path: "tenants", label: "Businesses", icon: "users", roles: ["DEVELOPER"] },
  {
    path: "plans",
    label: "Subscription plans",
    icon: "plans",
    roles: ["DEVELOPER"],
  },
  {
    path: "subscriptions",
    label: "Subscriptions",
    icon: "subscriptions",
    roles: ["DEVELOPER"],
  },
  {
    path: "providers",
    label: "Providers",
    icon: "providers",
    roles: ["DEVELOPER"],
  },
  {
    path: "operators",
    label: "Create operator",
    icon: "payments",
    roles: ["DEVELOPER"],
  },
  { path: "audit", label: "Audit trail", icon: "audit", roles: ["DEVELOPER"] },
  {
    path: "domains",
    label: "Custom domains",
    icon: "domains",
    roles: ["SUPER_ADMIN"],
  },
  {
    path: "settings",
    label: "Settings",
    icon: "settings",
    roles: ["DEVELOPER", "SUPER_ADMIN"],
  },
  {
    path: "profile",
    label: "My account",
    icon: "profile",
    roles: [...tenant, "DEVELOPER"],
  },
];
export function allowedPath(path: string, role: Role) {
  return navigation.some(
    (n) =>
      n.roles.includes(role) &&
      (path === n.path || path.startsWith(`${n.path}/`)),
  );
}
