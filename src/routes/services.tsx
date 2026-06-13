import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Code2,
  Smartphone,
  Palette,
  GraduationCap,
  Bot,
  Sparkles,
  Search,
  Compass,
  Hammer,
  Rocket,
  Check,
  Plus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import heroDashboard from "@/assets/hero-dashboard.jpg";

type PortfolioItem = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  url: string | null;
  tags: string[];
};

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Software Development Services — OKIKE Nigeria" },
      {
        name: "description",
        content:
          "OKIKE builds AI tools, web platforms, mobile apps, dashboards and student systems for startups, businesses and educational institutions across Africa and globally.",
      },
      { name: "robots", content: "index, follow" },
      { name: "keywords", content: "software development Nigeria, AI development Africa, web app development, mobile app Nigeria, SaaS development, student portal Nigeria, OKIKE services" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://okike-enterprise.lovable.app/services" },
      { property: "og:title", content: "Software Development Services — OKIKE Nigeria" },
      { property: "og:description", content: "AI automation, scalable web platforms, mobile apps and UI/UX design for ambitious teams across Africa and globally." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/261c5493-35d0-4cb5-851d-5b09f89d86ba/id-preview-9589f573--e22e363f-f41b-4927-9ac6-0599fdc05dff.lovable.app-1778630917399.png" },
      { property: "og:site_name", content: "OKIKE" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Software Development Services — OKIKE Nigeria" },
      { name: "twitter:description", content: "AI tools, web platforms, mobile apps and dashboards built for startups and businesses across Africa." },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/261c5493-35d0-4cb5-851d-5b09f89d86ba/id-preview-9589f573--e22e363f-f41b-4927-9ac6-0599fdc05dff.lovable.app-1778630917399.png" },
    ],
    links: [
      { rel: "canonical", href: "https://okike-enterprise.lovable.app/services" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          serviceType: "Software design and development",
          provider: {
            "@type": "Organization",
            name: "OKIKE",
            url: "https://okike-enterprise.lovable.app",
          },
          name: "OKIKE software, AI & product services",
          description:
            "AI automation, web & mobile platforms, UI/UX design, student & campus systems, and branding for ambitious teams.",
          areaServed: "Worldwide",
          url: "https://okike-enterprise.lovable.app/services",
        }),
      },
    ],
  }),
  component: ServicesPage,
});

const coreServices = [
  {
    icon: Bot,
    title: "AI & Automation",
    blurb:
      "Automate repetitive tasks and build intelligent systems that think alongside your team.",
    bullets: [
      "AI chatbots & assistants",
      "Workflow automation",
      "AI integrations (OpenAI, Gemini)",
      "Business process automation",
    ],
  },
  {
    icon: Code2,
    title: "Web Application Development",
    blurb: "Scalable, secure, modern web platforms — built with the stack the best teams ship on.",
    bullets: [
      "SaaS platforms",
      "Dashboards & admin panels",
      "Custom portals & APIs",
      "React · Next.js · Cloudflare",
    ],
  },
  {
    icon: Smartphone,
    title: "Mobile App Development",
    blurb: "Native-feeling mobile experiences for Android, iOS and the web — one polished product.",
    bullets: ["Android development", "Cross-platform apps", "Modern UI/UX", "Scalable backends"],
  },
  {
    icon: Palette,
    title: "UI/UX Design",
    blurb: "Beautiful, intuitive, user-centered design that turns visitors into customers.",
    bullets: ["Product design", "Design systems", "Prototypes", "User experience research"],
  },
  {
    icon: GraduationCap,
    title: "Student & Campus Platforms",
    blurb: "Purpose-built digital systems for institutions, departments and student bodies.",
    bullets: [
      "Student portals",
      "Complaint & feedback systems",
      "Material repositories",
      "Course & GPA checkers",
    ],
  },
  {
    icon: Sparkles,
    title: "Branding & Digital Presence",
    blurb: "Build a strong identity and a digital presence that actually stands out.",
    bullets: [
      "Startup identity",
      "Modern marketing sites",
      "Portfolio websites",
      "Founder & personal brands",
    ],
  },
];

const process = [
  {
    n: "01",
    icon: Search,
    t: "Discovery",
    d: "We understand your vision, users and constraints before writing a single line of code.",
  },
  {
    n: "02",
    icon: Compass,
    t: "Strategy",
    d: "We plan the architecture, flows and user experience — you approve every screen.",
  },
  {
    n: "03",
    icon: Hammer,
    t: "Development",
    d: "We build scalable systems with daily progress and weekly demos.",
  },
  {
    n: "04",
    icon: Rocket,
    t: "Launch & Support",
    d: "We deploy, optimize and maintain so your product keeps growing after day one.",
  },
];

