import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowRight,
  BriefcaseBusiness,
  Info,
  Mail,
  Smartphone,
  UserRound,
  UserRoundPlus,
} from "lucide-react";
import { useBrand } from "../../app/providers";
import AuthStory from "./AuthStory";
import "./login.css";
import "./register.css";

const requestSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(100),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number."),
  email: z.email("Enter a valid email address.").max(254),
  role: z.enum(["RETAILER", "DISTRIBUTOR"], {
    error: "Select your preferred role.",
  }),
});
type AccessRequest = z.infer<typeof requestSchema>;

export default function RegisterPage() {
  const brand = useBrand();
  const supportEmail = brand.support.email;
  const [draftOpened, setDraftOpened] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AccessRequest>({ resolver: zodResolver(requestSchema) });
  useEffect(() => {
    const previous = window.document.title;
    window.document.title = `Create Account | ${brand.name}`;
    return () => {
      window.document.title = previous;
    };
  }, [brand.name]);
  function requestAccess(values: AccessRequest) {
    if (!supportEmail) return;
    const subject = encodeURIComponent(
      `Account access request | ${brand.name}`,
    );
    const body = encodeURIComponent(
      `Hello,\r\n\r\nI would like to request an account.\r\n\r\nFull name: ${values.name}\r\nMobile: ${values.phone}\r\nEmail: ${values.email}\r\nPreferred role: ${values.role === "RETAILER" ? "Retailer" : "Distributor"}\r\n\r\nPlease let me know the next steps.`,
    );
    window.open(
      `mailto:${supportEmail}?subject=${subject}&body=${body}`,
      "_self",
    );
    setDraftOpened(true);
  }
  return (
    <div className="reference-auth register-page">
      <AuthStory registration />
      <main className="login-main">
        <section
          className="login-card register-card"
          aria-labelledby="register-heading"
        >
          <div className="login-card-heading">
            <span className="login-symbol">
              <UserRoundPlus size={26} aria-hidden="true" />
            </span>
            <h1 id="register-heading">Create Account</h1>
            <p>It only takes a minute to get started</p>
          </div>
          <form noValidate onSubmit={handleSubmit(requestAccess)}>
            <div className="register-grid">
              {(
                [
                  {
                    key: "name",
                    label: "Full name",
                    placeholder: "Full name",
                    type: "text",
                    autoComplete: "name",
                    Icon: UserRound,
                    max: 100,
                  },
                  {
                    key: "phone",
                    label: "Mobile number",
                    placeholder: "10-digit mobile",
                    type: "tel",
                    autoComplete: "tel-national",
                    Icon: Smartphone,
                    max: 10,
                  },
                  {
                    key: "email",
                    label: "Email address",
                    placeholder: "Email address",
                    type: "email",
                    autoComplete: "email",
                    Icon: Mail,
                    max: 254,
                  },
                ] as const
              ).map(
                ({
                  key,
                  label,
                  placeholder,
                  type,
                  autoComplete,
                  Icon,
                  max,
                }) => (
                  <div className="register-field" key={key}>
                    <label htmlFor={`register-${key}`}>{label}</label>
                    <div className="register-input-wrap">
                      <Icon size={17} aria-hidden="true" />
                      <input
                        id={`register-${key}`}
                        type={type}
                        placeholder={placeholder}
                        autoComplete={autoComplete}
                        inputMode={key === "phone" ? "numeric" : undefined}
                        maxLength={max}
                        required
                        aria-invalid={!!errors[key]}
                        aria-describedby={
                          errors[key] ? `register-${key}-error` : undefined
                        }
                        {...register(key)}
                      />
                    </div>
                    {errors[key] && (
                      <small
                        className="field-error"
                        id={`register-${key}-error`}
                        role="alert"
                      >
                        {errors[key].message}
                      </small>
                    )}
                  </div>
                ),
              )}
              <div className="register-field">
                <label htmlFor="register-role">Preferred role</label>
                <div className="register-input-wrap">
                  <BriefcaseBusiness size={17} aria-hidden="true" />
                  <select
                    id="register-role"
                    required
                    aria-invalid={!!errors.role}
                    aria-describedby={
                      errors.role ? "register-role-error" : undefined
                    }
                    {...register("role")}
                  >
                    <option value="">Select your role</option>
                    <option value="RETAILER">Retailer</option>
                    <option value="DISTRIBUTOR">Distributor</option>
                  </select>
                </div>
                {errors.role && (
                  <small
                    className="field-error"
                    id="register-role-error"
                    role="alert"
                  >
                    {errors.role.message}
                  </small>
                )}
              </div>
            </div>
            <p className="register-note" id="register-note">
              <Info size={16} aria-hidden="true" />
              <span>
                Accounts are created by an administrator. Request access by
                email; review and send the draft in your email app. Your
                administrator will provide sign-in details.
              </span>
            </p>
            <p className="register-policies">
              Ask your administrator about the <Link to="/terms">Terms</Link>{" "}
              and <Link to="/privacy">Privacy Policy</Link>.
            </p>
            <button
              className="register-submit"
              type="submit"
              disabled={!supportEmail}
              aria-describedby="register-note"
            >
              <UserRoundPlus size={17} aria-hidden="true" />
              Request Account Access
            </button>
            {!supportEmail && (
              <p className="register-note">
                Contact your business administrator to request an account.
                Support email has not been configured.
              </p>
            )}
            {draftOpened && (
              <p className="register-status" role="status">
                Continue in your email app to send your request. No account has
                been created yet. If your email app did not open, contact{" "}
                {supportEmail} directly.
              </p>
            )}
          </form>
          <p className="login-account">
            Already have an account?{" "}
            <Link to="/login">
              Sign in <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </p>
          <Link className="register-home" to="/">
            Back to home
          </Link>
        </section>
      </main>
    </div>
  );
}
