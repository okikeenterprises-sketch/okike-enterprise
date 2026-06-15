import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { publishAIBlogPostCore } from "@/lib/admin.functions";

export const Route = createFileRoute("/api/cron/publish-blog")({
    server: {
        handlers: {
            GET: async ({ request }: { request: Request }) => {
                // Validate the cron secret header
                // Vercel sends: Authorization: Bearer <CRON_SECRET>
                // Fallback: x-cron-secret header (for manual triggers)
                const authHeader = request.headers.get("authorization");
                const xCronSecret = request.headers.get("x-cron-secret");
                const expected = process.env.CRON_SECRET;

                const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
                const isAuthorized = expected && (bearerToken === expected || xCronSecret === expected);

                if (!isAuthorized) {
                    return new Response(JSON.stringify({ error: "Unauthorized" }), {
                        status: 401,
                        headers: { "Content-Type": "application/json" },
                    });
                }

                // Create a Supabase service-role client (bypasses RLS)
                const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
                const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

                if (!supabaseUrl || !serviceRoleKey) {
                    console.error("[cron/publish-blog] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
                    return new Response(JSON.stringify({ error: "Server configuration error" }), {
                        status: 500,
                        headers: { "Content-Type": "application/json" },
                    });
                }

                const supabase = createClient(supabaseUrl, serviceRoleKey);

                // Run the blog publisher
                try {
                    const result = await publishAIBlogPostCore(supabase);
                    if (result.ok) {
                        console.log(`[cron/publish-blog] Published: "${result.title}" (${result.slug})`);
                        return new Response(
                            JSON.stringify({ ok: true, title: result.title, slug: result.slug }),
                            { status: 200, headers: { "Content-Type": "application/json" } },
                        );
                    } else {
                        console.error(`[cron/publish-blog] Failed: ${result.error}`);
                        return new Response(JSON.stringify({ ok: false, error: result.error }), {
                            status: 500,
                            headers: { "Content-Type": "application/json" },
                        });
                    }
                } catch (e: unknown) {
                    const msg = e instanceof Error ? e.message : "Unknown error";
                    console.error(`[cron/publish-blog] Exception: ${msg}`);
                    return new Response(JSON.stringify({ ok: false, error: msg }), {
                        status: 500,
                        headers: { "Content-Type": "application/json" },
                    });
                }
            },
        },
    },
});