const results = [
  { metric: "300+", label: "Students using a platform we built", tag: "NACOS Blog" },
  { metric: "80%", label: "Reduction in manual admin workflows", tag: "Automation" },
  { metric: "12+", label: "Products shipped across web, mobile & AI", tag: "Studio" },
];

const stack = [
  "Next.js",
  "React",
  "Node.js",
  "TypeScript",
  "PostgreSQL",
  "Tailwind CSS",
  "Python",
  "Firebase",
  "Cloudflare",
  "OpenAI",
];

const industries = [
  { t: "Startups", d: "MVPs, SaaS products and founder-led brands." },
  { t: "Educational Institutions", d: "Portals, repositories and academic tools." },
  { t: "Businesses", d: "Internal tools, automations and growth platforms." },
  { t: "Creators", d: "Premium personal sites and digital products." },
  { t: "Student Organizations", d: "Custom platforms for departments & associations." },
];

const engagement = [
  { t: "Project-based", d: "Fixed scope, fixed timeline, clear deliverables." },
  { t: "Retainer partnerships", d: "Ongoing engineering, design and AI support." },
  { t: "MVP development", d: "From idea to a launch-ready product, fast." },
  { t: "Product consulting", d: "Strategy, architecture and technical direction." },
];

const faqs = [
  {
    q: "How long does development take?",
    a: "Most engagements ship in 2–8 weeks. MVPs typically take 4–6 weeks; marketing sites 1–3 weeks; custom platforms can run longer. We commit to a fixed timeline before we start.",
  },
  {
    q: "Do you work internationally?",
    a: "Yes. We work with founders, startups and organizations across Africa, Europe and North America — fully remote, async-friendly, with weekly check-ins.",
  },
  {
    q: "Can you redesign or rebuild existing systems?",
    a: "Absolutely. A large part of our work is taking outdated or fragile products and rebuilding them with modern architecture, better UX and a real foundation for scale.",
  },
  {
    q: "Do you provide maintenance after launch?",
    a: "Yes. Every project includes 30 days of post-launch support, and you can continue on a retainer for ongoing engineering, monitoring and improvements.",
  },
  {
    q: "Can you build AI-powered systems?",
    a: "Yes — this is one of our specialties. We build chatbots, AI assistants, document workflows, smart search and custom integrations with OpenAI, Gemini and your own data.",
  },
];

