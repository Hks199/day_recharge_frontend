import { createContext, useContext } from "react";
import { z } from "zod";
export const websiteBrandSchema = z.object({
  name: z.string(),
  logo: z.string(),
  authLogo: z.string(),
  tagline: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  address: z.string(),
  support: z.object({ email: z.string(), phone: z.string() }),
});
export const websiteSchema = z.object({
  revision: z.number().int(),
  brand: websiteBrandSchema,
  values: z.record(z.string(), z.string()),
});
export const websiteEditorSchema = websiteSchema.extend({
  fields: z.array(
    z.object({
      key: z.string(),
      group: z.string(),
      label: z.string(),
      type: z.enum(["text", "link", "image", "color", "date"]),
    }),
  ),
});
export type Website = z.infer<typeof websiteSchema>;
export const WebsiteContext = createContext<Website | null>(null);
export const websiteKey = () => [window.location.host, "public-website"];
export function useWebsite() {
  const website = useContext(WebsiteContext);
  if (!website) throw new Error("Website content has not loaded.");
  return {
    ...website,
    text: (key: string) =>
      (website.values[key] ?? "").replaceAll("{{brand}}", website.brand.name),
  };
}
