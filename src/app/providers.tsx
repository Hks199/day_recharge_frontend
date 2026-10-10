import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { api, isPlatform } from "../lib/api/client";
import {
  publicConfigSchema,
  type PublicConfig,
  type User,
} from "../types/contracts";
import { ErrorPanel, Loading } from "../components/ui";
import { FeedbackProvider } from "../components/feedback/Feedback";
const AuthContext = createContext<{ user: User | null; clear: () => void }>({
  user: null,
  clear: () => {},
});
const BrandContext = createContext<PublicConfig>({
  name: "Day Recharge",
  features: [],
  support: {},
});
export const useAuth = () => useContext(AuthContext);
export const useBrand = () => useContext(BrandContext);
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      gcTime: 120000,
      retry: false,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});
export const scopeKey = () => [
  window.location.host,
  api.getSession()?.user.tenantId ?? "platform",
  api.getSession()?.user.id ?? "public",
];
function readableColor(hex: string) {
  const rgb = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722 > 0.179
    ? "#000000"
    : "#ffffff";
}
function Contexts({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(api.getSession()?.user ?? null);
  useEffect(() => {
    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("recharge-auth")
        : null;
    let identity = api.getSession()
      ? `${api.getSession()!.user.tenantId}:${api.getSession()!.user.id}`
      : null;
    api.onSession = (session) => {
      const next = session
        ? `${session.user.tenantId}:${session.user.id}`
        : null;
      if (!next || next !== identity) {
        void queryClient.cancelQueries();
        queryClient.clear();
      }
      identity = next;
      setUser(session?.user ?? null);
    };
    api.onRotate = () => channel?.postMessage("cookie-changed");
    if (channel) channel.onmessage = () => api.clear();
    return () => {
      channel?.close();
      api.onSession = () => {};
      api.onRotate = () => {};
    };
  }, []);
  const config = useQuery({
    queryKey: [window.location.host, "public-config"],
    queryFn: ({ signal }) =>
      api.request("/public/tenant-config", publicConfigSchema, {
        public: true,
        signal,
      }),
    enabled: !isPlatform,
  });
  const brand: PublicConfig = isPlatform
    ? {
        name: import.meta.env.VITE_PLATFORM_NAME ?? "Day Recharge",
        features: [],
        support: {},
      }
    : (config.data ?? { name: "Recharge", features: [], support: {} });
  useEffect(() => {
    document.title = brand.name;
    for (const [key, value] of [
      ["primary", brand.primaryColor],
      ["secondary", brand.secondaryColor],
    ] as const) {
      const valid =
        value && /^#[a-f\d]{6}$/i.test(value)
          ? value
          : key === "primary"
            ? "#2563eb"
            : "#0d9488";
      document.documentElement.style.setProperty(`--${key}`, valid);
      document.documentElement.style.setProperty(
        `--${key}-fg`,
        readableColor(valid),
      );
      document.documentElement.style.setProperty(
        `--${key}-text`,
        readableColor(valid) === "#ffffff" ? valid : "#0f172a",
      );
    }
  }, [brand.name, brand.primaryColor, brand.secondaryColor]);
  return (
    <AuthContext.Provider value={{ user, clear: () => api.clear() }}>
      <BrandContext.Provider value={brand}>
        {!isPlatform && config.isPending ? (
          <Loading full />
        ) : !isPlatform && config.isError ? (
          <div className="center-page">
            <ErrorPanel
              error={config.error}
              retry={() => void config.refetch()}
            />
          </div>
        ) : (
          children
        )}
      </BrandContext.Provider>
    </AuthContext.Provider>
  );
}
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <FeedbackProvider>
        <Contexts>{children}</Contexts>
      </FeedbackProvider>
    </QueryClientProvider>
  );
}
