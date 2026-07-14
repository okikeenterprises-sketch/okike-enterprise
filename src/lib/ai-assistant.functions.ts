import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(8000),
});

type Project = {
  id: string;
  title: string;
  package_name: string | null;
  stage: string;
  created_at: string;
};

type Milestone = {
  id: string;
  project_id: string;
  name: string;
  status: string;
};

type Update = {
  id: string;
  project_id: string;
  message: string;
  created_at: string;
};

type ProjectData = {
  projects: Project[];
  milestones: Milestone[];
  updates: Update[];
};

export const askAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        messages: z.array(MessageSchema).min(1).max(20),
        system: z.string().max(2000).optional(),
        model: z.string().optional(),
        projectData: z.any().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "AI is not configured." };
    }

    let projectContext = "";
    if (data.projectData) {
      const { projects, milestones, updates } = data.projectData as ProjectData;

      if (projects.length > 0) {
        projectContext = "\n\nUSER'S CURRENT PROJECT DATA:\n";

        for (const project of projects) {
          const projectMilestones = milestones.filter((m) => m.project_id === project.id);
          const projectUpdates = updates.filter((u) => u.project_id === project.id);

          projectContext += `\nPROJECT: ${project.title}\n`;
          projectContext += `- Stage: ${project.stage}\n`;
          if (project.package_name) projectContext += `- Package: ${project.package_name}\n`;

          if (projectMilestones.length > 0) {
            projectContext += "- Milestones:\n";
            for (const m of projectMilestones) {
              projectContext += `  • ${m.name}: ${m.status}\n`;
            }
          }

          if (projectUpdates.length > 0) {
            projectContext += "- Latest updates:\n";
            for (const u of projectUpdates.slice(0, 3)) {
              projectContext += `  • ${u.message} (${new Date(u.created_at).toLocaleString()})\n`;
            }
          }
        }
      }
    }

    const system =
      data.system ??
      `You are OKIKE AI — a concise, helpful assistant inside the OKIKE client dashboard. Answer in 1-3 short paragraphs. Be practical.

You have access to the user's project data, milestones, and updates. When the user asks about their projects, you can reference this information. You can help summarize their progress, suggest next steps, and answer questions about their work.

If the user asks to create a project, tell them to click the "Start a project" button or go to /book.

For bootcamp students (Computing Synergy Summit commencing August 1, 2026):
- They can register for multiple tracks.
- CS/IT department students (Computer Science, Information Technology, Software Engineering, Cyber Security) get free admission by entering a valid, unique registration number containing 'CSC'.
- Non-department students pay a registration fee of ₦5,000.
- They have access to syllabus modules, roadmap milestones, live night sessions, downloadable materials, quizzes, and assignments for all registered course tracks in their dashboard.${projectContext}`;

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://okike.ai",
          "X-Title": "OKIKE AI Assistant",
        },
        body: JSON.stringify({
          model: data.model || "openai/gpt-4o-mini",
          messages: [{ role: "system", content: system }, ...data.messages],
        }),
      });

      if (res.status === 429)
        return { ok: false as const, error: "Rate limit reached. Try again in a moment." };
      if (res.status === 402)
        return {
          ok: false as const,
          error: "AI credits exhausted. Add credits in OpenRouter settings.",
        };
      if (!res.ok) {
        const t = await res.text();
        return {
          ok: false as const,
          error: `AI request failed (${res.status}): ${t.slice(0, 200)}`,
        };
      }
      const json = await res.json();
      const text: string = json?.choices?.[0]?.message?.content ?? "";
      return { ok: true as const, text };
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "AI request failed.";
      return { ok: false as const, error: errorMessage };
    }
  });

// ─── Feature 2: AI Project Creation Assistant ────────────────────────────────

export type PackageSummary = {
  id: string;
  name: string;
  base: number | null;
  timeline: string;
};

export type AddonSummary = {
  id: string;
  label: string;
  price: number;
};

export type AskProjectAssistantInput = {
  description: string;        // 20–2000 chars
  packages: PackageSummary[]; // [{ id, name, base, timeline }]
  addons: AddonSummary[];     // [{ id, label, price }]
  timelineOptions: string[];  // e.g. ["rush", "standard", "flexible"]
};

export type ProjectRecommendation = {
  pkg: "starter" | "business" | "custom";
  scopeGoal: string;
  scopePages: string;
  scopeBrand: string;
  addons: string[];            // array of addon ids
  timeline: string;            // one of the timeline option ids
  needs_clarification?: false;
};

export type ProjectClarification = {
  needs_clarification: true;
  clarification_question: string;
};

export type AskProjectAssistantResult =
  | { ok: true; recommendation: ProjectRecommendation }
  | { ok: true; recommendation: ProjectClarification }
  | { ok: false; error: string };

const AskProjectAssistantInputSchema = z.object({
  description: z.string().min(20).max(2000),
  packages: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        base: z.number().nullable(),
        timeline: z.string(),
      }),
    )
    .min(1),
  addons: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      price: z.number(),
    }),
  ),
  timelineOptions: z.array(z.string()),
});

