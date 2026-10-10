import { useEffect } from "react";
import { useBrand } from "../../app/providers";
import MarketingHeader from "./MarketingHeader";
import Footer from "./Footer";
import "./landing.css";
import "./reference-theme.css";
import "./terms.css";

export default function Terms() {
  const brand = useBrand();
  useEffect(() => {
    const previous = document.title;
    document.title = `Terms & Conditions | ${brand.name}`;
    return () => {
      document.title = previous;
    };
  }, [brand.name]);
  const sections = [
    {
      title: "Acceptance of Terms",
      text: `Access to ${brand.name} means you accept the conditions described here.`,
    },
    {
      title: "Services",
      text: "Authorized business accounts can use the platform for mobile top-ups, bill settlements, and supported wallet transfers.",
    },
    {
      title: "Account Responsibilities",
      text: "Keep your sign-in details private. As the account holder, you are accountable for activity carried out using your account.",
    },
    {
      title: "Wallet & Transactions",
      text: "Wallet deposits are generally not refundable, except where a specific exception is stated. Completed payments cannot be undone.",
    },
    {
      title: "Limitation of Liability",
      text: `${brand.name} accepts no responsibility for indirect losses, incidental expenses, or consequential damage resulting from use of the platform.`,
    },
  ];
  return (
    <div className="lp lp-reference terms-page">
      <MarketingHeader />
      <main id="main-content" className="terms-main">
        <section className="terms-banner" aria-labelledby="terms-heading">
          <h1 id="terms-heading">Terms &amp; Conditions</h1>
          <p>
            Last updated: <time dateTime="2026-10-10">10 Oct 2026</time>
          </p>
        </section>
        <div className="terms-container">
          <article className="terms-card" aria-label="Terms and conditions">
            {sections.map((section, index) => (
              <section
                className="terms-section"
                key={section.title}
                aria-labelledby={`terms-section-${index + 1}`}
              >
                <h2 id={`terms-section-${index + 1}`}>
                  {index + 1}. {section.title}
                </h2>
                <p>{section.text}</p>
              </section>
            ))}
          </article>
        </div>
      </main>
      <Footer registration />
    </div>
  );
}
