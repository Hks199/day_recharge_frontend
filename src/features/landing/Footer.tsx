import { Link } from "react-router-dom";
import { Rocket, Headphones, Mail } from "lucide-react";
import { useBrand } from "../../app/providers";
import "./footer.css";

export default function Footer({
  registration = false,
}: {
  registration?: boolean;
}) {
  const brand = useBrand();
  return (
    <footer className="dr-footer">
      <div className="dr-footer-container">
        <div className="dr-footer-row">
          <div className="dr-footer-intro dr-footer-column">
            <Link to="/" aria-label={`${brand.name} home`}>
              <img
                className="dr-footer-logo"
                src="/images/day-recharge-logo.jpg"
                alt={brand.name}
                width="75"
                height="48"
              />
            </Link>
            <p>
              A connected recharge and bill payment workspace for business
              owners, Distributors, and Retailers.
            </p>
          </div>
          <nav
            className="dr-footer-column dr-footer-links"
            aria-label="Footer services"
          >
            <h3>Services</h3>
            <ul>
              {[
                "Prepaid Recharge",
                "DTH Recharge",
                "Electricity Bill",
                "Bill Payments",
              ].map((service) => (
                <li key={service}>
                  <Link to="/login">{service}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav
            className="dr-footer-column dr-footer-links"
            aria-label="Footer company"
          >
            <h3>Company</h3>
            <ul>
              <li>
                <Link to="/aboutus">About Us</Link>
              </li>
              <li>
                <Link to="/contactus">Contact</Link>
              </li>
              <li>
                <Link to="/terms">Terms &amp; Conditions</Link>
              </li>
              <li>
                <Link to="/privacy">Privacy Policy</Link>
              </li>
            </ul>
          </nav>
          <div className="dr-footer-column dr-footer-start">
            <h3>Get Started Today</h3>
            <p>
              Access your payments, wallet, and business network through your
              authorized account.
            </p>
            <Link
              className="dr-footer-register"
              to={registration ? "/register" : "/login"}
            >
              <Rocket size={13} /> {registration ? "Register Now" : "Login Now"}
            </Link>
            <div className="dr-footer-support">
              <div>Support</div>
              {brand.support.phone && (
                <a href={`tel:${brand.support.phone}`}>
                  <Headphones size={13} />
                  {brand.support.phone}
                </a>
              )}
              {brand.support.email && (
                <a href={`mailto:${brand.support.email}`}>
                  <Mail size={13} />
                  {brand.support.email}
                </a>
              )}
              {!brand.support.phone && !brand.support.email && (
                <Link to="/contactus">Contact your business administrator</Link>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="dr-footer-copyright">
        <div className="dr-footer-container dr-footer-bottom">
          <p>
            © {new Date().getFullYear()} <strong>{brand.name}</strong>. All
            Rights Reserved.
          </p>
          <nav aria-label="Footer legal">
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
