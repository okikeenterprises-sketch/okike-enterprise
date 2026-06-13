import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { submitEnrollment } from "@/lib/forms.functions";
import { Field, TextArea, Select } from "./contact";

export const Route = createFileRoute("/enroll")({
  head: () => ({
    meta: [
      { title: "Apply to the academy — OKIKE" },
      { name: "description", content: "Apply to OKIKE's 12-week engineering cohort. We review every application personally." },
      { property: "og:title", content: "Apply to the academy — OKIKE" },
      { property: "og:description", content: "Enrollment form for OKIKE Academy." },
    ],
  }),
  component: EnrollPage,
});

function EnrollPage() {
  const navigate = useNavigate();
  const send = useServerFn(submitEnrollment);
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
          phone: String(fd.get("phone") || ""),
          experience_level: String(fd.get("experience_level") || ""),
          goals: String(fd.get("goals") || ""),
        },
      });
      if (res.ok) navigate({ to: "/thank-you" });
      else toast.error(res.error);
    } catch {
      toast.error("Please check the form and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteLayout>

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden border-b border-ink/10">
        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-0 md:pt-28 min-h-[56vh] flex flex-col justify-between">
          <div className="flex flex-col gap-6 max-w-2xl">
            <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/50">
              <span className="h-px w-8 bg-brand" />
              <span>Apply to the Academy</span>
            </div>

            <h1 className="font-display text-[clamp(3rem,9vw,7.5rem)] leading-[0.92] tracking-wide uppercase text-ink">
              Become the{" "}
              <span className="text-brand">engineer</span>{" "}
              behind what's next.
            </h1>

            <p className="text-base md:text-lg text-ink/65 max-w-[44ch] leading-relaxed">
              We review every application personally. Be honest — that's how we find the right fit.
            </p>
          </div>
          <div className="h-12" />
        </div>
      </section>

      {/* ─── FORM ─── */}
      <section className="px-6 py-16 md:py-24">
        <form onSubmit={onSubmit} className="max-w-3xl mx-auto flex flex-col gap-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Field label="Full name" name="name" required />
            <Field label="Email" name="email" type="email" required />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Field label="Phone or WhatsApp" name="phone" placeholder="Optional" />
            <Select
              label="Experience level"
              name="experience_level"
              required
              options={[
                "Complete beginner",
                "Some self-taught experience",
                "Bootcamp graduate",
                "Working developer (skill-up)",
              ]}
            />
          </div>
          <TextArea
            label="Why do you want to join? What do you want to build?"
            name="goals"
            required
            minLength={10}
            rows={8}
            placeholder="Tell us your story — current situation, what you've tried, what you want to ship."
          />
          <button
            type="submit"
            disabled={busy}
            className="bg-brand text-brand-foreground py-3.5 pl-7 pr-5 font-semibold text-sm uppercase tracking-widest hover:opacity-90 transition disabled:opacity-50 self-start"
          >
            {busy ? "Sending…" : "Submit application"}
          </button>
        </form>
      </section>

    </SiteLayout>
  );
}
