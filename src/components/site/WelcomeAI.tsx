import { useEffect, useRef, useState } from "react";
import { Bot, Send, X, Sparkles, ArrowUpRight, User } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { askPublicAI } from "@/lib/public-ai.functions";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

type ChatMsg = { role: "user" | "assistant"; content: string };

export function WelcomeAI() {
  const ask = useServerFn(askPublicAI);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content: "Hi there! 👋 Welcome to OKIKE. I'd love to tell you about what we do. We're a software house and academy — we build great software and teach people to build it too. Would you like to know more about our services, our academy, or how to get started?",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || busy) return;

    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setBusy(true);

    try {
      const res = await ask({
        data: {
          messages: next,
        },
      });
      if (res.ok) {
        setMessages([...next, { role: "assistant", content: res.text }]);
      } else {
        toast.error(res.error);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "AI request failed");
    } finally {
      setBusy(false);
    }
  }

  const quickQuestions = [
    "What services do you offer?",
    "Tell me about the academy",
    "How do I book a project?",
    "What's your pricing like?",
  ];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-brand text-brand-foreground p-4 rounded-full shadow-xl hover:scale-105 transition-transform"
        aria-label="Chat with OKIKE AI"
      >
        {isOpen ? <X className="size-6" /> : <Bot className="size-6" />}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] bg-surface rounded-2xl shadow-2xl ring-1 ring-ink/10 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-brand/5 border-b border-ink/10 p-4 flex items-center gap-3">
            <div className="size-10 rounded-full bg-brand/20 flex items-center justify-center">
              <Sparkles className="size-5 text-brand" />
            </div>
            <div>
              <div className="font-semibold text-ink">OKIKE AI</div>
              <div className="text-xs text-ink/60">Ask me anything</div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto max-h-[400px] space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "user"
                      ? "bg-ink/10"
                      : "bg-brand/20"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="size-4 text-ink/70" />
                  ) : (
                    <Bot className="size-4 text-brand" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-brand text-brand-foreground"
                      : "bg-ink/[0.04] text-ink"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex gap-3">
                <div className="size-8 rounded-full bg-brand/20 flex items-center justify-center shrink-0">
                  <Bot className="size-4 text-brand" />
                </div>
                <div className="bg-ink/[0.04] rounded-2xl px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-ink/30 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-ink/30 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-ink/30 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick questions */}
          {messages.length === 1 && !busy && (
            <div className="px-4 pb-3 space-y-2">
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="w-full text-left text-sm px-4 py-2 rounded-xl bg-ink/[0.03] hover:bg-ink/[0.06] transition-colors text-ink/70"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* CTA Buttons */}
          <div className="px-4 pb-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/signup"
                className="text-center text-sm py-2 px-3 rounded-xl bg-brand text-brand-foreground font-medium hover:opacity-90 transition"
              >
                Sign up
              </Link>
              <Link
                to="/book"
                className="text-center text-sm py-2 px-3 rounded-xl bg-ink/[0.05] text-ink font-medium hover:bg-ink/[0.08] transition flex items-center justify-center gap-1"
              >
                Book project <ArrowUpRight className="size-3" />
              </Link>
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-ink/10 p-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask me anything..."
                className="flex-1 bg-ink/[0.03] border-0 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
              <button
                onClick={() => send()}
                disabled={busy || !input.trim()}
                className="bg-brand text-brand-foreground p-2.5 rounded-xl hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
