import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type AuthedSupabase = SupabaseClient<Database>;
type DynamicMutationBuilder = {
  upsert(row: Record<string, unknown>): Promise<{ error: { message: string } | null }>;
  delete(): {
    eq(column: string, value: string): Promise<{ error: { message: string } | null }>;
  };
};
type DynamicSupabase = {
  from(table: string): DynamicMutationBuilder;
};

async function ensureAdmin(supabase: AuthedSupabase, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin only");
}

// ---- Inquiries ----

export const setInquiryStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["new", "reviewing", "accepted", "declined"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("project_inquiries")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const convertInquiryToProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        inquiryId: z.string().uuid(),
        title: z.string().min(1).max(200),
        package_name: z.string().max(120).optional(),
        total: z.number().optional(),
        deposit: z.number().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { data: inq, error: inqErr } = await context.supabase
      .from("project_inquiries")
      .select("*")
      .eq("id", data.inquiryId)
      .single();
    if (inqErr || !inq) throw new Error("Inquiry not found");

    const { data: project, error } = await context.supabase
      .from("client_projects")
      .insert({
        client_user_id: inq.client_user_id,
        client_email: inq.email,
        inquiry_id: inq.id,
        title: data.title,
        package_name: data.package_name ?? inq.project_type,
        total: data.total ?? null,
        deposit: data.deposit ?? null,
        stage: "accepted",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    await context.supabase
      .from("project_inquiries")
      .update({ status: "accepted" })
      .eq("id", inq.id);

    return { ok: true, projectId: project.id };
  });

// ---- Projects ----

export const updateProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        stage: z
          .enum(["submitted", "reviewing", "accepted", "declined", "in_progress", "completed"])
          .optional(),
        admin_notes: z.string().max(4000).nullable().optional(),
        title: z.string().max(200).optional(),
        total: z.number().nullable().optional(),
        deposit: z.number().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("client_projects").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateMilestone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "active", "done"]).optional(),
        note: z.string().max(2000).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("project_milestones").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const postProjectUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ project_id: z.string().uuid(), message: z.string().min(1).max(4000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("project_updates").insert({
      project_id: data.project_id,
      message: data.message,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Generic CMS upsert/delete ----

const ALLOWED_TABLES = [
  "services",
  "packages",
  "addons",
  "portfolio_items",
  "partners",
  "team_members",
  "site_settings",
  "blog_posts",
  "courses",
  "tracks",
  "physical_classes",
  "events",
] as const;

type CmsTable = (typeof ALLOWED_TABLES)[number];

export const cmsUpsert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        table: z.enum(ALLOWED_TABLES),
        row: z.record(z.string(), z.unknown()),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const tableClient = context.supabase as unknown as DynamicSupabase;
    const { error } = await tableClient.from(data.table).upsert(data.row);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const cmsDelete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ table: z.enum(ALLOWED_TABLES), id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const col = data.table === "site_settings" ? "key" : "id";
    const tableClient = context.supabase as unknown as DynamicSupabase;
    const { error } = await tableClient
      .from(data.table as CmsTable)
      .delete()
      .eq(col, data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ userId: z.string(), role: z.enum(["admin", "client"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { error: deleteError } = await context.supabase
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId);
    if (deleteError) throw new Error(deleteError.message);
    const { error: insertError } = await context.supabase
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    if (insertError) throw new Error(insertError.message);
    return { ok: true };
  });

export const updateUserProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        profileId: z.string(),
        updates: z.object({
          full_name: z.string().optional(),
          email: z.string().optional(),
        }),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("profiles")
      .update(data.updates)
      .eq("id", data.profileId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Autonomous AI Blog Publisher ----

export type PublishAIBlogPostResult =
  | { ok: true; title: string; slug: string }
  | { ok: false; error: string };

export async function publishAIBlogPostCore(
  supabase: SupabaseClient,
): Promise<PublishAIBlogPostResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "AI is not configured." };
  }

  // Wrap the two OpenRouter calls in a 60-second timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);

  let title: string;
  let excerpt: string;
  let content: string;
  let tags: string[];

  try {
    // Step 1: Select a tech topic
    const topicRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://okike.ai",
        "X-Title": "OKIKE AI Blog Publisher",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You select interesting tech topics. Return only the topic as a short phrase, no other text.",
          },
          {
            role: "user",
            content:
              "Select one relevant tech topic for a blog post focused on software, AI, or the Nigerian tech ecosystem. Return only the topic as a short phrase.",
          },
        ],
      }),
    });

    if (!topicRes.ok) {
      const t = await topicRes.text();
      return { ok: false, error: `Topic selection failed (${topicRes.status}): ${t.slice(0, 200)}` };
    }

    const topicJson = await topicRes.json();
    const topic: string = topicJson?.choices?.[0]?.message?.content?.trim() ?? "";
    if (!topic) {
      return { ok: false, error: "AI returned an empty topic." };
    }

    // Step 2: Write the blog post on that topic
    const postRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://okike.ai",
        "X-Title": "OKIKE AI Blog Publisher",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a professional tech blogger. Write plain prose only — absolutely NO markdown syntax. Do not use headers, bold text, asterisks, bullet points, hyphens as list markers, or any '#' characters. The site renders content with whitespace-pre-wrap only, so markdown will appear as raw symbols. Write flowing paragraphs separated by blank lines. Return valid JSON only with no code fences.",
          },
          {
            role: "user",
            content: `Write a blog post about: "${topic}". The content must be at least 400 words of plain prose (no markdown). Return a JSON object with these fields: { "title": string, "excerpt": string (1-2 sentences), "content": string (plain text, minimum 400 words, no markdown), "tags": string[] (2-5 relevant tags) }. Return only the JSON object, nothing else.`,
          },
        ],
      }),
    });

    if (!postRes.ok) {
      const t = await postRes.text();
      return { ok: false, error: `Blog post generation failed (${postRes.status}): ${t.slice(0, 200)}` };
    }

    const postJson = await postRes.json();
    const raw: string = postJson?.choices?.[0]?.message?.content ?? "";
    if (!raw) {
      return { ok: false, error: "AI returned an empty blog post response." };
    }

    // Parse the JSON response
    let parsed: { title: string; excerpt: string; content: string; tags: string[] };
    try {
      // Strip any accidental code fences if the model disobeys
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return { ok: false, error: "Failed to parse AI response as JSON." };
    }

    title = (parsed.title ?? "").trim();
    excerpt = (parsed.excerpt ?? "").trim();
    content = (parsed.content ?? "").trim();
    tags = Array.isArray(parsed.tags) ? parsed.tags.filter((t) => typeof t === "string") : [];

    if (!title || !excerpt || !content) {
      return { ok: false, error: "AI response is missing required fields (title, excerpt, or content)." };
    }
  } catch (e: unknown) {
    if (e instanceof Error && e.name === "AbortError") {
      return { ok: false, error: "Timeout: blog post generation exceeded 60 seconds." };
    }
    const msg = e instanceof Error ? e.message : "Unknown error during blog post generation.";
    return { ok: false, error: msg };
  } finally {
    clearTimeout(timeoutId);
  }

  // Step 3: Derive slug
  let baseSlug = title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  if (!baseSlug) {
    baseSlug = "ai-post-" + Date.now();
  }

  // Step 4: Check slug uniqueness (up to 10 attempts)
  let slug = baseSlug;
  let slugFound = false;
  for (let attempt = 1; attempt <= 10; attempt++) {
    const candidateSlug = attempt === 1 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    slug = candidateSlug;

    const { data: existing, error: slugErr } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("slug", candidateSlug)
      .maybeSingle();

    if (slugErr) {
      return { ok: false, error: `Slug check failed: ${slugErr.message}` };
    }

    if (!existing) {
      slugFound = true;
      break;
    }
  }

  if (!slugFound) {
    return { ok: false, error: "Could not generate a unique slug after 10 attempts." };
  }

  // Step 5: Construct image URL using Picsum Photos (free, no API key, reliable)
  // Use slug as seed so each post always gets the same consistent image
  const seed = slug.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const imageUrl = `https://picsum.photos/seed/${seed}/1200/630`;

  // Step 6: Insert to blog_posts
  const supabaseTyped = supabase as unknown as DynamicSupabase;
  const { error: insertError } = await supabaseTyped.from("blog_posts").upsert({
    title,
    slug,
    author: "OKIKE AI",
    excerpt,
    content,
    image_url: imageUrl,
    tags,
    published: true,
    position: 0,
  });

  if (insertError) {
    return { ok: false, error: `Failed to save blog post: ${insertError.message}` };
  }

  return { ok: true, title, slug };
}

