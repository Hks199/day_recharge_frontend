import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Plus, Users } from "lucide-react";
import { useAuth } from "../../app/providers";
import {
  Badge,
  Button,
  Card,
  Confirm,
  ErrorPanel,
  Form,
  Loading,
  Modal,
  PageTitle,
  Pagination,
  Table,
} from "../../components/ui";
import { canCreate, canManage, homes } from "../../lib/permissions";
import { userSchema } from "../../types/contracts";
import { useCommand, useRecords, useResource } from "../shared/data";
import { name, options, personFields, phone } from "../shared/validation";
export function UsersPage({ downlineId }: { downlineId?: string }) {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [create, setCreate] = useState<"DISTRIBUTOR" | "RETAILER" | null>(null);
  const command = useCommand();
  const filters = {
    role: params.get("role") ?? "",
    status: params.get("status") ?? "",
    sort: params.get("sort") ?? "createdAt",
    direction: params.get("direction") ?? "desc",
  };
  const result = useRecords(
    downlineId ? `/users/${downlineId}/downline` : "/users",
    userSchema,
    filters,
  );
  return (
    <>
      <PageTitle
        title={downlineId ? "Direct downline" : "Business network"}
        description="Accounts and relationships within your authorized scope."
      >
        {!downlineId && (
          <>
            {canCreate(user!.role, "DISTRIBUTOR") && (
              <Button
                variant="secondary"
                onClick={() => setCreate("DISTRIBUTOR")}
              >
                <Plus size={16} />
                Distributor
              </Button>
            )}
            {canCreate(user!.role, "RETAILER") && (
              <Button onClick={() => setCreate("RETAILER")}>
                <Plus size={16} />
                Retailer
              </Button>
            )}
          </>
        )}
      </PageTitle>
      <Modal
        open={!!create}
        onOpenChange={(open) => {
          if (!open) setCreate(null);
        }}
        title={`Create ${create?.toLowerCase()}`}
        description="Creates an account and wallet under your business relationship."
      >
        {create && (
          <Form
            fields={personFields}
            submitLabel="Create account"
            onSubmit={async (v) => {
              await command(
                `/users/${create === "DISTRIBUTOR" ? "distributors" : "retailers"}`,
                v,
              );
              setCreate(null);
            }}
          />
        )}
      </Modal>
      <Card>
        <Form
          initial={filters}
          fields={[
            {
              name: "role",
              label: "Role",
              type: "select",
              optional: true,
              options: options(
                user!.role === "DISTRIBUTOR"
                  ? ["RETAILER"]
                  : ["DISTRIBUTOR", "RETAILER", "SUPER_ADMIN"],
              ),
            },
            {
              name: "status",
              label: "Status",
              type: "select",
              optional: true,
              options: options(["ACTIVE", "BLOCKED"]),
            },
            {
              name: "sort",
              label: "Sort by",
              type: "select",
              options: [
                { value: "createdAt", label: "Created date" },
                { value: "name", label: "Name" },
              ],
            },
            {
              name: "direction",
              label: "Order",
              type: "select",
              options: options(["asc", "desc"]),
            },
          ]}
          submitLabel="Apply filters"
          onSubmit={async (v) => {
            setParams(
              Object.fromEntries(Object.entries(v).filter(([, val]) => val)),
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
              rowKey={(r) => r.id}
              columns={[
                {
                  title: "Account",
                  render: (r) => (
                    <Link
                      className="person-link"
                      to={`${homes[user!.role]}/users/${r.id}`}
                    >
                      <span className="person-avatar">
                        <Users size={18} />
                      </span>
                      <span>
                        <strong>{r.name}</strong>
                        <small>{r.email}</small>
                      </span>
                    </Link>
                  ),
                },
                { title: "Role", render: (r) => r.role.replaceAll("_", " ") },
                { title: "Phone", render: (r) => r.phone ?? "—" },
                {
                  title: "Status",
                  render: (r) => <Badge value={r.status ?? "ACTIVE"} />,
                },
                {
                  title: "Action",
                  render: (r) =>
                    canManage(user!, r) ? (
                      <Confirm
                        danger={r.status !== "BLOCKED"}
                        title={`${r.status === "BLOCKED" ? "Activate" : "Block"} ${r.name}?`}
                        description={
                          r.status === "BLOCKED"
                            ? "Allow this account to access the business again."
                            : "This blocks new access and revokes active sessions for this account."
                        }
                        onConfirm={() =>
                          command(
                            `/users/${r.id}/status`,
                            {
                              status:
                                r.status === "BLOCKED" ? "ACTIVE" : "BLOCKED",
                            },
                            "PATCH",
                          )
                        }
                      >
                        {r.status === "BLOCKED" ? "Activate" : "Block"}
                      </Confirm>
                    ) : (
                      "Protected account"
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
export function UserDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const command = useCommand();
  const result = useResource(`/users/${id}`, userSchema);
  const [downline, setDownline] = useState(false);
  if (result.isPending) return <Loading />;
  if (result.isError) return <ErrorPanel error={result.error} />;
  const target = result.data;
  return (
    <>
      <PageTitle
        title={target.name}
        description={`${target.role.replaceAll("_", " ")} · ${target.email ?? ""}`}
      >
        <Button variant="secondary" onClick={() => setDownline(!downline)}>
          {downline ? "Hide" : "View"} direct downline
        </Button>
        <Link
          className="btn btn-secondary"
          to={`${homes[user!.role]}/wallet?userId=${target.id}`}
        >
          View ledger
        </Link>
        {canManage(user!, target) && (
          <Link
            className="btn btn-primary"
            to={`${homes[user!.role]}/transfers?recipientId=${target.id}`}
          >
            Transfer funds
          </Link>
        )}
      </PageTitle>
      <div className="two-columns">
        <Card>
          <h2>Account details</h2>
          <dl>
            <dt>ID</dt>
            <dd>
              <code>{target.id}</code>
            </dd>
            <dt>Parent</dt>
            <dd>
              <code>{target.parentId ?? "Designated owner"}</code>
            </dd>
            <dt>Status</dt>
            <dd>
              <Badge value={target.status ?? "ACTIVE"} />
            </dd>
          </dl>
          {canManage(user!, target) && (
            <Form
              key={target.id}
              initial={{ name: target.name, phone: target.phone ?? "" }}
              fields={[
                { name: "name", label: "Name", validation: name },
                { name: "phone", label: "Phone", validation: phone },
              ]}
              onSubmit={(v) => command(`/users/${target.id}`, v, "PATCH")}
              successMessage="Account updated."
            />
          )}
        </Card>
        {canManage(user!, target) && user!.role === "SUPER_ADMIN" && (
          <Card>
            <h2>Wallet access</h2>
            <p>
              Block or activate new debit workflows. Required settlement and
              refunds can still complete.
            </p>
            <div className="actions">
              {["BLOCKED", "ACTIVE"].map((status) => (
                <Confirm
                  key={status}
                  title={`Set wallet ${status.toLowerCase()}?`}
                  danger={status === "BLOCKED"}
                  description={`Change the wallet for ${target.name} (${target.id}) to ${status}. This does not change their account login status.`}
                  onConfirm={() =>
                    command(`/wallet/${target.id}/status`, { status }, "PATCH")
                  }
                >
                  {status === "ACTIVE" ? "Activate wallet" : "Block wallet"}
                </Confirm>
              ))}
            </div>
          </Card>
        )}
      </div>
      {downline && <UsersPage downlineId={target.id} />}
    </>
  );
}
