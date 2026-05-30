import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(8000),
});

export const askAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        messages: z.array(MessageSchema).min(1).max(20),
        system: z.string().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "AI is not configured." };
    }
    const system =
      data.system ??
      "You are OKIKE AI — a concise, helpful assistant inside the OKIKE client dashboard. Answer in 1-3 short paragraphs. Be practical.";

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: system }, ...data.messages],
        }),
      });

      if (res.status === 429) return { ok: false as const, error: "Rate limit reached. Try again in a moment." };
      if (res.status === 402) return { ok: false as const, error: "AI credits exhausted. Add credits in workspace settings." };
      if (!res.ok) {
        const t = await res.text();
        return { ok: false as const, error: `AI request failed (${res.status}): ${t.slice(0, 200)}` };
      }
      const json = await res.json();
      const text: string = json?.choices?.[0]?.message?.content ?? "";
      return { ok: true as const, text };
    } catch (e: any) {
      return { ok: false as const, error: e?.message ?? "AI request failed." };
    }
  });
