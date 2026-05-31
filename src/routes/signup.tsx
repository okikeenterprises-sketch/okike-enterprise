import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — OKIKE" },
      {
        name: "description",
        content:
          "Create an OKIKE account to scope projects, track live progress through every milestone, and message your build team directly.",
      },
      { property: "og:title", content: "Create account — OKIKE" },
      {
        property: "og:description",
        content: "Sign up for OKIKE to track your project in real time.",
      },
    ],
    links: [{ rel: "canonical", href: "https://okike-enterprise.lovable.app/signup" }],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/dashboard" });
  }, [session, navigate]);

  async function onSignup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Check your email to confirm your account.");
    }
  }

  async function onGoogle() {
    setBusy(true);
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (res.error) {
      setBusy(false);
      toast.error(res.error.message ?? "Could not sign in with Google");
    }
  }

  return (
    <SiteLayout>
      <section className="py-24 px-6">
        <div className="max-w-md mx-auto bg-card rounded-3xl p-8 ring-1 ring-ink/5 flex flex-col gap-6">
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase text-brand">
              Get started
            </div>
            <h1 className="text-2xl font-medium mt-2">Create your OKIKE account</h1>
            <p className="text-sm text-ink/60 mt-2">Track your projects in real time.</p>
          </div>

          <button
            onClick={onGoogle}
            disabled={busy}
            className="w-full py-3 rounded-full bg-ink text-surface text-sm font-medium hover:bg-brand hover:text-brand-foreground transition disabled:opacity-50"
          >
            Continue with Google
          </button>

          <div className="flex items-center gap-3 text-xs text-ink/40">
            <div className="flex-1 h-px bg-ink/10" /> or <div className="flex-1 h-px bg-ink/10" />
          </div>

          <form onSubmit={onSignup} className="flex flex-col gap-3">
            <label htmlFor="signup-name" className="sr-only">
              Full name
            </label>
            <input
              id="signup-name"
              required
              placeholder="Full name"
              aria-label="Full name"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-surface ring-1 ring-ink/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-brand"
            />
            <label htmlFor="signup-email" className="sr-only">
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              required
              placeholder="Email"
              aria-label="Email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-surface ring-1 ring-ink/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-brand"
            />
            <label htmlFor="signup-password" className="sr-only">
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              required
              minLength={8}
              placeholder="Password (8+ characters)"
              aria-label="Password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-surface ring-1 ring-ink/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-brand"
            />
            <button
              disabled={busy}
              className="w-full py-3 rounded-full bg-brand text-brand-foreground text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {busy ? "…" : "Create account"}
            </button>
          </form>

          <p className="text-sm text-ink/60 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-brand font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}
