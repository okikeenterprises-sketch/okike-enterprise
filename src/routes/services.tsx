import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Bot,
  Code2,
  Smartphone,
  Palette,
  GraduationCap,
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
      { title: "Services — OKIKE" },
      {
        name: "description",
        content:
          "OKIKE designs and builds scalable platforms, AI tools, mobile apps and student-focused digital systems for startups, creators and organizations.",
      },
      { property: "og:title", content: "Services — OKIKE" },
      {
        property: "og:description",
        content:
          "Scalable platforms, AI tools, mobile apps and modern digital experiences — engineered by OKIKE.",
      },
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
      <section className="relative overflow-hidden border-b border-ink/5">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-40 size-[700px] rounded-full bg-brand/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-32 size-[500px] rounded-full bg-brand/5 blur-3xl"
        />

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24 grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-10 items-center">
          <div className="flex flex-col gap-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-ink/10 bg-surface/60 backdrop-blur px-4 py-2 text-xs font-medium tracking-wide text-ink/80">
              <Sparkles className="size-3.5 text-brand" />
              Our Services
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.02] text-ink text-balance">
              Building digital systems for{" "}
              <span className="text-brand italic font-medium">modern businesses.</span>
            </h1>

            <p className="text-lg text-ink/65 max-w-[54ch] text-pretty">
              We design and develop scalable platforms, AI-powered tools and modern digital
              experiences for startups, creators and organizations — built with the rigor of a
              studio and the speed of a startup.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/book"
                className="group bg-brand text-brand-foreground py-3.5 pl-6 pr-5 inline-flex items-center gap-2 rounded-full font-medium shadow-sm hover:opacity-90 transition"
              >
                Start a project
                <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#work"
                className="group bg-ink/[0.04] text-ink py-3.5 pl-6 pr-5 inline-flex items-center gap-2 rounded-full font-medium ring-1 ring-ink/10 hover:bg-ink/[0.07] transition"
              >
                View our work
                <ArrowUpRight className="size-4" />
              </a>
            </div>
          </div>

          <div className="relative">
            <div
              aria-hidden
              className="absolute inset-0 -m-6 rounded-[2rem] bg-gradient-to-br from-brand/15 via-brand/5 to-transparent blur-2xl"
            />
            <div className="relative rounded-2xl overflow-hidden ring-1 ring-ink/10 shadow-[0_30px_80px_-30px_rgba(146,64,14,0.35)] bg-card">
              <img
                src={heroDashboard}
                alt="OKIKE product dashboard preview"
                width={1536}
                height={1152}
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 hidden md:block rounded-xl bg-surface ring-1 ring-ink/10 px-4 py-3 shadow-lg">
              <div className="text-[10px] uppercase tracking-widest text-ink/40">In production</div>
              <div className="text-sm font-semibold text-ink">Platforms used by 300+ people</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CORE SERVICES GRID */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center gap-4 mb-16">
            <div className="text-xs font-semibold tracking-widest uppercase text-brand">
              What we do
            </div>
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight max-w-[22ch] text-balance">
              Our core services.
            </h2>
            <p className="text-ink/60 max-w-[52ch] text-pretty">
              End-to-end digital solutions tailored to your goals — from a single landing page to a
              full AI-powered platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreServices.map(({ icon: Icon, title, blurb, bullets }) => (
              <div
                key={title}
                className="group p-8 bg-card rounded-2xl ring-1 ring-ink/5 flex flex-col gap-5 hover:ring-brand/30 hover:-translate-y-1 transition-all"
              >
                <div className="inline-flex size-11 items-center justify-center rounded-lg bg-brand/10 text-brand ring-1 ring-brand/15">
                  <Icon className="size-5" />
                </div>
                <h3 className="text-xl font-medium leading-snug">{title}</h3>
                <p className="text-sm text-ink/60">{blurb}</p>
                <ul className="space-y-2 text-sm text-ink/80 mt-auto">
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
      <section className="py-24 bg-secondary border-y border-ink/5 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-[42ch] mb-16">
            <div className="text-xs font-semibold tracking-widest uppercase text-brand mb-4">
              Our process
            </div>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight">
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
              <div className="text-xs font-semibold tracking-widest uppercase text-brand mb-3">
                Featured results
              </div>
              <h2 className="text-3xl md:text-4xl font-medium tracking-tight max-w-[24ch] text-balance">
                Real systems. Real impact.
              </h2>
            </div>
            <p className="text-ink/60 max-w-[40ch]">
              A few outcomes from products we&apos;ve shipped for students, founders and
              organizations.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {results.map((r) => (
              <div
                key={r.label}
                className="p-8 bg-card rounded-2xl ring-1 ring-ink/5 flex flex-col gap-4"
              >
                <div className="text-xs uppercase tracking-widest text-ink/40">{r.tag}</div>
                <div className="text-5xl font-medium text-brand">{r.metric}</div>
                <div className="text-sm text-ink/70">{r.label}</div>
              </div>
            ))}
          </div>

          <PortfolioGrid />
        </div>
      </section>

      {/* 5. TECH STACK */}
      <section className="py-24 bg-contrast text-contrast-foreground px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-10">
          <div className="flex flex-col gap-4 items-center">
            <div className="text-xs font-semibold tracking-widest uppercase text-brand">
              Technology we use
            </div>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight max-w-[28ch] text-balance">
              Built on the stack the best teams ship on.
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {stack.map((s) => (
              <span
                key={s}
                className="px-5 py-2.5 rounded-full bg-contrast-foreground/5 ring-1 ring-contrast-foreground/10 text-sm font-medium text-contrast-foreground/90 hover:bg-contrast-foreground/10 transition"
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
            <div className="text-xs font-semibold tracking-widest uppercase text-brand mb-4">
              Who we help
            </div>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight">
              Built for the people building what&apos;s next.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {industries.map((i) => (
              <div
                key={i.t}
                className="p-6 rounded-2xl ring-1 ring-ink/5 bg-card hover:ring-brand/30 transition"
              >
                <div className="text-lg font-medium mb-1">{i.t}</div>
                <div className="text-sm text-ink/60">{i.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. ENGAGEMENT MODEL */}
      <section className="py-24 bg-secondary border-y border-ink/5 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-[42ch] mb-16">
            <div className="text-xs font-semibold tracking-widest uppercase text-brand mb-4">
              How we engage
            </div>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight">
              Flexible engagement models.
            </h2>
            <p className="text-ink/60 mt-4">
              Pick the partnership that fits your stage. We&apos;ll send a detailed quote within 24
              hours of your inquiry.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {engagement.map((e) => (
              <div key={e.t} className="p-6 rounded-2xl bg-card ring-1 ring-ink/5">
                <div className="text-base font-medium mb-2">{e.t}</div>
                <div className="text-sm text-ink/60">{e.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FAQ */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs font-semibold tracking-widest uppercase text-brand mb-3">
              Frequently asked
            </div>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight">
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
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-8">
          <h2 className="text-4xl md:text-6xl font-medium tracking-tight text-balance">
            Let&apos;s build something{" "}
            <span className="text-brand italic font-medium">meaningful</span>.
          </h2>
          <p className="text-ink/60 max-w-[48ch] text-pretty">
            Have a project in mind? Tell us what you&apos;re building — we&apos;ll respond within 24
            hours with next steps and a quote.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/book"
              className="bg-brand text-brand-foreground py-3 px-6 rounded-full font-medium hover:opacity-90 transition"
            >
              Book a call
            </Link>
            <Link
              to="/book"
              className="bg-ink text-surface py-3 px-6 rounded-full font-medium hover:bg-ink/90 transition"
            >
              Start a project
            </Link>
            <Link
              to="/contact"
              className="bg-ink/5 text-ink py-3 px-6 rounded-full font-medium ring-1 ring-ink/10 hover:bg-ink/10 transition"
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
    <div className="mt-8 pt-16 border-t border-ink/5">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="text-xs font-semibold tracking-widest uppercase text-brand mb-3">
            Selected work
          </div>
          <h3 className="text-3xl md:text-4xl font-medium tracking-tight max-w-[24ch] text-balance">
            Projects we&apos;ve shipped.
          </h3>
        </div>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => {
          const card = (
            <div className="group h-full bg-card rounded-2xl ring-1 ring-ink/5 overflow-hidden flex flex-col hover:ring-brand/30 hover:-translate-y-1 transition-all">
              {item.image_url ? (
                <div className="aspect-[4/3] overflow-hidden bg-ink/5">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="aspect-[4/3] bg-gradient-to-br from-brand/10 to-brand/5 flex items-center justify-center text-brand/40 text-4xl font-semibold">
                  {item.title[0]}
                </div>
              )}
              <div className="p-6 flex flex-col gap-3 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-lg font-medium leading-snug">{item.title}</h4>
                  {item.url && (
                    <ArrowUpRight className="size-4 text-ink/40 group-hover:text-brand transition shrink-0 mt-1" />
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-ink/60 line-clamp-3">{item.description}</p>
                )}
                {item.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
                    {item.tags.slice(0, 4).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-ink/5 text-ink/60"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
          return item.url ? (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              {card}
            </a>
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
        <span className="text-lg font-medium text-ink group-hover:text-brand transition">{q}</span>
        <span
          className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand transition-transform ${open ? "rotate-45" : ""}`}
        >
          <Plus className="size-4" />
        </span>
      </button>
      {open && <p className="mt-4 text-ink/65 text-pretty max-w-[68ch]">{a}</p>}
    </div>
  );
}
