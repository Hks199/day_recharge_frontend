import { z } from "zod";
import { toPaise, toBasisPoints } from "../../lib/money";
import type { Field } from "../../components/ui";
export const objectId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Enter a valid 24-character record ID.");
export const email = z.email().max(254).toLowerCase();
export const phone = z
  .string()
  .regex(
    /^\+?[1-9]\d{9,14}$/,
    "Enter 10–15 digits, optionally starting with +.",
  );
export const name = z.string().trim().min(2).max(100);
export const newPassword = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(128);
export const moneyInput = z.string().refine((v) => {
  try {
    return toPaise(v) > 0;
  } catch {
    return false;
  }
}, "Enter a positive INR amount, up to ₹1,00,00,000, with at most 2 decimals.");
export const priceInput = z.string().refine((v) => {
  try {
    toPaise(v);
    return true;
  } catch {
    return false;
  }
}, "Enter a valid INR amount with at most 2 decimals.");
export const percentInput = z.string().refine((v) => {
  try {
    toBasisPoints(v);
    return true;
  } catch {
    return false;
  }
}, "Enter 0–100%, with at most 2 decimals.");
export const personFields: Field[] = [
  { name: "name", label: "Full name", validation: name, autoComplete: "name" },
  {
    name: "email",
    label: "Email address",
    type: "email",
    validation: email,
    autoComplete: "email",
  },
  {
    name: "phone",
    label: "Phone number",
    validation: phone,
    autoComplete: "tel",
  },
  {
    name: "password",
    label: "Initial password",
    type: "password",
    validation: newPassword,
    autoComplete: "new-password",
    help: "12–128 characters. Share securely with the account holder.",
  },
];
export const options = (values: readonly string[]) =>
  values.map((value) => ({ value, label: value.replaceAll("_", " ") }));
export const isoDate = (value: string) => new Date(value).toISOString();
