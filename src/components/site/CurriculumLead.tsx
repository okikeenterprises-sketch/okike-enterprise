import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function CurriculumLead() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [track, setTrack] = useState("Full-Stack Development");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("project_inquiries").insert({
      name: name.trim(),
      email: email.trim(),
      project_type: "Curriculum download",
      details: `Requested curriculum PDF for track: ${track}`,
      status: "new",
    });
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't submit — please try again.");
      return;
    }
    setDone(true);
    toast.success("Curriculum sent — check your inbox shortly.");
  }

  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto bg-contrast text-contrast-foreground rounded-3xl p-10 md:p-14 grid md:grid-cols-[1.1fr_1fr] gap-10 items-center">
        <div className="flex flex-col gap-5">
          <div className="text-xs font-semibold tracking-widest uppercase text-brand">
            Free curriculum
          </div>
          <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-balance">
            Get the full 12-week curriculum.
          </h2>
          <p className="text-contrast-foreground/70 max-w-[44ch] text-pretty">
            Week-by-week breakdown, project list, tooling, and the standards we hold every cohort
            to. Sent straight to your inbox.
          </p>
          <div className="flex items-center gap-3 text-xs text-contrast-foreground/50 pt-2">
            <Download className="size-4 text-brand" /> PDF · ~1.2 MB · No spam
          </div>
        </div>

        {done ? (
          <div className="bg-contrast-foreground/5 ring-1 ring-contrast-foreground/10 rounded-2xl p-8 text-center">
            <div className="text-brand text-xs font-semibold tracking-widest uppercase mb-3">
              Sent
            </div>
            <div className="text-lg font-medium mb-2">Check your inbox.</div>
            <p className="text-sm text-contrast-foreground/60">
              If it doesn't land in 5 minutes, check spam or email us at hello@okike.dev.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              required
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-contrast-foreground/5 ring-1 ring-contrast-foreground/15 rounded-xl px-4 py-3 text-sm text-contrast-foreground placeholder:text-contrast-foreground/40 focus:outline-none focus:ring-brand"
            />
            <input
              type="email"
              required
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-contrast-foreground/5 ring-1 ring-contrast-foreground/15 rounded-xl px-4 py-3 text-sm text-contrast-foreground placeholder:text-contrast-foreground/40 focus:outline-none focus:ring-brand"
            />
            <select
              value={track}
              onChange={(e) => setTrack(e.target.value)}
              className="bg-contrast-foreground/5 ring-1 ring-contrast-foreground/15 rounded-xl px-4 py-3 text-sm text-contrast-foreground focus:outline-none focus:ring-brand"
            >
              <option className="text-ink">Full-Stack Development</option>
              <option className="text-ink">Cyber Security</option>
              <option className="text-ink">Data Analysis</option>
              <option className="text-ink">Python Development</option>
            </select>
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 inline-flex items-center justify-center gap-2 bg-brand text-brand-foreground rounded-full py-3 px-5 font-medium hover:opacity-90 transition disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              {submitting ? "Sending…" : "Send me the curriculum"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
