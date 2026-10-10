import { useState } from "react";
import { z } from "zod";
import { useAuth } from "../../app/providers";
import {
  Alert,
  Badge,
  Button,
  Card,
  ErrorPanel,
  Form,
  Loading,
  Modal,
  PageTitle,
  Pagination,
} from "../../components/ui";
import { notificationSchema, ticketSchema } from "../../types/contracts";
import { useCommand, useRecords } from "../shared/data";
import { dateTime } from "../../lib/money";
import { options } from "../shared/validation";
export function SupportPage() {
  const { user } = useAuth();
  const command = useCommand();
  const result = useRecords("/support-tickets", ticketSchema);
  const [create, setCreate] = useState(false);
  return (
    <>
      <PageTitle
        title="Support tickets"
        description={
          user!.role === "SUPER_ADMIN"
            ? "Review and respond to your tenant’s support requests."
            : "Ask for help and follow responses from your business support team."
        }
      >
        <Button onClick={() => setCreate(true)}>New support ticket</Button>
      </PageTitle>
      <Modal open={create} onOpenChange={setCreate} title="How can we help?">
        <Form
          fields={[
            {
              name: "subject",
              label: "Subject",
              validation: z.string().min(5).max(150),
            },
            {
              name: "message",
              label: "Message",
              type: "textarea",
              validation: z.string().min(10).max(5000),
              help: "Include transaction references if useful. Never include passwords or tokens.",
            },
          ]}
          submitLabel="Create ticket"
          onSubmit={async (v) => {
            await command("/support-tickets", v);
            setCreate(false);
          }}
        />
      </Modal>
      {result.isPending ? (
        <Loading />
      ) : result.isError ? (
        <ErrorPanel error={result.error} />
      ) : (
        <>
          {result.data.data.length === 0 && (
            <Card>
              <p>No support tickets yet.</p>
            </Card>
          )}
          {result.data.data.map((t) => (
            <Card key={t._id}>
              <div className="card-heading">
                <div>
                  <h2>{t.subject}</h2>
                  <small>
                    {dateTime(t.createdAt)} · <code>{t._id}</code>
                  </small>
                </div>
                <Badge value={t.status} />
              </div>
              <p className="preserve-lines">{t.message}</p>
              {t.response && (
                <div className="support-response">
                  <strong>Support response</strong>
                  <p className="preserve-lines">{t.response}</p>
                </div>
              )}
              {user!.role === "SUPER_ADMIN" && (
                <details>
                  <summary>Respond or change status</summary>
                  <Form
                    key={`${t._id}-${t.updatedAt}`}
                    initial={{ status: t.status, response: t.response ?? "" }}
                    fields={[
                      {
                        name: "status",
                        label: "Ticket status",
                        type: "select",
                        options: options(["OPEN", "CLOSED"]),
                      },
                      {
                        name: "response",
                        label: "Response",
                        type: "textarea",
                        validation: z.string().min(1).max(5000),
                      },
                    ]}
                    onSubmit={(v) =>
                      command(`/support-tickets/${t._id}`, v, "PATCH")
                    }
                    successMessage="Ticket updated."
                  />
                </details>
              )}
            </Card>
          ))}
          <Pagination
            page={result.page}
            count={result.data.data.length}
            total={result.data.total}
            onChange={result.setPage}
          />
        </>
      )}
    </>
  );
}
export function NotificationsPage() {
  const result = useRecords("/notifications", notificationSchema);
  const command = useCommand();
  const [error, setError] = useState<unknown>();
  return (
    <>
      <PageTitle
        title="Notifications"
        description="Updates for your account, directly from your business workspace."
      />
      {error !== undefined && <ErrorPanel error={error} />}
      {result.isPending ? (
        <Loading />
      ) : result.isError ? (
        <ErrorPanel error={result.error} />
      ) : (
        <>
          {!result.data.data.length && (
            <Alert success>
              You’re all caught up. No notifications to show.
            </Alert>
          )}
          {result.data.data.map((n) => (
            <Card key={n._id}>
              <div className="card-heading">
                <div>
                  <h2>{n.title}</h2>
                  <small>{dateTime(n.createdAt)}</small>
                </div>
                <Badge value={n.readAt ? "READ" : "UNREAD"} />
              </div>
              <p>{n.message}</p>
              {n.reference && (
                <small>
                  Reference: <code>{n.reference}</code>
                </small>
              )}
              {!n.readAt && (
                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      await command(
                        `/notifications/${n._id}/read`,
                        undefined,
                        "PATCH",
                      );
                    } catch (e) {
                      setError(e);
                    }
                  }}
                >
                  Mark as read
                </Button>
              )}
            </Card>
          ))}
          <Pagination
            page={result.page}
            total={result.data.total}
            count={result.data.data.length}
            onChange={result.setPage}
          />
        </>
      )}
    </>
  );
}
