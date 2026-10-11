import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";
import { api } from "../../lib/api/client";
import { scopeKey } from "../../app/providers";
import { listSchema } from "../../types/contracts";
import { useFeedback } from "../../components/feedback/Feedback";
export function useResource<T>(
  path: string,
  schema: z.ZodType<T>,
  enabled = true,
) {
  return useQuery({
    queryKey: [...scopeKey(), path],
    queryFn: ({ signal }) => api.request(path, schema, { signal }),
    enabled,
  });
}
export function useRecords<T extends z.ZodType>(
  path: string,
  schema: T,
  filters: Record<string, string> = {},
  enabled = true,
) {
  const [params, setParams] = useSearchParams();
  const rawPage = Number(params.get("page") ?? "1");
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const query = new URLSearchParams({
    page: String(page),
    limit: "20",
    ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)),
  });
  const result = useResource(
    `${path}${path.includes("?") ? "&" : "?"}${query}`,
    listSchema(schema),
    enabled,
  );
  return {
    ...result,
    page,
    setPage: (next: number) =>
      setParams((p) => {
        p.set("page", String(next));
        return p;
      }),
  };
}
export function useCommand() {
  const client = useQueryClient();
  const notify = useFeedback();
  return async (
    path: string,
    body?: unknown,
    method = "POST",
    key?: string,
  ) => {
    const result = await api.request(path, z.unknown(), { method, body, key });
    await client.invalidateQueries({
      predicate: (q) =>
        q.queryKey[0] === window.location.host &&
        q.queryKey[2] === api.getSession()?.user.id,
    });
    if (path.startsWith("/tenant") || path === "/platform/settings")
      await client.invalidateQueries({
        queryKey: [window.location.host, "public-website"],
      });
    if (method !== "GET" && !key)
      notify(
        path === "/wallet/funding-requests"
          ? "Funding request submitted for approval."
          : "Request recorded by the server.",
      );
    return result;
  };
}
