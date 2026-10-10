import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Alert, Button, ErrorPanel, Modal } from "../../components/ui";
import { FinancialIntent, isUncertain } from "../../lib/intent";
import { api, ApiError } from "../../lib/api/client";
import { transactionSchema, transferSchema } from "../../types/contracts";
import { homes } from "../../lib/permissions";
import { useCommand } from "../shared/data";
import { useFeedback } from "../../components/feedback/Feedback";
export function useFinancialReview() {
  const notify = useFeedback();
  const storageKey = `recharge-intent:${window.location.host}:${api.getSession()?.user.id}`;
  const [recovery, setRecovery] = useState(() =>
    sessionStorage.getItem(storageKey),
  );
  const [intent, setIntent] = useState<{
    operation: FinancialIntent<unknown>;
    path: string;
    summary: ReactNode;
    onResult?: (value: unknown) => void;
  } | null>(null);
  const [pending, setPending] = useState(false),
    [error, setError] = useState<unknown>(),
    [uncertain, setUncertain] = useState(false);
  const lock = useRef(false);
  const command = useCommand();
  useEffect(() => {
    if (!intent || !uncertain) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [intent, uncertain]);
  const begin = (
    path: string,
    payload: unknown,
    summary: ReactNode,
    onResult?: (value: unknown) => void,
  ) => {
    if (recovery || intent)
      throw new Error(
        "Resolve the previous financial intent before submitting another.",
      );
    setError(undefined);
    setUncertain(false);
    setIntent({
      operation: new FinancialIntent(payload),
      path,
      summary,
      onResult,
    });
  };
  const home = homes[api.getSession()!.user.role];
  const ui = (
    <>
      {recovery && !intent && (
        <Alert>
          <strong>A previous submission needs review.</strong>
          <p>
            This tab lost its in-memory payment payload. Check{" "}
            <Link to={`${home}/transactions`}>transactions</Link> and{" "}
            <Link to={`${home}/transfers`}>transfers</Link>, or contact support
            with reference <code>{recovery}</code>. Do not submit a duplicate
            payment.
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              if (
                window.confirm(
                  "Only clear this guard after confirming the previous operation’s outcome in history or with support. Have you resolved the previous intent?",
                )
              ) {
                sessionStorage.removeItem(storageKey);
                setRecovery(null);
              }
            }}
          >
            I have resolved the previous intent
          </Button>
        </Alert>
      )}
      <Modal
        open={!!intent}
        onOpenChange={(open) => {
          if (!open && !pending && !uncertain) setIntent(null);
        }}
        title={uncertain ? "Outcome not yet confirmed" : "Review and confirm"}
        description="Financial actions use a stable reference to protect against duplicate submissions."
      >
        {intent?.summary}
        {uncertain && (
          <Alert>
            The request may have reached the server. Retry keeps the same
            reference and exact payload. Do not create a new payment. Keep this
            tab open until resolved.
          </Alert>
        )}
        {error !== undefined && <ErrorPanel error={error} />}
        <div className="actions">
          <Button
            variant="secondary"
            disabled={pending || uncertain}
            onClick={() => setIntent(null)}
          >
            Back
          </Button>
          <Button
            disabled={pending}
            onClick={async () => {
              if (!intent || lock.current) return;
              lock.current = true;
              setPending(true);
              setError(undefined);
              sessionStorage.setItem(storageKey, intent.operation.key);
              try {
                const result = await command(
                  intent.path,
                  intent.operation.payload,
                  "POST",
                  intent.operation.key,
                );
                const parsed = (
                  intent.path === "/wallet/transfers"
                    ? transferSchema
                    : transactionSchema
                ).safeParse(result);
                if (!parsed.success)
                  throw new ApiError(502, "INVALID_RESPONSE");
                notify(
                  intent.path === "/wallet/transfers"
                    ? "Transfer confirmed by the server."
                    : "Payment accepted. Follow its status for the outcome.",
                );
                sessionStorage.removeItem(storageKey);
                setRecovery(null);
                setIntent(null);
                setUncertain(false);
                intent.onResult?.(result);
              } catch (e) {
                setError(e);
                if (isUncertain(e)) {
                  setUncertain(true);
                  setRecovery(intent.operation.key);
                } else if (!uncertain) sessionStorage.removeItem(storageKey);
              } finally {
                setPending(false);
                lock.current = false;
              }
            }}
          >
            {pending
              ? "Submitting…"
              : uncertain
                ? "Retry same intent"
                : "Confirm & submit"}
          </Button>
        </div>
        {intent && (
          <small className="muted block">
            Reference: {intent.operation.key}
          </small>
        )}
      </Modal>
    </>
  );
  return { begin, ui, blocked: !!recovery || !!intent };
}
