import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  Headphones,
  Layers3,
  Menu,
  Network,
  RadioTower,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tv,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { useBrand } from "../../app/providers";
import "./landing.css";

export function Brand({ inverse = false }: { inverse?: boolean }) {
  const brand = useBrand();
  return (
    <span className={`brand ${inverse ? "brand-inverse" : ""}`}>
      {brand.logo && /^https:\/\//.test(brand.logo) ? (
        <img src={brand.logo} alt="" />
      ) : (
        <span className="brand-mark">
          <Zap size={23} fill="currentColor" />
        </span>
      )}
      <span>
        {brand.name}
        <small>RECHARGE. CONNECT. GROW.</small>
      </span>
    </span>
  );
}

const services = [
  {
    icon: Smartphone,
    title: "Mobile prepaid",
    label: "Mobile",
    text: "Keep conversations going with everyday mobile recharges.",
    color: "blue",
  },
  {
    icon: Tv,
    title: "DTH recharge",
    label: "DTH",
    text: "Bring entertainment home with a simple recharge workflow.",
    color: "purple",
  },
  {
    icon: RadioTower,
    title: "Postpaid bills",
    label: "Postpaid",
    text: "Fetch the bill, review the details, and pay with clarity.",
    color: "green",
  },
  {
    icon: Zap,
    title: "Electricity",
    label: "Electricity",
    text: "Keep the lights on with supported electricity bill payments.",
    color: "orange",
  },
  {
    icon: Layers3,
    title: "Bill payments",
    label: "Bills",
    text: "Bring supported billers together in one familiar workspace.",
    color: "pink",
  },
];
const benefits = [
  {
    icon: Wallet,
    title: "Every rupee, accounted for.",
    text: "Know your balance. Review transfers, funding requests, and a traceable wallet ledger.",
  },
  {
    icon: Network,
    title: "Your network, working together.",
    text: "Give business owners, Distributors, and Retailers the access their responsibilities need.",
  },
  {
    icon: ShieldCheck,
    title: "Your business. Your identity.",
    text: "A consistent branded experience on your verified business domain, with clear transaction records.",
  },
];
const questions = [
  {
    q: "How do I get an account?",
    a: "Contact your business owner or Distributor to request access. Accounts are created by an authorized administrator; public registration is not available.",
  },
  {
    q: "Can my whole team use the platform?",
    a: "Yes. Business owners, Distributors, and Retailers each have a workspace scoped to their authorized responsibilities. The platform owner manages the SaaS separately.",
  },
  {
    q: "How is my wallet funded?",
    a: "Submit a funding request with an external bank reference. An authorized administrator reviews and approves externally verified funds.",
  },
  {
    q: "What happens if a payment is pending?",
    a: "Track the original transaction until its outcome is confirmed. Avoid submitting a second payment while the first is being reconciled.",
  },
  {
    q: "Which services can I access?",
    a: "Availability depends on enabled operators, business settings, your role, and configured providers. Your signed-in workspace shows the available catalogue.",
  },
];

