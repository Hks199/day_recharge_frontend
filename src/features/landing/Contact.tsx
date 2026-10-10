import { useEffect, useState } from "react";
import { MapPin, Phone, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBrand } from "../../app/providers";
import { isPlatform } from "../../lib/api/client";
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
  const brand = useBrand();
  const phone = brand.support.phone || (isPlatform ? "7828222210" : undefined);
  const email =
    brand.support.email || (isPlatform ? "dayrecharge@gmail.com" : undefined);
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
            <h1 id="contact-heading">Contact Us</h1>
            <p>We’re here to help — reach {brand.name} anytime.</p>
          </div>
        </section>
        <div className="contact-container contact-grid">
          <section
            className="contact-panel contact-company"
            aria-labelledby="company-heading"
          >
            <h2 id="company-heading">{brand.name}</h2>
            <p className="contact-description">
              Company details &amp; registered information
            </p>
            <div className="contact-detail">
              <span className="contact-detail-icon">
                <MapPin size={19} />
              </span>
              <div>
                <h3>Address</h3>
                <p>
                  {isPlatform
                    ? "Ravi Shankar Nagar Korba Chhattisgarh Pin - 495677"
                    : "Contact your business administrator for the registered address."}
                </p>
              </div>
            </div>
            <div className="contact-detail">
              <span className="contact-detail-icon">
                <Phone size={19} />
              </span>
              <div>
                <h3>Support Phone</h3>
                {phone ? (
                  <a href={`tel:${phone}`}>{phone}</a>
                ) : (
                  <p>Contact your business administrator.</p>
                )}
              </div>
            </div>
            <div className="contact-detail">
              <span className="contact-detail-icon">
                <Mail size={19} />
              </span>
              <div>
                <h3>Support Email</h3>
                {email ? (
                  <a href={`mailto:${email}`}>{email}</a>
                ) : (
                  <p>Contact your business administrator.</p>
                )}
              </div>
            </div>
          </section>
          <section
            className="contact-panel contact-message"
            aria-labelledby="message-heading"
          >
            <h2 id="message-heading">Send a Message</h2>
            <form onSubmit={handleSubmit(openDraft)} noValidate>
              <div className="contact-field">
                <label htmlFor="contact-name">Your Name</label>
                <input
                  id="contact-name"
                  placeholder="Full Name"
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
                <label htmlFor="contact-email">Email Address</label>
                <input
                  id="contact-email"
                  type="email"
                  placeholder="you@email.com"
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
                <label htmlFor="contact-message">Message</label>
                <textarea
                  id="contact-message"
                  rows={5}
                  placeholder="How can we help you?"
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
                Send Message
              </button>
              <p id="contact-form-note" className="contact-form-note">
                {email
                  ? "Opens your email app. Review and send your message there."
                  : "Contact your administrator to obtain your business support email."}
              </p>
              {draftOpened && (
                <p className="contact-form-status" role="status">
                  Continue in your email app to send your message. If it did not
                  open, email {email} directly.
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
