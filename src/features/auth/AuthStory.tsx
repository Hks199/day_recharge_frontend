import { Link } from "react-router-dom";
import { BarChart3, ShieldCheck, Wallet, Zap } from "lucide-react";
import { useBrand } from "../../app/providers";
import { Brand } from "../landing/Brand";
import "../landing/landing.css";

export default function AuthStory({
  registration = false,
}: {
  registration?: boolean;
}) {
  const brand = useBrand();
  return (
    <aside className="login-story">
      <div className="login-story-content">
        <Link to="/" aria-label={`${brand.name} home`} className="login-brand">
          {!brand.logo &&
          brand.name.replace(/\s/g, "").toLowerCase() === "dayrecharge" ? (
            <img src="/images/day-recharge-login-logo.png" alt={brand.name} />
          ) : (
            <Brand inverse />
          )}
        </Link>
        <h2>
          {registration ? "Start your business with" : "Welcome back to"}
          <br />
          <span>{brand.name}</span>
        </h2>
        <p>
          {registration
            ? "Get connected to a workspace for recharges, bill payments, and your business network."
            : "Manage your recharges, payments, and business network from one connected workspace."}
        </p>
        <ul className="login-features">
          <li>
            <span>
              <Zap size={18} aria-hidden="true" />
            </span>
            Recharge & bill payments
          </li>
          <li>
            <span>
              <ShieldCheck size={18} aria-hidden="true" />
            </span>
            Secure account access
          </li>
          <li>
            <span>
              <Wallet size={18} aria-hidden="true" />
            </span>
            Wallet & commission tracking
          </li>
          <li>
            <span>
              <BarChart3 size={18} aria-hidden="true" />
            </span>
            Transaction reports & analytics
          </li>
        </ul>
        <div className="login-trust">
          <small>Built for</small>
          <strong>Your business network</strong>
          <span>Retailers, distributors & business owners</span>
        </div>
      </div>
    </aside>
  );
}
