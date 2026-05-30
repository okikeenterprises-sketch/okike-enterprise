import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
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
      <section className="py-32 px-6">
        <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-8">
          <div className="size-16 rounded-full bg-brand/10 flex items-center justify-center">
            <Check className="size-8 text-brand" />
          </div>
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-balance">
            Got it. We'll be in touch within 24 hours.
          </h1>
          <p className="text-ink/60 max-w-[48ch]">
            A real human reads every submission. Check your email for the next steps. In the meantime, take a look around.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/" className="bg-ink text-surface py-3 px-6 rounded-full font-medium hover:bg-ink/90 transition">Back home</Link>
            <Link to="/services" className="bg-ink/5 text-ink py-3 px-6 rounded-full font-medium ring-1 ring-ink/5 hover:bg-ink/10 transition">Browse services</Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