export const publishAIBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    return publishAIBlogPostCore(context.supabase);
  });

// ---- AI Admin Tools ----

export type DraftProjectUpdateInput = {
  projectTitle: string;
  stage: string;
  packageName: string | null;
  milestones: { name: string; status: string }[];
  recentUpdates: string[]; // last 3 update messages
};

export type DraftProjectUpdateResult =
  | { ok: true; draft: string }
  | { ok: false; error: string };

export const draftProjectUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        projectTitle: z.string().min(1).max(200),
        stage: z.string().min(1).max(100),
        packageName: z.string().max(120).nullable(),
        milestones: z.array(z.object({ name: z.string(), status: z.string() })),
        recentUpdates: z.array(z.string()).max(3),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<DraftProjectUpdateResult> => {
    await ensureAdmin(context.supabase, context.userId);

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      return { ok: false, error: "AI is not configured." };
    }

    const milestonesSummary =
      data.milestones.length > 0
        ? data.milestones.map((m) => `- ${m.name} (${m.status})`).join("\n")
        : "No milestones yet.";

    const recentUpdatesSummary =
      data.recentUpdates.length > 0
        ? data.recentUpdates.map((u, i) => `${i + 1}. ${u}`).join("\n")
        : "No recent updates.";

    const prompt = `You are a professional project manager writing a concise status update for a client.

Project: ${data.projectTitle}
Stage: ${data.stage}${data.packageName ? `\nPackage: ${data.packageName}` : ""}

Milestones:
${milestonesSummary}

Recent updates (most recent first):
${recentUpdatesSummary}

Write a 1–3 sentence professional project update message suitable to send directly to the client. Be specific, positive in tone, and mention relevant progress or next steps. Do not include greetings or sign-offs.`;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        return { ok: false, error: `OpenRouter request failed: ${response.statusText}` };
      }

      const json = await response.json();
      const text: string = json?.choices?.[0]?.message?.content?.trim() ?? "";

      if (!text) {
        return { ok: false, error: "AI returned an empty response. Please try again." };
      }

      return { ok: true, draft: text };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return { ok: false, error: `Failed to generate draft: ${message}` };
    }
  });

