import { useWebsite } from "../../app/website";
import { useEffect } from "react";
import { useBrand } from "../../app/providers";
import MarketingHeader from "./MarketingHeader";
import Footer from "./Footer";
import "./landing.css";
import "./reference-theme.css";
import "./terms.css";

export default function Terms() {
  const website = useWebsite();
  const content = website.text;

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
      title: content("terms.title.1"),
      text: content("terms.text.2"),
    },
    {
      title: content("terms.title.3"),
      text: content("terms.text.4"),
    },
    {
      title: content("terms.title.5"),
      text: content("terms.text.6"),
    },
    {
      title: content("terms.title.7"),
      text: content("terms.text.8"),
    },
    {
      title: content("terms.title.9"),
      text: content("terms.text.10"),
    },
  ];
  return (
    <div className="lp lp-reference terms-page">
      <MarketingHeader />
      <main id="main-content" className="terms-main">
        <section className="terms-banner" aria-labelledby="terms-heading">
          <h1 id="terms-heading">{content("terms.h1.11")}</h1>
          <p>
            {content("terms.p.12")}{" "}
            <time dateTime={content("terms.dateTime.13")}>
              {content("terms.time.14")}
            </time>
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