function ServicesPage() {
  return (
    <SiteLayout>
      {/* 1. HERO */}
      <section className="relative overflow-hidden border-b border-ink/10">
        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-0 md:pt-28 min-h-[72vh] flex flex-col justify-between">
          <div className="flex flex-col gap-6 max-w-3xl">
            <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/50">
              <span className="h-px w-8 bg-brand" />
              <span>What We Build</span>
            </div>

            <h1 className="font-display text-[clamp(3.5rem,9vw,7.5rem)] leading-[0.92] tracking-wide uppercase text-ink">
              Digital foundations for{" "}
              <span className="text-brand">ambitious</span> teams.
            </h1>

            <p className="text-base md:text-lg text-ink/65 max-w-[48ch] leading-relaxed">
              From idea to scale — we ship AI tools, scalable platforms, mobile apps and stunning
              experiences that actually move the needle.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/book"
                className="group bg-brand text-brand-foreground py-3.5 pl-7 pr-5 inline-flex items-center gap-2 font-semibold text-sm uppercase tracking-widest hover:opacity-90 transition"
              >
                Start a project
                <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#work"
                className="bg-transparent text-ink py-3.5 pl-7 pr-5 inline-flex items-center gap-2 font-semibold text-sm uppercase tracking-widest ring-1 ring-ink/20 hover:ring-ink/40 transition"
              >
                View our work
              </a>
            </div>
          </div>

          {/* Stats bar */}
          <div className="relative mt-16 -mx-6 border-t border-ink/10 bg-surface/80 backdrop-blur overflow-hidden">
            <div className="flex divide-x divide-ink/10 overflow-x-auto scrollbar-none">
              {[
                { value: "12+", label: "Products shipped" },
                { value: "6", label: "Service areas" },
                { value: "4–6 wks", label: "Avg. delivery" },
                { value: "AI-first", label: "By default" },
                { value: "30 days", label: "Post-launch support" },
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

      {/* 2. CORE SERVICES GRID */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/50 mb-6">
              <span className="h-px w-8 bg-brand" />
              <span>What we do</span>
            </div>
            <h2 className="font-display text-5xl md:text-6xl leading-[0.92] tracking-wide uppercase text-ink">
              Our core services.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-ink/10 border border-ink/10">
            {coreServices.map(({ icon: Icon, title, blurb, bullets }) => (
              <div key={title} className="p-8 bg-surface flex flex-col gap-5 hover:bg-secondary transition-colors">
                <div className="inline-flex size-10 items-center justify-center bg-brand/10 text-brand">
                  <Icon className="size-5" />
                </div>
                <h3 className="font-display text-2xl leading-none tracking-wide uppercase text-ink">{title}</h3>
                <p className="text-sm text-ink/60">{blurb}</p>
                <ul className="space-y-2 text-sm text-ink/80 mt-auto pt-4 border-t border-ink/5">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <Check className="size-4 text-brand mt-0.5 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. HOW WE WORK */}
      <section className="py-24 bg-secondary border-y border-ink/10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-[42ch] mb-16">
            <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/50 mb-6">
              <span className="h-px w-8 bg-brand" />
              <span>Our process</span>
            </div>
            <h2 className="font-display text-5xl md:text-6xl leading-[0.92] tracking-wide uppercase text-ink">
              A simple, transparent and collaborative way of working.
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {process.map(({ n, icon: Icon, t, d }) => (
              <div key={n} className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-brand/10 text-brand ring-1 ring-brand/15">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-sm font-semibold text-brand">{n}</span>
                </div>
                <div className="text-xl font-medium">{t}</div>
                <p className="text-sm text-ink/60">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SHOWCASE RESULTS */}
      <section id="work" className="py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/50 mb-6">
                <span className="h-px w-8 bg-brand" />
                <span>Featured results</span>
              </div>
              <h2 className="font-display text-5xl md:text-6xl leading-[0.92] tracking-wide uppercase text-ink">
                Real systems. Real impact.
              </h2>
            </div>
            <p className="text-ink/60 max-w-[40ch]">
              A few outcomes from products we&apos;ve shipped for students, founders and organisations.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-px bg-ink/10 border border-ink/10 mb-16">
            {results.map((r) => (
              <div key={r.label} className="p-8 bg-surface flex flex-col gap-4">
                <div className="text-[10px] uppercase tracking-[0.2em] text-ink/40 font-semibold">{r.tag}</div>
                <div className="font-display text-7xl leading-none tracking-wide text-brand">{r.metric}</div>
                <div className="text-sm text-ink/70">{r.label}</div>
              </div>
            ))}
          </div>

          <PortfolioGrid />
        </div>
      </section>

      {/* 5. TECH STACK */}
      <section className="py-24 bg-contrast text-contrast-foreground px-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-10">
          <div>
            <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-brand mb-6">
              <span className="h-px w-8 bg-brand" />
              <span>Technology we use</span>
            </div>
            <h2 className="font-display text-5xl md:text-6xl leading-[0.92] tracking-wide uppercase text-contrast-foreground">
              Built on the stack the best teams ship on.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {stack.map((s) => (
              <span
                key={s}
                className="px-5 py-2.5 bg-contrast-foreground/5 ring-1 ring-contrast-foreground/10 text-sm font-semibold uppercase tracking-widest text-contrast-foreground/90 hover:bg-contrast-foreground/10 transition"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 6. INDUSTRIES */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-[42ch] mb-16">
            <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/50 mb-6">
              <span className="h-px w-8 bg-brand" />
              <span>Who we help</span>
            </div>
            <h2 className="font-display text-5xl md:text-6xl leading-[0.92] tracking-wide uppercase text-ink">
              Built for the people building what&apos;s next.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-ink/10 border border-ink/10">
            {industries.map((i) => (
              <div key={i.t} className="p-6 bg-surface hover:bg-secondary transition-colors">
                <div className="font-display text-xl tracking-wide uppercase text-ink mb-2">{i.t}</div>
                <div className="text-sm text-ink/60">{i.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. ENGAGEMENT MODEL */}
      <section className="py-24 bg-secondary border-y border-ink/10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-[42ch] mb-16">
            <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/50 mb-6">
              <span className="h-px w-8 bg-brand" />
              <span>How we engage</span>
            </div>
            <h2 className="font-display text-5xl md:text-6xl leading-[0.92] tracking-wide uppercase text-ink">
              Flexible engagement models.
            </h2>
            <p className="text-ink/60 mt-4">
              Pick the partnership that fits your stage. We&apos;ll send a detailed quote within 24
              hours of your inquiry.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-ink/10 border border-ink/10">
            {engagement.map((e) => (
              <div key={e.t} className="p-6 bg-surface hover:bg-card transition-colors">
                <div className="font-display text-xl tracking-wide uppercase text-ink mb-2">{e.t}</div>
                <div className="text-sm text-ink/60">{e.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FAQ */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/50 mb-6">
              <span className="h-px w-8 bg-brand" />
              <span>Frequently asked</span>
            </div>
            <h2 className="font-display text-5xl md:text-6xl leading-[0.92] tracking-wide uppercase text-ink">
              Questions, answered.
            </h2>
          </div>
          <div className="divide-y divide-ink/10 border-y border-ink/10">
            {faqs.map((f, i) => (
              <FaqItem key={f.q} q={f.q} a={f.a} defaultOpen={i === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* 9. FINAL CTA */}
      <section className="py-24 md:py-32 px-6 border-t border-ink/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/50 mb-8">
            <span className="h-px w-8 bg-brand" />
            <span>Get Started</span>
          </div>
          <h2 className="font-display text-[clamp(2.5rem,7vw,6rem)] leading-[0.92] tracking-wide uppercase text-ink mb-8 max-w-4xl">
            Let&apos;s build something{" "}
            <span className="text-brand">meaningful.</span>
          </h2>
          <p className="text-ink/60 max-w-[48ch] text-pretty mb-10">
            Have a project in mind? Tell us what you&apos;re building — we&apos;ll respond within 24
            hours with next steps and a quote.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/book"
              className="bg-brand text-brand-foreground py-3.5 pl-7 pr-5 inline-flex items-center gap-2 font-semibold text-sm uppercase tracking-widest hover:opacity-90 transition"
            >
              Book a call
            </Link>
            <Link
              to="/contact"
              className="bg-transparent text-ink py-3.5 pl-7 pr-5 inline-flex items-center gap-2 font-semibold text-sm uppercase tracking-widest ring-1 ring-ink/20 hover:ring-ink/40 transition"
            >
              Send an inquiry
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function PortfolioGrid() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("portfolio_items")
      .select("id, title, description, image_url, url, tags")
      .eq("published", true)
      .order("position", { ascending: true })
      .then(({ data }) => {
        setItems((data ?? []) as PortfolioItem[]);
        setLoading(false);
      });
  }, []);

  if (loading) return null;
  if (items.length === 0) return null;

  return (
    <div className="mt-8 pt-16 border-t border-ink/10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/50 mb-4">
            <span className="h-px w-8 bg-brand" />
            <span>Selected work</span>
          </div>
          <h3 className="font-display text-5xl md:text-6xl leading-[0.92] tracking-wide uppercase text-ink">
            Projects we&apos;ve shipped.
          </h3>
        </div>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-ink/10 border border-ink/10">
        {items.map((item) => {
          const card = (
            <div className="group h-full bg-surface flex flex-col hover:bg-secondary transition-colors">
              {item.image_url ? (
                <div className="aspect-[4/3] overflow-hidden bg-ink/5">
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
              ) : (
                <div className="aspect-[4/3] bg-brand/5 flex items-center justify-center font-display text-6xl text-brand/30">
                  {item.title[0]}
                </div>
              )}
              <div className="p-6 flex flex-col gap-3 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-display text-xl tracking-wide uppercase text-ink">{item.title}</h4>
                  {item.url && <ArrowUpRight className="size-4 text-ink/40 group-hover:text-brand transition shrink-0 mt-1" />}
                </div>
                {item.description && <p className="text-sm text-ink/60 line-clamp-3">{item.description}</p>}
                {item.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
                    {item.tags.slice(0, 4).map((t) => (
                      <span key={t} className="text-[10px] uppercase tracking-wider px-2 py-1 bg-ink/5 text-ink/60">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
          return item.url ? (
            <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="block">{card}</a>
          ) : (
            <div key={item.id}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}

function FaqItem({ q, a, defaultOpen = false }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="py-5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-6 text-left group"
      >
        <span className="text-base font-semibold uppercase tracking-wide text-ink group-hover:text-brand transition">{q}</span>
        <span className={`inline-flex size-7 shrink-0 items-center justify-center bg-brand/10 text-brand transition-transform ${open ? "rotate-45" : ""}`}>
          <Plus className="size-4" />
        </span>
      </button>
      {open && <p className="mt-4 text-ink/65 max-w-[68ch] leading-relaxed">{a}</p>}
    </div>
  );
}
