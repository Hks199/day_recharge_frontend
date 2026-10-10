import { Zap } from "lucide-react";
import { useBrand } from "../../app/providers";
export function Brand({ inverse = false }: { inverse?: boolean }) {
  const brand = useBrand();
  return (
    <span className={`brand ${inverse ? "brand-inverse" : ""}`}>
      {!brand.logo &&
      brand.name.replace(/\s/g, "").toLowerCase() === "dayrecharge" ? (
        <img
          className="brand-local-logo"
          src="/images/day-recharge-logo.jpg"
          alt={brand.name}
          width="75"
          height="48"
        />
      ) : brand.logo && /^https:\/\//.test(brand.logo) ? (
        <img src={brand.logo} alt="" />
      ) : (
        <span className="brand-mark">
          <Zap size={23} fill="currentColor" />
        </span>
      )}
      {(brand.logo ||
        brand.name.replace(/\s/g, "").toLowerCase() !== "dayrecharge") && (
        <span>
          {brand.name}
          <small>RECHARGE. CONNECT. GROW.</small>
        </span>
      )}
    </span>
  );
}
