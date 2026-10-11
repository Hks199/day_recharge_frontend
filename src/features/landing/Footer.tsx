import { useWebsite } from "../../app/website";
import { Link } from "react-router-dom";
import { Rocket, Headphones, Mail } from "lucide-react";
import { useBrand } from "../../app/providers";
import "./footer.css";

export default function Footer({
  registration = false,
}: {
  registration?: boolean;
}) {
  const website = useWebsite();
  const content = website.text;

  const brand = useBrand();
  return (
    <footer className="dr-footer">
      <div className="dr-footer-container">
        <div className="dr-footer-row">
          <div className="dr-footer-intro dr-footer-column">
            <Link to={content("footer.to.1")} aria-label={`${brand.name} home`}>
              {brand.logo ? (
                <img
                  className="dr-footer-logo"
                  src={brand.logo}
                  alt={brand.name}
                  width="75"
                  height="48"
                />
              ) : (
                <strong>{brand.name}</strong>
              )}
            </Link>
            <p>{content("footer.p.3")}</p>
          </div>
          <nav
            className="dr-footer-column dr-footer-links"
            aria-label="Footer services"
          >
            <h3>{content("footer.h3.4")}</h3>
            <ul>
              {[
                content("footer.service.5"),
                content("footer.service.6"),
                content("footer.service.7"),
                content("footer.service.8"),
              ].map((service) => (
                <li key={service}>
                  <Link to={content("footer.to.9")}>{service}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav
            className="dr-footer-column dr-footer-links"
            aria-label="Footer company"
          >
            <h3>{content("footer.h3.10")}</h3>
            <ul>
              <li>
                <Link to={content("footer.to.11")}>
                  {content("footer.Link.12")}
                </Link>
              </li>
              <li>
                <Link to={content("footer.to.13")}>
                  {content("footer.Link.14")}
                </Link>
              </li>
              <li>
                <Link to={content("footer.to.15")}>
                  {content("footer.Link.16")}
                </Link>
              </li>
              <li>
                <Link to={content("footer.to.17")}>
                  {content("footer.Link.18")}
                </Link>
              </li>
            </ul>
          </nav>
          <div className="dr-footer-column dr-footer-start">
            <h3>{content("footer.h3.19")}</h3>
            <p>{content("footer.p.20")}</p>
            <Link
              className="dr-footer-register"
              to={
                registration
                  ? content("footer.text.21")
                  : content("footer.text.22")
              }
            >
              <Rocket size={13} />{" "}
              {registration
                ? content("footer.text.23")
                : content("footer.text.24")}
            </Link>
            <div className="dr-footer-support">
              <div>{content("footer.div.25")}</div>
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
                <Link to={content("footer.to.26")}>
                  {content("footer.Link.27")}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="dr-footer-copyright">
        <div className="dr-footer-container dr-footer-bottom">
          <p>
            {content("footer.p.28")} {new Date().getFullYear()}{" "}
            <strong>{brand.name}</strong>
            {content("footer.p.29")}
          </p>
          <nav aria-label="Footer legal">
            <Link to={content("footer.to.30")}>
              {content("footer.Link.31")}
            </Link>
            <Link to={content("footer.to.32")}>
              {content("footer.Link.33")}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
