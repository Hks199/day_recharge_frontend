export class FinancialIntent<T> {
  readonly key = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)), value => value.toString(16).padStart(2, '0')).join('');
  readonly payload: T;
  constructor(payload: T) {
    this.payload = structuredClone(payload);
  }
}
export const isUncertain = (error: unknown) =>
  error instanceof Error &&
  "status" in error &&
  (error.status === 0 ||
    (typeof error.status === "number" && error.status >= 500));
