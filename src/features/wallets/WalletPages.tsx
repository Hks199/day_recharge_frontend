import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Wallet, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useAuth } from "../../app/providers";
import {
  Alert,
  Badge,
  Card,
  Confirm,
  Empty,
  ErrorPanel,
  Form,
  Loading,
  PageTitle,
  Pagination,
  Table,
} from "../../components/ui";
import {
  fundingSchema,
  ledgerSchema,
  transferSchema,
  userSchema,
  walletSchema,
  listSchema,
} from "../../types/contracts";
import { useCommand, useRecords, useResource } from "../shared/data";
import { money, dateTime, toPaise } from "../../lib/money";
import { canManage, homes } from "../../lib/permissions";
import { moneyInput, objectId } from "../shared/validation";
import { z } from "zod";
import { api } from "../../lib/api/client";
import { useFinancialReview } from "./FinancialReview";
export function WalletSummary() {
  const wallet = useResource("/wallet", walletSchema.nullable());
  return (
    <div className="balance-card">
      <div>
        <p>
          <Wallet size={18} /> YOUR SPENDABLE WALLET
        </p>
        {wallet.isPending ? (
          <Loading />
        ) : wallet.isError ? (
          <ErrorPanel
            error={wallet.error}
            retry={() => void wallet.refetch()}
          />
        ) : wallet.data ? (
          <>
            <h2>{money(wallet.data.balanceMinor)}</h2>
            <span>
              Available balance <Badge value={wallet.data.status} />
            </span>
          </>
        ) : (
          <Empty title="Wallet unavailable" />
        )}
      </div>
      <div className="balance-art">
        <Wallet size={64} strokeWidth={1} />
      </div>
    </div>
  );
}
export function WalletPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const userId = params.get("userId") ?? "";
  const result = useRecords("/wallet/ledger", ledgerSchema, { userId });
  return (
    <>
      <PageTitle
        title="Wallet & ledger"
        description="A clear record of funds moving through your business."
      />
      <WalletSummary />
      <Card>
        <div className="card-heading">
          <div>
            <h2>Wallet ledger</h2>
            <p>
              {userId
                ? "Authorized user ledger. This does not show a current wallet balance."
                : "Your own wallet entries, newest first."}
            </p>
          </div>
          <Link className="btn btn-primary" to={`${homes[user!.role]}/funding`}>
            Request funding
          </Link>
        </div>
        {user!.role !== "RETAILER" && (
          <Form
            fields={[
              {
                name: "userId",
                label: "Authorized user ID",
                validation: objectId.or(z.literal("")),
                optional: true,
              },
            ]}
            initial={{ userId }}
            submitLabel="View ledger"
            onSubmit={async (v) => {
              setParams(v.userId ? { userId: v.userId } : {});
            }}
          />
        )}
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
                { title: "Date", render: (r) => dateTime(r.createdAt) },
                {
                  title: "Entry",
                  render: (r) => (
                    <span className="entry-type">
                      {r.entryType === "DEBIT" ? (
                        <ArrowUpRight size={16} />
                      ) : (
                        <ArrowDownLeft size={16} />
                      )}
                      {r.entryType.replaceAll("_", " ")}
                    </span>
                  ),
                },
                { title: "Amount", render: (r) => money(r.amountMinor) },
                { title: "Before", render: (r) => money(r.balanceBeforeMinor) },
                { title: "After", render: (r) => money(r.balanceAfterMinor) },
                {
                  title: "Reference",
                  render: (r) => <code>{r.reference ?? r._id}</code>,
                },
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
export function TransfersPage() {
  const { user } = useAuth();
  const command = useCommand(),
    review = useFinancialReview();
  const result = useRecords("/wallet/transfers", transferSchema);
  const managers = user!.role !== "RETAILER";
  const [params] = useSearchParams();
  const downline = useResource(
    "/users?limit=100",
    listSchema(userSchema),
    managers,
  );
  const [success, setSuccess] = useState(false);
  return (
    <>
      <PageTitle
        title="Wallet transfers"
        description="Move your own funds to an authorized member of your network."
      />
      {review.ui}
      {success && <Alert success>Transfer confirmed by the server.</Alert>}
      {managers && (
        <div className="two-columns">
          <WalletSummary />
          <Card>
            <h2>Transfer funds</h2>
            {downline.isError && <ErrorPanel error={downline.error} />}
            <Form
              fields={[
                {
                  name: "toUserId",
                  label: "Recipient from loaded network",
                  type: "select",
                  validation: objectId.or(z.literal("")),
                  optional: true,
                  options:
                    downline.data?.data
                      .filter(
                        (u) => u.id !== user!.id && u.role !== "SUPER_ADMIN",
                      )
                      .map((u) => ({
                        value: u.id,
                        label: `${u.name} · ${u.role}`,
                      })) ?? [],
                  help: "First 100 authorized accounts. Alternatively enter a recipient ID below.",
                },
                {
                  name: "recipientId",
                  label: "Recipient ID instead",
                  optional: true,
                  validation: objectId.or(z.literal("")),
                  defaultValue: params.get("recipientId") ?? "",
                  help: "Use an authorized account ID for recipients outside the loaded list.",
                },
                {
                  name: "amount",
                  label: "Amount (₹)",
                  type: "money",
                  validation: moneyInput,
                },
              ]}
              submitLabel="Review transfer"
              onSubmit={async (v) => {
                const toUserId = v.recipientId || v.toUserId;
                if (!toUserId) throw new Error("Choose or enter a recipient.");
                const recipient = await api.request(
                  "/users/" + toUserId,
                  userSchema,
                );
                if (!canManage(user!, recipient))
                  throw new Error(
                    "This recipient is outside your authorized downline.",
                  );
                review.begin(
                  "/wallet/transfers",
                  { toUserId, amountMinor: toPaise(v.amount) },
                  <div className="review-details">
                    <p>
                      Transfer <strong>{money(toPaise(v.amount))}</strong> from
                      your wallet to <strong>{recipient?.name}</strong>.
                    </p>
                    <code>{toUserId}</code>
                    <p>
                      The recipient will receive these funds. Your available
                      balance will be debited.
                    </p>
                  </div>,
                  () => setSuccess(true),
                );
              }}
            />
          </Card>
        </div>
      )}
      <Card>
        <h2>Transfer history</h2>
        {result.isPending ? (
          <Loading />
        ) : result.isError ? (
          <ErrorPanel error={result.error} />
        ) : (
          <>
            <Table
              rows={result.data.data}
              rowKey={(r) => r._id}
              columns={[
                {
                  title: "Transfer",
                  render: (r) => (
                    <>
                      <code>{r._id}</code>
                      <small className="block">{dateTime(r.createdAt)}</small>
                    </>
                  ),
                },
                {
                  title: "From → To",
                  render: (r) => (
                    <>
                      <code>{r.fromUserId}</code>
                      <br />
                      <code>{r.toUserId}</code>
                    </>
                  ),
                },
                { title: "Amount", render: (r) => money(r.amountMinor) },
                {
                  title: "Status",
                  render: (r) => (
                    <Badge value={r.reversedAt ? "REFUNDED" : "SUCCESS"} />
                  ),
                },
                {
                  title: "Action",
                  render: (r) =>
                    user!.role === "SUPER_ADMIN" && !r.reversedAt ? (
                      <Confirm
                        danger
                        title="Reverse this transfer?"
                        description={
                          <p>
                            Reverse {money(r.amountMinor)} from recipient{" "}
                            {r.toUserId} to sender {r.fromUserId}. The entire
                            reversal fails if the recipient cannot cover the
                            debit.
                          </p>
                        }
                        onConfirm={() =>
                          command(`/wallet/transfers/${r._id}/reverse`)
                        }
                      >
                        Reverse
                      </Confirm>
                    ) : (
                      "—"
                    ),
                },
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
export function FundingPage() {
  const { user } = useAuth();
  const command = useCommand();
  const developer = user!.role === "DEVELOPER";
  const [decision, setDecision] = useState<{
    tenantId: string;
    fundingId: string;
    approve: boolean;
  } | null>(null);
  const result = useRecords(
    "/wallet/funding-requests",
    fundingSchema,
    {},
    !developer,
  );
  if (developer)
    return (
      <>
        <PageTitle
          title="External funding decision"
          description="An explicit-ID administrative action based on external verification."
        />
        <Alert>
          The platform API has no funding listing or detail endpoint. Verify the
          request ID, recipient, amount, and external bank deposit through your
          operational process before making a decision. This form does not
          contact a bank.
        </Alert>
        <Card>
          <Form
            fields={[
              { name: "tenantId", label: "Tenant ID", validation: objectId },
              {
                name: "fundingId",
                label: "Funding request ID",
                validation: objectId,
              },
              {
                name: "approve",
                label: "Decision",
                type: "select",
                options: [
                  { value: "true", label: "Approve externally verified funds" },
                  { value: "false", label: "Reject request" },
                ],
              },
            ]}
            submitLabel="Review decision"
            onSubmit={async (v) => {
              setDecision({
                tenantId: v.tenantId,
                fundingId: v.fundingId,
                approve: v.approve === "true",
              });
            }}
          />
          {decision && (
            <div className="review-details">
              <p>
                Tenant: <code>{decision.tenantId}</code>
                <br />
                Request: <code>{decision.fundingId}</code>
              </p>
              <Confirm
                title="Confirm funding decision"
                danger={!decision.approve}
                description={`Record ${decision.approve ? "approval" : "rejection"} for the supplied IDs. Approval credits the requested amount; evidence is available externally only.`}
                attestation="I verified the request identity and decision against external banking and operational evidence."
                onConfirm={async () => {
                  await command(
                    `/platform/tenants/${decision.tenantId}/funding-requests/${decision.fundingId}/decision`,
                    { approve: decision.approve },
                  );
                  setDecision(null);
                }}
              >
                Confirm {decision.approve ? "approval" : "rejection"}
              </Confirm>
            </div>
          )}
        </Card>
      </>
    );
  return (
    <>
      <PageTitle
        title="Funding requests"
        description="Request approval for funds verified outside this platform."
      />
      <Alert>
        A request is not proof of payment. Approval is a manual, audited action
        and does not initiate a bank payment.
      </Alert>
      <Card>
        <h2>Request wallet funding</h2>
        <Form
          fields={[
            {
              name: "amount",
              label: "Amount (₹)",
              type: "money",
              validation: moneyInput,
            },
            {
              name: "reference",
              label: "External bank reference",
              validation: z.string().min(8).max(100),
              help: "Use the unique reference for funds confirmed outside this platform.",
            },
          ]}
          submitLabel="Submit funding request"
          onSubmit={(v) =>
            command("/wallet/funding-requests", {
              amountMinor: toPaise(v.amount),
              reference: v.reference,
            })
          }
          successMessage="Funding requested. Your balance changes only after approval."
        />
      </Card>
      <Card>
        <h2>
          {user!.role === "SUPER_ADMIN" ? "Tenant requests" : "Your requests"}
        </h2>
        {result.isPending ? (
          <Loading />
        ) : result.isError ? (
          <ErrorPanel error={result.error} />
        ) : (
          <>
            <Table
              rows={result.data.data}
              rowKey={(r) => r._id}
              columns={[
                {
                  title: "Request",
                  render: (r) => (
                    <>
                      <code>{r._id}</code>
                      <small className="block">{dateTime(r.createdAt)}</small>
                    </>
                  ),
                },
                { title: "User", render: (r) => <code>{r.userId}</code> },
                { title: "Amount", render: (r) => money(r.amountMinor) },
                { title: "Reference", render: (r) => r.reference },
                { title: "Status", render: (r) => <Badge value={r.status} /> },
                {
                  title: "Decision",
                  render: (r) =>
                    user!.role === "SUPER_ADMIN" &&
                    r.userId !== user!.id &&
                    r.status === "REQUESTED" ? (
                      <div className="actions">
                        <Confirm
                          title="Approve externally verified funding?"
                          attestation="I checked the external bank deposit and recipient. This checkbox is an administrative attestation."
                          description={
                            <p>
                              Credit {money(r.amountMinor)} to {r.userId}, bank
                              reference {r.reference}.
                            </p>
                          }
                          onConfirm={() =>
                            command(
                              `/wallet/funding-requests/${r._id}/decision`,
                              { approve: true },
                            )
                          }
                        >
                          Approve
                        </Confirm>
                        <Confirm
                          title="Reject funding request?"
                          danger
                          description={`Reject ${r.reference} for ${money(r.amountMinor)}. No funds will be credited.`}
                          onConfirm={() =>
                            command(
                              `/wallet/funding-requests/${r._id}/decision`,
                              { approve: false },
                            )
                          }
                        >
                          Reject
                        </Confirm>
                      </div>
                    ) : r.userId === user!.id && r.status === "REQUESTED" ? (
                      "Awaiting authorized approval"
                    ) : (
                      "—"
                    ),
                },
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
