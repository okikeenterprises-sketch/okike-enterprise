import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/hooks/use-auth";

import { useServerFn } from "@tanstack/react-start";
import { sendPasswordChangedEmail } from "@/lib/forms.functions";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Set New Password — OKIKE" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const sendEmailAlert = useServerFn(sendPasswordChangedEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onReset(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setBusy(true);

    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (error) {
      toast.error(error.message);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        await sendEmailAlert({ data: { email: user.email } }).catch(() => {});
      }
      toast.success("Password reset successfully! Redirecting you...");
      setTimeout(() => {
        navigate({ to: "/dashboard" });
      }, 1500);
    }
  }

  return (
    <SiteLayout>
      <section className="py-24 px-6 min-h-[80vh] flex items-center">
        <div className="max-w-md w-full mx-auto flex flex-col gap-8">
          <div>
            <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/55 mb-4">
              <span className="h-px w-8 bg-brand" />
              <span>Recovery Session</span>
            </div>
            <h1 className="font-display text-4xl leading-[0.92] tracking-wide uppercase text-ink">
              Set New <span className="text-brand">Password</span>
            </h1>
            <p className="text-sm text-ink/60 mt-3 leading-relaxed">
              Enter your new account password below.
            </p>
          </div>

          <form onSubmit={onReset} className="flex flex-col gap-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder="New Password"
                aria-label="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-surface ring-1 ring-ink/10 px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 transition w-full"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/50 hover:text-ink transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Confirm New Password"
              aria-label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-surface ring-1 ring-ink/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 transition w-full"
            />

            <button
              disabled={busy}
              className="w-full py-3.5 bg-brand text-brand-foreground font-semibold text-sm uppercase tracking-widest hover:opacity-90 transition disabled:opacity-50"
            >
              {busy ? "Updating…" : "Update Password"}
            </button>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}
