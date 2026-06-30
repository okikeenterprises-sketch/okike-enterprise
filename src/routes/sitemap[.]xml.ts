import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BASE_URL = "https://okike-enterprise.com";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
  lastmod?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/services", changefreq: "monthly", priority: "0.9" },
          { path: "/learn", changefreq: "monthly", priority: "0.9" },
          { path: "/portfolio", changefreq: "monthly", priority: "0.8" },
          { path: "/blog", changefreq: "weekly", priority: "0.8" },
          { path: "/about", changefreq: "monthly", priority: "0.7" },
          { path: "/book", changefreq: "monthly", priority: "0.8" },
          { path: "/enroll", changefreq: "monthly", priority: "0.8" },
          { path: "/contact", changefreq: "monthly", priority: "0.6" },
        ];

        try {
          const { data: posts } = await supabaseAdmin
            .from("blog_posts")
            .select("slug, updated_at")
            .eq("published", true)
            .order("created_at", { ascending: false });

          if (posts) {
            for (const post of posts) {
              if (post.slug) {
                entries.push({
                  path: `/blog/${post.slug}`,
                  changefreq: "weekly",
                  priority: "0.7",
                  lastmod: post.updated_at ? new Date(post.updated_at).toISOString().split("T")[0] : undefined,
                });
              }
            }
          }
        } catch (error) {
          console.error("Error fetching blog posts for sitemap:", error);
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
