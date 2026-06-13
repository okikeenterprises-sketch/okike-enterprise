import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { submitContact } from "@/lib/forms.functions";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact OKIKE — Get in Touch With Our Team" },
      { name: "description", content: "Contact OKIKE for project inquiries, partnerships or general questions. We respond within 24 hours. Based in Nigeria, working globally." },
      { name: "robots", content: "index, follow" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://okike-enterprise.lovable.app/contact" },
      { property: "og:title", content: "Contact OKIKE — Get in Touch With Our Team" },
      { property: "og:description", content: "We respond within 24 hours. Reach the OKIKE team for project inquiries, partnerships or any questions." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/261c5493-35d0-4cb5-851d-5b09f89d86ba/id-preview-9589f573--e22e363f-f41b-4927-9ac6-0599fdc05dff.lovable.app-1778630917399.png" },
      { property: "og:site_name", content: "OKIKE" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Contact OKIKE — Get in Touch" },
      { name: "twitter:description", content: "We respond within 24 hours. Get in touch with the OKIKE team." },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/261c5493-35d0-4cb5-851d-5b09f89d86ba/id-preview-9589f573--e22e363f-f41b-4927-9ac6-0599fdc05dff.lovable.app-1778630917399.png" },
    ],
    links: [
      { rel: "canonical", href: "https://okike-enterprise.lovable.app/contact" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const navigate = useNavigate();
  const send = useServerFn(submitContact);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await send({
        data: {
          name: String(fd.get("name") || ""),
          email: String(fd.get("email") || ""),
          message: String(fd.get("message") || ""),
        },
      });
      if (res.ok) {
        navigate({ to: "/thank-you" });
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Please check the form and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-ink/10">
        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-20">
          <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/50 mb-8">
            <span className="h-px w-8 bg-brand" />
            <span>Get in Touch</span>
          </div>
          <h1 className="font-display text-[clamp(3rem,8vw,7rem)] leading-[0.92] tracking-wide uppercase text-ink max-w-3xl mb-6">
            Tell us what you need.
          </h1>
          <p className="text-base md:text-lg text-ink/65 max-w-[44ch] leading-relaxed mb-4">
            We reply within 24 hours. For project inquiries, use the{" "}
            <a href="/book" className="text-brand hover:underline underline-offset-2">
              project form
            </a>
            .
          </p>
        </div>
      </section>

      <section className="px-6 py-16 md:py-24">
        <form
          onSubmit={onSubmit}
          className="max-w-3xl mx-auto flex flex-col gap-6"
        >
          <Field label="Name" name="name" required />
          <Field label="Email" name="email" type="email" required />
          <TextArea label="Message" name="message" required minLength={5} rows={6} />
          <button
            type="submit"
            disabled={busy}
            className="bg-brand text-brand-foreground py-3.5 pl-7 pr-5 font-semibold text-sm uppercase tracking-widest hover:opacity-90 transition disabled:opacity-50 self-start"
          >
            {busy ? "Sending…" : "Send message"}
          </button>
        </form>
      </section>
    </SiteLayout>
  );
}

export function Field({
  label,
  name,
  type = "text",
  required,
  ...rest
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/50">
        {label}
        {required && <span className="text-brand"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        className="bg-surface border border-ink/10 px-4 py-3 text-ink focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition"
        {...rest}
      />
    </label>
  );
}

export function TextArea({
  label,
  name,
  required,
  ...rest
}: {
  label: string;
  name: string;
  required?: boolean;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/50">
        {label}
        {required && <span className="text-brand"> *</span>}
      </span>
      <textarea
        name={name}
        required={required}
        className="bg-surface border border-ink/10 px-4 py-3 text-ink focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition resize-y"
        {...rest}
      />
    </label>
  );
}

export function Select({
  label,
  name,
  options,
  required,
}: {
  label: string;
  name: string;
  options: string[];
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/50">
        {label}
        {required && <span className="text-brand"> *</span>}
      </span>
      <select
        name={name}
        required={required}
        defaultValue=""
        className="bg-surface border border-ink/10 px-4 py-3 text-ink focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition"
      >
        <option value="" disabled>Choose…</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
