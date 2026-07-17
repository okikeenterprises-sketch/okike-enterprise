import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";

type PortfolioItem = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  url: string | null;
  tags: string[];
  position: number | null;
  published: boolean | null;
};

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — Software Projects by OKIKE Nigeria" },
      {
        name: "description",
        content:
          "Browse OKIKE's portfolio of shipped products — SaaS platforms, student portals, AI tools, dashboards and mobile apps built for startups, institutions and creators across Africa.",
      },
      { name: "robots", content: "index, follow" },
      { name: "keywords", content: "software portfolio Nigeria, web projects Africa, SaaS examples, student portal software, AI tools portfolio, OKIKE projects" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://okike-enterprise.com/portfolio" },
      { property: "og:title", content: "Portfolio — Software Projects by OKIKE Nigeria" },
      { property: "og:description", content: "Real systems with real impact — browse OKIKE's shipped products for startups, institutions and creators." },
      { property: "og:image", content: "https://okike-enterprise.com/background.png" },
      { property: "og:site_name", content: "OKIKE" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Portfolio — Software Projects by OKIKE Nigeria" },
      { name: "twitter:description", content: "Browse our shipped products — SaaS platforms, AI tools, student portals and more." },
      { name: "twitter:image", content: "https://okike-enterprise.com/background.png" },
    ],
    links: [
      { rel: "canonical", href: "https://okike-enterprise.com/portfolio" },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentCount, setStudentCount] = useState<string>("3,000+");
  const [orgCount, setOrgCount] = useState<string>("30+");
  const [projectCount, setProjectCount] = useState<string>("20+");
 
  useEffect(() => {
    supabase
      .from("portfolio_items")
      .select("id, title, description, image_url, url, tags, position, published")
      .eq("published", true)
      .order("position", { ascending: true })
      .then(({ data }) => {
        setItems((data ?? []) as unknown as PortfolioItem[]);
        setLoading(false);
      });
 
    // Query actual student headcount dynamically from bootcamp_registrations
    supabase
      .from("bootcamp_registrations" as any)
      .select("email", { count: "exact", head: true })
      .then(({ count, error }) => {
        if (!error && typeof count === "number") {
          // If we have registrations, display the exact live count, otherwise fallback to a default baseline.
          setStudentCount(count > 0 ? count.toLocaleString() : "3,000+");
        }
      });

    // Query actual organizations served dynamically from partners table
    supabase
      .from("partners")
      .select("id", { count: "exact", head: true })
      .eq("published", true)
      .then(({ count, error }) => {
        if (!error && typeof count === "number") {
          setOrgCount(count > 0 ? `${count}+` : "30+");
        }
      });

    // Query actual projects launched dynamically from portfolio_items table
    supabase
      .from("portfolio_items")
      .select("id", { count: "exact", head: true })
      .eq("published", true)
      .then(({ count, error }) => {
        if (!error && typeof count === "number") {
          setProjectCount(count > 0 ? `${count}+` : "20+");
        }
      });
  }, []);
 
  const stats = [
    { value: orgCount, label: "Organisations served" },
    { value: projectCount, label: "Projects launched" },
    { value: studentCount, label: "Students reached" },
    { value: "100%", label: "Client satisfaction" },
  ];

  return (
    <SiteLayout>
      {/* 1. HERO */}
      <section className="pt-20 md:pt-28 pb-0 px-6 border-b border-ink/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/50 mb-8">
            <span className="h-px w-8 bg-brand" />
            <span>Vol. 02 — Shipped Products</span>
          </div>

          <div className="max-w-3xl">
            <h1 className="font-display text-5xl md:text-8xl leading-[0.92] tracking-wide uppercase text-ink">
              Engineered <br />
              to perform.
            </h1>
            <p className="text-base md:text-lg text-ink/65 max-w-[46ch] leading-relaxed mt-6">
              From SaaS platforms to student portals — real systems with real impact for
              founders, creators and educational institutions.
            </p>
 
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/book"
                className="bg-brand text-brand-foreground py-3.5 pl-7 pr-5 inline-flex items-center gap-2 font-semibold text-sm uppercase tracking-widest hover:opacity-90 transition"
              >
                Start your project
                <ArrowUpRight className="size-4" />
              </Link>
              <Link
                to="/services"
                className="bg-transparent text-ink py-3.5 pl-7 pr-5 inline-flex items-center gap-2 font-semibold text-sm uppercase tracking-widest ring-1 ring-ink/20 hover:ring-ink/40 transition"
              >
                Our services
              </Link>
            </div>
          </div>

          {/* Stats bar */}
          <div className="relative mt-16 -mx-6 border-t border-ink/10 bg-surface/80 backdrop-blur overflow-hidden">
            <div className="flex divide-x divide-ink/10 overflow-x-auto scrollbar-none">
              {stats.map(({ value, label }) => (
                <div key={label} className="flex-shrink-0 px-8 py-5 flex flex-col gap-0.5 min-w-[160px]">
                  <span className="font-display text-3xl leading-none tracking-wide uppercase text-ink">{value}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/45">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. PORTFOLIO GRID */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/50 mb-4">
                <span className="h-px w-8 bg-brand" />
                <span>Selected work</span>
              </div>
              <h2 className="font-display text-5xl md:text-6xl leading-[0.92] tracking-wide uppercase text-ink">
                Projects we&apos;ve shipped.
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-ink/10 border border-ink/10">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-surface p-8 flex flex-col gap-5">
                  <div className="aspect-[4/3] bg-ink/5 animate-pulse" />
                  <div className="h-6 bg-ink/5 w-3/4 animate-pulse" />
                  <div className="h-4 bg-ink/5 w-1/2 animate-pulse" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="border border-ink/10 p-20 text-center">
              <p className="text-[11px] uppercase tracking-[0.2em] text-ink/50">Portfolio coming soon — check back later.</p>
            </div>
          ) : (
            <PortfolioGrid items={items} />
          )}
        </div>
      </section>

      {/* 3. FINAL CTA */}
      <section className="py-24 md:py-32 px-6 border-t border-ink/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/50 mb-8">
            <span className="h-px w-8 bg-brand" />
            <span>Next Steps</span>
          </div>
          <h2 className="font-display text-[clamp(2.5rem,7vw,6rem)] leading-[0.92] tracking-wide uppercase text-ink mb-8 max-w-3xl">
            Let&apos;s add{" "}
            <span className="text-brand">your project</span> next.
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
              Start a project
            </Link>
            <Link
              to="/contact"
              className="bg-transparent text-ink py-3.5 pl-7 pr-5 inline-flex items-center gap-2 font-semibold text-sm uppercase tracking-widest ring-1 ring-ink/20 hover:ring-ink/40 transition"
            >
              Get in touch
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function PortfolioGrid({ items }: { items: PortfolioItem[] }) {
  return (
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
                <h3 className="font-display text-xl tracking-wide uppercase text-ink">{item.title}</h3>
                {item.url && <ArrowUpRight className="size-4 text-ink/40 group-hover:text-brand transition shrink-0 mt-1" />}
              </div>
              {item.description && <p className="text-sm text-ink/60 line-clamp-3">{item.description}</p>}
              {item.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
                  {item.tags.slice(0, 4).map((t) => (
                    <span key={t} className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-ink/5 text-ink/60">{t}</span>
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
  );
}


