import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { HeartPulse, Database, Activity, Globe, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/admin/system-health")({
  component: AdminSystemHealth,
});

type Check = { label: string; ok: boolean | null; latency?: number; detail?: string };

function AdminSystemHealth() {
  const [checks, setChecks] = useState<Record<string, Check>>({
    database: { label: "Database (read)", ok: null },
    auth: { label: "Auth session", ok: null },
    realtime: { label: "Realtime", ok: null },
  });
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string>("");

  async function runChecks() {
    setRunning(true);
    const results: Record<string, Check> = {};

    const t1 = performance.now();
    const { error: dbErr } = await supabase.from("site_settings").select("key").limit(1);
    results.database = {
      label: "Database (read)",
      ok: !dbErr,
      latency: Math.round(performance.now() - t1),
      detail: dbErr?.message,
    };

    const t2 = performance.now();
    const { data: s, error: authErr } = await supabase.auth.getSession();
    results.auth = {
      label: "Auth session",
      ok: !authErr && !!s.session,
      latency: Math.round(performance.now() - t2),
      detail: authErr?.message,
    };

    const t3 = performance.now();
    const rt = await new Promise<boolean>((resolve) => {
      const ch = supabase.channel(`health-${Date.now()}`);
      const timeout = setTimeout(() => {
        supabase.removeChannel(ch);
        resolve(false);
      }, 4000);
      ch.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          clearTimeout(timeout);
          supabase.removeChannel(ch);
          resolve(true);
        }
      });
    });
    results.realtime = { label: "Realtime", ok: rt, latency: Math.round(performance.now() - t3) };

    setChecks(results);
    setLastRun(new Date().toLocaleTimeString());
    setRunning(false);
  }

  useEffect(() => {
    runChecks();
  }, []);

  const allOk = Object.values(checks).every((c) => c.ok === true);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif tracking-tight flex items-center gap-2">
            <HeartPulse className="size-6 text-brand" /> System Health
          </h1>
          <p className="text-sm text-ink/60 mt-1">
            {lastRun ? `Last checked at ${lastRun}` : "Running checks…"}
          </p>
        </div>
        <button
          onClick={runChecks}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-xl bg-brand text-brand-foreground px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          <RefreshCw className={`size-4 ${running ? "animate-spin" : ""}`} /> Re-run
        </button>
      </div>

      <section
        className={`rounded-2xl p-6 ring-1 ${allOk ? "bg-emerald-500/10 ring-emerald-500/25" : "bg-amber-500/10 ring-amber-500/25"}`}
      >
        <div className="text-sm font-medium">
          {Object.values(checks).every((c) => c.ok === null)
            ? "Checking…"
            : allOk
              ? "All systems operational"
              : "Some checks failed — review below"}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <HealthCard icon={Database} check={checks.database} />
        <HealthCard icon={Globe} check={checks.auth} />
        <HealthCard icon={Activity} check={checks.realtime} />
      </div>
    </div>
  );
}

function HealthCard({ icon: Icon, check }: { icon: LucideIcon; check: Check }) {
  const status = check.ok === null ? "checking" : check.ok ? "ok" : "down";
  const color =
    status === "ok"
      ? "text-emerald-500 bg-emerald-500/15"
      : status === "down"
        ? "text-rose-500 bg-rose-500/15"
        : "text-ink/50 bg-foreground/5";
  return (
    <div className="rounded-2xl bg-card ring-1 ring-border p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`size-9 rounded-xl ring-1 ring-border grid place-items-center ${color}`}>
          <Icon className="size-4" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium">{check.label}</div>
          <div className="text-xs text-ink/50">
            {status === "checking" ? "Checking…" : status === "ok" ? "Operational" : "Degraded"}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-ink/60">
        <span>Latency</span>
        <span className="tabular-nums">{check.latency != null ? `${check.latency} ms` : "—"}</span>
      </div>
      {check.detail && <div className="text-xs text-rose-500 mt-2">{check.detail}</div>}
    </div>
  );
}
