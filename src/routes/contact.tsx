import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { submitContact } from "@/lib/forms.functions";
import { Mail } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — OKIKE" },
      { name: "description", content: "Get in touch with OKIKE. We respond within 24 hours." },
      { property: "og:title", content: "Contact — OKIKE" },
      { property: "og:description", content: "Reach the OKIKE team." },
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
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-8">
          <div className="text-xs font-semibold tracking-widest uppercase text-brand">Contact</div>
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight max-w-[20ch] text-balance">
            Tell us what you need. We'll reply within 24 hours.
          </h1>
          <div className="flex items-center gap-3 text-ink/60">
            <Mail className="size-4 text-brand" />
            <span>
              For project inquiries, use the{" "}
              <a href="/book" className="text-brand underline-offset-2 hover:underline">
                project form
              </a>
              .
            </span>
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <form
          onSubmit={onSubmit}
          className="max-w-3xl mx-auto bg-card rounded-3xl p-8 md:p-12 ring-1 ring-ink/5 flex flex-col gap-6"
        >
          <Field label="Name" name="name" required />
          <Field label="Email" name="email" type="email" required />
          <TextArea label="Message" name="message" required minLength={5} rows={6} />
          <button
            type="submit"
            disabled={busy}
            className="bg-brand text-brand-foreground py-3 px-6 rounded-full font-medium hover:opacity-90 transition disabled:opacity-50 self-start"
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
      <span className="text-xs font-semibold uppercase tracking-widest text-ink/60">
        {label}
        {required && <span className="text-brand"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        className="bg-surface border border-ink/10 rounded-lg px-4 py-3 text-ink focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition"
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
      <span className="text-xs font-semibold uppercase tracking-widest text-ink/60">
        {label}
        {required && <span className="text-brand"> *</span>}
      </span>
      <textarea
        name={name}
        required={required}
        className="bg-surface border border-ink/10 rounded-lg px-4 py-3 text-ink focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition resize-y"
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
      <span className="text-xs font-semibold uppercase tracking-widest text-ink/60">
        {label}
        {required && <span className="text-brand"> *</span>}
      </span>
      <select
        name={name}
        required={required}
        defaultValue=""
        className="bg-surface border border-ink/10 rounded-lg px-4 py-3 text-ink focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition"
      >
        <option value="" disabled>
          Choose…
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
