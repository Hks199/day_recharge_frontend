import { useId, useRef, useState } from "react";
import { z } from "zod";
import { api, ApiError } from "../../lib/api/client";

const uploadSchema = z.object({
  url: z.url().refine((value) => value.startsWith("https://")),
  fields: z.record(z.string(), z.string()),
  publicUrl: z.url(),
  expiresIn: z.number(),
});
const acceptedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export function WebsiteImageField({
  label,
  field,
  value,
  onChange,
  path,
  disabled,
  onBusy,
  description,
}: {
  label: string;
  field: string;
  value: string;
  onChange: (value: string) => void;
  path: string;
  disabled: boolean;
  onBusy: (busy: boolean) => void;
  description?: string;
}) {
  const id = useId();
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  async function upload(file: File) {
    if (busyRef.current) return;
    setMessage("");
    setFailed(false);
    if (
      !acceptedTypes.includes(file.type) ||
      file.size < 1 ||
      file.size > 5 * 1024 * 1024
    ) {
      setFailed(true);
      setMessage("Choose a PNG, JPEG, WebP, or GIF image up to 5 MB.");
      return;
    }
    busyRef.current = true;
    setBusy(true);
    onBusy(true);
    try {
      const signed = await api.request(`${path}/images/upload`, uploadSchema, {
        method: "POST",
        body: { field, contentType: file.type, size: file.size },
      });
      const form = new FormData();
      for (const [key, entry] of Object.entries(signed.fields))
        form.append(key, entry);
      form.append("file", file);
      const result = await fetch(signed.url, {
        method: "POST",
        body: form,
        credentials: "omit",
        signal: AbortSignal.timeout(120000),
      });
      if (!result.ok)
        throw new Error(
          "Upload failed. Check the bucket permissions and CORS settings, then try again.",
        );
      onChange(signed.publicUrl);
      setMessage("Image uploaded. Save website to publish it.");
    } catch (error) {
      setFailed(true);
      setMessage(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Image upload failed. Please try again.",
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
      onBusy(false);
    }
  }
  return (
    <div className="website-image-field">
      <label htmlFor={`${id}-url`}>{label}</label>
      <input
        id={`${id}-url`}
        aria-describedby={`${id}-help`}
        maxLength={2048}
        value={value}
        disabled={disabled || busy}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Upload an image or enter its HTTPS URL"
      />
      <small id={`${id}-help`}>
        {description ??
          "Upload an image or use an existing HTTPS image URL or local /images/ path."}
      </small>
      {value && (
        <img
          src={value}
          alt={`${label} preview`}
          className="website-image-preview"
        />
      )}
      <label htmlFor={`${id}-file`}>Upload {label.toLowerCase()}</label>
      <input
        id={`${id}-file`}
        type="file"
        accept={acceptedTypes.join(",")}
        disabled={disabled || busy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void upload(file);
        }}
      />
      <small>PNG, JPEG, WebP, or GIF. Maximum 5 MB.</small>
      {busy && <p role="status">Uploading image…</p>}
      {message && <p role={failed ? "alert" : "status"}>{message}</p>}
    </div>
  );
}