export type GenerateMilestonePlanInput = {
  projectTitle: string;
  packageName: string | null;
  stage: string;
  inquiryDetails: string;
};

export type GenerateMilestonePlanResult =
  | { ok: true; milestones: string[] }
  | { ok: false; error: string };

export const generateMilestonePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        projectTitle: z.string().min(1).max(200),
        packageName: z.string().max(120).nullable(),
        stage: z.string().min(1).max(100),
        inquiryDetails: z.string().min(1).max(4000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<GenerateMilestonePlanResult> => {
    await ensureAdmin(context.supabase, context.userId);

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      return { ok: false, error: "AI is not configured." };
    }

    const prompt = `You are a project manager creating a milestone plan for a software project.

Project: ${data.projectTitle}
Stage: ${data.stage}${data.packageName ? `\nPackage: ${data.packageName}` : ""}

Project details:
${data.inquiryDetails}

Generate a numbered list of 3 to 8 clear, actionable milestone names for this project. Each milestone should represent a meaningful deliverable or phase. Return ONLY the numbered list, one milestone per line, like:
1. Milestone name
2. Milestone name
...

Do not include descriptions, just concise milestone names.`;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        return { ok: false, error: `OpenRouter request failed: ${response.statusText}` };
      }

      const json = await response.json();
      const rawText: string = json?.choices?.[0]?.message?.content?.trim() ?? "";

      if (!rawText) {
        return { ok: false, error: "AI returned an empty response. Please try again." };
      }

      // Parse numbered lines: match lines starting with a number followed by . or )
      const lines = rawText
        .split("\n")
        .map((line) => line.replace(/^\d+[\.\)]\s*/, "").trim())
        .filter((line) => line.length > 0);

      if (lines.length < 3) {
        return {
          ok: false,
          error: "Could not generate enough milestones from the project details.",
        };
      }

      const milestones = lines.slice(0, 8);

      return { ok: true, milestones };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return { ok: false, error: `Failed to generate milestone plan: ${message}` };
    }
  });
