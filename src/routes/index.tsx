import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { WelcomeAI } from "@/components/site/WelcomeAI";
import { Testimonials } from "@/components/site/Testimonials";
import {
  getPackages,
  getPartners,
  getSettings,
  type PublicPackage,
  type PublicPartner,
} from "@/lib/public-content";
import servicesImg from "@/assets/services-image.jpg";
import learnImg from "@/assets/learn-image.jpg";
import founderImg from "@/assets/founder.jpg";
import heroDashboard from "@/assets/hero-dashboard.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OKIKE — Build software. Learn to build it." },
      {
        name: "description",
        content:
          "OKIKE is a software house and academy based in Nigeria. We build high-performance web platforms, AI tools and mobile apps for startups and businesses, while training the next generation of African engineers.",
      },
      { name: "robots", content: "index, follow" },
      { name: "keywords", content: "software development Nigeria, web development Africa, AI tools, mobile app development, software academy Nigeria, tech training Africa, OKIKE" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://okike-enterprise.lovable.app/" },
      { property: "og:title", content: "OKIKE — Build software. Learn to build it." },
      { property: "og:description", content: "Nigerian software studio and tech academy. We build web platforms, AI tools and mobile apps for ambitious teams — and train the engineers who build them." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/261c5493-35d0-4cb5-851d-5b09f89d86ba/id-preview-9589f573--e22e363f-f41b-4927-9ac6-0599fdc05dff.lovable.app-1778630917399.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:locale", content: "en_NG" },
      { property: "og:site_name", content: "OKIKE" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@okikeenterprises" },
      { name: "twitter:title", content: "OKIKE — Build software. Learn to build it." },
      { name: "twitter:description", content: "Nigerian software studio and tech academy. Build with us or learn to build it yourself." },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/261c5493-35d0-4cb5-851d-5b09f89d86ba/id-preview-9589f573--e22e363f-f41b-4927-9ac6-0599fdc05dff.lovable.app-1778630917399.png" },
    ],
    links: [
      { rel: "canonical", href: "https://okike-enterprise.lovable.app/" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [packages, setPackages] = useState<PublicPackage[]>([]);
  const [partners, setPartners] = useState<PublicPartner[]>([]);
  const [founder, setFounder] = useState<{ quote?: string; name?: string }>({});

  useEffect(() => {
    const settingText = (value: unknown) => (typeof value === "string" ? value : undefined);
    getPackages().then((rows) => setPackages(rows.slice(0, 3)));
    getPartners().then(setPartners);
    getSettings(["founder_quote", "founder_name"]).then((s) =>
      setFounder({
        quote: settingText(s.founder_quote),
        name: settingText(s.founder_name),
      }),
    );
  }, []);

  return (
    <>
      <SiteLayout>

        {/* ─── HERO ─── */}
        <section className="relative overflow-hidden border-b border-ink/10">
          <div className="absolute inset-y-0 right-0 w-full lg:w-[65%] pointer-events-none">
            <img src="/background.png" alt="" aria-hidden className="w-full h-full object-cover object-left-top opacity-100" />
            <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/85 to-surface/5" />
            <div className="absolute inset-0 bg-gradient-to-l from-surface/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-surface to-transparent" />
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-surface to-transparent" />
          </div>

          <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-0 md:pt-28 min-h-[88vh] flex flex-col justify-between">
            <div className="flex flex-col gap-6 max-w-3xl">
              <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/50">
                <span className="h-px w-8 bg-brand" />
                <span>Institutional Studio &amp; Academy</span>
              </div>

              <h1 className="font-display text-[clamp(3.5rem,10vw,8.5rem)] leading-[0.92] tracking-wide uppercase text-ink">
                OKIKE Your{" "}
                <span className="text-brand">Cultural</span>{" "}
                Architect.
              </h1>

              <p className="text-base md:text-lg text-ink/65 max-w-[46ch] leading-relaxed">
                OKIKE helps businesses, startups and students turn ideas into powerful digital
                solutions — using modern engineering, thoughtful design and AI automation.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/book"
                  className="group bg-brand text-brand-foreground py-3.5 pl-7 pr-5 inline-flex items-center gap-2 font-semibold text-sm uppercase tracking-widest hover:opacity-90 transition"
                >
                  Start a project
                  <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/learn"
                  className="bg-transparent text-ink py-3.5 pl-7 pr-5 inline-flex items-center gap-2 font-semibold text-sm uppercase tracking-widest ring-1 ring-ink/20 hover:ring-ink/40 transition"
                >
                  Explore Academy
                  <ArrowUpRight className="size-4" />
                </Link>
              </div>
            </div>

            <div className="relative mt-16 -mx-6 border-t border-ink/10 bg-surface/80 backdrop-blur overflow-hidden">
              <div className="flex divide-x divide-ink/10 overflow-x-auto scrollbar-none">
                {[
                  { value: "12+", label: "Products shipped" },
                  { value: "2 wks", label: "Fastest delivery" },
                  { value: "100%", label: "Senior-built" },
                  { value: "4", label: "Service tracks" },
                  { value: "AI-first", label: "By design" },
                  { value: "NG + Global", label: "Where we work" },
                ].map(({ value, label }) => (
                  <div key={label} className="flex-shrink-0 px-8 py-5 flex flex-col gap-0.5 min-w-[160px]">
                    <span className="font-display text-3xl leading-none tracking-wide uppercase text-ink">{value}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/45">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </section>

        {/* ─── PARTNERS ─── */}
        <section className="py-16 px-6 border-y border-ink/10">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/40 mb-10">
              <span className="h-px w-8 bg-brand" />
              <span>Trusted by students, startups &amp; businesses</span>
            </div>
            {partners.length > 0 ? (
              <div className="flex flex-wrap items-center gap-x-12 gap-y-8">
                {partners.map((p) =>
                  p.logo_url ? (
                    <a key={p.id} href={p.url ?? "#"} target={p.url ? "_blank" : undefined} rel="noreferrer" className="opacity-50 hover:opacity-100 grayscale hover:grayscale-0 transition">
                      <img src={p.logo_url} alt={p.name} className="h-16 w-auto object-contain max-w-[200px]" />
                    </a>
                  ) : (
                    <span key={p.id} className="font-display text-3xl tracking-wide uppercase text-ink/40 hover:text-ink/70 transition">{p.name}</span>
                  ),
                )}
              </div>
            ) : (
              <p className="text-[11px] uppercase tracking-[0.2em] text-ink/30">
                Partner logos — managed from the admin dashboard.
              </p>
            )}
          </div>
        </section>

        {/* ─── TAGLINE ─── */}
        <section className="border-y border-ink/10 bg-surface">
          <div className="max-w-7xl mx-auto px-6 py-8 flex items-center gap-4">
            <span className="h-px w-8 bg-brand shrink-0" />
            <p className="text-sm md:text-base font-semibold tracking-[0.12em] uppercase text-ink/60">
              Now open for projects — built from the ground up, with intention.
            </p>
          </div>
        </section>

        {/* ─── TWO OFFERINGS ─── */}
        <section className="py-24 bg-secondary border-y border-ink/10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/50 mb-12">
              <span className="h-px w-8 bg-brand" />
              <span>Two practices. One mission.</span>
            </div>
            <div className="grid md:grid-cols-2 gap-12">
              <article className="flex flex-col gap-6">
                <div className="text-xs font-semibold tracking-widest uppercase text-brand">01 / Engineering</div>
                <h2 className="font-display text-5xl md:text-6xl leading-[0.92] tracking-wide uppercase text-ink">
                  Software for teams that demand precision.
                </h2>
                <img src={servicesImg} alt="Engineering" loading="lazy" width={1280} height={832} className="w-full aspect-video object-cover" />
                <ul className="text-ink/70 divide-y divide-ink/5">
                  <li className="py-4 flex justify-between"><span>Web &amp; mobile products</span><span className="text-xs uppercase tracking-wider text-ink/40">Custom build</span></li>
                  <li className="py-4 flex justify-between"><span>Internal tools &amp; dashboards</span><span className="text-xs uppercase tracking-wider text-ink/40">SaaS</span></li>
                  <li className="py-4 flex justify-between"><span>MVP launchpad</span><span className="text-xs uppercase tracking-wider text-ink/40">2 weeks</span></li>
                </ul>
                <Link to="/services" className="inline-flex items-center gap-2 text-brand font-semibold text-sm uppercase tracking-widest mt-2 hover:gap-3 transition-all">
                  Explore services <ArrowUpRight className="size-4" />
                </Link>
              </article>

              <article className="flex flex-col gap-6">
                <div className="text-xs font-semibold tracking-widest uppercase text-brand">02 / Education</div>
                <h2 className="font-display text-5xl md:text-6xl leading-[0.92] tracking-wide uppercase text-ink">
                  Training the architects of the digital economy.
                </h2>
                <img src={learnImg} alt="Education" loading="lazy" width={1280} height={832} className="w-full aspect-video object-cover" />
                <ul className="text-ink/70 divide-y divide-ink/5">
                  <li className="py-4 flex justify-between"><span>Fullstack development</span><span className="text-xs uppercase tracking-wider text-ink/40">12 weeks</span></li>
                  <li className="py-4 flex justify-between"><span>UI/UX systems design</span><span className="text-xs uppercase tracking-wider text-ink/40">8 weeks</span></li>
                  <li className="py-4 flex justify-between"><span>One-to-one mentorship</span><span className="text-xs uppercase tracking-wider text-ink/40">Ongoing</span></li>
                </ul>
                <Link to="/learn" className="inline-flex items-center gap-2 text-brand font-semibold text-sm uppercase tracking-widest mt-2 hover:gap-3 transition-all">
                  Explore the academy <ArrowUpRight className="size-4" />
                </Link>
              </article>
            </div>
          </div>
        </section>

        {/* ─── PRICING ─── */}
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto flex flex-col gap-12">
            <div>
              <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/50 mb-6">
                <span className="h-px w-8 bg-brand" />
                <span>Engagement</span>
              </div>
              <h2 className="font-display text-5xl md:text-6xl leading-[0.92] tracking-wide uppercase text-ink mb-4">
                Transparent packages for every stage.
              </h2>
              <p className="text-ink/60 max-w-[44ch]">
                From a single landing page to a custom SaaS — fixed scope, fixed timeline.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {(packages.length > 0
                ? packages.map((p) => ({
                  tier: p.name,
                  price: p.request_quote || p.price == null
                    ? "Custom"
                    : `From ${p.currency === "USD" ? "$" : ""}${Number(p.price).toLocaleString()}`,
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

        {/* ─── TESTIMONIALS ─── */}
        <Testimonials />

        {/* ─── FOUNDER ─── */}
        <section className="py-24 bg-contrast text-contrast-foreground px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 items-center">
            <div className="md:w-1/3 shrink-0">
              <img
                src={founderImg}
                alt="OKIKE founder"
                loading="lazy"
                width={800}
                height={1000}
                className="w-full aspect-[4/5] object-cover"
              />
            </div>
            <div className="md:w-2/3">
              <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-brand mb-6">
                <span className="h-px w-8 bg-brand" />
                <span>Founder Note</span>
              </div>
              <h2 className="font-display text-5xl md:text-6xl leading-[0.92] tracking-wide uppercase text-contrast-foreground mb-8 max-w-[18ch]">
                Crafted with heritage, engineered for the global stage.
              </h2>
              <p className="text-lg text-contrast-foreground/70 max-w-[52ch] mb-8 text-pretty">
                {founder.quote ??
                  `"OKIKE was founded on the belief that African tech talent shouldn't just participate in the global economy — it should lead it. We combine local intelligence with world-class engineering."`}
              </p>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 text-brand font-semibold text-sm uppercase tracking-widest hover:gap-3 transition-all"
              >
                Read the full story <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ─── FINAL CTA ─── */}
        <section className="py-24 px-6 border-t border-ink/10">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/50 mb-8">
              <span className="h-px w-8 bg-brand" />
              <span>Ready to Build</span>
            </div>
            <h2 className="font-display text-[clamp(3rem,8vw,7rem)] leading-[0.92] tracking-wide uppercase text-ink mb-6 max-w-3xl">
              Ready to build something{" "}
              <span className="text-brand">lasting?</span>
            </h2>
            <p className="text-ink/60 max-w-[46ch] mb-10">
              Whether you need a partner to ship your next product or a path to becoming the
              engineer behind it — OKIKE is built for both.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/book"
                className="bg-brand text-brand-foreground py-3.5 pl-7 pr-5 inline-flex items-center gap-2 font-semibold text-sm uppercase tracking-widest hover:opacity-90 transition"
              >
                Start a project
              </Link>
              <Link
                to="/enroll"
                className="bg-transparent text-ink py-3.5 pl-7 pr-5 inline-flex items-center gap-2 font-semibold text-sm uppercase tracking-widest ring-1 ring-ink/20 hover:ring-ink/40 transition"
              >
                Apply to the academy
              </Link>
            </div>
          </div>
        </section>

      </SiteLayout>
      <WelcomeAI />
    </>
  );
}

function PricingCard({
  tier,
  price,
  period,
  desc,
  cta,
  highlight,
}: {
  tier: string;
  price: string;
  period: string;
  desc: string;
  cta: string;
  highlight: boolean;
}) {
  return (
    <div className={`p-8 bg-surface flex flex-col gap-6 relative overflow-hidden border-t-2 ${highlight ? "border-brand" : "border-ink/10"} ring-1 ring-ink/5`}>
      {highlight && (
        <div className="absolute top-0 right-0 bg-brand text-brand-foreground text-[10px] px-3 py-1 font-semibold uppercase tracking-wider">
          Most popular
        </div>
      )}
      <h3 className="font-display text-2xl tracking-wide uppercase">{tier}</h3>
      <div>
        <div className="font-display text-5xl leading-none tracking-wide">{price}</div>
        <div className="text-sm text-ink/40 mt-1 uppercase tracking-wider">{period}</div>
      </div>
      <p className="text-sm text-ink/60">{desc}</p>
      <Link
        to="/book"
        className={`py-3 font-semibold text-sm uppercase tracking-widest text-center transition ${highlight ? "bg-brand text-brand-foreground hover:opacity-90" : "bg-ink/5 text-ink ring-1 ring-ink/10 hover:bg-ink/10"}`}
      >
        {cta}
      </Link>
    </div>
  );
}
