import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useBrand } from "../../app/providers";
import MarketingHeader from "./MarketingHeader";
import Footer from "./Footer";
import "./landing.css";
import "./reference-theme.css";
import "./terms.css";

const sections = [
  {
    title: "Information We Collect",
    text: "We need your name, email, mobile number, and payment records to deliver our services.",
  },
  {
    title: "How We Use Information",
    text: "Account details support payment processing, customer assistance, and platform improvements. Personal information is not offered for sale to other businesses.",
  },
  {
    title: "Data Security",
    text: "Password hashing, protected session credentials, and role-based permissions help safeguard account information.",
  },
  {
    title: "Cookies",
    text: "A protected cookie supports authentication; this frontend adds no marketing cookies.",
  },
];

export default function Privacy() {
  const brand = useBrand();
  useEffect(() => {
    const previous = document.title;
    document.title = `Privacy Policy | ${brand.name}`;
    return () => {
      document.title = previous;
    };
  }, [brand.name]);
  return (
    <div className="lp lp-reference terms-page privacy-page">
      <MarketingHeader />
      <main id="main-content" className="terms-main">
        <section className="terms-banner" aria-labelledby="privacy-heading">
          <h1 id="privacy-heading">Privacy Policy</h1>
          <p>
            Last updated: <time dateTime="2026-10-10">10 Oct 2026</time>
          </p>
        </section>
        <div className="terms-container">
          <article className="terms-card" aria-label="Privacy policy">
            {sections.map((section, index) => (
              <section
                className="terms-section"
                key={section.title}
                aria-labelledby={`privacy-section-${index + 1}`}
              >
                <h2 id={`privacy-section-${index + 1}`}>
                  {index + 1}. {section.title}
                </h2>
                <p>{section.text}</p>
              </section>
            ))}
            <section
              className="terms-section"
              aria-labelledby="privacy-section-5"
            >
              <h2 id="privacy-section-5">5. Contact</h2>
              <p>
                Questions about personal information can be raised through our{" "}
                <Link to="/contactus">Contact page</Link>.
              </p>
            </section>
          </article>
        </div>
      </main>
      <Footer registration />
    </div>
  );
}
