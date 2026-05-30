import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Sparkles, Zap, Bot, ShieldCheck, Users, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";

import { Testimonials } from "@/components/site/Testimonials";
import { getPackages, getPartners, getSettings, type PublicPackage, type PublicPartner } from "@/lib/public-content";
import servicesImg from "@/assets/services-image.jpg";
import learnImg from "@/assets/learn-image.jpg";
import founderImg from "@/assets/founder.jpg";
import heroDashboard from "@/assets/hero-dashboard.jpg";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OKIKE — Build software. Learn to build it." },
      { name: "description", content: "OKIKE is a software house and academy. We build high-performance products for ambitious teams and train the next generation of African engineers." },
      { property: "og:title", content: "OKIKE — Build software. Learn to build it." },
      { property: "og:description", content: "Software studio and academy. Build with us, or learn to build it yourself." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [packages, setPackages] = useState<PublicPackage[]>([]);
  const [partners, setPartners] = useState<PublicPartner[]>([]);
  const [founder, setFounder] = useState<{ quote?: string; name?: string }>({});

  useEffect(() => {
    getPackages().then((rows) => setPackages(rows.slice(0, 3)));
    getPartners().then(setPartners);
    getSettings(["founder_quote", "founder_name"]).then((s) =>
      setFounder({ quote: s.founder_quote, name: s.founder_name }),
    );
  }, []);

  return (

    <SiteLayout>
      {/* Hero — magazine layout with product mockup */}
      <section className="relative overflow-hidden border-b border-ink/5">
        {/* Soft brand glow */}
        <div aria-hidden className="pointer-events-none absolute -top-40 -right-40 size-[700px] rounded-full bg-brand/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-32 size-[500px] rounded-full bg-brand/5 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24 grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-10 items-center">
          {/* Left column */}
          <div className="flex flex-col gap-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-ink/10 bg-surface/60 backdrop-blur px-4 py-2 text-xs font-medium tracking-wide text-ink/80">
              <Sparkles className="size-3.5 text-brand" />
              We build. We automate. We scale.
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.02] text-ink text-balance">
              Software and <span className="text-brand italic font-medium">AI</span> that solve{" "}
              <span className="text-brand italic font-medium">real problems.</span>
            </h1>

            <p className="text-lg text-ink/65 max-w-[52ch] text-pretty">
              OKIKE helps businesses, startups and students turn ideas into powerful digital solutions — using modern engineering, thoughtful design and AI automation.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/book"
                className="group bg-brand text-brand-foreground py-3.5 pl-6 pr-5 inline-flex items-center gap-2 rounded-full font-medium shadow-sm hover:opacity-90 transition"
              >
                Start a project
                <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/services"
                className="group bg-ink/[0.04] text-ink py-3.5 pl-6 pr-5 inline-flex items-center gap-2 rounded-full font-medium ring-1 ring-ink/10 hover:bg-ink/[0.07] transition"
              >
                View services
                <Phone className="size-4" />
              </Link>
            </div>

            {/* Feature row */}
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5 pt-6 border-t border-ink/5 mt-4">
              {[
                { icon: Zap, title: "Fast delivery", sub: "On-time, every time" },
                { icon: Bot, title: "AI-powered", sub: "Smarter solutions" },
                { icon: ShieldCheck, title: "Scalable & secure", sub: "Built for growth" },
                { icon: Users, title: "Client focused", sub: "Your success matters" },
              ].map(({ icon: Icon, title, sub }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-brand/10 text-brand ring-1 ring-brand/15">
                    <Icon className="size-4" />
                  </span>
                  <div className="leading-tight">
                    <div className="text-sm font-semibold text-ink">{title}</div>
                    <div className="text-xs text-ink/55 mt-0.5">{sub}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Right column — product visual */}
          <div className="relative">
            <div aria-hidden className="absolute inset-0 -m-6 rounded-[2rem] bg-gradient-to-br from-brand/15 via-brand/5 to-transparent blur-2xl" />
            <div className="relative rounded-2xl overflow-hidden ring-1 ring-ink/10 shadow-[0_30px_80px_-30px_rgba(146,64,14,0.35)] bg-card">
              <img
                src={heroDashboard}
                alt="OKIKE analytics dashboard product preview"
                width={1536}
                height={1152}
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 hidden md:block rounded-xl bg-surface ring-1 ring-ink/10 px-4 py-3 shadow-lg">
              <div className="text-[10px] uppercase tracking-widest text-ink/40">Live</div>
              <div className="text-sm font-semibold text-ink">12 products shipped this quarter</div>
            </div>
          </div>
        </div>

        {/* Trusted by */}
        {partners.length > 0 && (
          <div className="relative max-w-7xl mx-auto px-6 pb-16">
            <div className="text-center text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/40 mb-6">
              Trusted by students, startups & businesses
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-ink/50">
              {partners.map((p) =>
                p.logo_url ? (
                  <a key={p.id} href={p.url ?? "#"} target={p.url ? "_blank" : undefined} rel="noreferrer" className="opacity-70 hover:opacity-100 transition">
                    <img src={p.logo_url} alt={p.name} className="h-8 w-auto object-contain" />
                  </a>
                ) : (
                  <span key={p.id} className="text-lg font-semibold tracking-tight hover:text-ink/80 transition">
                    {p.name}
                  </span>
                ),
              )}
            </div>
          </div>
        )}

      </section>


      {/* Launch tagline */}
      <section className="border-y border-ink/5 bg-surface">
        <div className="max-w-7xl mx-auto px-6 py-10 text-center">
          <p className="text-base md:text-lg font-medium tracking-tight text-ink/80">
            Launching June 1st, 2026 — built from the ground up, with intention.
          </p>
        </div>
      </section>

      {/* Two offerings */}
      <section className="py-24 bg-secondary border-y border-ink/5">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12">
          <article className="flex flex-col gap-6">
            <div className="text-xs font-semibold tracking-widest uppercase text-brand">01 / Engineering</div>
            <h2 className="text-3xl font-medium max-w-[22ch] text-balance">Software for teams that demand precision.</h2>
            <img
              src={servicesImg}
              alt="Modern architecture detail"
              loading="lazy"
              width={1280}
              height={832}
              className="w-full aspect-video object-cover rounded-xl outline-1 -outline-offset-1 outline-black/5"
            />
            <ul className="text-ink/70 divide-y divide-ink/5">
              <li className="py-4 flex justify-between"><span>Web & mobile products</span><span className="text-xs uppercase tracking-wider text-ink/40">Custom build</span></li>
              <li className="py-4 flex justify-between"><span>Internal tools & dashboards</span><span className="text-xs uppercase tracking-wider text-ink/40">SaaS</span></li>
              <li className="py-4 flex justify-between"><span>MVP launchpad</span><span className="text-xs uppercase tracking-wider text-ink/40">2 weeks</span></li>
            </ul>
            <Link to="/services" className="inline-flex items-center gap-2 text-brand font-medium mt-2 hover:gap-3 transition-all">
              Explore services <ArrowUpRight className="size-4" />
            </Link>
          </article>

          <article className="flex flex-col gap-6">
            <div className="text-xs font-semibold tracking-widest uppercase text-brand">02 / Education</div>
            <h2 className="text-3xl font-medium max-w-[22ch] text-balance">Training the architects of the digital economy.</h2>
            <img
              src={learnImg}
              alt="Workspace with art"
              loading="lazy"
              width={1280}
              height={832}
              className="w-full aspect-video object-cover rounded-xl outline-1 -outline-offset-1 outline-black/5"
            />
            <ul className="text-ink/70 divide-y divide-ink/5">
              <li className="py-4 flex justify-between"><span>Fullstack development</span><span className="text-xs uppercase tracking-wider text-ink/40">12 weeks</span></li>
              <li className="py-4 flex justify-between"><span>UI/UX systems design</span><span className="text-xs uppercase tracking-wider text-ink/40">8 weeks</span></li>
              <li className="py-4 flex justify-between"><span>One-to-one mentorship</span><span className="text-xs uppercase tracking-wider text-ink/40">Ongoing</span></li>
            </ul>
            <Link to="/learn" className="inline-flex items-center gap-2 text-brand font-medium mt-2 hover:gap-3 transition-all">
              Explore the academy <ArrowUpRight className="size-4" />
            </Link>
          </article>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-12">
          <div className="max-w-[35ch] text-balance">
            <div className="text-xs font-semibold tracking-widest uppercase text-brand mb-4">Engagement</div>
            <h2 className="text-3xl font-medium mb-4">Transparent packages for every stage.</h2>
            <p className="text-ink/60 text-pretty">From a single landing page to a custom SaaS — fixed scope, fixed timeline.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {(packages.length > 0
              ? packages.map((p) => ({
                  tier: p.name,
                  price: p.request_quote || p.price == null ? "Custom" : `From ${p.currency === "USD" ? "$" : ""}${Number(p.price).toLocaleString()}`,
                  period: p.tagline ?? "",
                  desc: (p.features[0] as string) ?? "",
                  cta: p.request_quote ? "Request quote" : "Inquire",
                  highlight: p.featured,
                }))
              : [
                  { tier: "Starter Site", price: "From ₦150,000", period: "/ 1 week", desc: "A polished landing page with a contact form and analytics.", cta: "Inquire", highlight: false },
                  { tier: "Business Site", price: "From ₦400,000", period: "/ 2 weeks", desc: "Multi-page marketing site with CMS, forms, and integrations.", cta: "Book Consultation", highlight: true },
                  { tier: "Custom Software", price: "Custom Quote", period: "Quote", desc: "Internal tools, dashboards, and SaaS MVPs scoped around your business.", cta: "Contact", highlight: false },
                ]
            ).map((c) => (
              <PricingCard key={c.tier} {...c} />
            ))}
          </div>

        </div>
      </section>

      {/* Social proof */}
      <Testimonials />

      {/* Founder teaser */}
      <section className="py-24 bg-contrast text-contrast-foreground px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 items-center">
          <div className="md:w-1/3 shrink-0">
            <img
              src={founderImg}
              alt="OKIKE founder"
              loading="lazy"
              width={800}
              height={1000}
              className="w-full aspect-[4/5] object-cover rounded-xl outline-1 -outline-offset-1 outline-contrast-foreground/5"
            />
          </div>
          <div className="md:w-2/3">
            <div className="text-xs font-semibold tracking-widest uppercase text-brand mb-4">Founder note</div>
            <h2 className="text-3xl md:text-4xl font-medium mb-8 max-w-[28ch] text-balance">Crafted with heritage, engineered for the global stage.</h2>
            <p className="text-lg text-contrast-foreground/70 max-w-[52ch] mb-8 text-pretty">
              {founder.quote ?? `"OKIKE was founded on the belief that African tech talent shouldn't just participate in the global economy — it should lead it. We combine local intelligence with world-class engineering."`}
            </p>

            <Link to="/about" className="inline-flex items-center gap-2 text-brand font-medium hover:gap-3 transition-all">
              Read the full story <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-8">
          <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-balance">
            Ready to build something lasting?
          </h2>
          <p className="text-ink/60 max-w-[48ch] text-pretty">
            Whether you need a partner to ship your next product or a path to becoming the engineer behind it — OKIKE is built for both.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/book" className="bg-brand text-brand-foreground py-3 px-6 rounded-full font-medium hover:opacity-90 transition">
              Start a project
            </Link>
            <Link to="/enroll" className="bg-ink/5 text-ink py-3 px-6 rounded-full font-medium ring-1 ring-ink/5 hover:bg-ink/10 transition">
              Apply to the academy
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function PricingCard({ tier, price, period, desc, cta, highlight }: { tier: string; price: string; period: string; desc: string; cta: string; highlight: boolean }) {
  return (
    <div className={`p-8 bg-surface rounded-2xl flex flex-col gap-6 relative overflow-hidden ${highlight ? "ring-1 ring-brand/30" : "ring-1 ring-ink/5"}`}>
      {highlight && (
        <div className="absolute top-0 right-0 bg-brand text-brand-foreground text-[10px] px-3 py-1 font-semibold uppercase tracking-wider">Most popular</div>
      )}
      <h3 className="text-lg font-medium">{tier}</h3>
      <div>
        <div className="text-4xl font-medium">{price}</div>
        <div className="text-sm text-ink/40 mt-1">{period}</div>
      </div>
      <p className="text-sm text-ink/60 text-pretty">{desc}</p>
      <Link to="/book" className={`w-full py-3 rounded-full text-sm font-medium text-center transition ${highlight ? "bg-brand text-brand-foreground ring-1 ring-brand hover:opacity-90" : "bg-contrast text-contrast-foreground hover:bg-ink/90"}`}>
        {cta}
      </Link>
    </div>
  );
}
