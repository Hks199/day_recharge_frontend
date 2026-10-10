import { useState } from "react";
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
} from "../../components/ui";
import {
  commissionSchema,
  listSchema,
  operatorSchema,
  ruleSchema,
  services,
} from "../../types/contracts";
import { useCommand, useRecords, useResource } from "../shared/data";
import {
  dateTime,
  decimalFromInteger,
  money,
  toBasisPoints,
  toPaise,
} from "../../lib/money";
import { isoDate, objectId, options } from "../shared/validation";
export function CommissionsPage() {
  const result = useRecords("/commissions/records", commissionSchema);
  return (
    <>
      <PageTitle
        title="Commission records"
        description="Actual direct payouts recorded by the backend, including reversals."
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
                {
                  title: "Beneficiary",
                  render: (r) => <code>{r.beneficiaryUserId}</code>,
                },
                {
                  title: "Transaction",
                  render: (r) => <code>{r.transactionId}</code>,
                },
                { title: "Amount", render: (r) => money(r.amountMinor) },
                { title: "Status", render: (r) => <Badge value={r.status} /> },
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
export function RulesPage() {
  const result = useRecords("/commissions/rules", ruleSchema);
  const operators = useResource(
    "/recharges/operators",
    listSchema(operatorSchema),
  );
  const command = useCommand();
  const [create, setCreate] = useState(false),
    [calculation, setCalculation] = useState("PERCENTAGE");
  return (
    <>
      <PageTitle
        title="Commission rules"
        description="Direct payouts funded from the designated owner’s wallet."
      >
        <Button onClick={() => setCreate(true)}>Create rule</Button>
      </PageTitle>
      <Alert>
        Rules are direct payouts, not cumulative tiers. The backend checks the
        operator budget and snapshots rules when a payment is accepted.
        Disabling a rule does not alter existing transaction snapshots.
      </Alert>
      <Modal
        open={create}
        onOpenChange={setCreate}
        title="Create commission rule"
      >
        <div className="tabs">
          <Button
            variant={calculation === "PERCENTAGE" ? "primary" : "secondary"}
            onClick={() => setCalculation("PERCENTAGE")}
          >
            Percentage
          </Button>
          <Button
            variant={calculation === "FIXED" ? "primary" : "secondary"}
            onClick={() => setCalculation("FIXED")}
          >
            Fixed INR
          </Button>
        </div>
        <Form
          key={calculation}
          fields={[
            {
              name: "serviceType",
              label: "Service",
              type: "select",
              options: options(services),
            },
            {
              name: "operatorId",
              label: "Operator",
              type: "select",
              validation: objectId,
              options:
                operators.data?.data.map((o) => ({
                  value: o._id,
                  label: `${o.name} · ${o.serviceType}`,
                })) ?? [],
            },
            {
              name: "beneficiaryRole",
              label: "Beneficiary role",
              type: "select",
              options: options(["RETAILER", "DISTRIBUTOR", "SUPER_ADMIN"]),
            },
            {
              name: "value",
              label:
                calculation === "PERCENTAGE"
                  ? "Direct payout (%)"
                  : "Direct payout (₹)",
              type: "money",
              validation: z.string().refine((v) => {
                try {
                  return (
                    (calculation === "PERCENTAGE"
                      ? toBasisPoints(v)
                      : toPaise(v)) <= 10000
                  );
                } catch {
                  return false;
                }
              }, "Maximum is 100% or ₹100.00. Use at most 2 decimal places."),
            },
            {
              name: "effectiveFrom",
              label: "Effective from",
              type: "datetime-local",
            },
            {
              name: "effectiveTo",
              label: "Effective until",
              type: "datetime-local",
              optional: true,
            },
          ]}
          submitLabel="Create direct payout rule"
          onSubmit={async (v) => {
            if (
              operators.data?.data.find((o) => o._id === v.operatorId)
                ?.serviceType !== v.serviceType
            )
              throw new Error("Operator must match the selected service.");
            if (
              v.effectiveTo &&
              new Date(v.effectiveTo) <= new Date(v.effectiveFrom)
            )
              throw new Error("End date must follow start date.");
            await command("/commissions/rules", {
              serviceType: v.serviceType,
              operatorId: v.operatorId,
              beneficiaryRole: v.beneficiaryRole,
              calculationType: calculation,
              commissionValue:
                calculation === "PERCENTAGE"
                  ? toBasisPoints(v.value)
                  : toPaise(v.value),
              effectiveFrom: isoDate(v.effectiveFrom),
              ...(v.effectiveTo ? { effectiveTo: isoDate(v.effectiveTo) } : {}),
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
          <>
            <Table
              rows={result.data.data}
              rowKey={(r) => r._id}
              columns={[
                {
                  title: "Service / operator",
                  render: (r) => (
                    <>
                      {r.serviceType}
                      <small className="block">
                        {operators.data?.data.find(
                          (o) => o._id === r.operatorId,
                        )?.name ?? r.operatorId}
                      </small>
                    </>
                  ),
                },
                { title: "Beneficiary", render: (r) => r.beneficiaryRole },
                {
                  title: "Payout",
                  render: (r) =>
                    r.calculationType === "FIXED"
                      ? money(r.commissionValue)
                      : `${decimalFromInteger(r.commissionValue)}%`,
                },
                {
                  title: "Effective window",
                  render: (r) => (
                    <>
                      {dateTime(r.effectiveFrom)}
                      <small className="block">
                        Until{" "}
                        {r.effectiveTo ? dateTime(r.effectiveTo) : "disabled"}
                      </small>
                    </>
                  ),
                },
                { title: "Status", render: (r) => <Badge value={r.status} /> },
                {
                  title: "Action",
                  render: (r) =>
                    r.status === "ACTIVE" ? (
                      <Confirm
                        title="Disable rule?"
                        description="Future payments will not use this rule. Existing payment snapshots remain in effect."
                        onConfirm={() =>
                          command(
                            `/commissions/rules/${r._id}`,
                            { status: "INACTIVE" },
                            "PATCH",
                          )
                        }
                      >
                        Disable
                      </Confirm>
                    ) : (
                      "—"
                    ),
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
