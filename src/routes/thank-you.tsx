import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/thank-you")({
  head: () => ({
    meta: [
      { title: "Thank you — OKIKE" },
      { name: "description", content: "We received your submission and will be in touch within 24 hours." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ThankYouPage,
});

function ThankYouPage() {
  return (
    <SiteLayout>
      <section className="border-b border-ink/10">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-0 md:pt-28 min-h-[72vh] flex flex-col justify-between">
          <div className="flex flex-col gap-6 max-w-2xl">
            <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/50">
              <span className="h-px w-8 bg-brand" />
              <span>Submission received</span>
            </div>

            <h1 className="font-display text-[clamp(3rem,9vw,7.5rem)] leading-[0.92] tracking-wide uppercase text-ink">
              Got it.{" "}
              <span className="text-brand">We'll be in touch</span>{" "}
              within 24 hours.
            </h1>

            <p className="text-base md:text-lg text-ink/65 max-w-[44ch] leading-relaxed">
              A real human reads every submission. Check your email for next steps. In the
              meantime, take a look around.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/"
                className="bg-brand text-brand-foreground py-3.5 pl-7 pr-5 inline-flex items-center gap-2 font-semibold text-sm uppercase tracking-widest hover:opacity-90 transition"
              >
                Back home
              </Link>
              <Link
                to="/services"
                className="bg-transparent text-ink py-3.5 pl-7 pr-5 inline-flex items-center gap-2 font-semibold text-sm uppercase tracking-widest ring-1 ring-ink/20 hover:ring-ink/40 transition"
              >
                Browse services
              </Link>
            </div>
          </div>

          <div className="h-12" />
        </div>
      </section>
    </SiteLayout>
  );
}
