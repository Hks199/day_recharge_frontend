import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api, ApiError, isPlatform } from "../../lib/api/client";
import { scopeKey } from "../../app/providers";
import {
  websiteEditorSchema,
  websiteKey,
  websiteSchema,
  type Website,
} from "../../app/website";
import { Button, Card, ErrorPanel } from "../../components/ui";
import { WebsiteImageField } from "./WebsiteImageField";

const path = isPlatform ? "/platform/website" : "/tenant/website";
const pages: Record<
  string,
  { title: string; description: string; preview: string }
> = {
  brand: {
    title: "Brand & contact details",
    description:
      "Your business identity and contact information. The same logo is used across the website, login, and registration pages.",
    preview: "/contactus",
  },
  home: {
    title: "Home page",
    description:
      "Edit the welcome banner, services, benefits, business roles, and closing invitation visitors see on your home page.",
    preview: "/",
  },
  about: {
    title: "About us",
    description:
      "Tell visitors about your business and the benefits of working with you.",
    preview: "/aboutus",
  },
  contact: {
    title: "Contact page",
    description:
      "Edit the contact page headings and form wording. Change your actual address, email, and phone under Brand & contact details.",
    preview: "/contactus",
  },
  terms: {
    title: "Terms & conditions",
    description:
      "Update your terms of service and effective date. Section numbers are added automatically.",
    preview: "/terms",
  },
  privacy: {
    title: "Privacy policy",
    description:
      "Explain how your business handles personal information and update the policy date.",
    preview: "/privacy",
  },
  navigation: {
    title: "Header & navigation",
    description:
      "Edit the shared menu, logo link, and account buttons for desktop and mobile visitors.",
    preview: "/",
  },
  footer: {
    title: "Footer",
    description:
      "Edit the business summary, services, links, support panel, and copyright shown at the bottom of public pages.",
    preview: "/",
  },
  auth: {
    title: "Login & registration",
    description:
      "Edit the introduction beside the login and account request forms. The forms themselves retain their account and security requirements.",
    preview: "/login",
  },
};
const destinations = [
  ["/", "Home page"],
  ["/aboutus", "About us"],
  ["/contactus", "Contact page"],
  ["/terms", "Terms & conditions"],
  ["/term", "Terms & conditions (alternate address)"],
  ["/privacy", "Privacy policy"],
  ["/login", "Login page"],
  ["/register", "Request an account"],
];
const brandFields = [
  {
    key: "name",
    label: "Business name",
    help: "Your public business name, used in the header, page text, and browser title.",
    placeholder: "e.g. Day Recharge",
    max: 100,
  },
  {
    key: "tagline",
    label: "Business tagline",
    help: "A short phrase describing your business, shown with your text branding.",
    placeholder: "e.g. Recharge. Connect. Grow.",
    max: 150,
  },
  {
    key: "primaryColor",
    label: "Primary brand color",
    help: "Main brand accent used by the website and account dashboard.",
    max: 7,
  },
  {
    key: "secondaryColor",
    label: "Secondary brand color",
    help: "Supporting brand accent used by the website and account dashboard.",
    max: 7,
  },
  {
    key: "address",
    label: "Business address",
    help: "Your full business or registered address, displayed on the Contact page.",
    placeholder: "Street, city, state, postal code",
    max: 1000,
  },
] as const;

