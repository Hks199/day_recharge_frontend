import { useWebsite } from "../../app/website";
import { useEffect } from "react";
import { Zap, ShieldCheck, Network, IndianRupee } from "lucide-react";
import { useBrand } from "../../app/providers";
import MarketingHeader from "./MarketingHeader";
import Footer from "./Footer";
import "./landing.css";
import "./reference-theme.css";
import "./about.css";

export default function About() {
  const website = useWebsite();
  const content = website.text;
  const features = [
    {
      icon: Zap,
      title: content("about.title.1"),
      description: content("about.description.2"),
    },
    {
      icon: ShieldCheck,
      title: content("about.title.3"),
      description: content("about.description.4"),
    },
    {
      icon: Network,
      title: content("about.title.5"),
      description: content("about.description.6"),
    },
    {
      icon: IndianRupee,
      title: content("about.title.7"),
      description: content("about.description.8"),
    },
  ];

  const brand = useBrand();
  useEffect(() => {
    const previous = document.title;
    document.title = `About Us | ${brand.name}`;
    return () => {
      document.title = previous;
    };
  }, [brand.name]);

  return (
    <div className="lp lp-reference about-page">
      <MarketingHeader />
      <main id="main-content" className="about-main">
        <section className="about-banner" aria-labelledby="about-heading">
          <div className="about-container">
            <h1 id="about-heading">{content("about.h1.9")}</h1>
            <p>{content("about.p.10")}</p>
          </div>
        </section>
        <section
          className="about-content about-container"
          aria-labelledby="who-heading"
        >
          <div className="about-story">
            <h2 id="who-heading">{content("about.h2.11")}</h2>
            <p>
              {brand.name} {content("about.p.12")}
            </p>
            <p>{content("about.p.13")}</p>
          </div>
          <div className="about-feature-grid">
            {features.map((feature) => (
              <article className="about-feature" key={feature.title}>
                <feature.icon size={32} strokeWidth={1.8} aria-hidden="true" />
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
