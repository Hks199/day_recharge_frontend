import { useWebsite } from "../../app/website";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useBrand } from "../../app/providers";
import MarketingHeader from "./MarketingHeader";
import Footer from "./Footer";
import "./landing.css";
import "./reference-theme.css";
import "./terms.css";

export default function Privacy() {
  const website = useWebsite();
  const content = website.text;
  const sections = [
    {
      title: content("privacy.title.1"),
      text: content("privacy.text.2"),
    },
    {
      title: content("privacy.title.3"),
      text: content("privacy.text.4"),
    },
    {
      title: content("privacy.title.5"),
      text: content("privacy.text.6"),
    },
    {
      title: content("privacy.title.7"),
      text: content("privacy.text.8"),
    },
  ];

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
          <h1 id="privacy-heading">{content("privacy.h1.9")}</h1>
          <p>
            {content("privacy.p.10")}{" "}
            <time dateTime={content("privacy.dateTime.11")}>
              {content("privacy.time.12")}
            </time>
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
              <h2 id="privacy-section-5">{content("privacy.h2.13")}</h2>
              <p>
                {content("privacy.p.14")}{" "}
                <Link to={content("privacy.to.15")}>
                  {content("privacy.Link.16")}
                </Link>
                .
              </p>
            </section>
          </article>
        </div>
      </main>
      <Footer registration />
    </div>
  );
}
