import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { Brand } from "../landing/Landing";
import { useAuth, useBrand } from "../../app/providers";
import {
  Form,
  Card,
  Alert,
  Confirm,
  PageTitle,
  ErrorPanel,
  Loading,
} from "../../components/ui";
import { api, isPlatform } from "../../lib/api/client";
import { safeReturnTo } from "../../lib/permissions";
import { email, name, phone, newPassword } from "../shared/validation";
import { useCommand, useResource } from "../shared/data";
import { userSchema } from "../../types/contracts";
export function LoginForm() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  return (
    <Form
      fields={[
        {
          name: "email",
          label: "Email address",
          type: "email",
          validation: email,
          autoComplete: "username",
          placeholder: "you@business.com",
        },
        {
          name: "password",
          label: "Password",
          type: "password",
          validation: z.string().min(1, "Enter your password.").max(128),
          autoComplete: "current-password",
        },
      ]}
      submitLabel="Login to your workspace"
      onSubmit={async (v) => {
        const user = await api.login(v.email, v.password);
        navigate(safeReturnTo(params.get("returnTo"), user.role), {
          replace: true,
        });
      }}
    >
      <Link className="forgot-link" to="/forgot-password">
        Forgot password?
      </Link>
    </Form>
  );
}
export default function AuthPage({
  mode = "login",
}: {
  mode?: "login" | "forgot" | "reset";
}) {
  const brand = useBrand();
  const [params, setParams] = useSearchParams();
  const [token] = useState(() => {
    const captured = params.get("token") ?? "";
    if (captured) window.history.replaceState({}, "", window.location.pathname);
    return captured;
  });
  const [done, setDone] = useState(false);
  const heading =
    mode === "login"
      ? "Welcome back."
      : mode === "forgot"
        ? "Let’s get you back in."
        : "Set a new password.";
  return (
    <div className="auth-page">
      <aside className="auth-story">
        <Link to="/">
          <Brand inverse />
        </Link>
        <div>
          <span className="hero-tag">YOUR BUSINESS, CONNECTED</span>
          <h1>
            A clear view.
            <br />A confident
            <br />
            <em>working day.</em>
          </h1>
          <p>
            Your network, wallet, and everyday payments, together in one
            workspace.
          </p>
          <div className="auth-orbit">
            <ShieldCheck size={88} strokeWidth={1} />
          </div>
        </div>
        <small>Built around the way your business works.</small>
      </aside>
      <main className="auth-main">
        <Link to="/" className="back-link">
          <ArrowLeft size={16} /> Back to home
        </Link>
        <div className="auth-box">
          <div className="auth-mobile-brand">
            <Brand />
          </div>
          <p className="eyebrow">
            {isPlatform ? "PLATFORM WORKSPACE" : brand.name.toUpperCase()}
          </p>
          <h1>{heading}</h1>
          <p>
            {mode === "login"
              ? "Enter your credentials to open your workspace."
              : mode === "forgot"
                ? "Enter your account email to request reset instructions."
                : "Choose 12–128 characters for your new password."}
          </p>
          {params.get("reason") === "session" && (
            <Alert>
              Your session ended. Please sign in again. A full page reload also
              requires login.
            </Alert>
          )}
          {params.get("logout") === "unconfirmed" && (
            <Alert>
              Local sign-out is complete. Server session revocation could not be
              confirmed because the request failed. Sign in again or contact
              your administrator to revoke sessions.
            </Alert>
          )}
          {mode === "login" ? (
            <LoginForm />
          ) : done ? (
            <Alert success>
              {mode === "forgot"
                ? "If the account exists, reset instructions will be delivered."
                : "Password updated. Sign in with your new password."}
            </Alert>
          ) : (
            <Form
              fields={
                mode === "forgot"
                  ? [
                      {
                        name: "email",
                        label: "Account email",
                        type: "email",
                        validation: email,
                      },
                    ]
                  : [
                      {
                        name: "token",
                        label: "Reset token",
                        defaultValue: token,
                        validation: z
                          .string()
                          .length(
                            64,
                            "Enter the 64-character token from your reset instructions.",
                          ),
                      },
                      {
                        name: "password",
                        label: "New password",
                        type: "password",
                        validation: newPassword,
                        autoComplete: "new-password",
                      },
                    ]
              }
              submitLabel={
                mode === "forgot"
                  ? "Request reset instructions"
                  : "Reset password"
              }
              onSubmit={async (v) => {
                await api.request(
                  `${api.prefix}/password-reset/${mode === "forgot" ? "request" : "confirm"}`,
                  z.unknown(),
                  { method: "POST", body: v, public: true },
                );
                setDone(true);
                setParams({}, { replace: true });
              }}
            />
          )}
          {mode !== "login" && (
            <Link className="text-link" to="/login">
              Return to login <ArrowRight size={16} />
            </Link>
          )}
          <div className="auth-help">
            <ShieldCheck size={17} />
            <p>
              Use the account provided by your administrator.
              <br />
              Access is determined by your assigned role.
            </p>
          </div>
        </div>
        <small className="auth-copyright">
          {brand.name} · Your connected business workspace
        </small>
      </main>
    </div>
  );
}
export function ProfilePage() {
  const { clear } = useAuth();
  const profile = useResource(`${api.prefix}/me`, userSchema);
  const command = useCommand();
  if (profile.isPending) return <Loading />;
  if (profile.isError) return <ErrorPanel error={profile.error} />;
  const user = profile.data;
  return (
    <>
      <PageTitle
        title="My account"
        description="Your profile, password, and account security."
      />
      <div className="two-columns">
        <Card>
          <h2>Profile details</h2>
          <p className="muted">
            {user.email} · {user.role.replaceAll("_", " ")}
          </p>
          <Form
            key={user.id}
            initial={{ name: user.name, phone: user.phone ?? "" }}
            fields={[
              { name: "name", label: "Full name", validation: name },
              { name: "phone", label: "Phone number", validation: phone },
            ]}
            onSubmit={async (v) => {
              const updated = userSchema.parse(
                await command(`${api.prefix}/me`, v, "PATCH"),
              );
              const session = api.getSession();
              if (session) api.setSession({ ...session, user: updated });
            }}
            successMessage="Profile updated."
          />
        </Card>
        <Card>
          <h2>Change password</h2>
          <p className="muted">Changing your password revokes all sessions.</p>
          <Form
            fields={[
              {
                name: "oldPassword",
                label: "Current password",
                type: "password",
                validation: z.string().min(1).max(128),
              },
              {
                name: "newPassword",
                label: "New password",
                type: "password",
                validation: newPassword,
                autoComplete: "new-password",
              },
            ]}
            submitLabel="Change password & sign out"
            onSubmit={async (v) => {
              await command(`${api.prefix}/change-password`, v);
              api.onRotate();
              clear();
            }}
          />
        </Card>
      </div>
      <Card>
        <h2>Active sessions</h2>
        <p>
          Revoke access on every device, including this session. You will need
          to sign in again.
        </p>
        <Confirm
          title="Revoke all sessions?"
          danger
          description="All devices will be signed out. This cannot be undone."
          onConfirm={async () => {
            await command(`${api.prefix}/sessions`, undefined, "DELETE");
            api.onRotate();
            clear();
          }}
        >
          Revoke all sessions
        </Confirm>
      </Card>
    </>
  );
}
