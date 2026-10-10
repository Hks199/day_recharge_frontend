import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Printer,
  RefreshCw,
  Smartphone,
  Tv,
  Zap,
  RadioTower,
  Layers3,
} from "lucide-react";
import { api } from "../../lib/api/client";
import { scopeKey, useAuth } from "../../app/providers";
import {
  Alert,
  Badge,
  Button,
  Card,
  Confirm,
  ErrorPanel,
  Form,
  Loading,
  PageTitle,
  Pagination,
  Table,
} from "../../components/ui";
import {
  billSchema,
  listSchema,
  operatorSchema,
  transactionSchema,
  type Bill,
  type Operator,
  type Service,
} from "../../types/contracts";
import { useCommand, useRecords, useResource } from "../shared/data";
import { moneyInput, objectId } from "../shared/validation";
import { dateTime, money, toPaise } from "../../lib/money";
import { homes } from "../../lib/permissions";
import { WalletSummary } from "../wallets/WalletPages";
import { useFinancialReview } from "../wallets/FinancialReview";
const accountSchema = z
  .string()
  .regex(
    /^[A-Za-z0-9@._-]{5,64}$/,
    "Use 5–64 letters, numbers, @, dot, underscore, or hyphen.",
  );
export const paymentServices = [
  { type: "MOBILE" as const, label: "Mobile prepaid", icon: Smartphone },
  { type: "DTH" as const, label: "DTH recharge", icon: Tv },
  { type: "POSTPAID" as const, label: "Postpaid", icon: RadioTower },
  { type: "ELECTRICITY" as const, label: "Electricity", icon: Zap },
  { type: "BBPS" as const, label: "Bill payments", icon: Layers3 },
];
export function billPayable(bill: Bill, now = Date.now()) {
  return !bill.consumedAt && new Date(bill.expiresAt).getTime() > now;
}
export function PaymentsPage() {
  const [service, setService] = useState<Service>("MOBILE");
  const operators = useResource(
    "/recharges/operators",
    listSchema(operatorSchema),
  );
  const [bill, setBill] = useState<{
    record: Bill;
    account: string;
    operator: Operator;
  } | null>(null);
  const [now, setNow] = useState(Date.now());
  const review = useFinancialReview();
  const navigate = useNavigate();
  useEffect(() => {
    if (!bill) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [bill]);
  const billService = !["MOBILE", "DTH"].includes(service);
  function accepted(value: unknown) {
    const record = transactionSchema.parse(value);
    navigate(`/retailer/transactions/${record._id}`);
  }
  function checkBounds(op: Operator, amount: number) {
    if (amount < op.minMinor || amount > op.maxMinor)
      throw new Error(
        `This operator accepts ${money(op.minMinor)}–${money(op.maxMinor)}.`,
      );
  }
  return (
    <>
      <PageTitle
        title="Recharge & bill payments"
        description="Choose a service. Review the details. Follow the real outcome."
      />
      <WalletSummary />
      {review.ui}
      <div className="payment-service-tabs" aria-label="Payment service">
        {paymentServices.map((s) => (
          <button
            key={s.type}
            aria-pressed={service === s.type}
            onClick={() => {
              setService(s.type);
              setBill(null);
            }}
          >
            <s.icon size={23} />
            <span>{s.label}</span>
            <ArrowRight size={14} />
          </button>
        ))}
      </div>
      <div className="payment-layout">
        <Card>
          <div className="card-heading">
            <div>
              <p className="eyebrow">
                {billService
                  ? "INQUIRE BEFORE YOU PAY"
                  : "A FEW DETAILS TO GET STARTED"}
              </p>
              <h2>{paymentServices.find((s) => s.type === service)?.label}</h2>
            </div>
          </div>
          {operators.isPending ? (
            <Loading />
          ) : operators.isError ? (
            <ErrorPanel
              error={operators.error}
              retry={() => void operators.refetch()}
            />
          ) : !operators.data.data.some((op) => op.serviceType === service) ? (
            <Alert>No enabled operators are available for this service.</Alert>
          ) : (
            <Form
              key={service}
              fields={[
                {
                  name: "operatorId",
                  label: "Operator",
                  type: "select",
                  validation: objectId,
                  options: operators.data.data
                    .filter((op) => op.serviceType === service)
                    .map((op) => ({
                      value: op._id,
                      label: `${op.name} · ${money(op.minMinor)}–${money(op.maxMinor)}`,
                    })),
                },
                {
                  name: "account",
                  label: "Mobile / customer account",
                  validation: accountSchema,
                  help: "Use the account identifier accepted by your operator. Check it carefully.",
                },
                ...(!billService
                  ? [
                      {
                        name: "amount",
                        label: "Recharge amount (₹)",
                        type: "money" as const,
                        validation: moneyInput,
                      },
                    ]
                  : []),
              ]}
              submitLabel={billService ? "Fetch bill" : "Review recharge"}
              onSubmit={async (v) => {
                if (review.blocked)
                  throw new Error("Resolve your previous submission first.");
                const op = operators.data.data.find(
                  (o) => o._id === v.operatorId,
                );
                if (!op) throw new Error("Select an available operator.");
                if (billService) {
                  const record = await api.request(
                    "/bill-payments/inquiries",
                    billSchema,
                    {
                      method: "POST",
                      body: { operatorId: v.operatorId, account: v.account },
                    },
                  );
                  setNow(Date.now());
                  setBill({ record, account: v.account, operator: op });
                } else {
                  const amountMinor = toPaise(v.amount);
                  checkBounds(op, amountMinor);
                  review.begin(
                    "/recharges",
                    {
                      serviceType: service,
                      operatorId: op._id,
                      account: v.account,
                      amountMinor,
                    },
                    <div className="review-details">
                      <dl>
                        <dt>Service</dt>
                        <dd>{service}</dd>
                        <dt>Operator</dt>
                        <dd>{op.name}</dd>
                        <dt>Account</dt>
                        <dd>••••{v.account.slice(-4)}</dd>
                        <dt>Amount</dt>
                        <dd className="review-amount">{money(amountMinor)}</dd>
                      </dl>
                      <p>
                        Your wallet will be debited on acceptance. Acceptance is
                        not payment success.
                      </p>
                    </div>,
                    accepted,
                  );
                }
              }}
            />
          )}
          {bill && (
            <div className="bill-result">
              <h3>Bill inquiry</h3>
              <dl>
                <dt>Operator</dt>
                <dd>{bill.operator.name}</dd>
                <dt>Account</dt>
                <dd>••••{bill.account.slice(-4)}</dd>
                <dt>Amount</dt>
                <dd>{money(bill.record.amountMinor)}</dd>
                <dt>Provider reference</dt>
                <dd>
                  <code>{bill.record.providerReference}</code>
                </dd>
                <dt>Expires</dt>
                <dd>{dateTime(bill.record.expiresAt)}</dd>
              </dl>
              {!billPayable(bill.record, now) ? (
                <Alert>
                  This inquiry has expired or has been consumed. Fetch and
                  review a fresh bill before paying.
                </Alert>
              ) : (
                <Button
                  disabled={review.blocked}
                  onClick={() => {
                    checkBounds(bill.operator, bill.record.amountMinor);
                    review.begin(
                      "/bill-payments",
                      {
                        serviceType: bill.operator.serviceType,
                        operatorId: bill.operator._id,
                        account: bill.account,
                        amountMinor: bill.record.amountMinor,
                        billId: bill.record._id,
                      },
                      <div className="review-details">
                        <h3>{money(bill.record.amountMinor)}</h3>
                        <p>
                          Pay {bill.operator.name} for account ••••
                          {bill.account.slice(-4)} using bill reference{" "}
                          {bill.record.providerReference}.
                        </p>
                        <p>
                          This inquiry is single-use. Expiry:{" "}
                          {dateTime(bill.record.expiresAt)}. The server checks
                          its validity before acceptance.
                        </p>
                      </div>,
                      accepted,
                    );
                  }}
                >
                  Review bill payment
                </Button>
              )}
            </div>
          )}
        </Card>
        <aside className="payment-help">
          <span className="benefit-icon">
            <CheckCircle2 size={24} />
          </span>
          <h3>A little care goes a long way.</h3>
          <p>
            Check the operator and account before confirming. Once accepted,
            funds are reserved and the provider processes your request.
          </p>
          <div>
            <Clock3 size={19} />
            <p>
              Pending means still processing. Keep the original reference and
              track its status.
            </p>
          </div>
          <div>
            <RefreshCw size={19} />
            <p>
              If your connection drops, retry the same intent. A timeout does
              not mean a refund.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
export function TransactionsPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const filters = {
    status: params.get("status") ?? "",
    from: params.get("from") ?? "",
    to: params.get("to") ?? "",
  };
  const result = useRecords("/recharges", transactionSchema, filters);
  const home = homes[user!.role];
  return (
    <>
      <PageTitle
        title="Transactions"
        description="Payment history within your authorized business scope."
      />{" "}
      <Card>
        <Form
          initial={filters}
          fields={[
            {
              name: "status",
              label: "Status",
              type: "select",
              optional: true,
              options: [
                "PENDING",
                "PROCESSING",
                "SUCCESS",
                "FAILED",
                "REFUNDED",
              ].map((value) => ({ value, label: value })),
            },
            {
              name: "from",
              label: "From",
              type: "datetime-local",
              optional: true,
            },
            {
              name: "to",
              label: "Until",
              type: "datetime-local",
              optional: true,
            },
          ]}
          submitLabel="Apply filters"
          onSubmit={async (v) => {
            if (v.from && v.to && new Date(v.to) < new Date(v.from))
              throw new Error("End date must follow start date.");
            setParams(
              Object.fromEntries(
                Object.entries(v)
                  .filter(([, val]) => val)
                  .map(([k, val]) => [
                    k,
                    k === "status" ? val : new Date(val).toISOString(),
                  ]),
              ),
            );
          }}
        />
        {result.isPending ? (
          <Loading />
        ) : result.isError ? (
          <ErrorPanel
            error={result.error}
            retry={() => void result.refetch()}
          />
        ) : (
          <>
            <Table
              rows={result.data.data}
              rowKey={(r) => r._id}
              columns={[
                {
                  title: "Transaction",
                  render: (r) => (
                    <Link
                      className="text-link"
                      to={`${home}/transactions/${r._id}`}
                    >
                      <code>{r._id}</code>
                    </Link>
                  ),
                },
                { title: "Service", render: (r) => r.serviceType },
                {
                  title: "Amount",
                  render: (r) => <strong>{money(r.amountMinor)}</strong>,
                },
                { title: "Status", render: (r) => <Badge value={r.status} /> },
                { title: "Date", render: (r) => dateTime(r.createdAt) },
              ]}
            />
            <Pagination
              page={result.page}
              total={result.data.total}
              count={result.data.data.length}
              onChange={result.setPage}
            />
          </>
        )}
      </Card>
    </>
  );
}
export function TransactionDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const command = useCommand();
  const [started] = useState(Date.now());
  const [reason, setReason] = useState("");
  const [canPoll, setCanPoll] = useState(
    document.visibilityState === "visible" && navigator.onLine,
  );
  useEffect(() => {
    const update = () =>
      setCanPoll(document.visibilityState === "visible" && navigator.onLine);
    document.addEventListener("visibilitychange", update);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  const result = useQuery({
    queryKey: [...scopeKey(), "/recharges", id],
    queryFn: ({ signal }) =>
      api.request(`/recharges/${id}`, transactionSchema, { signal }),
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      return status &&
        ["PENDING", "PROCESSING"].includes(status) &&
        Date.now() - started < 180000 &&
        canPoll
        ? Math.min(3000 * 2 ** Math.floor(q.state.dataUpdateCount / 4), 15000)
        : false;
    },
    refetchIntervalInBackground: false,
  });
  if (result.isPending) return <Loading />;
  if (result.isError)
    return (
      <ErrorPanel error={result.error} retry={() => void result.refetch()} />
    );
  const t = result.data;
  const pending = ["PENDING", "PROCESSING"].includes(t.status);
  return (
    <>
      <PageTitle
        title="Transaction details"
        description="A receipt of the status returned by the payment system."
      >
        <Button variant="secondary" onClick={() => void result.refetch()}>
          <RefreshCw size={16} />
          Refresh
        </Button>
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer size={16} />
          Print receipt
        </Button>
      </PageTitle>
      <Card className="receipt">
        <div
          className={`receipt-status ${pending ? "pending" : t.status.toLowerCase()}`}
        >
          {pending ? <Clock3 size={28} /> : <ReceiptIcon status={t.status} />}
        </div>
        <h2>{money(t.amountMinor)}</h2>
        <Badge value={t.status} />
        {pending && (
          <Alert>
            Accepted for processing. This is not a successful payment receipt.
            Funds remain reserved while reconciliation continues. Automatic
            checks pause after 3 minutes; use Refresh to check again.
          </Alert>
        )}
        {t.status === "REFUNDED" && (
          <Alert success>
            The backend confirms that this payment was refunded.
          </Alert>
        )}
        {t.failureReason && <p>{t.failureReason}</p>}
        <dl>
          <dt>Transaction reference</dt>
          <dd>
            <code>{t._id}</code>
          </dd>
          <dt>Service</dt>
          <dd>{t.serviceType}</dd>
          <dt>Operator ID</dt>
          <dd>
            <code>{t.operatorId}</code>
          </dd>
          <dt>Provider reference</dt>
          <dd>{t.providerTransactionId ?? "Not yet returned"}</dd>
          <dt>Created</dt>
          <dd>{dateTime(t.createdAt)}</dd>
          <dt>Last updated</dt>
          <dd>{dateTime(t.updatedAt)}</dd>
        </dl>
      </Card>
      {user!.role === "SUPER_ADMIN" && t.status === "SUCCESS" && (
        <Card>
          <h2>Record confirmed provider reversal</h2>
          <p>
            This administrative action refunds principal and reverses
            commissions. It does not call a provider cancellation API.
          </p>
          <label htmlFor="reversal-reason">
            External reversal reason / evidence reference
          </label>
          <textarea
            id="reversal-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            minLength={10}
            maxLength={300}
          />
          <Confirm
            danger
            title="Reverse this payment?"
            description={`Refund ${money(t.amountMinor)} and reverse its commissions. All affected wallets must support the compensating entries.`}
            attestation="The provider reversal was confirmed externally. This attestation is not independent provider evidence."
            onConfirm={async () => {
              if (reason.length < 10 || reason.length > 300)
                throw new Error("Use 10–300 characters for the reason.");
              await command(`/recharges/${id}/reverse`, {
                reason,
                providerReversalConfirmed: true,
              });
            }}
          >
            Record reversal
          </Confirm>
        </Card>
      )}
    </>
  );
}
function ReceiptIcon({ status }: { status: string }) {
  return status === "SUCCESS" ? (
    <CheckCircle2 size={28} />
  ) : (
    <RefreshCw size={28} />
  );
}
