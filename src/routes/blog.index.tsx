import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Sparkles, Calendar, User, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { getBlogPosts } from "@/lib/public-content";
import type { PublicBlogPost } from "@/lib/public-content";

export const Route = createFileRoute("/blog/")({
  component: BlogIndexPage,
  loader: async () => {
    return await getBlogPosts();
  },
});

function BlogIndexPage() {
  const posts = Route.useLoaderData();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, [posts]);

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
      <section className="relative overflow-hidden border-b border-ink/5">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-40 size-[700px] rounded-full bg-brand/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-32 size-[500px] rounded-full bg-brand/5 blur-3xl"
        />

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24">
          <div className="flex flex-col items-center text-center gap-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-ink/10 bg-surface/60 backdrop-blur px-4 py-2 text-xs font-medium tracking-wide text-ink/80">
              <Sparkles className="size-3.5 text-brand" />
              Our Blog
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.02] text-ink text-balance">
              Stories & Insights
            </h1>

            <p className="text-lg text-ink/65 max-w-[60ch] text-pretty">
              News, insights, and behind the scenes from OKIKE.
            </p>
          </div>
        </div>
      </section>

      {/* 2. BLOG GRID */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-card rounded-2xl ring-1 ring-ink/5 p-8 flex flex-col gap-5"
                >
                  <div className="aspect-[4/3] bg-ink/5 rounded-xl animate-pulse" />
                  <div className="h-6 bg-ink/5 rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-ink/5 rounded w-1/2 animate-pulse" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-2xl ring-1 ring-ink/5">
              <p className="text-ink/60">Blog coming soon! Check back later.</p>
            </div>
          ) : (
            <BlogGrid posts={posts} formatDate={formatDate} />
          )}
        </div>
      </section>

      {/* 3. FINAL CTA */}
      <section className="py-24 md:py-32 px-6 bg-secondary border-y border-ink/5">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-8">
          <h2 className="text-4xl md:text-6xl font-medium tracking-tight text-balance">
            Have an idea for a post?
          </h2>
          <p className="text-ink/60 max-w-[48ch] text-pretty">
            We'd love to hear from you! Reach out to collaborate.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/contact"
              className="bg-brand text-brand-foreground py-3 px-6 rounded-full font-medium hover:opacity-90 transition"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function BlogGrid({
  posts,
  formatDate,
}: {
  posts: PublicBlogPost[];
  formatDate: (date: string | null) => string;
}) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => {
        const slug = post.slug || post.id;
        return (
          <Link
            key={post.id}
            to="/blog/$slug"
            params={{ slug }}
            className="group h-full bg-card rounded-2xl ring-1 ring-ink/5 overflow-hidden flex flex-col hover:ring-brand/30 hover:-translate-y-1 transition-all"
          >
            {post.image_url ? (
              <div className="aspect-[4/3] overflow-hidden bg-ink/5">
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="aspect-[4/3] bg-gradient-to-br from-brand/10 to-brand/5 flex items-center justify-center text-brand/40 text-4xl font-semibold">
                {post.title[0]}
              </div>
            )}
            <div className="p-6 flex flex-col gap-4 flex-1">
              <div className="flex items-center gap-4 text-xs text-ink/50">
                {post.created_at && (
                  <div className="flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    {formatDate(post.created_at)}
                  </div>
                )}
                {post.author && (
                  <div className="flex items-center gap-1">
                    <User className="size-3.5" />
                    {post.author}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <h3 className="text-xl font-medium leading-snug">{post.title}</h3>
                {post.excerpt && <p className="text-sm text-ink/60 line-clamp-3">{post.excerpt}</p>}
              </div>
              {post.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-ink/5 text-ink/60"
                    >
                      <Tag className="size-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="pt-2 mt-auto">
                <div className="inline-flex items-center gap-1 text-sm text-brand font-medium group-hover:gap-2 transition-all">
                  Read post
                  <ArrowUpRight className="size-4" />
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