export const askProjectAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => AskProjectAssistantInputSchema.parse(d))
  .handler(async ({ data }): Promise<AskProjectAssistantResult> => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return { ok: false, error: "AI is not configured." };
    }

    const packageList = data.packages
      .map((p) => `- id: "${p.id}", name: "${p.name}", base price: ${p.base !== null ? `$${p.base}` : "custom quote"}, timeline: ${p.timeline}`)
      .join("\n");

    const addonList =
      data.addons.length > 0
        ? data.addons
          .map((a) => `- id: "${a.id}", label: "${a.label}", price: $${a.price}`)
          .join("\n")
        : "  (none available)";

    const timelineList = data.timelineOptions.join(", ");

    const systemPrompt = `You are an expert OKIKE project advisor. A prospective client will describe their project idea. Your job is to analyse the description and return a JSON object — nothing else, no markdown, no explanation.

Available packages:
${packageList}

Available add-ons:
${addonList}

Available timeline options: ${timelineList}

---

If you have enough information, return a JSON object matching this shape exactly:
{
  "pkg": "<one of the package ids above>",
  "scopeGoal": "<one concise sentence describing what the project is trying to achieve>",
  "scopePages": "<comma-separated list of main pages/sections, e.g. Home, About, Contact>",
  "scopeBrand": "<brief description of the desired look and feel>",
  "addons": ["<addon id>", ...],
  "timeline": "<one of the timeline option ids above>",
  "needs_clarification": false
}

If the description is too vague to make a confident recommendation, return:
{
  "needs_clarification": true,
  "clarification_question": "<a single, specific follow-up question that would allow you to make a recommendation>"
}

IMPORTANT: Return ONLY the JSON object. No markdown fences, no explanation text.`;

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://okike.ai",
          "X-Title": "OKIKE AI Assistant",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: data.description },
          ],
        }),
      });

      if (res.status === 429)
        return { ok: false, error: "Rate limit reached. Try again in a moment." };
      if (res.status === 402)
        return { ok: false, error: "AI credits exhausted. Add credits in OpenRouter settings." };
      if (!res.ok) {
        const t = await res.text();
        return { ok: false, error: `AI request failed (${res.status}): ${t.slice(0, 200)}` };
      }

      const json = await res.json();
      const rawText: string = json?.choices?.[0]?.message?.content ?? "";

      if (!rawText) {
        return { ok: false, error: "AI returned an empty response." };
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        // Try stripping markdown fences in case the model ignored instructions
        const stripped = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
        try {
          parsed = JSON.parse(stripped);
        } catch {
          return { ok: false, error: "AI response could not be parsed as JSON." };
        }
      }

      if (typeof parsed !== "object" || parsed === null) {
        return { ok: false, error: "AI returned an unexpected response shape." };
      }

      const obj = parsed as Record<string, unknown>;

      // Clarification branch
      if (obj.needs_clarification === true) {
        if (typeof obj.clarification_question !== "string" || !obj.clarification_question.trim()) {
          return { ok: false, error: "AI returned needs_clarification but no question." };
        }
        return {
          ok: true,
          recommendation: {
            needs_clarification: true,
            clarification_question: obj.clarification_question,
          },
        };
      }

      // Recommendation branch — validate all required fields
      const pkg = obj.pkg;
      if (pkg !== "starter" && pkg !== "business" && pkg !== "custom") {
        return { ok: false, error: `AI returned an invalid package id: ${String(pkg)}` };
      }

      if (typeof obj.scopeGoal !== "string" || !obj.scopeGoal.trim()) {
        return { ok: false, error: "AI recommendation is missing scopeGoal." };
      }
      if (typeof obj.scopePages !== "string" || !obj.scopePages.trim()) {
        return { ok: false, error: "AI recommendation is missing scopePages." };
      }
      if (typeof obj.scopeBrand !== "string" || !obj.scopeBrand.trim()) {
        return { ok: false, error: "AI recommendation is missing scopeBrand." };
      }
      if (!Array.isArray(obj.addons) || !obj.addons.every((a) => typeof a === "string")) {
        return { ok: false, error: "AI recommendation has an invalid addons field." };
      }
      if (typeof obj.timeline !== "string" || !obj.timeline.trim()) {
        return { ok: false, error: "AI recommendation is missing timeline." };
      }

      const recommendation: ProjectRecommendation = {
        pkg,
        scopeGoal: obj.scopeGoal,
        scopePages: obj.scopePages,
        scopeBrand: obj.scopeBrand,
        addons: obj.addons as string[],
        timeline: obj.timeline,
        needs_clarification: false,
      };

      return { ok: true, recommendation };
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "AI request failed.";
      return { ok: false, error: errorMessage };
    }
  });


// ─── Feature 3: Proactive AI Insights ────────────────────────────────────────

export type Insight = {
  id: string;
  severity: "warning" | "info";
  title: string; // ≤60 chars
  message: string;
};

