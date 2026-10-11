import { useWebsite } from "../../app/website";
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

export default function Landing() {
  const website = useWebsite();
  const content = website.text;
  const services = [
    {
      title: content("home.title.1"),
      image: content("home.image.2"),
      color: content("home.color.3"),
    },
    {
      title: content("home.title.4"),
      image: content("home.image.5"),
      color: content("home.color.6"),
    },
    {
      title: content("home.title.7"),
      image: content("home.image.8"),
      color: content("home.color.9"),
    },
    {
      title: content("home.title.10"),
      image: content("home.image.11"),
      color: content("home.color.12"),
    },
    {
      title: content("home.title.13"),
      image: content("home.image.14"),
      color: content("home.color.15"),
    },
    {
      title: content("home.title.16"),
      image: content("home.image.17"),
      color: content("home.color.18"),
    },
  ];
  const benefits = [
    {
      icon: Zap,
      title: content("home.title.19"),
      text: content("home.text.20"),
      color: content("home.color.21"),
    },
    {
      icon: ShieldCheck,
      title: content("home.title.22"),
      text: content("home.text.23"),
      color: content("home.color.24"),
    },
    {
      icon: Wallet,
      title: content("home.title.25"),
      text: content("home.text.26"),
      color: content("home.color.27"),
    },
    {
      icon: BarChart3,
      title: content("home.title.28"),
      text: content("home.text.29"),
      color: content("home.color.30"),
    },
    {
      icon: Network,
      title: content("home.title.31"),
      text: content("home.text.32"),
      color: content("home.color.33"),
    },
    {
      icon: Smartphone,
      title: content("home.title.34"),
      text: content("home.text.35"),
      color: content("home.color.36"),
    },
  ];
  const roles = [
    {
      icon: Store,
      title: content("home.title.37"),
      text: content("home.text.38"),
      highlight: content("home.highlight.39"),
      caption: content("home.caption.40"),
      color: "retailer",
      to: content("home.to.41"),
    },
    {
      icon: Network,
      title: content("home.title.42"),
      text: content("home.text.43"),
      highlight: content("home.highlight.44"),
      caption: content("home.caption.45"),
      color: "distributor",
      to: content("home.to.46"),
    },
    {
      icon: ShieldCheck,
      title: content("home.title.47"),
      text: content("home.text.48"),
      highlight: content("home.highlight.49"),
      caption: content("home.caption.50"),
      color: "owner",
      to: content("home.to.51"),
    },
  ];

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
                {content("home.div.52")}
              </div>
              <h1>
                {content("home.h1.53")}
                <br />
                {content("home.h1.54")} <span>{content("home.span.55")}</span>
              </h1>
              <p className="home-subtitle">{content("home.p.56")}</p>
              <div className="home-actions">
                <Link className="home-button" to={content("home.to.57")}>
                  <Rocket size={17} aria-hidden="true" />
                  {content("home.Link.58")}
                </Link>
                <Link
                  className="home-button home-glass"
                  to={content("home.to.59")}
                >
                  {content("home.Link.60")}
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
                <Link
                  className="home-button home-green"
                  to={content("home.to.61")}
                >
                  <Headphones size={17} aria-hidden="true" />
                  {content("home.Link.62")}
                </Link>
              </div>
              <div className="home-stats" aria-label="Platform capabilities">
                <div>
                  <strong>{content("home.strong.63")}</strong>
                  <span>{content("home.span.64")}</span>
                </div>
                <div>
                  <strong>{content("home.strong.65")}</strong>
                  <span>{content("home.span.66")}</span>
                </div>
                <div>
                  <strong>{content("home.strong.67")}</strong>
                  <span>{content("home.span.68")}</span>
                </div>
                <div>
                  <strong>{content("home.strong.69")}</strong>
                  <span>{content("home.span.70")}</span>
                </div>
              </div>
            </div>
            <div
              className="home-visual"
              aria-label="Illustration of the recharge workspace"
            >
              <img
                className="home-art"
                src={content("home.src.71")}
                alt={content("home.alt.72")}
                width="587"
                height="250"
                fetchPriority="high"
              />
              <div className="home-float home-transaction">
                <small>{content("home.small.73")}</small>
                <div>
                  <span className="home-check">
                    <Check size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <strong>{content("home.strong.74")}</strong>
                    <span>{content("home.span.75")}</span>
                  </div>
                </div>
              </div>
              <div className="home-float home-earnings">
                <small>{content("home.small.76")}</small>
                <strong>{content("home.strong.77")}</strong>
                <span>{content("home.span.78")}</span>
              </div>
              <div className="home-float home-online">
                <span />
                {content("home.div.79")}
              </div>
            </div>
          </div>
        </section>
        <section id="services" className="home-services">
          <div className="home-container">
            <div className="home-section-heading">
              <span className="home-tag">{content("home.span.80")}</span>
              <h2>{content("home.h2.81")}</h2>
              <p>{content("home.p.82")}</p>
            </div>
            <div className="home-service-grid">
              {services.map((s) => (
                <Link
                  to={content("home.to.83")}
                  className="lp-service home-service"
                  key={s.title}
                  aria-label={`Login for ${s.title}`}
                >
                  <span
                    className="home-service-icon"
                    style={{ background: s.color }}
                  >
                    <img
                      src={s.image}
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
              <span className="home-tag">{content("home.span.84")}</span>
              <h2>{content("home.h2.85")}</h2>
              <div className="home-divider" />
              <p>{content("home.p.86")}</p>
              <Link to={content("home.to.87")} className="home-button">
                {content("home.Link.88")}
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
              <span className="home-tag">{content("home.span.89")}</span>
              <h2>{content("home.h2.90")}</h2>
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
                      {r.color === "owner"
                        ? content("home.roleContact")
                        : content("home.roleJoin")}
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
              <h2>{content("home.h2.91")}</h2>
              <p>{content("home.p.92")}</p>
              <div className="home-actions">
                <Link
                  className="home-button home-white"
                  to={content("home.to.93")}
                >
                  <UserRoundPlus size={18} aria-hidden="true" />
                  {content("home.Link.94")}
                </Link>
                <Link
                  className="home-button home-glass"
                  to={content("home.to.95")}
                >
                  {content("home.Link.96")}
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
