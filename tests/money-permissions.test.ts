import { describe, expect, it } from "vitest";
import {
  decimalToInteger,
  decimalFromInteger,
  money,
  toPaise,
  toBasisPoints,
} from "../src/lib/money";
import {
  allowedPath,
  canCreate,
  canManage,
  homes,
  safeReturnTo,
} from "../src/lib/permissions";
import {
  listSchema,
  userSchema,
  roles,
  billSchema,
} from "../src/types/contracts";
import { billPayable } from "../src/features/recharges/PaymentPages";
import { FinancialIntent } from "../src/lib/intent";
import { z } from "zod";
describe("Exact financial values", () => {
  it.each([
    ["0.01", 1],
    ["1.25", 125],
    ["10000000", 1000000000],
    ["001.2", 120],
  ])("converts %s to %d paise", (input, expected) =>
    expect(toPaise(input)).toBe(expected),
  );
  it.each([
    "1.001",
    "-1",
    "1e2",
    " 1 ",
    "Infinity",
    ".1",
    "1.",
    "10000000.01",
    "99999999999999999999",
  ])("rejects %s", (value) => expect(() => toPaise(value)).toThrow());
  it("handles safe integer boundary without rounding", () => {
    expect(decimalToInteger("90071992547409.91")).toBe(Number.MAX_SAFE_INTEGER);
    expect(() => decimalToInteger("90071992547409.92")).toThrow();
  });
  it("converts percentage to basis points", () => {
    expect(toBasisPoints("1.25")).toBe(125);
    expect(toBasisPoints("100")).toBe(10000);
    expect(() => toBasisPoints("100.01")).toThrow();
    expect(decimalFromInteger(125)).toBe("1.25");
  });
  it("formats Indian grouping", () =>
    expect(money(12345678)).toContain("1,23,456.78"));
});
describe("Authorization", () => {
  it.each(roles)("redirects %s to own workspace only", (role) => {
    expect(safeReturnTo(null, role)).toBe(`${homes[role]}/dashboard`);
    expect(safeReturnTo("https://evil.example", role)).toBe(
      `${homes[role]}/dashboard`,
    );
    expect(safeReturnTo(`${homes[role]}/\\evil`, role)).toBe(
      `${homes[role]}/dashboard`,
    );
  });
  it("enforces creation matrix", () => {
    expect(canCreate("SUPER_ADMIN", "DISTRIBUTOR")).toBe(true);
    expect(canCreate("DISTRIBUTOR", "RETAILER")).toBe(true);
    expect(canCreate("DISTRIBUTOR", "DISTRIBUTOR")).toBe(false);
    expect(canCreate("RETAILER", "RETAILER")).toBe(false);
    expect(canCreate("DEVELOPER", "SUPER_ADMIN")).toBe(false);
  });
  it("forbids financial and management direct routes", () => {
    expect(allowedPath("payments", "DISTRIBUTOR")).toBe(false);
    expect(allowedPath("users", "RETAILER")).toBe(false);
    expect(allowedPath("rules", "DISTRIBUTOR")).toBe(false);
    expect(allowedPath("wallet", "DEVELOPER")).toBe(false);
  });
  it("only manages authorized direct Retailers", () => {
    const actor = userSchema.parse({
      id: "a",
      name: "Actor",
      role: "DISTRIBUTOR",
    });
    const target = userSchema.parse({
      _id: "b",
      name: "Target",
      role: "RETAILER",
      parentId: "a",
    });
    expect(canManage(actor, target)).toBe(true);
    expect(canManage(actor, { ...target, parentId: "other" })).toBe(false);
    expect(canManage(actor, { ...target, role: "SUPER_ADMIN" })).toBe(false);
  });
});
describe("Contract normalization and intent integrity", () => {
  it("handles arrays without fabricating total and paginated lists", () => {
    const schema = listSchema(z.string());
    expect(schema.parse(["one"])).toEqual({ data: ["one"], total: undefined });
    expect(schema.parse({ data: ["one"], total: 8, page: 1 })).toEqual({
      data: ["one"],
      total: 8,
      page: 1,
    });
  });
  it("normalizes _id and rejects unknown role", () => {
    expect(
      userSchema.parse({ _id: "user-id", name: "U", role: "RETAILER" }).id,
    ).toBe("user-id");
    expect(() =>
      userSchema.parse({ id: "id", name: "U", role: "MASTER_DISTRIBUTOR" }),
    ).toThrow();
  });
  it("preserves exact financial payload independently of draft changes", () => {
    const draft = { amountMinor: 125 };
    const intent = new FinancialIntent(draft);
    draft.amountMinor = 200;
    expect(intent.payload.amountMinor).toBe(125);
    expect(intent.key).toMatch(/^[\w.-]{8,128}$/);
  });
  it("requires a fresh unconsumed bill inquiry", () => {
    const now = Date.now();
    const bill = billSchema.parse({
      _id: "bill",
      operatorId: "operator",
      amountMinor: 10000,
      providerReference: "ref",
      expiresAt: new Date(now + 1000).toISOString(),
    });
    expect(billPayable(bill, now)).toBe(true);
    expect(billPayable(bill, now + 1001)).toBe(false);
    expect(
      billPayable({ ...bill, consumedAt: new Date().toISOString() }, now),
    ).toBe(false);
  });
});
