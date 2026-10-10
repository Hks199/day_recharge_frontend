import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useBrand } from "../../app/providers";
import { Brand } from "./Brand";
import "./marketing-header.css";

const links = [
  { to: "/", label: "Home" },
  { to: "/aboutus", label: "About" },
  { to: "/contactus", label: "Contact" },
  { to: "/terms", label: "Terms" },
];
export default function MarketingHeader() {
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
        Skip to content
      </a>
      <header className="lp-header marketing-header" ref={header}>
        <div className="lp-container lp-nav-inner">
          <Link
            to="/"
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
              to="/login"
              onClick={() => setMenu(false)}
            >
              Login to your account
            </Link>
            <Link
              className="lp-mobile-start"
              to="/register"
              onClick={() => setMenu(false)}
            >
              Get Started
            </Link>
          </nav>
          <Link className="lp-button lp-login" to="/login">
            Login
          </Link>
          <Link className="lp-button lp-header-start" to="/register">
            Get Started
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