export default function WebsiteEditor({
  initial,
  reload,
}: {
  initial: z.infer<typeof websiteEditorSchema>;
  reload: () => void;
}) {
  const [draft, setDraft] = useState<Website>(() =>
    websiteSchema.parse(initial),
  );
  const [group, setGroup] = useState("brand");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const client = useQueryClient();
  const uploading = uploadCount > 0;
  const busy = saving || uploading;
  const changed =
    JSON.stringify(websiteSchema.parse(initial)) !== JSON.stringify(draft);
  const page = pages[group];
  const visible = initial.fields.filter(
    (field) =>
      field.group === group &&
      `${field.label} ${field.section} ${field.description}`
        .toLowerCase()
        .includes(search.toLowerCase().trim()),
  );
  const sections = [...new Set(visible.map((field) => field.section))];
  const onBusy = (value: boolean) =>
    setUploadCount((count) => count + (value ? 1 : -1));
  function setBrand(key: string, value: string) {
    setSaved(false);
    setDraft((current) => ({
      ...current,
      brand: { ...current.brand, [key]: value },
    }));
  }
  function setValue(key: string, value: string) {
    setSaved(false);
    setDraft((current) => ({
      ...current,
      values: { ...current.values, [key]: value },
    }));
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (savingRef.current || uploading || !changed) return;
    savingRef.current = true;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const result = await api.request(path, websiteEditorSchema, {
        method: "PATCH",
        body: draft,
      });
      setDraft(websiteSchema.parse(result));
      client.setQueryData(websiteKey(), websiteSchema.parse(result));
      client.setQueryData([...scopeKey(), path], result);
      setSaved(true);
    } catch (cause) {
      setError(cause);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }
  const fieldLabel = (parts: (string | number)[]) => {
    const key = String(parts.at(-1));
    const field = initial.fields.find((field) => field.key === key);
    if (field) return `${pages[field.group]?.title}: ${field.label}`;
    return (
      brandFields.find((field) => field.key === key)?.label ??
      { logo: "Logo", email: "Support email", phone: "Support phone" }[
        key as "logo" | "email" | "phone"
      ] ??
      "Website content"
    );
  };
  return (
    <form onSubmit={save} className="website-editor">
      <Card>
        <div className="website-editor-actions">
          <div>
            <h2>Edit your public website</h2>
            <p>
              Choose a section, update its fields, then save to publish your
              changes.
            </p>
            <span
              className={`website-save-state ${changed ? "is-changed" : ""}`}
            >
              {uploading
                ? "Image upload in progress"
                : changed
                  ? "You have unsaved changes"
                  : "No unsaved changes"}
            </span>
          </div>
          <div className="website-editor-buttons">
            <a
              className="website-preview-link"
              href={page.preview}
              target="_blank"
              rel="noopener noreferrer"
            >
              View public page ↗
            </a>
            <Button type="submit" disabled={busy || !changed}>
              {saving ? "Saving…" : "Save website"}
            </Button>
          </div>
        </div>
        {saved && (
          <p role="status" className="website-save-success">
            Website saved. Public pages now use your updated content.
          </p>
        )}
        {error instanceof ApiError && error.status === 409 ? (
          <div role="alert">
            <p>
              Another administrator changed this website. Reload the latest
              version before editing again. Your changes have not been saved.
            </p>
            <Button type="button" disabled={busy} onClick={reload}>
              Reload latest version
            </Button>
          </div>
        ) : error instanceof ApiError && error.issues.length ? (
          <div role="alert" className="website-validation">
            <p>Please check these fields before saving:</p>
            <ul>
              {error.issues.map((issue, index) => (
                <li key={index}>
                  <button
                    type="button"
                    className="website-error-field"
                    onClick={() => {
                      const field = initial.fields.find(
                        (field) => field.key === String(issue.path.at(-1)),
                      );
                      setGroup(field?.group ?? "brand");
                      setSearch(field?.label ?? "");
                    }}
                  >
                    {fieldLabel(issue.path)}
                  </button>
                  : {issue.message}
                </li>
              ))}
            </ul>
          </div>
        ) : error ? (
          <ErrorPanel error={error} />
        ) : null}
        <nav aria-label="Website sections" className="website-editor-tabs">
          {Object.entries(pages).map(([key, info]) => (
            <Button
              key={key}
              type="button"
              variant={group === key ? "primary" : "secondary"}
              disabled={busy}
              onClick={() => {
                setGroup(key);
                setSearch("");
              }}
              aria-current={group === key ? "page" : undefined}
            >
              {info.title}
            </Button>
          ))}
        </nav>
      </Card>
      <Card>
        <div className="website-section-intro">
          <h2>{page.title}</h2>
          <p>{page.description}</p>
        </div>
        {group !== "brand" && (
          <div className="website-editor-search">
            <label htmlFor="website-field-search">
              Find a field in this section
            </label>
            <input
              id="website-field-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by field name or location"
            />
            <small>
              Write plain text. Use {"{{brand}}"} to insert your business name
              automatically.
            </small>
          </div>
        )}
        {group === "brand" ? (
          <>
            <fieldset disabled={saving} className="website-editor-section">
              <legend>Business identity</legend>
              <div className="website-editor-fields">
                {brandFields
                  .filter((field) => field.key !== "address")
                  .map((field) => (
                    <div className="website-editor-field" key={field.key}>
                      <label htmlFor={`brand-${field.key}`}>
                        {field.label}
                      </label>
                      <input
                        id={`brand-${field.key}`}
                        aria-describedby={`brand-help-${field.key}`}
                        value={draft.brand[field.key]}
                        type={field.key.endsWith("Color") ? "color" : "text"}
                        maxLength={field.max}
                        placeholder={
                          "placeholder" in field ? field.placeholder : undefined
                        }
                        required={field.key === "name"}
                        onChange={(event) =>
                          setBrand(field.key, event.target.value)
                        }
                      />
                      <small id={`brand-help-${field.key}`}>{field.help}</small>
                    </div>
                  ))}
                <WebsiteImageField
                  label="Logo"
                  field="logo"
                  value={draft.brand.logo}
                  onChange={(value) => setBrand("logo", value)}
                  path={path}
                  disabled={saving}
                  onBusy={onBusy}
                  description="Used in the header, footer, login, and registration pages. Leave empty to show your business name."
                />
              </div>
            </fieldset>
            <fieldset disabled={saving} className="website-editor-section">
              <legend>Contact information</legend>
              <p>
                These details appear on the Contact page and wherever support
                details are shown.
              </p>
              <div className="website-editor-fields">
                <div className="website-editor-field website-field-wide">
                  <label htmlFor="brand-address">Business address</label>
                  <textarea
                    id="brand-address"
                    aria-describedby="address-help"
                    rows={3}
                    maxLength={1000}
                    value={draft.brand.address}
                    placeholder="Street, city, state, postal code"
                    onChange={(event) =>
                      setBrand("address", event.target.value)
                    }
                  />
                  <small id="address-help">
                    Your full business or registered address, displayed on the
                    Contact page.
                  </small>
                </div>
                {(["email", "phone"] as const).map((key) => (
                  <div className="website-editor-field" key={key}>
                    <label htmlFor={`support-${key}`}>Support {key}</label>
                    <input
                      id={`support-${key}`}
                      aria-describedby={`support-help-${key}`}
                      type={key === "email" ? "email" : "tel"}
                      maxLength={key === "email" ? 254 : 30}
                      value={draft.brand.support[key]}
                      placeholder={
                        key === "email"
                          ? "support@example.com"
                          : "+91 98765 43210"
                      }
                      onChange={(event) => {
                        setSaved(false);
                        setDraft((current) => ({
                          ...current,
                          brand: {
                            ...current.brand,
                            support: {
                              ...current.brand.support,
                              [key]: event.target.value,
                            },
                          },
                        }));
                      }}
                    />
                    <small id={`support-help-${key}`}>
                      {key === "email"
                        ? "Public support email and recipient for contact and account request email drafts."
                        : "Public support phone number. Include the country code when needed."}
                    </small>
                  </div>
                ))}
              </div>
            </fieldset>
          </>
        ) : sections.length ? (
          sections.map((section) => (
            <fieldset
              key={section}
              disabled={saving}
              className="website-editor-section"
            >
              <legend>{section}</legend>
              <div className="website-editor-fields">
                {visible
                  .filter((field) => field.section === section)
                  .map((field) =>
                    field.type === "image" ? (
                      <WebsiteImageField
                        key={field.key}
                        label={field.label}
                        description={field.description}
                        field={field.key}
                        value={draft.values[field.key]}
                        onChange={(value) => setValue(field.key, value)}
                        path={path}
                        disabled={saving}
                        onBusy={onBusy}
                      />
                    ) : (
                      <div
                        className={`website-editor-field ${field.type === "text" && (initial.values[field.key]?.length ?? 0) > 120 ? "website-field-wide" : ""}`}
                        key={field.key}
                      >
                        <label htmlFor={`content-${field.key}`}>
                          {field.label}
                        </label>
                        {field.type === "link" ? (
                          <select
                            id={`content-${field.key}`}
                            aria-describedby={`help-${field.key}`}
                            value={draft.values[field.key]}
                            onChange={(event) =>
                              setValue(field.key, event.target.value)
                            }
                          >
                            {destinations.map(([route, title]) => (
                              <option key={route} value={route}>
                                {title}
                              </option>
                            ))}
                          </select>
                        ) : field.type === "text" ? (
                          <textarea
                            id={`content-${field.key}`}
                            aria-describedby={`help-${field.key}`}
                            rows={
                              (draft.values[field.key]?.length ?? 0) > 120
                                ? 4
                                : 2
                            }
                            maxLength={5000}
                            value={draft.values[field.key]}
                            placeholder={field.placeholder}
                            onChange={(event) =>
                              setValue(field.key, event.target.value)
                            }
                          />
                        ) : (
                          <input
                            id={`content-${field.key}`}
                            aria-describedby={`help-${field.key}`}
                            type={field.type === "color" ? "color" : "date"}
                            value={draft.values[field.key]}
                            onChange={(event) =>
                              setValue(field.key, event.target.value)
                            }
                          />
                        )}
                        <small id={`help-${field.key}`}>
                          {field.description}
                        </small>
                      </div>
                    ),
                  )}
              </div>
            </fieldset>
          ))
        ) : (
          <p className="website-empty-search">
            No fields match “{search}”. Try another name or{" "}
            <button type="button" onClick={() => setSearch("")}>
              clear the search
            </button>
            .
          </p>
        )}
      </Card>
    </form>
  );
}
