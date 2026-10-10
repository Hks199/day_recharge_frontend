import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Check,
  Headphones,
  Network,
  Rocket,
  ShieldCheck,
  Smartphone,
  Store,
  UserRoundPlus,
  Wallet,
  Zap,
} from "lucide-react";
import Footer from "./Footer";
import MarketingHeader from "./MarketingHeader";
import "./landing.css";
import "./reference-theme.css";
import "./home.css";
export { Brand } from "./Brand";
const services = [
  { title: "Prepaid Recharge", image: "recharge.png", color: "#eef2ff" },
  { title: "Postpaid Bill", image: "api.png", color: "#f0fdf4" },
  { title: "DTH Recharge", image: "dth.png", color: "#fff7ed" },
  { title: "Electricity", image: "api.png", color: "#fef3c7" },
  { title: "Bill Payments", image: "BBPS_Logo.png", color: "#eef2ff" },
  { title: "Wallet Transfers", image: "api.png", color: "#f0fdf4" },
];
const benefits = [
  {
    icon: Zap,
    title: "Recharge Processing",
    text: "Submit supported payments and track their status in your workspace.",
    color: "#db2777",
  },
  {
    icon: ShieldCheck,
    title: "Secure Access",
    text: "Account permissions keep each workspace scoped to its assigned role.",
    color: "#10b981",
  },
  {
    icon: Wallet,
    title: "Transparent Commissions",
    text: "Review commission records and the rules set by your business.",
    color: "#f59e0b",
  },
  {
    icon: BarChart3,
    title: "Transaction Reports",
    text: "Find payment history, wallet statements, and business activity together.",
    color: "#3b82f6",
  },
  {
    icon: Network,
    title: "Connected Network",
    text: "Manage authorized Retailers and Distributors from one workspace.",
    color: "#9333ea",
  },
  {
    icon: Smartphone,
    title: "Your Business Identity",
    text: "Use your business branding on a verified custom domain.",
    color: "#10b981",
  },
];
const roles = [
  {
    icon: Store,
    title: "Retailer",
    text: "Serve your customers with supported recharges and bill payments.",
    highlight: "Recharge & Bills",
    caption: "Your customer workspace",
    color: "retailer",
    to: "/register",
  },
  {
    icon: Network,
    title: "Distributor",
    text: "Support your authorized Retailers and manage your business network.",
    highlight: "Retail Network",
    caption: "Connected business tools",
    color: "distributor",
    to: "/register",
  },
  {
    icon: ShieldCheck,
    title: "Business Owner",
    text: "Manage your business, branding, commission rules, and team access.",
    highlight: "Business Control",
    caption: "Your tenant workspace",
    color: "owner",
    to: "/contactus",
  },
];
export default function Landing() {
  return (
    <div className="lp lp-reference home-page">
      <MarketingHeader />
      <main id="main-content">
        <section className="home-hero">
          <div className="home-orb home-orb-one" aria-hidden="true" />
          <div className="home-orb home-orb-two" aria-hidden="true" />
          <div className="home-container home-hero-grid">
            <div className="home-hero-copy">
              <div className="home-badge">
                <span />
                Your B2B Recharge & Payment Platform
              </div>
              <h1>
                Power Your Business
                <br />
                With <span>Digital Services</span>
              </h1>
              <p className="home-subtitle">
                Mobile recharge, bill payments, and wallet management — all in
                one connected dashboard. Built for retailers, distributors, and
                business owners.
              </p>
              <div className="home-actions">
                <Link className="home-button" to="/register">
                  <Rocket size={17} aria-hidden="true" />
                  Get Started Now
                </Link>
                <Link className="home-button home-glass" to="/login">
                  Login to Dashboard
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
                <Link className="home-button home-green" to="/contactus">
                  <Headphones size={17} aria-hidden="true" />
                  Contact Support
                </Link>
              </div>
              <div className="home-stats" aria-label="Platform capabilities">
                <div>
                  <strong>Recharge</strong>
                  <span>Everyday Services</span>
                </div>
                <div>
                  <strong>Wallet</strong>
                  <span>Clear Records</span>
                </div>
                <div>
                  <strong>Reports</strong>
                  <span>Track Activity</span>
                </div>
                <div>
                  <strong>Teams</strong>
                  <span>Role-Based Access</span>
                </div>
              </div>
            </div>
            <div
              className="home-visual"
              aria-label="Illustration of the recharge workspace"
            >
              <img
                className="home-art"
                src="/images/digital-services.png"
                alt="Team working together with digital tools"
                width="587"
                height="250"
                fetchPriority="high"
              />
              <div className="home-float home-transaction">
                <small>PAYMENT WORKFLOW</small>
                <div>
                  <span className="home-check">
                    <Check size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <strong>Recharge & Bills</strong>
                    <span>Submit, review, and track</span>
                  </div>
                </div>
              </div>
              <div className="home-float home-earnings">
                <small>YOUR DAILY WORKSPACE</small>
                <strong>Wallet Control</strong>
                <span>Balance, funding & history</span>
              </div>
              <div className="home-float home-online">
                <span />
                Role-based access
              </div>
            </div>
          </div>
        </section>
        <section id="services" className="home-services">
          <div className="home-container">
            <div className="home-section-heading">
              <span className="home-tag">Our Services</span>
              <h2>Everything You Need in One Place</h2>
              <p>
                One workspace for recharges, supported bill payments, and your
                wallet.
              </p>
            </div>
            <div className="home-service-grid">
              {services.map((s) => (
                <Link
                  to="/login"
                  className="lp-service home-service"
                  key={s.title}
                  aria-label={`Login for ${s.title}`}
                >
                  <span
                    className="home-service-icon"
                    style={{ background: s.color }}
                  >
                    <img
                      src={`/images/${s.image}`}
                      alt=""
                      width="38"
                      height="38"
                      loading="lazy"
                    />
                  </span>
                  <span>{s.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
        <section id="why-us" className="home-why">
          <div className="home-container home-why-grid">
            <div id="how-it-works" className="home-why-copy">
              <span className="home-tag">Why Choose Us</span>
              <h2>Built for Serious Fintech Businesses</h2>
              <div className="home-divider" />
              <p>
                Bring your payments, wallet records, commissions, and business
                network together. Clear tools for each part of your working day.
              </p>
              <Link to="/register" className="home-button">
                Get Started
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
            <div className="home-benefit-grid">
              {benefits.map((b) => (
                <article className="home-benefit" key={b.title}>
                  <span
                    className="home-benefit-icon"
                    style={{ background: b.color }}
                  >
                    <b.icon size={24} aria-hidden="true" />
                  </span>
                  <h3>{b.title}</h3>
                  <p>{b.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section id="business-models" className="home-models">
          <div className="home-container">
            <div className="home-section-heading">
              <span className="home-tag">Business Models</span>
              <h2>Choose Your Role & Get Connected</h2>
            </div>
            <div className="home-role-grid">
              {roles.map((r) => (
                <article
                  key={r.title}
                  className={`home-role home-role-${r.color}`}
                >
                  <span className="home-role-icon">
                    <r.icon size={27} aria-hidden="true" />
                  </span>
                  <h3>{r.title}</h3>
                  <p>{r.text}</p>
                  <div className="home-role-bottom">
                    <div>
                      <strong>{r.highlight}</strong>
                      <span>{r.caption}</span>
                    </div>
                    <Link to={r.to}>
                      {r.color === "owner" ? "Contact Us" : "Join Now"}
                      <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section id="contact" className="home-cta-wrap">
          <div className="home-container">
            <div className="home-cta">
              <h2>Ready to Grow Your Business?</h2>
              <p>
                Connect with your business administrator and get the tools to
                manage your everyday digital services.
              </p>
              <div className="home-actions">
                <Link className="home-button home-white" to="/register">
                  <UserRoundPlus size={18} aria-hidden="true" />
                  Request an Account
                </Link>
                <Link className="home-button home-glass" to="/contactus">
                  Talk to Sales
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer registration />
    </div>
  );
}
