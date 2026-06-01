import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Sparkles } from "lucide-react";
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
  position: number | null;
  published: boolean | null;
};

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — OKIKE" },
      {
        name: "description",
        content:
          "Explore OKIKE's portfolio of products, platforms and AI tools built for startups, creators and organizations.",
      },
      { property: "og:title", content: "Portfolio — OKIKE" },
      {
        property: "og:description",
        content: "Browse our work — real systems with real impact.",
      },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, []);

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
              Our Work
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.02] text-ink text-balance">
              Real products. Real impact.{" "}
              <span className="text-brand italic font-medium">Built with care.</span>
            </h1>

            <p className="text-lg text-ink/65 max-w-[54ch] text-pretty">
              A curated selection of the platforms, AI tools, mobile apps and digital
              experiences we&apos;ve built for ambitious teams across Africa and beyond.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/book"
                className="group bg-brand text-brand-foreground py-3.5 pl-6 pr-5 inline-flex items-center gap-2 rounded-full font-medium shadow-sm hover:opacity-90 transition"
              >
                Build something with us
                <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
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
                alt="OKIKE product portfolio"
                width={1536}
                height={1152}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. PORTFOLIO GRID */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="text-xs font-semibold tracking-widest uppercase text-brand mb-3">
                Selected work
              </div>
              <h2 className="text-3xl md:text-4xl font-medium tracking-tight max-w-[24ch] text-balance">
                Projects we&apos;ve shipped.
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map((i) => (
                <div key={i} className="bg-card rounded-2xl ring-1 ring-ink/5 p-8 flex flex-col gap-5">
                  <div className="aspect-[4/3] bg-ink/5 rounded-xl animate-pulse" />
                  <div className="h-6 bg-ink/5 rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-ink/5 rounded w-1/2 animate-pulse" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-2xl ring-1 ring-ink/5">
              <p className="text-ink/60">
                Portfolio coming soon! Check back later for our latest work.
              </p>
            </div>
          ) : (
            <PortfolioGrid items={items} />
          )}
        </div>
      </section>

      {/* 3. FINAL CTA */}
      <section className="py-24 md:py-32 px-6 bg-secondary border-y border-ink/5">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-8">
          <h2 className="text-4xl md:text-6xl font-medium tracking-tight text-balance">
            Let&apos;s add{" "}
            <span className="text-brand italic font-medium">your project</span> next.
          </h2>
          <p className="text-ink/60 max-w-[48ch] text-pretty">
            Have a project in mind? Tell us what you&apos;re building — we&apos;ll respond
            within 24 hours with next steps and a quote.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/book"
              className="bg-brand text-brand-foreground py-3 px-6 rounded-full font-medium hover:opacity-90 transition"
            >
              Start a project
            </Link>
            <Link
              to="/contact"
              className="bg-ink text-surface py-3 px-6 rounded-full font-medium hover:bg-ink/90 transition"
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
                <h3 className="text-xl font-medium leading-snug">{item.title}</h3>
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
  );
}
