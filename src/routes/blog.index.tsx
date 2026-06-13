import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Calendar, User, Tag, MapPin, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { getBlogPosts } from "@/lib/public-content";
import { supabase } from "@/integrations/supabase/client";
import type { PublicBlogPost } from "@/lib/public-content";

type Event = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  date: string | null;
  end_date: string | null;
  location: string | null;
  venue: string | null;
  event_type: string | null;
  tags: string[];
  registration_url: string | null;
  is_free: boolean;
  price: number | null;
  spots_available: number | null;
};

export const Route = createFileRoute("/blog/")({
  component: BlogIndexPage,
  loader: async () => {
    return await getBlogPosts();
  },
  head: () => ({
    meta: [
      { title: "Blog & Events — OKIKE Journal" },
      { name: "description", content: "Insights, tutorials, news and events from OKIKE — Nigerian software studio and tech academy. Stay up to date with our latest work, thinking and upcoming events." },
      { name: "robots", content: "index, follow" },
      { name: "keywords", content: "OKIKE blog, tech blog Nigeria, software development articles, coding tutorials Africa, OKIKE events" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://okike-enterprise.lovable.app/blog" },
      { property: "og:title", content: "Blog & Events — OKIKE Journal" },
      { property: "og:description", content: "News, insights and events from OKIKE — Nigerian software studio and tech academy." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/261c5493-35d0-4cb5-851d-5b09f89d86ba/id-preview-9589f573--e22e363f-f41b-4927-9ac6-0599fdc05dff.lovable.app-1778630917399.png" },
      { property: "og:site_name", content: "OKIKE" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Blog & Events — OKIKE Journal" },
      { name: "twitter:description", content: "News, insights and events from OKIKE." },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/261c5493-35d0-4cb5-851d-5b09f89d86ba/id-preview-9589f573--e22e363f-f41b-4927-9ac6-0599fdc05dff.lovable.app-1778630917399.png" },
    ],
    links: [
      { rel: "canonical", href: "https://okike-enterprise.lovable.app/blog" },
    ],
  }),
});

function BlogIndexPage() {
  const posts = Route.useLoaderData();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, [posts]);

  useEffect(() => {
    supabase
      .from("events" as never)
      .select("id, title, description, image_url, date, end_date, location, venue, event_type, tags, registration_url, is_free, price, spots_available")
      .eq("published" as never, true)
      .order("date" as never, { ascending: true })
      .then(({ data }: { data: Event[] | null }) => {
        setEvents((data ?? []) as Event[]);
        setEventsLoading(false);
      });
  }, []);

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "Recent";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <>
      {/* 1. HERO */}
      <section className="relative overflow-hidden border-b border-ink/10">
        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-0 md:pt-28 min-h-[56vh] flex flex-col justify-between">
          <div className="flex flex-col gap-6 max-w-3xl">
            <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/50">
              <span className="h-px w-8 bg-brand" />
              <span>The Journal</span>
            </div>

            <h1 className="font-display text-[clamp(3.5rem,9vw,7.5rem)] leading-[0.92] tracking-wide uppercase text-ink">
              Stories &{" "}
              <span className="text-brand">Insights</span>
            </h1>

            <p className="text-base md:text-lg text-ink/65 max-w-[46ch] leading-relaxed">
              News, insights, and behind the scenes from OKIKE.
            </p>
          </div>

          <div className="h-12" />
        </div>
      </section>

      {/* 2. BLOG GRID */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
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
          ) : posts.length === 0 ? (
            <div className="border border-ink/10 p-20 text-center">
              <p className="text-[11px] uppercase tracking-[0.2em] text-ink/50">Blog coming soon — check back later.</p>
            </div>
          ) : (
            <BlogGrid posts={posts} formatDate={formatDate} />
          )}
        </div>
      </section>

      {/* 3. EVENTS */}
      <section className="py-24 md:py-32 px-6 bg-secondary border-y border-ink/10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/50 mb-6">
              <span className="h-px w-8 bg-brand" />
              <span>Events</span>
            </div>
            <h2 className="font-display text-5xl md:text-6xl leading-[0.92] tracking-wide uppercase text-ink">
              Hosted by <span className="text-brand">OKIKE.</span>
            </h2>
            <p className="text-ink/60 mt-4 max-w-[44ch]">
              Workshops, talks, bootcamps and community events — in-person and online.
            </p>
          </div>

          {eventsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-ink/10 border border-ink/10">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-surface p-8 flex flex-col gap-4">
                  <div className="aspect-video bg-ink/5 animate-pulse" />
                  <div className="h-5 bg-ink/5 w-3/4 animate-pulse" />
                  <div className="h-4 bg-ink/5 w-1/2 animate-pulse" />
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="border border-ink/10 p-20 text-center">
              <p className="text-[11px] uppercase tracking-[0.2em] text-ink/50">
                No upcoming events — check back soon.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-ink/10 border border-ink/10">
              {events.map((event) => {
                const dateObj = event.date ? new Date(event.date) : null;
                const isPast = dateObj ? dateObj < new Date() : false;
                const card = (
                  <div className={`group bg-surface flex flex-col hover:bg-card transition-colors h-full ${isPast ? "opacity-60" : ""}`}>
                    {event.image_url ? (
                      <div className="aspect-video overflow-hidden bg-ink/5">
                        <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      </div>
                    ) : (
                      <div className="aspect-video bg-brand/5 flex items-center justify-center font-display text-5xl text-brand/30">
                        {event.title[0]}
                      </div>
                    )}
                    <div className="p-6 flex flex-col gap-3 flex-1">
                      {/* Type badge */}
                      {event.event_type && (
                        <div className="text-[10px] uppercase tracking-[0.2em] text-brand font-semibold">
                          {isPast ? "Past — " : ""}{event.event_type}
                        </div>
                      )}

                      <h3 className="font-display text-xl tracking-wide uppercase text-ink leading-tight">
                        {event.title}
                      </h3>

                      {event.description && (
                        <p className="text-sm text-ink/60 line-clamp-2">{event.description}</p>
                      )}

                      <div className="flex flex-col gap-1.5 mt-auto pt-3 border-t border-ink/5">
                        {dateObj && (
                          <div className="flex items-center gap-2 text-xs text-ink/55">
                            <Calendar className="size-3 shrink-0" />
                            <span>
                              {dateObj.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                              {event.end_date && ` — ${new Date(event.end_date).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`}
                            </span>
                          </div>
                        )}
                        {(event.venue || event.location) && (
                          <div className="flex items-center gap-2 text-xs text-ink/55">
                            <MapPin className="size-3 shrink-0" />
                            <span>{[event.venue, event.location].filter(Boolean).join(", ")}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-ink/60">
                          {event.is_free ? "Free" : event.price ? `₦${event.price.toLocaleString()}` : ""}
                          {event.spots_available != null && !isPast && ` · ${event.spots_available} spots left`}
                        </span>
                        {event.registration_url && !isPast && (
                          <div className="inline-flex items-center gap-1 text-brand font-semibold text-xs uppercase tracking-widest group-hover:gap-2 transition-all">
                            Register <ExternalLink className="size-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
                return event.registration_url && !isPast ? (
                  <a key={event.id} href={event.registration_url} target="_blank" rel="noopener noreferrer" className="block">
                    {card}
                  </a>
                ) : (
                  <div key={event.id}>{card}</div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 4. FINAL CTA */}
      <section className="py-24 md:py-32 px-6 border-t border-ink/10">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-[clamp(2.5rem,7vw,6rem)] leading-[0.92] tracking-wide uppercase text-ink mb-8 max-w-2xl">
            Have an idea for a{" "}
            <span className="text-brand">post?</span>
          </h2>
          <p className="text-ink/60 max-w-[40ch] text-pretty mb-10">
            We'd love to hear from you. Reach out to collaborate.
          </p>
          <Link
            to="/contact"
            className="bg-brand text-brand-foreground py-3.5 pl-7 pr-5 inline-flex items-center gap-2 font-semibold text-sm uppercase tracking-widest hover:opacity-90 transition"
          >
            Get in touch
          </Link>
        </div>
      </section>
    </>
  );
}

function BlogGrid({ posts, formatDate }: { posts: PublicBlogPost[]; formatDate: (date: string | null) => string }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-ink/10 border border-ink/10">
      {posts.map((post) => {
        const slug = post.slug || post.id;
        return (
          <Link
            key={post.id}
            to="/blog/$slug"
            params={{ slug }}
            className="group bg-surface flex flex-col hover:bg-secondary transition-colors"
          >
            {post.image_url ? (
              <div className="aspect-[4/3] overflow-hidden bg-ink/5">
                <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              </div>
            ) : (
              <div className="aspect-[4/3] bg-brand/5 flex items-center justify-center font-display text-6xl text-brand/30">
                {post.title[0]}
              </div>
            )}
            <div className="p-6 flex flex-col gap-4 flex-1">
              <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.15em] text-ink/40 font-semibold">
                {post.created_at && <span className="flex items-center gap-1"><Calendar className="size-3" />{formatDate(post.created_at)}</span>}
                {post.author && <span className="flex items-center gap-1"><User className="size-3" />{post.author}</span>}
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <h3 className="font-display text-xl tracking-wide uppercase text-ink leading-tight">{post.title}</h3>
                {post.excerpt && <p className="text-sm text-ink/60 line-clamp-3">{post.excerpt}</p>}
              </div>
              {post.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 bg-ink/5 text-ink/55">
                      <Tag className="size-3" />{tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="pt-2 mt-auto">
                <div className="inline-flex items-center gap-1 text-brand font-semibold text-xs uppercase tracking-widest group-hover:gap-2 transition-all">
                  Read post <ArrowUpRight className="size-3" />
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
