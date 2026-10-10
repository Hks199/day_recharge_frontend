export function decimalToInteger(
  value: string,
  max = Number.MAX_SAFE_INTEGER,
): number {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value))
    throw new Error(
      "Enter a positive decimal with at most two decimal places.",
    );
  const [whole, fraction = ""] = value.split(".");
  const result = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  if (result > BigInt(max))
    throw new Error("Amount exceeds the permitted limit.");
  return Number(result);
}
export const toPaise = (value: string) =>
  decimalToInteger(value, 1_000_000_000);
export const toBasisPoints = (value: string) => decimalToInteger(value, 10000);
export function decimalFromInteger(value: number) {
  return `${Math.trunc(value / 100)}.${String(Math.abs(value % 100)).padStart(2, "0")}`;
}
export const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value / 100);
export const dateTime = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
