import { useWebsite } from "../../app/website";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useBrand } from "../../app/providers";
import { Brand } from "./Brand";
import "./marketing-header.css";

export default function MarketingHeader() {
  const website = useWebsite();
  const content = website.text;
  const links = [
    { to: content("navigation.to.1"), label: content("navigation.label.2") },
    { to: content("navigation.to.3"), label: content("navigation.label.4") },
    { to: content("navigation.to.5"), label: content("navigation.label.6") },
    { to: content("navigation.to.7"), label: content("navigation.label.8") },
  ];

  const brand = useBrand();
  const { pathname } = useLocation();
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
    <>
      <a href="#main-content" className="lp-skip">
        {content("navigation.a.9")}
      </a>
      <header className="lp-header marketing-header" ref={header}>
        <div className="lp-container lp-nav-inner">
          <Link
            to={content("navigation.to.10")}
            aria-label={`${brand.name} home`}
            onClick={() => setMenu(false)}
          >
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
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                aria-current={pathname === link.to ? "page" : undefined}
                onClick={() => setMenu(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              className="lp-contact-mobile-login"
              to={content("navigation.to.11")}
              onClick={() => setMenu(false)}
            >
              {content("navigation.Link.12")}
            </Link>
            <Link
              className="lp-mobile-start"
              to={content("navigation.to.13")}
              onClick={() => setMenu(false)}
            >
              {content("navigation.Link.14")}
            </Link>
          </nav>
          <Link className="lp-button lp-login" to={content("navigation.to.15")}>
            {content("navigation.Link.16")}
          </Link>
          <Link
            className="lp-button lp-header-start"
            to={content("navigation.to.17")}
          >
            {content("navigation.Link.18")}
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
    </>
  );
}
