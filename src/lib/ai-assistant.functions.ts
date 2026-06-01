import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(8000),
});

type ProjectData = {
  projects: any[];
  milestones: any[];
  updates: any[];
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

If the user asks to create a project, tell them to click the "Start a project" button or go to /book.${projectContext}`;

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
    } catch (e: any) {
      return { ok: false as const, error: e?.message ?? "AI request failed." };
    }
  });
