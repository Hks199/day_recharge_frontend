import { Zap } from "lucide-react";
import { useBrand } from "../../app/providers";
import { useWebsite } from "../../app/website";
export function Brand({ inverse = false }: { inverse?: boolean }) {
  const brand = useBrand();
  const website = useWebsite();
  return (
    <span className={`brand ${inverse ? "brand-inverse" : ""}`}>
      {brand.logo ? (
        <img
          className="brand-local-logo"
          src={brand.logo}
          alt={brand.name}
          width="75"
          height="48"
        />
      ) : (
        <span className="brand-mark">
          <Zap size={23} fill="currentColor" />
        </span>
      )}
      {!brand.logo && (
        <span>
          {brand.name}
          <small>{website.brand.tagline}</small>
        </span>
      )}
    </span>
  );
}
