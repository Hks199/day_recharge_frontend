import { z } from "zod";
export const roles = [
  "DEVELOPER",
  "SUPER_ADMIN",
  "DISTRIBUTOR",
  "RETAILER",
] as const;
export type Role = (typeof roles)[number];
export const services = [
  "MOBILE",
  "DTH",
  "POSTPAID",
  "ELECTRICITY",
  "BBPS",
] as const;
export const serviceSchema = z.enum(services);
export type Service = z.infer<typeof serviceSchema>;
const base = {
  _id: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
};
export const userSchema = z
  .object({
    id: z.string().optional(),
    _id: z.string().optional(),
    name: z.string(),
    role: z.enum(roles),
    tenantId: z.string().nullable().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    parentId: z.string().nullable().optional(),
    status: z.string().optional(),
  })
  .transform((u) => {
    const id = u.id ?? u._id;
    if (!id) throw new Error("Invalid user identifier");
    return { ...u, id };
  });
export type User = z.infer<typeof userSchema>;
export const sessionSchema = z.object({
  accessToken: z.string(),
  csrfToken: z.string(),
  expiresIn: z.number(),
  user: userSchema,
  requestId: z.string().optional(),
});
export type Session = z.infer<typeof sessionSchema>;
export const publicConfigSchema = z.object({
  name: z.string(),
  logo: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  domain: z.string().optional(),
  features: z.array(z.string()).default([]),
  support: z
    .object({ email: z.string().optional(), phone: z.string().optional() })
    .default({}),
});
export type PublicConfig = z.infer<typeof publicConfigSchema>;
export const walletSchema = z.object({
  ...base,
  userId: z.string(),
  balanceMinor: z.number().int(),
  currency: z.literal("INR"),
  status: z.string(),
});
export const operatorSchema = z.object({
  ...base,
  name: z.string(),
  code: z.string(),
  serviceType: serviceSchema,
  providerId: z.string(),
  minMinor: z.number().int(),
  maxMinor: z.number().int(),
  enabled: z.boolean(),
});
export type Operator = z.infer<typeof operatorSchema>;
export const transactionSchema = z.object({
  ...base,
  userId: z.string(),
  operatorId: z.string(),
  serviceType: serviceSchema,
  amountMinor: z.number().int(),
  status: z.enum(["PENDING", "PROCESSING", "SUCCESS", "FAILED", "REFUNDED"]),
  providerTransactionId: z.string().optional(),
  failureReason: z.string().optional(),
  idempotencyKey: z.string().optional(),
});
export type Transaction = z.infer<typeof transactionSchema>;
export const billSchema = z.object({
  ...base,
  operatorId: z.string(),
  amountMinor: z.number().int(),
  providerReference: z.string(),
  expiresAt: z.string(),
  consumedAt: z.string().optional(),
});
export type Bill = z.infer<typeof billSchema>;
export const tenantSchema = z.object({
  ...base,
  name: z.string(),
  slug: z.string(),
  ownerId: z.string(),
  status: z.string(),
  subscriptionId: z.string().optional(),
  branding: z
    .object({
      logo: z.string().optional(),
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
    })
    .optional(),
});
export const planSchema = z.object({
  ...base,
  name: z.string(),
  priceMinor: z.number().int(),
  durationDays: z.number().int(),
  features: z.array(z.string()),
  active: z.boolean(),
});
export const providerSchema = z.object({
  ...base,
  name: z.string(),
  code: z.string(),
  enabled: z.boolean(),
});
export const domainSchema = z.object({
  ...base,
  hostname: z.string(),
  verifiedAt: z.string().optional(),
  primary: z.boolean(),
});
export const challengeSchema = z.object({
  id: z.string(),
  hostname: z.string(),
  txtName: z.string(),
  txtValue: z.string(),
});
export const fundingSchema = z.object({
  ...base,
  userId: z.string(),
  amountMinor: z.number().int(),
  reference: z.string(),
  status: z.string(),
});
export const transferSchema = z.object({
  ...base,
  fromUserId: z.string(),
  toUserId: z.string(),
  amountMinor: z.number().int(),
  reversedAt: z.string().optional(),
});
export const ledgerSchema = z.object({
  ...base,
  userId: z.string(),
  entryType: z.string(),
  amountMinor: z.number().int(),
  balanceBeforeMinor: z.number().int(),
  balanceAfterMinor: z.number().int(),
  reference: z.string().optional(),
});
export const commissionSchema = z.object({
  ...base,
  beneficiaryUserId: z.string(),
  transactionId: z.string(),
  amountMinor: z.number().int(),
  status: z.string(),
});
export const ruleSchema = z.object({
  ...base,
  operatorId: z.string(),
  serviceType: serviceSchema,
  beneficiaryRole: z.string(),
  calculationType: z.string(),
  commissionValue: z.number().int(),
  effectiveFrom: z.string(),
  effectiveTo: z.string().optional(),
  status: z.string(),
});
export const ticketSchema = z.object({
  ...base,
  userId: z.string(),
  subject: z.string(),
  message: z.string(),
  status: z.string(),
  response: z.string().optional(),
});
export const notificationSchema = z.object({
  ...base,
  title: z.string(),
  message: z.string(),
  readAt: z.string().optional(),
  reference: z.string().optional(),
});
export const subscriptionSchema = z.object({
  ...base,
  tenantId: z.string(),
  planId: z.string(),
  startAt: z.string(),
  endAt: z.string(),
  status: z.string(),
});
export const auditSchema = z.object({
  ...base,
  actorId: z.string().optional(),
  action: z.string(),
  targetId: z.string().optional(),
  requestId: z.string().optional(),
});
export const settingsSchema = z.object({
  enabledServices: z.array(serviceSchema),
  supportEmail: z.string().optional(),
  supportPhone: z.string().optional(),
  maxRechargeMinor: z.number().int().optional(),
});
const group = z.object({
  _id: z.string().nullable(),
  count: z.number().optional(),
  volumeMinor: z.number().optional(),
  amountMinor: z.number().optional(),
  balanceMinor: z.number().optional(),
});
export const dashboardSchema = z.object({
  users: z.array(group).optional(),
  tenants: z.array(group).optional(),
  subscriptions: z.array(group).optional(),
  transactions: z.array(group),
  commissions: z.array(group).optional(),
  wallets: z.array(group).optional(),
});
export function listSchema<T extends z.ZodType>(item: T) {
  return z.union([
    z
      .array(item)
      .transform((data) => ({ data, total: undefined as number | undefined })),
    z.object({
      data: z.array(item),
      total: z.number().int().nonnegative(),
      page: z.number().optional(),
      limit: z.number().optional(),
    }),
  ]);
}
