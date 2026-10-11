import { useState } from "react";
import { z } from "zod";
import { useAuth } from "../../app/providers";
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
  Table,
} from "../../components/ui";
import {
  challengeSchema,
  domainSchema,
  listSchema,
  services,
  settingsSchema,
  tenantSchema,
} from "../../types/contracts";
import { useCommand, useResource } from "../shared/data";
import { email, moneyInput } from "../shared/validation";
import { decimalFromInteger, toPaise } from "../../lib/money";
export function DomainsPage({ tenantId }: { tenantId?: string }) {
  const path = tenantId
    ? `/platform/tenants/${tenantId}/domains`
    : "/tenant/domains";
  const result = useResource(path, listSchema(domainSchema));
  const command = useCommand();
  const [challenge, setChallenge] = useState<z.infer<typeof challengeSchema>>();
  const [error, setError] = useState<unknown>();
  return (
    <>
      <PageTitle
        title="Custom domains"
        description="Verified hostnames connect customers to the right business."
      />
      <Alert>
        Add apex and www hostnames separately. Domain verification requires the
        exact TXT record in public DNS. A primary domain must be verified and
        cannot be removed.
      </Alert>
      <Card>
        <h2>Add a hostname</h2>
        <Form
          fields={[
            {
              name: "hostname",
              label: "Domain hostname",
              placeholder: "recharge.example.com",
              validation: z
                .string()
                .trim()
                .min(1)
                .max(253)
                .refine(
                  (value) => value.includes(".") && !/[:/@?#\s]/.test(value),
                  "Enter a hostname without scheme, path, or port.",
                ),
            },
          ]}
          submitLabel="Get DNS challenge"
          onSubmit={async (v) => {
            const response = challengeSchema.parse(await command(path, v));
            setChallenge(response);
          }}
        />
        {challenge && (
          <div className="dns-challenge">
            <h3>Publish this TXT record</h3>
            <p>
              Save these instructions now. The backend does not return the
              challenge value in the domain listing.
            </p>
            <dl>
              <dt>Hostname</dt>
              <dd>{challenge.hostname}</dd>
              <dt>TXT name</dt>
              <dd>
                <code>{challenge.txtName}</code>
              </dd>
              <dt>TXT value</dt>
              <dd>
                <code>{challenge.txtValue}</code>
              </dd>
            </dl>
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    `${challenge.txtName} TXT ${challenge.txtValue}`,
                  );
                } catch {
                  setError(
                    new Error(
                      "Clipboard unavailable. Select and copy the TXT record above.",
                    ),
                  );
                }
              }}
            >
              Copy TXT record
            </Button>
          </div>
        )}
      </Card>
      {error !== undefined && <ErrorPanel error={error} />}
      <Card>
        <h2>Domain mappings</h2>
        {result.isPending ? (
          <Loading />
        ) : result.isError ? (
          <ErrorPanel
            error={result.error}
            retry={() => void result.refetch()}
          />
        ) : (
          <Table
            rows={result.data.data}
            rowKey={(r) => r._id}
            columns={[
              {
                title: "Hostname",
                render: (r) => <strong>{r.hostname}</strong>,
              },
              {
                title: "Verification",
                render: (r) => (
                  <Badge value={r.verifiedAt ? "VERIFIED" : "UNVERIFIED"} />
                ),
              },
              {
                title: "Primary",
                render: (r) =>
                  r.primary ? "Primary domain" : "Secondary domain",
              },
              {
                title: "Actions",
                render: (r) => (
                  <div className="actions">
                    {!r.verifiedAt && (
                      <Confirm
                        title="Check DNS ownership?"
                        description={`Check the public TXT record at _recharge-verification.${r.hostname}.`}
                        onConfirm={() => command(`${path}/${r._id}/verify`)}
                      >
                        Verify DNS
                      </Confirm>
                    )}
                    {r.verifiedAt && !r.primary && (
                      <Confirm
                        title="Set primary domain?"
                        description={`Make ${r.hostname} the primary public domain for this tenant.`}
                        onConfirm={() =>
                          command(
                            `${path}/${r._id}/primary`,
                            undefined,
                            "PATCH",
                          )
                        }
                      >
                        Set primary
                      </Confirm>
                    )}
                    {!r.primary && (
                      <Confirm
                        title="Remove domain?"
                        danger
                        description={`Remove ${r.hostname}. Access through this hostname will stop.`}
                        onConfirm={() =>
                          command(`${path}/${r._id}`, undefined, "DELETE")
                        }
                      >
                        Remove
                      </Confirm>
                    )}
                  </div>
                ),
              },
            ]}
          />
        )}
      </Card>
    </>
  );
}
export function SettingsPage() {
  const { user } = useAuth();
  const platform = user!.role === "DEVELOPER";
  const path = platform ? "/platform/settings" : "/tenant/settings";
  const result = useResource(path, settingsSchema.nullable());
  const tenant = useResource("/tenant", tenantSchema, !platform);
  const command = useCommand();
  const [enabled, setEnabled] = useState<string[] | null>(null);
  if (result.isPending) return <Loading />;
  if (result.isError) return <ErrorPanel error={result.error} />;
  const data = result.data;
  const selected = enabled ?? data?.enabledServices ?? [...services];
  return (
    <>
      <PageTitle
        title={platform ? "Platform settings" : "Business settings"}
        description="Service restrictions and verified public support contacts."
      />
      <Card>
        <h2>Enabled services</h2>
        <p>
          Platform restrictions and tenant settings both apply. Changes affect
          new submissions.
        </p>
        <div className="service-checkboxes">
          {services.map((s) => (
            <label className="check-label" key={s}>
              <input
                type="checkbox"
                checked={selected.includes(s)}
                onChange={(e) =>
                  setEnabled(
                    e.target.checked
                      ? [...selected, s]
                      : selected.filter((v) => v !== s),
                  )
                }
              />
              {s}
            </label>
          ))}
        </div>
        <Form
          key={data?.supportEmail ?? "settings"}
          initial={{
            supportEmail: data?.supportEmail ?? "",
            supportPhone: data?.supportPhone ?? "",
            maxRecharge: decimalFromInteger(
              data?.maxRechargeMinor ?? 1_000_000_000,
            ),
          }}
          fields={[
            {
              name: "supportEmail",
              label: "Public support email",
              type: "email",
              optional: true,
              validation: email.or(z.literal("")),
            },
            ...(platform
              ? [
                  {
                    name: "maxRecharge",
                    label: "Maximum payment amount (₹)",
                    type: "money" as const,
                    validation: moneyInput,
                  },
                ]
              : [
                  {
                    name: "supportPhone",
                    label: "Public support phone",
                    optional: true,
                    validation: z.string().max(20),
                  },
                ]),
          ]}
          onSubmit={async (v) => {
            await command(
              path,
              {
                enabledServices: selected,
                ...(v.supportEmail ? { supportEmail: v.supportEmail } : {}),
                ...(platform
                  ? { maxRechargeMinor: toPaise(v.maxRecharge) }
                  : { supportPhone: v.supportPhone }),
              },
              "PATCH",
            );
          }}
          successMessage="Settings saved."
        />
      </Card>
      {!platform && (
        <Card>
          <h2>Branding</h2>
          <p>
            Your colors and logo are used throughout your tenant workspace. Text
            contrast is adjusted for readable primary actions.
          </p>
          {tenant.isPending ? (
            <Loading />
          ) : tenant.isError ? (
            <ErrorPanel error={tenant.error} />
          ) : (
            <Form
              key={tenant.data._id}
              initial={{
                logo: tenant.data.branding?.logo ?? "",
                primaryColor: tenant.data.branding?.primaryColor ?? "#2563eb",
                secondaryColor:
                  tenant.data.branding?.secondaryColor ?? "#0d9488",
              }}
              fields={[
                {
                  name: "logo",
                  label: "Logo URL (HTTPS or /images/ path)",
                  optional: true,
                  validation: z
                    .url()
                    .startsWith("https://")
                    .or(z.string().regex(/^\/images\/[a-zA-Z0-9_./-]+$/))
                    .or(z.literal("")),
                },
                {
                  name: "primaryColor",
                  label: "Primary color",
                  type: "color",
                  validation: z.string().regex(/^#[a-f\d]{6}$/i),
                },
                {
                  name: "secondaryColor",
                  label: "Secondary color",
                  type: "color",
                  validation: z.string().regex(/^#[a-f\d]{6}$/i),
                },
              ]}
              onSubmit={async (v) => {
                await command(
                  "/tenant/branding",
                  {
                    primaryColor: v.primaryColor,
                    secondaryColor: v.secondaryColor,
                    ...(v.logo ? { logo: v.logo } : {}),
                  },
                  "PATCH",
                );
              }}
            />
          )}
        </Card>
      )}
    </>
  );
}