export type GenerateInsightsInput = {
  projects: {
    id: string;
    title: string;
    package_name: string | null;
    stage: string;
    created_at: string;
  }[];
  milestones: {
    id: string;
    project_id: string;
    name: string;
    status: string;
    updated_at?: string;
    created_at: string;
  }[];
  updates: {
    id: string;
    project_id: string;
    message: string;
    created_at: string;
  }[];
};

export type GenerateInsightsResult =
  | { ok: true; insights: Insight[] }
  | { ok: false; error: string };

/** Returns how many whole days ago a timestamp was from now (UTC). */
function daysAgo(isoString: string): number {
  const then = new Date(isoString).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

/** Truncates a string to maxLen characters (for title safety). */
function cap(str: string, maxLen = 60): string {
  return str.length <= maxLen ? str : str.slice(0, maxLen - 1) + "…";
}

export const generateInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        projects: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            package_name: z.string().nullable(),
            stage: z.string(),
            created_at: z.string(),
          }),
        ),
        milestones: z.array(
          z.object({
            id: z.string(),
            project_id: z.string(),
            name: z.string(),
            status: z.string(),
            updated_at: z.string().optional(),
            created_at: z.string(),
          }),
        ),
        updates: z.array(
          z.object({
            id: z.string(),
            project_id: z.string(),
            message: z.string(),
            created_at: z.string(),
          }),
        ),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<GenerateInsightsResult> => {
    const { projects, milestones } = data;
    const insights: Insight[] = [];

    // ── Rule 1: Stalled milestones ──────────────────────────────────────────
    for (const m of milestones) {
      if (m.status === "active") {
        const ref = m.updated_at ?? m.created_at;
        const days = daysAgo(ref);
        if (days > 7) {
          insights.push({
            id: `stalled-${m.id}`,
            severity: "warning",
            title: cap(`Milestone stalled: ${m.name}`),
            message: `${days} days without progress on this milestone`,
          });
        }
      }
    }

    // ── Rule 2: Completion-ready projects ───────────────────────────────────
    for (const p of projects) {
      if (p.stage === "in_progress") {
        const projectMilestones = milestones.filter((m) => m.project_id === p.id);
        const allDone =
          projectMilestones.length > 0 && projectMilestones.every((m) => m.status === "done");
        if (allDone) {
          insights.push({
            id: `complete-ready-${p.id}`,
            severity: "info",
            title: cap(`Ready to complete: ${p.title}`),
            message: "All milestones done — notify admin for sign-off",
          });
        }
      }
    }

    // ── Rule 3: Cross-project pattern ───────────────────────────────────────
    if (projects.length >= 2) {
      const completedProjects = projects.filter((p) => p.stage === "completed");
      if (completedProjects.length >= 1) {
        const n = completedProjects.length;

        // Find most common package_name among completed projects
        // If tied, pick first alphabetically; if all null, use "Custom"
        const packageCounts: Record<string, number> = {};
        for (const p of completedProjects) {
          const pkg = p.package_name ?? "Custom";
          packageCounts[pkg] = (packageCounts[pkg] ?? 0) + 1;
        }
        const maxCount = Math.max(...Object.values(packageCounts));
        const mostCommonPackage =
          Object.entries(packageCounts)
            .filter(([, count]) => count === maxCount)
            .map(([name]) => name)
            .sort()[0] ?? "Custom";

        insights.push({
          id: "cross-project-pattern",
          severity: "info",
          title: cap(`${n} project${n === 1 ? "" : "s"} completed`),
          message: `Most common package: ${mostCommonPackage}`,
        });
      }
    }

    // ── Optional LLM summary ────────────────────────────────────────────────
    const hasActiveProject = projects.some(
      (p) => p.stage === "in_progress" || p.stage === "accepted",
    );

    if (hasActiveProject) {
      try {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (apiKey) {
          const activeProjects = projects.filter(
            (p) => p.stage === "in_progress" || p.stage === "accepted",
          );
          const projectSummary = activeProjects
            .map((p) => {
              const ms = milestones.filter((m) => m.project_id === p.id);
              const doneCount = ms.filter((m) => m.status === "done").length;
              return `"${p.title}" (${p.stage}): ${doneCount}/${ms.length} milestones done`;
            })
            .join("; ");

          const prompt = `You are a project health advisor. Given this project summary: ${projectSummary}. Write ONE short sentence (max 15 words) of overall health advice or encouragement for the client. Reply with only that sentence, no quotes.`;

          const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://okike.ai",
              "X-Title": "OKIKE AI Insights",
            },
            body: JSON.stringify({
              model: "openai/gpt-4o-mini",
              messages: [{ role: "user", content: prompt }],
              max_tokens: 60,
            }),
          });

          if (res.ok) {
            const json = await res.json();
            const text: string = json?.choices?.[0]?.message?.content ?? "";
            if (text) {
              insights.push({
                id: "ai-summary",
                severity: "info",
                title: "AI summary",
                message: text.slice(0, 300),
              });
            }
          }
        }
      } catch {
        // LLM failure is non-fatal — return rule-based insights only
      }
    }

    return { ok: true, insights };
  });
