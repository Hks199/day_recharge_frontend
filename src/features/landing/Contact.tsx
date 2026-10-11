import { useWebsite } from "../../app/website";
import { useEffect, useState } from "react";
import { MapPin, Phone, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBrand } from "../../app/providers";
import MarketingHeader from "./MarketingHeader";
import Footer from "./Footer";
import "./landing.css";
import "./reference-theme.css";
import "./contact.css";

const messageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter your name.")
    .max(100, "Use 100 characters or fewer."),
  email: z.email("Enter a valid email address.").max(254),
  message: z
    .string()
    .trim()
    .min(1, "Enter your message.")
    .max(5000, "Use 5,000 characters or fewer."),
});
type Message = z.infer<typeof messageSchema>;

export default function Contact() {
  const website = useWebsite();
  const content = website.text;

  const brand = useBrand();
  const phone = brand.support.phone;
  const email = brand.support.email;
  const [draftOpened, setDraftOpened] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Message>({ resolver: zodResolver(messageSchema) });
  useEffect(() => {
    const previous = document.title;
    document.title = `Contact Us | ${brand.name}`;
    return () => {
      document.title = previous;
    };
  }, [brand.name]);
  function openDraft(values: Message) {
    if (!email) return;
    const subject = encodeURIComponent(`Contact enquiry from ${values.name}`);
    const body = encodeURIComponent(
      `Name: ${values.name}\r\nEmail: ${values.email}\r\n\r\n${values.message}`,
    );
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_self");
    setDraftOpened(true);
  }

  return (
    <div className="lp lp-reference contact-page">
      <MarketingHeader />
      <main id="main-content" className="contact-main">
        <section className="contact-hero" aria-labelledby="contact-heading">
          <div className="contact-container">
            <h1 id="contact-heading">{content("contact.h1.1")}</h1>
            <p>
              {content("contact.p.2")} {brand.name} {content("contact.p.3")}
            </p>
          </div>
        </section>
        <div className="contact-container contact-grid">
          <section
            className="contact-panel contact-company"
            aria-labelledby="company-heading"
          >
            <h2 id="company-heading">{brand.name}</h2>
            <p className="contact-description">{content("contact.p.4")}</p>
            <div className="contact-detail">
              <span className="contact-detail-icon">
                <MapPin size={19} />
              </span>
              <div>
                <h3>{content("contact.h3.5")}</h3>
                <p>{website.brand.address}</p>
              </div>
            </div>
            <div className="contact-detail">
              <span className="contact-detail-icon">
                <Phone size={19} />
              </span>
              <div>
                <h3>{content("contact.h3.6")}</h3>
                {phone ? (
                  <a href={`tel:${phone}`}>{phone}</a>
                ) : (
                  <p>{content("contact.p.7")}</p>
                )}
              </div>
            </div>
            <div className="contact-detail">
              <span className="contact-detail-icon">
                <Mail size={19} />
              </span>
              <div>
                <h3>{content("contact.h3.8")}</h3>
                {email ? (
                  <a href={`mailto:${email}`}>{email}</a>
                ) : (
                  <p>{content("contact.p.9")}</p>
                )}
              </div>
            </div>
          </section>
          <section
            className="contact-panel contact-message"
            aria-labelledby="message-heading"
          >
            <h2 id="message-heading">{content("contact.h2.10")}</h2>
            <form onSubmit={handleSubmit(openDraft)} noValidate>
              <div className="contact-field">
                <label htmlFor="contact-name">
                  {content("contact.label.11")}
                </label>
                <input
                  id="contact-name"
                  placeholder={content("contact.placeholder.12")}
                  autoComplete="name"
                  maxLength={100}
                  required
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={
                    errors.name ? "contact-name-error" : undefined
                  }
                  {...register("name")}
                />
                {errors.name && (
                  <span
                    id="contact-name-error"
                    className="field-error"
                    role="alert"
                  >
                    {errors.name.message}
                  </span>
                )}
              </div>
              <div className="contact-field">
                <label htmlFor="contact-email">
                  {content("contact.label.13")}
                </label>
                <input
                  id="contact-email"
                  type="email"
                  placeholder={content("contact.placeholder.14")}
                  autoComplete="email"
                  maxLength={254}
                  required
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={
                    errors.email ? "contact-email-error" : undefined
                  }
                  {...register("email")}
                />
                {errors.email && (
                  <span
                    id="contact-email-error"
                    className="field-error"
                    role="alert"
                  >
                    {errors.email.message}
                  </span>
                )}
              </div>
              <div className="contact-field">
                <label htmlFor="contact-message">
                  {content("contact.label.15")}
                </label>
                <textarea
                  id="contact-message"
                  rows={5}
                  placeholder={content("contact.placeholder.16")}
                  maxLength={5000}
                  required
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={
                    errors.message
                      ? "contact-message-error"
                      : "contact-form-note"
                  }
                  {...register("message")}
                />
                {errors.message && (
                  <span
                    id="contact-message-error"
                    className="field-error"
                    role="alert"
                  >
                    {errors.message.message}
                  </span>
                )}
              </div>
              <button className="contact-send" type="submit" disabled={!email}>
                {content("contact.button.17")}
              </button>
              <p id="contact-form-note" className="contact-form-note">
                {email
                  ? "Opens your email app. Review and send your message there."
                  : "Contact your administrator to obtain your business support email."}
              </p>
              {draftOpened && (
                <p className="contact-form-status" role="status">
                  {content("contact.p.18")} {email} {content("contact.p.19")}
                </p>
              )}
            </form>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
