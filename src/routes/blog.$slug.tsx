import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Calendar, User, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PublicBlogPost } from "@/lib/public-content";

export const Route = createFileRoute("/blog/$slug")({
  head: () => ({
    meta: [
      { title: "Blog Post — OKIKE" },
      { name: "description", content: "Insights, tutorials, and stories from OKIKE." },
    ],
  }),
  component: BlogPostPage,
  loader: async ({ params }) => {
    const { data: bySlug } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", params.slug)
      .eq("published", true)
      .single();
    if (bySlug) return bySlug as unknown as PublicBlogPost;

    const { data: byId } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", params.slug)
      .eq("published", true)
      .single();
    return byId as unknown as PublicBlogPost;
  },
});

function BlogPostPage() {
  const post = Route.useLoaderData() as PublicBlogPost | null;
  const [loading, setLoading] = useState(true);

  useEffect(() => { setLoading(false); }, [post]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 animate-pulse">
        <div className="h-8 bg-ink/5 w-3/4 mb-4" />
        <div className="h-4 bg-ink/5 w-1/2 mb-12" />
        <div className="aspect-video bg-ink/5 mb-12" />
        <div className="space-y-4">
          <div className="h-4 bg-ink/5 w-full" />
          <div className="h-4 bg-ink/5 w-full" />
          <div className="h-4 bg-ink/5 w-3/4" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h1 className="font-display text-6xl tracking-wide uppercase text-ink mb-4">Post not found</h1>
        <p className="text-ink/60 mb-8">The blog post you're looking for doesn't exist or has been removed.</p>
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 bg-brand text-brand-foreground py-3.5 pl-7 pr-5 font-semibold text-sm uppercase tracking-widest hover:opacity-90 transition"
        >
          <ArrowLeft className="size-4" /> Back to all posts
        </Link>
      </div>
    );
  }

  return (
    <article className="py-24 px-6">
      <div className="max-w-4xl mx-auto">

        <Link to="/blog" className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/50 hover:text-brand mb-10 transition">
          <ArrowLeft className="size-3.5" /> Back to all posts
        </Link>

        <header className="mb-12 border-b border-ink/10 pb-12">
          <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.2em] text-ink/40 font-semibold mb-6">
            {post.created_at && (
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3" />
                {new Date(post.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            )}
            {post.author && (
              <span className="flex items-center gap-1.5">
                <User className="size-3" />
                {post.author}
              </span>
            )}
          </div>
          <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-[0.92] tracking-wide uppercase text-ink mb-6">{post.title}</h1>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag: string) => (
                <span key={tag} className="flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 bg-ink/5 text-ink/60">
                  <Tag className="size-3" />{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {post.image_url && (
          <div className="mb-12 bg-ink/5 rounded-lg overflow-hidden">
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full max-h-[600px] object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        )}

        <div className="prose prose-lg max-w-none">
          {post.content ? (
            <div className="whitespace-pre-wrap text-ink/80 text-lg leading-relaxed">{post.content}</div>
          ) : (
            <p className="text-ink/60">Full content coming soon. Check back later.</p>
          )}
        </div>

      </div>
    </article>
  );
}
