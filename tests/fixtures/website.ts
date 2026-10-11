import values from "./website-values.json" with { type: "json" };
import fields from "./website-fields.json" with { type: "json" };
export function websiteFixture(platform = true) {
  return {
    revision: 0,
    brand: {
      name: platform ? "Day Recharge" : "Connected Recharge",
      logo: platform ? "/images/day-recharge-logo.jpg" : "",
      authLogo: platform ? "/images/day-recharge-login-logo.png" : "",
      tagline: "RECHARGE. CONNECT. GROW.",
      primaryColor: "#2563eb",
      secondaryColor: "#0d9488",
      address: platform
        ? "Ravi Shankar Nagar Korba Chhattisgarh Pin - 495677"
        : "",
      support: {
        email: platform ? "dayrecharge@gmail.com" : "support@example.com",
        phone: platform ? "7828222210" : "",
      },
    },
    values: { ...values },
    fields,
  };
}
