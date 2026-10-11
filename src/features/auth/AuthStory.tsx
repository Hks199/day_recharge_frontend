import { useWebsite } from "../../app/website";
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
  const website = useWebsite();
  const content = website.text;

  const brand = useBrand();
  return (
    <aside className="login-story">
      <div className="login-story-content">
        <Link
          to={content("auth.to.1")}
          aria-label={`${brand.name} home`}
          className="login-brand"
        >
          {website.brand.authLogo || brand.logo ? (
            <img src={website.brand.authLogo || brand.logo} alt={brand.name} />
          ) : (
            <Brand inverse />
          )}
        </Link>
        <h2>
          {registration ? content("auth.text.2") : content("auth.text.3")}
          <br />
          <span>{brand.name}</span>
        </h2>
        <p>{registration ? content("auth.text.4") : content("auth.text.5")}</p>
        <ul className="login-features">
          <li>
            <span>
              <Zap size={18} aria-hidden="true" />
            </span>
            {content("auth.li.6")}
          </li>
          <li>
            <span>
              <ShieldCheck size={18} aria-hidden="true" />
            </span>
            {content("auth.li.7")}
          </li>
          <li>
            <span>
              <Wallet size={18} aria-hidden="true" />
            </span>
            {content("auth.li.8")}
          </li>
          <li>
            <span>
              <BarChart3 size={18} aria-hidden="true" />
            </span>
            {content("auth.li.9")}
          </li>
        </ul>
        <div className="login-trust">
          <small>{content("auth.small.10")}</small>
          <strong>{content("auth.strong.11")}</strong>
          <span>{content("auth.span.12")}</span>
        </div>
      </div>
    </aside>
  );
}
