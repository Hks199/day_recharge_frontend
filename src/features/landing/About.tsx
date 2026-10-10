import { useEffect } from "react";
import { Zap, ShieldCheck, Network, IndianRupee } from "lucide-react";
import { useBrand } from "../../app/providers";
import MarketingHeader from "./MarketingHeader";
import Footer from "./Footer";
import "./landing.css";
import "./reference-theme.css";
import "./about.css";

const features = [
  { icon: Zap, title: "Fast", description: "A streamlined payment workflow" },
  {
    icon: ShieldCheck,
    title: "Secure",
    description: "Role-based account access",
  },
  {
    icon: Network,
    title: "Connected",
    description: "Your business network, together",
  },
  {
    icon: IndianRupee,
    title: "Transparent",
    description: "Clear commissions & reports",
  },
];

export default function About() {
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
            <h1 id="about-heading">About Us</h1>
            <p>
              A connected platform for your everyday recharge, bill payments,
              and business network.
            </p>
          </div>
        </section>
        <section
          className="about-content about-container"
          aria-labelledby="who-heading"
        >
          <div className="about-story">
            <h2 id="who-heading">Who We Are</h2>
            <p>
              {brand.name} brings recharge and supported bill payments into a
              shared business workspace. Business owners, Distributors, and
              Retailers can manage their authorized activities, serve customers,
              and follow each payment through to its final status.
            </p>
            <p>
              With role-based access, wallet records, and commission tracking,
              the platform keeps your business activity organized. Review
              transactions, manage your network, and see the details that matter
              in one place.
            </p>
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
