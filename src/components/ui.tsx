import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  LoaderCircle,
  SearchX,
  X,
} from "lucide-react";
import {
  useForm,
  type FieldValues,
  type Path,
  type UseFormRegister,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ApiError } from "../lib/api/client";
export function Button({
  className = "",
  variant = "primary",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  return (
    <button className={`btn btn-${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`card ${className}`}>{children}</section>;
}
export function Loading({ full = false }: { full?: boolean }) {
  return (
    <div className={full ? "center-page" : "loading"} role="status">
      <LoaderCircle className="spin" size={22} />
      <span>Loading your workspace…</span>
    </div>
  );
}
export function Empty({
  title = "No records yet",
  description = "New activity will appear here.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="empty">
      <SearchX size={34} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
export function Alert({
  children,
  success = false,
}: {
  children: ReactNode;
  success?: boolean;
}) {
  return (
    <div
      className={`alert ${success ? "alert-success" : ""}`}
      role={success ? "status" : "alert"}
    >
      {success ? <CheckCircle2 size={19} /> : <AlertCircle size={19} />}
      <div>{children}</div>
    </div>
  );
}
export function ErrorPanel({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  return (
    <div className="error-panel">
      <Alert>
        <strong>
          {error instanceof Error
            ? error.message
            : "Something went wrong. Please try again."}
        </strong>
        {error instanceof ApiError && error.requestId && (
          <small className="block">Support reference: {error.requestId}</small>
        )}
        {error instanceof ApiError && error.issues.length > 0 && (
          <ul>
            {error.issues.map((issue, i) => (
              <li key={i}>
                {issue.path.join(".")}: {issue.message}
              </li>
            ))}
          </ul>
        )}
      </Alert>
      {retry && (
        <Button variant="secondary" onClick={retry}>
          Try again
        </Button>
      )}
    </div>
  );
}
export function Badge({ value }: { value: string }) {
  const good = [
    "ACTIVE",
    "SUCCESS",
    "APPROVED",
    "PAID",
    "VERIFIED",
    "READ",
  ].includes(value);
  const bad = [
    "FAILED",
    "BLOCKED",
    "SUSPENDED",
    "REJECTED",
    "INACTIVE",
    "EXPIRED",
  ].includes(value);
  return (
    <span
      className={`badge ${good ? "badge-good" : bad ? "badge-bad" : "badge-neutral"}`}
    >
      <span className="status-dot" />
      {value.replaceAll("_", " ")}
    </span>
  );
}
export function PageTitle({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">YOUR WORKSPACE</p>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="actions">{children}</div>}
    </div>
  );
}
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const returnFocus = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className="dialog-content"
          onOpenAutoFocus={() => {
            returnFocus.current =
              document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocus.current?.focus();
          }}
        >
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>
            {description ?? "Review the details below."}
          </Dialog.Description>
          <Dialog.Close className="dialog-close" aria-label="Close dialog">
            <X size={20} />
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function Confirm({
  title,
  description,
  onConfirm,
  children,
  danger = false,
  attestation,
}: {
  title: string;
  description: ReactNode;
  onConfirm: () => Promise<unknown>;
  children: ReactNode;
  danger?: boolean;
  attestation?: string;
}) {
  const [open, setOpen] = useState(false),
    [pending, setPending] = useState(false),
    [error, setError] = useState<unknown>(),
    [checked, setChecked] = useState(false);
  const lock = useRef(false);
  return (
    <>
      <Button
        variant={danger ? "danger" : "secondary"}
        onClick={() => {
          setError(undefined);
          setChecked(false);
          setOpen(true);
        }}
      >
        {children}
      </Button>
      <Modal
        open={open}
        onOpenChange={(v) => {
          if (!pending) setOpen(v);
        }}
        title={title}
      >
        <div className="confirm-copy">{description}</div>
        {attestation && (
          <label className="check-label">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            {attestation}
          </label>
        )}
        {error !== undefined && <ErrorPanel error={error} />}
        <div className="actions">
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            disabled={pending || (!!attestation && !checked)}
            onClick={async () => {
              if (lock.current) return;
              lock.current = true;
              setPending(true);
              setError(undefined);
              try {
                await onConfirm();
                setOpen(false);
              } catch (e) {
                setError(e);
              } finally {
                setPending(false);
                lock.current = false;
              }
            }}
          >
            {pending ? <LoaderCircle className="spin" size={16} /> : null}
            Confirm
          </Button>
        </div>
      </Modal>
    </>
  );
}
export type Field = {
  name: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "password"
    | "money"
    | "select"
    | "textarea"
    | "date"
    | "datetime-local"
    | "number"
    | "color";
  placeholder?: string;
  help?: string;
  options?: { value: string; label: string }[];
  validation?: z.ZodType<string, string>;
  defaultValue?: string;
  optional?: boolean;
  autoComplete?: string;
};
export function PasswordInput<T extends FieldValues>({
  name,
  register,
  autoComplete,
  invalid,
  placeholder,
}: {
  name: Path<T>;
  register: UseFormRegister<T>;
  autoComplete?: string;
  invalid?: boolean;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="password-input">
      <input
        {...register(name)}
        type={show ? "text" : "password"}
        id={name}
        autoComplete={autoComplete ?? "current-password"}
        aria-invalid={invalid}
        placeholder={placeholder}
      />
      <button
        type="button"
        aria-label={show ? "Hide password" : "Show password"}
        onClick={() => setShow(!show)}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
export function Form({
  fields,
  onSubmit,
  submitLabel = "Save changes",
  initial,
  successMessage,
  children,
}: {
  fields: Field[];
  onSubmit: (values: Record<string, string>) => Promise<unknown>;
  submitLabel?: string;
  initial?: Record<string, string>;
  successMessage?: string;
  children?: ReactNode;
}) {
  const shape: Record<string, z.ZodType<string, string>> = Object.fromEntries(
    fields.map((f) => [
      f.name,
      f.validation ??
        (f.optional
          ? z.string()
          : z.string().min(1, `${f.label} is required.`)),
    ]),
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<Record<string, string>>({
    resolver: zodResolver(z.object(shape)),
    defaultValues:
      initial ??
      Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? ""])),
  });
  const [error, setFailure] = useState<unknown>(),
    [success, setSuccess] = useState(false);
  const lock = useRef(false);
  return (
    <form
      className="form"
      noValidate
      onSubmit={handleSubmit(async (values) => {
        if (lock.current) return;
        lock.current = true;
        setFailure(undefined);
        setSuccess(false);
        try {
          await onSubmit(values);
          setSuccess(true);
        } catch (e) {
          setFailure(e);
          if (e instanceof ApiError)
            for (const issue of e.issues)
              setError(
                fields.some((f) => f.name === issue.path.join("_"))
                  ? issue.path.join("_")
                  : issue.path.join("."),
                { message: issue.message },
              );
        } finally {
          lock.current = false;
        }
      })}
    >
      <div className="form-grid">
        {fields.map((f) => (
          <div
            className={`field ${f.type === "textarea" ? "field-wide" : ""}`}
            key={f.name}
          >
            <label htmlFor={f.name}>
              {f.label}
              {f.optional && <span className="muted"> (optional)</span>}
            </label>
            {f.type === "password" ? (
              <PasswordInput
                name={f.name}
                register={register}
                autoComplete={f.autoComplete}
                invalid={!!errors[f.name]}
                placeholder={f.placeholder}
              />
            ) : f.type === "select" ? (
              <div className="select-wrap">
                <select
                  id={f.name}
                  {...register(f.name)}
                  aria-invalid={!!errors[f.name]}
                >
                  <option value="">Select an option</option>
                  {f.options?.map((o) => (
                    <option value={o.value} key={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} />
              </div>
            ) : f.type === "textarea" ? (
              <textarea
                id={f.name}
                {...register(f.name)}
                rows={4}
                aria-invalid={!!errors[f.name]}
              />
            ) : (
              <input
                id={f.name}
                {...register(f.name)}
                type={f.type === "money" ? "text" : (f.type ?? "text")}
                inputMode={f.type === "money" ? "decimal" : undefined}
                placeholder={f.placeholder}
                autoComplete={f.autoComplete}
                aria-invalid={!!errors[f.name]}
                aria-describedby={`${f.name}-help`}
              />
            )}
            {f.help && <small id={`${f.name}-help`}>{f.help}</small>}
            {errors[f.name] && (
              <small className="field-error" role="alert">
                {String(errors[f.name]?.message)}
              </small>
            )}
          </div>
        ))}
      </div>
      {children}
      {error !== undefined && <ErrorPanel error={error} />}
      {success && successMessage && <Alert success>{successMessage}</Alert>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <LoaderCircle size={16} className="spin" />}
        {isSubmitting ? "Submitting…" : submitLabel}
      </Button>
    </form>
  );
}
export type Column<T> = { title: string; render: (row: T) => ReactNode };
export function Table<T>({
  rows,
  columns,
  rowKey,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
}) {
  if (!rows.length) return <Empty />;
  return (
    <div className="table-scroll" tabIndex={0} aria-label="Scrollable records">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th scope="col" key={c.title}>
                {c.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((c) => (
                <td key={c.title}>{c.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function Pagination({
  page,
  total,
  count,
  onChange,
  limit = 20,
}: {
  page: number;
  total?: number;
  count: number;
  onChange: (page: number) => void;
  limit?: number;
}) {
  return (
    <div className="pagination">
      <span>
        Page {page}
        {total !== undefined
          ? ` · ${total} records`
          : ` · ${count} loaded records`}
      </span>
      <div className="actions">
        <Button
          variant="secondary"
          aria-label="Previous page"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
        >
          <ArrowLeft size={16} />
        </Button>
        <Button
          variant="secondary"
          aria-label="Next page"
          disabled={total !== undefined ? page * limit >= total : count < limit}
          onClick={() => onChange(page + 1)}
        >
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}
export function Tabs({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="tabs">
      {items.map((i) => (
        <Button
          key={i}
          variant={i === value ? "primary" : "ghost"}
          aria-pressed={i === value}
          onClick={() => onChange(i)}
        >
          {i}
        </Button>
      ))}
    </div>
  );
}
export function OnlineState() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online ? null : (
    <Alert>
      You are offline. Financial submissions may have an uncertain outcome.
      Reconnect before retrying the same intent.
    </Alert>
  );
}
