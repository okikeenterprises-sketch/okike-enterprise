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
      const res = await send({ data: {
        name: String(fd.get("name") || ""),
        email: String(fd.get("email") || ""),
        phone: String(fd.get("phone") || ""),
        experience_level: String(fd.get("experience_level") || ""),
        goals: String(fd.get("goals") || ""),
      }});
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
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          <div className="text-xs font-semibold tracking-widest uppercase text-brand">Apply to the academy</div>
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight max-w-[22ch] text-balance">
            Become the engineer behind the next generation of African software.
          </h1>
          <p className="text-ink/60 max-w-[52ch]">We review every application personally. Be honest — that's how we find the right fit.</p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <form onSubmit={onSubmit} className="max-w-3xl mx-auto bg-card rounded-3xl p-8 md:p-12 ring-1 ring-ink/5 flex flex-col gap-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Field label="Full name" name="name" required />
            <Field label="Email" name="email" type="email" required />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Field label="Phone or WhatsApp" name="phone" placeholder="Optional" />
            <Select label="Experience level" name="experience_level" required options={["Complete beginner", "Some self-taught experience", "Bootcamp graduate", "Working developer (skill-up)"]} />
          </div>
          <TextArea label="Why do you want to join? What do you want to build?" name="goals" required minLength={10} rows={8} placeholder="Tell us your story — current situation, what you've tried, what you want to ship." />
          <button type="submit" disabled={busy} className="bg-brand text-brand-foreground py-3 px-6 rounded-full font-medium hover:opacity-90 transition disabled:opacity-50 self-start">
            {busy ? "Sending…" : "Submit application"}
          </button>
        </form>
      </section>
    </SiteLayout>
  );
}
