import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { api, isPlatform, ApiError } from "../../lib/api/client";
import { scopeKey } from "../../app/providers";
import {
  websiteEditorSchema,
  websiteKey,
  websiteSchema,
  type Website,
} from "../../app/website";
import {
  Button,
  Card,
  ErrorPanel,
  Loading,
  PageTitle,
} from "../../components/ui";
import "./website-editor.css";

type EditorData = z.infer<typeof websiteEditorSchema>;
const path = isPlatform ? "/platform/website" : "/tenant/website";
const publicPaths = [
  "/",
  "/aboutus",
  "/contactus",
  "/terms",
  "/privacy",
  "/login",
  "/register",
];
function Editor({
  initial,
  reload,
}: {
  initial: EditorData;
  reload: () => void;
}) {
  const [draft, setDraft] = useState<Website>(() =>
    websiteSchema.parse(initial),
  );
  const [group, setGroup] = useState("brand");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const client = useQueryClient();
  const groups = [
    "brand",
    ...new Set(initial.fields.map((field) => field.group)),
  ];
  const changed =
    JSON.stringify(websiteSchema.parse(initial)) !== JSON.stringify(draft);
  function setBrand(key: string, value: string) {
    setSaved(false);
    setDraft((current) => ({
      ...current,
      brand: { ...current.brand, [key]: value },
    }));
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
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
      setSaving(false);
    }
  }
  return (
    <form onSubmit={save} className="website-editor">
      <Card>
        <div className="website-editor-actions">
          <div>
            <h2>Website content</h2>
            <p>Changes publish when you save. Revision {draft.revision}.</p>
          </div>
          <Button type="submit" disabled={saving || !changed}>
            {saving ? "Saving…" : "Save website"}
          </Button>
        </div>
        {saved && (
          <p role="status">
            Website saved. Public pages now use your updated content.
          </p>
        )}
        {error instanceof ApiError && error.status === 409 ? (
          <div role="alert">
            <p>
              Another administrator changed this website. Reload the latest
              version before editing again. Your changes have not been saved.
            </p>
            <Button type="button" onClick={reload}>
              Reload latest version
            </Button>
          </div>
        ) : error ? (
          <ErrorPanel error={error} />
        ) : null}
        <nav aria-label="Website sections" className="website-editor-tabs">
          {groups.map((value) => (
            <Button
              type="button"
              variant={group === value ? "primary" : "secondary"}
              key={value}
              onClick={() => setGroup(value)}
              aria-current={group === value ? "page" : undefined}
            >
              {value === "brand" ? "Brand & contact details" : value}
            </Button>
          ))}
        </nav>
      </Card>
      <Card>
        <h2>
          {group === "brand"
            ? "Brand & contact details"
            : `${group[0].toUpperCase()}${group.slice(1)} page content`}
        </h2>
        <p>
          Text is displayed safely as plain text. Use {"{{brand}}"} in
          paragraphs to insert your business name. Navigation links stay within
          this website.
        </p>
        <div className="website-editor-fields">
          {group === "brand" ? (
            <>
              {(
                [
                  "name",
                  "logo",
                  "authLogo",
                  "tagline",
                  "primaryColor",
                  "secondaryColor",
                  "address",
                ] as const
              ).map((key) => (
                <label key={key}>
                  {
                    {
                      name: "Business name",
                      logo: "Logo image URL",
                      authLogo: "Login logo image URL",
                      tagline: "Brand tagline",
                      primaryColor: "Primary color",
                      secondaryColor: "Secondary color",
                      address: "Registered address",
                    }[key]
                  }
                  <input
                    value={draft.brand[key]}
                    type={key.endsWith("Color") ? "color" : "text"}
                    maxLength={key === "address" ? 1000 : 2048}
                    onChange={(event) => setBrand(key, event.target.value)}
                    required={key === "name"}
                  />
                  {(key === "logo" || key === "authLogo") && (
                    <small>
                      Use /images/filename.png or an HTTPS image URL. Leave
                      empty to display the business name.
                    </small>
                  )}
                </label>
              ))}
              {(["email", "phone"] as const).map((key) => (
                <label key={key}>
                  Support {key}
                  <input
                    type={key === "email" ? "email" : "tel"}
                    value={draft.brand.support[key]}
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
                </label>
              ))}
            </>
          ) : (
            initial.fields
              .filter((field) => field.group === group)
              .map((field) => (
                <label key={field.key}>
                  <span>
                    {field.label === "text" ||
                    [
                      "h1",
                      "h2",
                      "p",
                      "span",
                      "strong",
                      "small",
                      "div",
                      "li",
                      "h3",
                    ].includes(field.label)
                      ? initial.values[field.key].slice(0, 80)
                      : field.label}
                  </span>
                  <small>{field.key}</small>
                  {field.type === "link" ? (
                    <select
                      value={draft.values[field.key]}
                      onChange={(event) => {
                        setSaved(false);
                        setDraft((current) => ({
                          ...current,
                          values: {
                            ...current.values,
                            [field.key]: event.target.value,
                          },
                        }));
                      }}
                    >
                      {publicPaths.map((route) => (
                        <option key={route}>{route}</option>
                      ))}
                    </select>
                  ) : field.type === "text" ? (
                    <textarea
                      rows={draft.values[field.key].length > 120 ? 4 : 2}
                      maxLength={5000}
                      value={draft.values[field.key]}
                      onChange={(event) => {
                        setSaved(false);
                        setDraft((current) => ({
                          ...current,
                          values: {
                            ...current.values,
                            [field.key]: event.target.value,
                          },
                        }));
                      }}
                    />
                  ) : (
                    <input
                      type={
                        field.type === "color"
                          ? "color"
                          : field.type === "date"
                            ? "date"
                            : "text"
                      }
                      value={draft.values[field.key]}
                      onChange={(event) => {
                        setSaved(false);
                        setDraft((current) => ({
                          ...current,
                          values: {
                            ...current.values,
                            [field.key]: event.target.value,
                          },
                        }));
                      }}
                    />
                  )}
                </label>
              ))
          )}
        </div>
      </Card>
    </form>
  );
}
export default function WebsitePage() {
  const [editorVersion, setEditorVersion] = useState(0);
  const query = useQuery({
    queryKey: [...scopeKey(), path],
    queryFn: ({ signal }) => api.request(path, websiteEditorSchema, { signal }),
    refetchOnWindowFocus: false,
  });
  return (
    <>
      <PageTitle
        title="Public website"
        description="Manage the branding, public pages, navigation, footer, and login introduction for this business."
      />
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorPanel error={query.error} retry={() => void query.refetch()} />
      ) : (
        <Editor
          key={editorVersion}
          initial={query.data}
          reload={() => {
            void query.refetch().then((result) => {
              if (result.isSuccess) setEditorVersion((value) => value + 1);
            });
          }}
        />
      )}
    </>
  );
}
