import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Building2,
  CircleDollarSign,
  Network,
  ReceiptText,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../../app/providers";
import {
  Alert,
  Badge,
  Card,
  Empty,
  ErrorPanel,
  Loading,
  PageTitle,
  Table,
} from "../../components/ui";
import { dashboardSchema, transactionSchema } from "../../types/contracts";
import { useRecords, useResource } from "../shared/data";
import { homes, roleLabel } from "../../lib/permissions";
import { money, dateTime } from "../../lib/money";
import { WalletSummary } from "../wallets/WalletPages";
import { paymentServices } from "../recharges/PaymentPages";
export default function Dashboard() {
  const { user } = useAuth();
  const platform = user!.role === "DEVELOPER",
    home = homes[user!.role];
  const result = useResource(
    platform ? "/platform/dashboard" : "/reports/dashboard",
    dashboardSchema,
  );
  const recent = useRecords("/recharges", transactionSchema, {}, !platform);
  if (result.isPending) return <Loading />;
  if (result.isError)
    return (
      <ErrorPanel error={result.error} retry={() => void result.refetch()} />
    );
  const d = result.data;
  const total = d.transactions.reduce((s, g) => s + (g.count ?? 0), 0),
    volume = d.transactions.reduce((s, g) => s + (g.volumeMinor ?? 0), 0),
    commissions =
      d.commissions?.find((g) => g._id === "PAID")?.amountMinor ?? 0;
  const metrics = platform
    ? [
        {
          label: "Businesses",
          value: String(
            d.tenants?.reduce((s, g) => s + (g.count ?? 0), 0) ?? 0,
          ),
          icon: Building2,
          caption: "Across all tenant statuses",
        },
        {
          label: "Active subscriptions",
          value: String(
            d.subscriptions?.find((g) => g._id === "ACTIVE")?.count ?? 0,
          ),
          icon: Network,
          caption: "Current status aggregate",
        },
        {
          label: "Transactions",
          value: String(total),
          icon: ReceiptText,
          caption: "Across all payment statuses",
        },
        {
          label: "Transaction volume",
          value: money(volume),
          icon: CircleDollarSign,
          caption: "Includes pending and refunded",
        },
      ]
    : [
        {
          label:
            user!.role === "RETAILER" ? "Transactions" : "Retailers in scope",
          value: String(
            user!.role === "RETAILER"
              ? total
              : (d.users?.find((g) => g._id === "RETAILER")?.count ?? 0),
          ),
          icon: Network,
          caption: "Within your authorized scope",
        },
        {
          label: "Transaction volume",
          value: money(volume),
          icon: ReceiptText,
          caption: "All statuses, including refunded",
        },
        {
          label:
            user!.role === "SUPER_ADMIN"
              ? "Tenant paid commissions"
              : "Your paid commissions",
          value: money(commissions),
          icon: CircleDollarSign,
          caption: "Backend recorded direct payouts",
        },
      ];
  return (
    <>
      <PageTitle
        title={`Good to see you, ${user!.name.split(" ")[0]}.`}
        description={`${roleLabel[user!.role]} overview · A clear view of your business today.`}
      >
        {user!.role === "RETAILER" && (
          <Link className="btn btn-primary" to={`${home}/payments`}>
            New recharge <ArrowRight size={17} />
          </Link>
        )}
      </PageTitle>
      <div className={`metric-grid ${platform ? "four-metrics" : ""}`}>
        {metrics.map((m) => (
          <Card key={m.label}>
            <div className="metric-label">
              {m.label}
              <span>
                <m.icon size={19} />
              </span>
            </div>
            <h2 className="metric-value">{m.value}</h2>
            <small>{m.caption}</small>
          </Card>
        ))}
      </div>
      {!platform && <WalletSummary />}
      {user!.role === "RETAILER" && (
        <Card>
          <div className="card-heading">
            <h2>Everyday services</h2>
            <Link className="text-link" to={`${home}/payments`}>
              View services <ArrowRight size={15} />
            </Link>
          </div>
          <div className="dashboard-services">
            {paymentServices.map((s) => (
              <Link to={`${home}/payments`} key={s.type}>
                <span>
                  <s.icon size={24} />
                </span>
                {s.label}
              </Link>
            ))}
          </div>
        </Card>
      )}
      <div className="two-columns">
        <Card>
          <div className="card-heading">
            <div>
              <h2>Payment status</h2>
              <p>Actual transaction counts by current status</p>
            </div>
            <Activity size={20} />
          </div>
          {!total ? (
            <Empty
              title="Your activity starts here"
              description="Payment status distribution appears once transactions are recorded."
            />
          ) : (
            <>
              <div className="chart" aria-label="Transaction counts by status">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={d.transactions}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="_id" tick={{ fontSize: 10 }} interval={0} />
                    <YAxis allowDecimals={false} width={35} />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      name="Transactions"
                      fill="var(--primary-text)"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ul className="distribution">
                {d.transactions.map((g) => (
                  <li key={g._id}>
                    <Badge value={g._id ?? "UNKNOWN"} />
                    <strong>
                      {g.count} · {money(g.volumeMinor ?? 0)}
                    </strong>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
        <Card>
          <h2>
            {platform
              ? "Platform health at a glance"
              : "Your business, in context"}
          </h2>
          <p>Aggregates returned for your authorized scope.</p>
          {platform ? (
            <>
              <h3>Tenant status</h3>
              <ul className="distribution">
                {d.tenants?.map((g) => (
                  <li key={g._id}>
                    <Badge value={g._id ?? "UNKNOWN"} />
                    <strong>{g.count}</strong>
                  </li>
                ))}
              </ul>
              <h3>Subscription status</h3>
              <ul className="distribution">
                {d.subscriptions?.map((g) => (
                  <li key={g._id}>
                    <Badge value={g._id ?? "UNKNOWN"} />
                    <strong>{g.count}</strong>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <ul className="distribution">
                {d.users?.map((g) => (
                  <li key={g._id}>
                    <span>{g._id?.replaceAll("_", " ")}</span>
                    <strong>{g.count} accounts</strong>
                  </li>
                ))}
              </ul>
              {user!.role === "SUPER_ADMIN" && (
                <Alert>
                  Tenant aggregate wallet balance:{" "}
                  <strong>
                    {money(
                      d.wallets?.reduce(
                        (s, g) => s + (g.balanceMinor ?? 0),
                        0,
                      ) ?? 0,
                    )}
                  </strong>
                  . This includes all tenant wallets and is separate from your
                  spendable balance.
                </Alert>
              )}
              <div className="dashboard-tip">
                <h3>Keep your day moving.</h3>
                <p>
                  Check pending payments before submitting again. Your
                  transaction reference connects every step.
                </p>
                <Link className="text-link" to={`${home}/transactions`}>
                  Review transactions <ArrowRight size={16} />
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>
      {!platform && (
        <Card>
          <div className="card-heading">
            <h2>Recent transactions</h2>
            <Link className="text-link" to={`${home}/transactions`}>
              All transactions <ArrowRight size={15} />
            </Link>
          </div>
          {recent.isPending ? (
            <Loading />
          ) : recent.isError ? (
            <ErrorPanel error={recent.error} />
          ) : (
            <>
              <small>Latest records on the currently loaded page</small>
              <Table
                rows={recent.data.data.slice(0, 5)}
                rowKey={(r) => r._id}
                columns={[
                  {
                    title: "Reference",
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
                  { title: "Amount", render: (r) => money(r.amountMinor) },
                  {
                    title: "Status",
                    render: (r) => <Badge value={r.status} />,
                  },
                  { title: "Created", render: (r) => dateTime(r.createdAt) },
                ]}
              />
            </>
          )}
        </Card>
      )}
    </>
  );
}
