import { useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { z } from "zod";
import {
  Alert,
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
  type Field,
} from "../../components/ui";
import {
  auditSchema,
  listSchema,
  operatorSchema,
  planSchema,
  providerSchema,
  services,
  subscriptionSchema,
  tenantSchema,
} from "../../types/contracts";
import { useCommand, useRecords, useResource } from "../shared/data";
import {
  isoDate,
  moneyInput,
  name,
  objectId,
  options,
  percentInput,
  personFields,
  priceInput,
} from "../shared/validation";
import {
  dateTime,
  decimalFromInteger,
  money,
  toBasisPoints,
  toPaise,
} from "../../lib/money";
import { DomainsPage } from "../settings/SettingsPages";
export function TenantsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const result = useRecords("/platform/tenants", tenantSchema);
  const plans = useResource("/platform/plans", listSchema(planSchema));
  const command = useCommand();
  const create = params.get("create") === "true";
  const setCreate = (open: boolean) =>
    setParams((current) => {
      if (open) current.set("create", "true");
      else current.delete("create");
      return current;
    });
  return (
    <>
      <PageTitle
        title="Tenants & domains"
        description="Rent a website to a business with its own owner, subscription, and custom domain."
      >
        <Button onClick={() => setCreate(true)}>Create tenant</Button>
      </PageTitle>
      <Modal
        open={create}
        onOpenChange={setCreate}
        title="Create a tenant"
        description="Create the business owner and subscription, then connect their own domain on the next screen."
      >
        {plans.isPending ? (
          <Loading />
        ) : plans.isError ? (
          <ErrorPanel error={plans.error} retry={() => void plans.refetch()} />
        ) : !plans.data.data.some((plan) => plan.active) ? (
          <Alert>
            Create an active subscription plan before creating a tenant.{" "}
            <Link className="text-link" to="/platform/plans">
              Create a plan
            </Link>
          </Alert>
        ) : (
          <Form
            fields={[
              { name: "name", label: "Business name", validation: name },
              {
                name: "slug",
                label: "Unique slug",
                validation: z
                  .string()
                  .regex(
                    /^[a-z0-9-]{3,64}$/,
                    "Use 3–64 lowercase letters, digits, or hyphens.",
                  ),
              },
              {
                name: "planId",
                label: "Subscription plan",
                type: "select",
                validation: objectId,
                options:
                  plans.data?.data
                    .filter((p) => p.active)
                    .map((p) => ({
                      value: p._id,
                      label: `${p.name} · ${p.durationDays} days`,
                    })) ?? [],
              },
              ...personFields.map((f) => ({
                ...f,
                name: `owner_${f.name}`,
                label: `Owner ${f.label.toLowerCase()}`,
              })),
            ]}
            submitLabel="Create tenant & continue to domain setup"
            onSubmit={async (v) => {
              const tenant = tenantSchema.parse(
                await command("/platform/tenants", {
                  name: v.name,
                  slug: v.slug,
                  planId: v.planId,
                  owner: {
                    name: v.owner_name,
                    email: v.owner_email,
                    phone: v.owner_phone,
                    password: v.owner_password,
                  },
                }),
              );
              navigate(`/platform/tenants/${tenant._id}`);
            }}
          />
        )}
      </Modal>
      <Card>
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
                  title: "Setup",
                  render: (r) => (
                    <Link
                      className="text-link"
                      to={`/platform/tenants/${r._id}`}
                    >
                      Manage domains
                    </Link>
                  ),
                },
                {
                  title: "Business",
                  render: (r) => (
                    <Link
                      className="text-link"
                      to={`/platform/tenants/${r._id}`}
                    >
                      <strong>{r.name}</strong>
                    </Link>
                  ),
                },
                { title: "Slug", render: (r) => r.slug },
                { title: "Owner", render: (r) => <code>{r.ownerId}</code> },
                { title: "Status", render: (r) => <Badge value={r.status} /> },
                { title: "Created", render: (r) => dateTime(r.createdAt) },
              ]}
            />
            <Pagination
              page={result.page}
              count={result.data.data.length}
              total={result.data.total}
              onChange={result.setPage}
            />
          </>
        )}
      </Card>
    </>
  );
}
export function TenantDetail() {
  const { id } = useParams();
  const result = useResource(`/platform/tenants/${id}`, tenantSchema);
  const command = useCommand();
  if (result.isPending) return <Loading />;
  if (result.isError) return <ErrorPanel error={result.error} />;
  const tenant = result.data;
  return (
    <>
      <PageTitle title={tenant.name} description={`Business ID: ${tenant._id}`}>
        <Confirm
          danger={tenant.status === "ACTIVE"}
          title={`${tenant.status === "ACTIVE" ? "Suspend" : "Activate"} business?`}
          description={
            tenant.status === "ACTIVE"
              ? `Suspend ${tenant.name}. New tenant access will be blocked. Existing financial settlement can continue.`
              : `Activate ${tenant.name}. An active subscription is also required for access.`
          }
          onConfirm={() =>
            command(
              `/platform/tenants/${id}/status`,
              { status: tenant.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" },
              "PATCH",
            )
          }
        >
          {tenant.status === "ACTIVE"
            ? "Suspend business"
            : "Activate business"}
        </Confirm>
        <Link
          className="btn btn-primary"
          to={`/platform/subscriptions?tenantId=${id}`}
        >
          Subscription history
        </Link>
      </PageTitle>
      <Card>
        <h2>Connect the tenant's website</h2>
        <ol>
          <li>
            Add the customer's hostname below and publish the supplied DNS TXT
            record.
          </li>
          <li>
            Verify DNS ownership, then set the verified hostname as primary.
          </li>
          <li>
            Point the hostname to your deployed website and configure HTTPS on
            your hosting service.
          </li>
        </ol>
        <p>
          The business owner signs in on their connected domain to manage their
          website and business.
        </p>
      </Card>
      <Card>
        <dl>
          <dt>Status</dt>
          <dd>
            <Badge value={tenant.status} />
          </dd>
          <dt>Slug</dt>
          <dd>{tenant.slug}</dd>
          <dt>Designated owner ID</dt>
          <dd>
            <code>{tenant.ownerId}</code>
          </dd>
          <dt>Subscription ID</dt>
          <dd>
            <code>{tenant.subscriptionId}</code>
          </dd>
        </dl>
      </Card>
      <DomainsPage tenantId={tenant._id} />
    </>
  );
}
const planFields: Field[] = [
  { name: "name", label: "Plan name", validation: name },
  {
    name: "price",
    label: "Administrative plan price (₹)",
    type: "money",
    validation: priceInput,
  },
  {
    name: "durationDays",
    label: "Duration in days",
    type: "number",
    validation: z
      .string()
      .refine(
        (v) => /^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 3660,
        "Use 1–3660 days.",
      ),
  },
  {
    name: "features",
    label: "Features, one per line",
    type: "textarea",
    optional: true,
    validation: z
      .string()
      .refine(
        (v) =>
          v.split("\n").filter(Boolean).length <= 50 &&
          v.split("\n").every((s) => s.length <= 64),
        "Use up to 50 features, each at most 64 characters.",
      ),
  },
];
export function PlansPage() {
  const result = useResource("/platform/plans", listSchema(planSchema));
  const command = useCommand();
  const [editing, setEditing] = useState<
    z.infer<typeof planSchema> | "new" | null
  >(null);
  const plan = typeof editing === "object" ? editing : null;
  return (
    <>
      <PageTitle
        title="Subscription plans"
        description="Administrative plan definitions. Assignment does not collect a card payment."
      >
        <Button onClick={() => setEditing("new")}>Create plan</Button>
      </PageTitle>
      <Modal
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        title={plan ? "Edit subscription plan" : "Create subscription plan"}
      >
        <Form
          key={plan?._id ?? "new"}
          initial={
            plan
              ? {
                  name: plan.name,
                  price: decimalFromInteger(plan.priceMinor),
                  durationDays: String(plan.durationDays),
                  features: plan.features.join("\n"),
                }
              : undefined
          }
          fields={planFields}
          submitLabel={plan ? "Update plan" : "Create plan"}
          onSubmit={async (v) => {
            await command(
              plan ? `/platform/plans/${plan._id}` : "/platform/plans",
              {
                name: v.name,
                priceMinor: toPaise(v.price),
                durationDays: Number(v.durationDays),
                features: v.features
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              },
              plan ? "PATCH" : "POST",
            );
            setEditing(null);
          }}
        />
      </Modal>
      <Card>
        {result.isPending ? (
          <Loading />
        ) : result.isError ? (
          <ErrorPanel error={result.error} />
        ) : (
          <Table
            rows={result.data.data}
            rowKey={(r) => r._id}
            columns={[
              {
                title: "Plan",
                render: (r) => (
                  <>
                    <strong>{r.name}</strong>
                    <small className="block">
                      {r.features.join(" · ") || "No public features"}
                    </small>
                  </>
                ),
              },
              { title: "Price", render: (r) => money(r.priceMinor) },
              { title: "Duration", render: (r) => `${r.durationDays} days` },
              {
                title: "Status",
                render: (r) => (
                  <Badge value={r.active ? "ACTIVE" : "INACTIVE"} />
                ),
              },
              {
                title: "Actions",
                render: (r) => (
                  <div className="actions">
                    <Button variant="secondary" onClick={() => setEditing(r)}>
                      Edit
                    </Button>
                    <Confirm
                      title={`${r.active ? "Deactivate" : "Activate"} plan?`}
                      description={`Change availability of ${r.name} for new assignments.`}
                      onConfirm={() =>
                        command(
                          `/platform/plans/${r._id}`,
                          { active: !r.active },
                          "PATCH",
                        )
                      }
                    >
                      {r.active ? "Deactivate" : "Activate"}
                    </Confirm>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Card>
      <small>
        Plans endpoint returns at most 100 records; no server total is
        available.
      </small>
    </>
  );
}
export function SubscriptionsPage() {
  const [params, setParams] = useSearchParams();
  const tenantId = params.get("tenantId") ?? "";
  const validFilter = tenantId === "" || objectId.safeParse(tenantId).success;
  const result = useRecords(
    "/platform/subscriptions",
    subscriptionSchema,
    { tenantId },
    validFilter,
  );
  const plans = useResource("/platform/plans", listSchema(planSchema));
  const command = useCommand();
  const [create, setCreate] = useState(false);
  return (
    <>
      <PageTitle
        title="Subscriptions"
        description="Assign or renew a plan with an explicit start and end date."
      >
        <Button onClick={() => setCreate(true)}>Assign / renew plan</Button>
      </PageTitle>
      <Modal
        open={create}
        onOpenChange={setCreate}
        title="Assign or renew subscription"
      >
        <Alert>
          This cancels the previous active subscription, preserves its history,
          activates the business, and updates its public features. No automatic
          payment is collected.
        </Alert>
        <Form
          fields={[
            {
              name: "tenantId",
              label: "Tenant ID",
              validation: objectId,
              defaultValue: tenantId,
            },
            {
              name: "planId",
              label: "Plan",
              type: "select",
              validation: objectId,
              options:
                plans.data?.data
                  .filter((p) => p.active)
                  .map((p) => ({ value: p._id, label: p.name })) ?? [],
            },
            { name: "startAt", label: "Start", type: "datetime-local" },
            { name: "endAt", label: "End", type: "datetime-local" },
          ]}
          submitLabel="Assign subscription"
          onSubmit={async (v) => {
            if (new Date(v.endAt) <= new Date(v.startAt))
              throw new Error("End date must follow start date.");
            await command("/platform/subscriptions", {
              tenantId: v.tenantId,
              planId: v.planId,
              startAt: isoDate(v.startAt),
              endAt: isoDate(v.endAt),
            });
            setCreate(false);
          }}
        />
      </Modal>
      <Card>
        <Form
          initial={{ tenantId }}
          fields={[
            {
              name: "tenantId",
              label: "Filter by tenant ID",
              optional: true,
              validation: objectId.or(z.literal("")),
            },
          ]}
          submitLabel="Filter history"
          onSubmit={async (v) => {
            setParams(v.tenantId ? v : {});
          }}
        />
        {!validFilter ? (
          <Alert>Enter a valid tenant ID.</Alert>
        ) : result.isPending ? (
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
                  title: "Tenant",
                  render: (r) => (
                    <Link
                      className="text-link"
                      to={`/platform/tenants/${r.tenantId}`}
                    >
                      <code>{r.tenantId}</code>
                    </Link>
                  ),
                },
                {
                  title: "Plan",
                  render: (r) =>
                    plans.data?.data.find((p) => p._id === r.planId)?.name ??
                    r.planId,
                },
                { title: "Start", render: (r) => dateTime(r.startAt) },
                { title: "End", render: (r) => dateTime(r.endAt) },
                { title: "Status", render: (r) => <Badge value={r.status} /> },
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
export function ProvidersPage() {
  const result = useResource("/platform/providers", listSchema(providerSchema));
  const command = useCommand();
  const [create, setCreate] = useState(false);
  return (
    <>
      <PageTitle
        title="Payment providers"
        description="Configure the adapters supported by this backend."
      >
        <Button onClick={() => setCreate(true)}>Create provider</Button>
      </PageTitle>
      <Alert>
        MOCK is the only implemented provider. Enabling a provider does not
        establish live recharge or BBPS connectivity.
      </Alert>
      <Modal
        open={create}
        onOpenChange={setCreate}
        title="Create MOCK provider"
      >
        <Form
          fields={[
            {
              name: "name",
              label: "Provider name",
              validation: z.string().min(1).max(100),
            },
            {
              name: "enabled",
              label: "New requests",
              type: "select",
              options: [
                { value: "true", label: "Enabled" },
                { value: "false", label: "Disabled" },
              ],
            },
          ]}
          submitLabel="Create provider"
          onSubmit={async (v) => {
            await command("/platform/providers", {
              name: v.name,
              code: "MOCK",
              enabled: v.enabled === "true",
            });
            setCreate(false);
          }}
        />
      </Modal>
      <Card>
        {result.isPending ? (
          <Loading />
        ) : result.isError ? (
          <ErrorPanel error={result.error} />
        ) : (
          <Table
            rows={result.data.data}
            rowKey={(r) => r._id}
            columns={[
              {
                title: "Provider",
                render: (r) => (
                  <>
                    <strong>{r.name}</strong>
                    <code className="block">{r._id}</code>
                  </>
                ),
              },
              { title: "Adapter", render: (r) => r.code },
              {
                title: "New requests",
                render: (r) => (
                  <Badge value={r.enabled ? "ACTIVE" : "INACTIVE"} />
                ),
              },
              {
                title: "Action",
                render: (r) => (
                  <Confirm
                    title={`${r.enabled ? "Disable" : "Enable"} provider?`}
                    description={`Change new request availability for ${r.name}. Existing financial settlement can continue.`}
                    onConfirm={() =>
                      command(
                        `/platform/providers/${r._id}`,
                        { enabled: !r.enabled },
                        "PATCH",
                      )
                    }
                  >
                    {r.enabled ? "Disable" : "Enable"}
                  </Confirm>
                ),
              },
            ]}
          />
        )}
      </Card>
    </>
  );
}
export function OperatorsPage() {
  const providers = useResource(
    "/platform/providers",
    listSchema(providerSchema),
  );
  const command = useCommand();
  const [created, setCreated] = useState<z.infer<typeof operatorSchema>>();
  return (
    <>
      <PageTitle
        title="Create operator"
        description="Define an operator using a supported provider and explicit amount bounds."
      />
      <Alert>
        There is no platform operator listing or edit endpoint. Only creation
        and the resulting record are available here. Keep the created ID for
        your operational records.
      </Alert>
      <Card>
        <Form
          fields={[
            {
              name: "name",
              label: "Operator name",
              validation: z.string().min(1).max(100),
            },
            {
              name: "code",
              label: "Operator code",
              validation: z
                .string()
                .regex(
                  /^[A-Z0-9_-]{2,32}$/,
                  "Use 2–32 uppercase letters, digits, underscore, or hyphen.",
                ),
            },
            {
              name: "serviceType",
              label: "Service",
              type: "select",
              options: options(services),
            },
            {
              name: "providerId",
              label: "Provider",
              type: "select",
              validation: objectId,
              options:
                providers.data?.data.map((p) => ({
                  value: p._id,
                  label: `${p.name} (${p.code})`,
                })) ?? [],
            },
            {
              name: "minimum",
              label: "Minimum amount (₹)",
              type: "money",
              validation: moneyInput,
            },
            {
              name: "maximum",
              label: "Maximum amount (₹)",
              type: "money",
              validation: moneyInput,
            },
            {
              name: "budget",
              label: "Commission budget (%)",
              type: "money",
              validation: percentInput,
            },
          ]}
          submitLabel="Create operator"
          onSubmit={async (v) => {
            const minMinor = toPaise(v.minimum),
              maxMinor = toPaise(v.maximum);
            if (maxMinor < minMinor)
              throw new Error("Maximum must be at least the minimum.");
            setCreated(
              operatorSchema.parse(
                await command("/platform/operators", {
                  name: v.name,
                  code: v.code,
                  serviceType: v.serviceType,
                  providerId: v.providerId,
                  minMinor,
                  maxMinor,
                  commissionBudgetBps: toBasisPoints(v.budget),
                }),
              ),
            );
          }}
        />
      </Card>
      {created && (
        <Card>
          <Alert success>Operator created.</Alert>
          <dl>
            <dt>Record ID</dt>
            <dd>
              <code>{created._id}</code>
            </dd>
            <dt>Name / code</dt>
            <dd>
              {created.name} · {created.code}
            </dd>
            <dt>Service</dt>
            <dd>{created.serviceType}</dd>
            <dt>Amount bounds</dt>
            <dd>
              {money(created.minMinor)}–{money(created.maxMinor)}
            </dd>
            <dt>Provider ID</dt>
            <dd>
              <code>{created.providerId}</code>
            </dd>
          </dl>
        </Card>
      )}
    </>
  );
}
export function AuditPage() {
  const result = useRecords("/platform/audit-logs", auditSchema);
  return (
    <>
      <PageTitle
        title="Audit trail"
        description="Platform activity and administrative evidence, newest first."
      />
      <Card>
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
                { title: "Date", render: (r) => dateTime(r.createdAt) },
                { title: "Action", render: (r) => <strong>{r.action}</strong> },
                {
                  title: "Actor",
                  render: (r) => <code>{r.actorId ?? "System"}</code>,
                },
                {
                  title: "Target",
                  render: (r) => <code>{r.targetId ?? "—"}</code>,
                },
                {
                  title: "Request",
                  render: (r) => <code>{r.requestId ?? "—"}</code>,
                },
              ]}
            />
            <Pagination
              page={result.page}
              count={result.data.data.length}
              total={result.data.total}
              onChange={result.setPage}
            />
          </>
        )}
      </Card>
    </>
  );
}
