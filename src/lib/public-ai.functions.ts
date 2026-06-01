import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(8000),
});

export const askPublicAI = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        messages: z.array(MessageSchema).min(1).max(20),
        system: z.string().max(2000).optional(),
        model: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "AI is not configured." };
    }

    const system =
      data.system ??
      `You are OKIKE AI — a friendly, helpful assistant for the OKIKE website. OKIKE is a software house and academy that builds software and teaches people to build it.

Your role is to:
1. Welcome visitors warmly
2. Explain what OKIKE does:
   - Software development (web apps, mobile apps, AI tools, SaaS platforms)
   - Education/Academy (fullstack development, UI/UX design, Python, cybersecurity, data analysis)
3. Answer questions about services, pricing, the academy
4. Encourage visitors to sign up, book a consultation, or enroll in the academy
5. Keep responses conversational and concise (1-3 short paragraphs)

Guide visitors towards signing up (/signup), booking a project (/book), or enrolling in the academy (/enroll).`;

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://okike.ai",
          "X-Title": "OKIKE Public AI Assistant",
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
