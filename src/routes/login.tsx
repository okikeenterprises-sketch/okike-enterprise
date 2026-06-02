import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Github } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — OKIKE" },
      {
        name: "description",
        content:
          "Sign in to your OKIKE account to track your project progress in real time, message your team, and review deliverables.",
      },
      { property: "og:title", content: "Sign in — OKIKE" },
      {
        property: "og:description",
        content: "Access your OKIKE dashboard to follow live project updates.",
      },
    ],
    links: [{ rel: "canonical", href: "https://okike-enterprise.lovable.app/login" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { session, role } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) {
      navigate({ to: role === "admin" ? "/admin" : "/dashboard" });
    }
  }, [session, role, navigate]);

  async function onEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
  }

  async function onGithub() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: window.location.origin,
      },
    });
    setBusy(false);
    if (error) toast.error(error.message ?? "Could not sign in with GitHub");
  }

  return (
    <SiteLayout>
      <section className="py-24 px-6">
        <div className="max-w-md mx-auto bg-card rounded-3xl p-8 ring-1 ring-ink/5 flex flex-col gap-6">
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase text-brand">
              Welcome back
            </div>
            <h1 className="text-2xl font-medium mt-2">Sign in to OKIKE</h1>
          </div>

          <button
            onClick={onGithub}
            disabled={busy}
            className="w-full py-3 rounded-full bg-ink text-surface text-sm font-medium hover:bg-brand hover:text-brand-foreground transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Github className="size-4" />
            Continue with GitHub
          </button>

          <div className="flex items-center gap-3 text-xs text-ink/40">
            <div className="flex-1 h-px bg-ink/10" /> or <div className="flex-1 h-px bg-ink/10" />
          </div>

          <form onSubmit={onEmail} className="flex flex-col gap-3">
            <label htmlFor="login-email" className="sr-only">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              placeholder="Email"
              aria-label="Email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-surface ring-1 ring-ink/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-brand"
            />
            <label htmlFor="login-password" className="sr-only">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder="Password"
                aria-label="Password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-surface ring-1 ring-ink/10 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-brand w-full"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/50 hover:text-ink transition"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button
              disabled={busy}
              className="w-full py-3 rounded-full bg-brand text-brand-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {busy ? "…" : "Sign in"}
            </button>
          </form>

          <p className="text-sm text-ink/60 text-center">
            New to OKIKE?{" "}
            <Link to="/signup" className="text-brand font-medium">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}