export default function Landing() {
  const brand = useBrand();
  const [menu, setMenu] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!menu) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenu(false);
        menuButton.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) setMenu(false);
    };
    const breakpoint = window.matchMedia("(min-width: 1000px)");
    const resize = () => {
      if (breakpoint.matches) setMenu(false);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", outside);
    breakpoint.addEventListener("change", resize);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", outside);
      breakpoint.removeEventListener("change", resize);
    };
  }, [menu]);

  return (
    <div className="lp">
      <a href="#main-content" className="lp-skip">
        Skip to content
      </a>
      <header className="lp-header" ref={header}>
        <div className="lp-container lp-nav-inner">
          <Link to="/" aria-label={`${brand.name} home`}>
            <Brand />
          </Link>
          <nav
            id="landing-navigation"
            className={`lp-nav ${menu ? "is-open" : ""}`}
            aria-label="Main navigation"
            onBlur={(event) => {
              if (!header.current?.contains(event.relatedTarget as Node))
                setMenu(false);
            }}
          >
            <a href="#services" onClick={() => setMenu(false)}>
              Our services
            </a>
            <a href="#why-us" onClick={() => setMenu(false)}>
              Why choose us
            </a>
            <a href="#how-it-works" onClick={() => setMenu(false)}>
              How it works
            </a>
            <a href="#contact" onClick={() => setMenu(false)}>
              Contact
            </a>
          </nav>
          <Link className="lp-button lp-login" to="/login">
            Login <ArrowRight size={17} />
          </Link>
          <button
            ref={menuButton}
            className="lp-menu"
            aria-controls="landing-navigation"
            aria-label={menu ? "Close navigation" : "Open navigation"}
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </header>
      <main id="main-content">
        <section className="lp-hero">
          <div className="lp-container lp-hero-grid">
            <div className="lp-hero-copy">
              <p className="lp-tag">
                <span /> A little simpler. A lot more connected.
              </p>
              <h1>
                Power everyday
                <br />
                payments.
                <br />
                <span>Grow your business.</span>
              </h1>
              <p className="lp-lead">
                From the first recharge to the last bill of the day. Bring your
                payments, wallet, and business network together in one
                workspace.
              </p>
              <div className="lp-actions">
                <Link className="lp-button" to="/login">
                  Open your workspace <ArrowRight size={19} />
                </Link>
                <a href="#services" className="lp-explore">
                  Explore services <ArrowDown size={17} />
                </a>
              </div>
              <div className="lp-hero-notes">
                <span>
                  <Check size={16} /> Clear wallet records
                </span>
                <span>
                  <Check size={16} /> Role-based access
                </span>
              </div>
            </div>
            <div
              className="lp-visual"
              role="img"
              aria-label="Illustration of a workspace with a wallet, recharge services, and transaction tracking"
            >
              <div className="lp-visual-orbit" aria-hidden="true" />
              <div className="lp-demo">
                <div className="lp-demo-header">
                  <span>
                    <span className="lp-demo-dot" /> Your daily workspace
                  </span>
                  <Layers3 size={19} />
                </div>
                <div className="lp-demo-body">
                  <div className="lp-demo-greeting">
                    <div>
                      <small>LET’S MAKE IT A GOOD DAY</small>
                      <h3>Ready when you are.</h3>
                    </div>
                    <span className="lp-demo-avatar">
                      <Zap size={20} />
                    </span>
                  </div>
                  <div className="lp-wallet">
                    <div>
                      <span>ONE CONNECTED WALLET</span>
                      <h2>
                        More clarity.
                        <br />
                        More control.
                      </h2>
                      <p>Fund. Recharge. Track.</p>
                    </div>
                    <Wallet size={42} strokeWidth={1.3} />
                  </div>
                  <div className="lp-demo-section">
                    <strong>Everyday essentials</strong>
                    <span>
                      All in one place <ArrowRight size={13} />
                    </span>
                  </div>
                  <div className="lp-demo-services">
                    {services.slice(0, 4).map((s) => (
                      <div key={s.title}>
                        <span className={`lp-icon lp-${s.color}`}>
                          <s.icon size={22} />
                        </span>
                        <span>{s.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="lp-demo-record">
                    <span className="lp-record-icon">
                      <Check size={18} />
                    </span>
                    <div>
                      <strong>Stay on top of every payment</strong>
                      <span>Submission to final status</span>
                    </div>
                    <ArrowRight size={17} />
                  </div>
                </div>
                <div className="lp-demo-caption">
                  <Sparkles size={13} /> Workspace illustration
                </div>
              </div>
              <div className="lp-floating">
                <span>
                  <ShieldCheck size={24} />
                </span>
                <div>
                  <strong>A clearer working day</strong>
                  <small>Your records. In your control.</small>
                </div>
              </div>
              <div className="lp-visual-label">
                <Network size={17} /> Built for your network
              </div>
            </div>
          </div>
          <div className="lp-container lp-trust">
            <span>MADE FOR YOUR EVERYDAY</span>
            <div>
              <Smartphone size={19} /> Recharge & bills
            </div>
            <div>
              <Wallet size={19} /> Wallet control
            </div>
            <div>
              <Network size={19} /> Connected teams
            </div>
          </div>
        </section>

        <section id="services" className="lp-container lp-section">
          <div className="lp-section-heading">
            <div>
              <p className="lp-eyebrow">
                SMALL PAYMENTS. EVERYDAY POSSIBILITIES.
              </p>
              <h2>
                One workspace.
                <br />
                So many ways to connect.
              </h2>
            </div>
            <p>
              Keep your customers moving with recharge and supported bill
              payments.
              <small>
                Availability depends on your business configuration.
              </small>
            </p>
          </div>
          <div className="lp-service-grid">
            {services.map((s, i) => (
              <Link
                to="/login"
                className={`lp-service lp-${s.color}`}
                key={s.title}
                aria-label={`Login for ${s.title}`}
              >
                <div className="lp-service-top">
                  <span className={`lp-icon lp-${s.color}`}>
                    <s.icon size={27} />
                  </span>
                  <span className="lp-service-number">0{i + 1}</span>
                </div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <span className="lp-service-link">
                  Get started <ArrowRight size={18} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section id="why-us" className="lp-benefits">
          <div className="lp-container lp-benefits-grid">
            <div>
              <p className="lp-eyebrow">BUILT AROUND YOUR BUSINESS</p>
              <h2>
                Less juggling.
                <br />
                <span>More moving forward.</span>
              </h2>
              <p className="lp-section-copy">
                The important details, together. So you can spend more time
                serving the people who count on you.
              </p>
              <div className="lp-network">
                <div className="lp-network-owner">
                  <span>
                    <Network size={25} />
                  </span>
                  <div>
                    <small>ONE CONNECTED WORKSPACE</small>
                    <strong>Your business, in sync.</strong>
                  </div>
                </div>
                <div className="lp-network-line" />
                <div className="lp-network-roles">
                  <span>Business owner</span>
                  <span>Distributors</span>
                  <span>Retailers</span>
                </div>
                <p>
                  <ShieldCheck size={16} /> Clear responsibilities at every
                  level
                </p>
              </div>
            </div>
            <div className="lp-benefit-list">
              {benefits.map((b) => (
                <article key={b.title}>
                  <span className="lp-benefit-icon">
                    <b.icon size={24} />
                  </span>
                  <div>
                    <h3>{b.title}</h3>
                    <p>{b.text}</p>
                  </div>
                </article>
              ))}
              <Link to="/login" className="lp-text-link">
                Make room for a better workflow <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="lp-container lp-section">
          <div className="lp-centered">
            <p className="lp-eyebrow">YOUR NEXT STEP, MADE SIMPLE</p>
            <h2>A good day starts here.</h2>
            <p>Three steps to your everyday payment workflow.</p>
          </div>
          <div className="lp-steps">
            {[
              {
                icon: Network,
                title: "Get connected",
                text: "Your business administrator creates your authorized account and shares access securely.",
              },
              {
                icon: Wallet,
                title: "Fund your wallet",
                text: "Request funding approval through your business’s supported process with an external bank reference.",
              },
              {
                icon: Smartphone,
                title: "Recharge. Track. Repeat.",
                text: "Authorized Retailers submit payments and follow every transaction through to its final status.",
              },
            ].map((s, i) => (
              <article key={s.title}>
                <div className="lp-step-top">
                  <span>0{i + 1}</span>
                  <s.icon size={25} />
                </div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lp-container lp-faq">
          <div>
            <p className="lp-eyebrow">LET’S CLEAR THINGS UP</p>
            <h2>
              A few questions.
              <br />A little clarity.
            </h2>
            <p>Everything you need to know before your next working day.</p>
            <a className="lp-text-link" href="#contact">
              Talk to your support team <ArrowRight size={18} />
            </a>
          </div>
          <div className="lp-faq-list">
            {questions.map((f) => (
              <details key={f.q}>
                <summary>
                  {f.q}
                  <ChevronDown size={20} />
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="contact" className="lp-container lp-contact-wrap">
          <div className="lp-contact">
            <div>
              <p className="lp-eyebrow">READY FOR WHAT’S NEXT?</p>
              <h2>
                Let’s make everyday
                <br />
                work a little easier.
              </h2>
              <p>Your payments. Your people. Your workspace.</p>
              <div className="lp-contact-links">
                {brand.support.email && (
                  <a href={`mailto:${brand.support.email}`}>
                    <Headphones size={17} />
                    {brand.support.email}
                  </a>
                )}
                {brand.support.phone && (
                  <a href={`tel:${brand.support.phone}`}>
                    {brand.support.phone}
                  </a>
                )}
                {!brand.support.email && !brand.support.phone && (
                  <span>
                    Need access? Contact the administrator who provided your
                    account.
                  </span>
                )}
                {brand.domain && <span>{brand.domain}</span>}
              </div>
            </div>
            <Link to="/login" className="lp-button lp-button-white">
              Login to your account <ArrowRight size={19} />
            </Link>
          </div>
        </section>
      </main>
      <footer className="lp-container lp-footer">
        <div>
          <Brand />
          <p>Everyday payments. A connected business.</p>
        </div>
        <nav aria-label="Footer">
          <a href="#services">Services</a>
          <a href="#contact">Support</a>
          <Link to="/login">Login</Link>
        </nav>
        <div className="lp-footer-bottom">
          <span>
            © {new Date().getFullYear()} {brand.name}
          </span>
          <span>Recharge. Connect. Grow.</span>
        </div>
      </footer>
    </div>
  );
}
