import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard } from "lucide-react";

export const Route = createFileRoute("/admin/payments")({
  component: AdminPayments,
});

type Project = {
  id: string;
  title: string;
  client_email: string;
  package_name: string | null;
  total: number | null;
  deposit: number | null;
  currency: string;
  stage: string;
  created_at: string;
};

function AdminPayments() {
  const [rows, setRows] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("client_projects")
        .select(
          "id, title, client_email, package_name, total, deposit, currency, stage, created_at",
        )
        .order("created_at", { ascending: false });
      setRows((data ?? []) as Project[]);
      setLoading(false);
    }
    load();
  }, []);

  const pipeline = rows.reduce((s, r) => s + Number(r.total ?? 0), 0);
  const deposits = rows.reduce((s, r) => s + Number(r.deposit ?? 0), 0);
  const completed = rows
    .filter((r) => r.stage === "completed")
    .reduce((s, r) => s + Number(r.total ?? 0), 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-serif tracking-tight flex items-center gap-2">
          <CreditCard className="size-6 text-brand" /> Payments
        </h1>
        <p className="text-sm text-ink/60 mt-1">Project totals, deposits, and revenue snapshot.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Tile label="Pipeline total" value={fmt(pipeline)} />
        <Tile label="Deposits collected" value={fmt(deposits)} />
        <Tile label="Completed revenue" value={fmt(completed)} />
      </div>

      <section className="rounded-2xl bg-card ring-1 ring-border overflow-hidden">
        {loading ? (
          <div className="px-6 py-10 text-sm text-ink/40">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-10 text-sm text-ink/40">No projects yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-ink/40 border-b border-border">
                  <th className="text-left font-medium px-6 py-3">Project</th>
                  <th className="text-left font-medium px-2 py-3">Client</th>
                  <th className="text-left font-medium px-2 py-3">Package</th>
                  <th className="text-left font-medium px-2 py-3">Stage</th>
                  <th className="text-right font-medium px-2 py-3">Deposit</th>
                  <th className="text-right font-medium px-6 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((p) => (
                  <tr key={p.id} className="hover:bg-foreground/5">
                    <td className="px-6 py-3 font-medium">{p.title}</td>
                    <td className="px-2 py-3 text-ink/70">{p.client_email}</td>
                    <td className="px-2 py-3 text-ink/60">{p.package_name ?? "—"}</td>
                    <td className="px-2 py-3">
                      <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-brand/10 text-brand ring-1 ring-brand/20 capitalize">
                        {p.stage.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right text-ink/70 tabular-nums">
                      {p.deposit ? fmt(Number(p.deposit), p.currency) : "—"}
                    </td>
                    <td className="px-6 py-3 text-right font-medium tabular-nums">
                      {p.total ? fmt(Number(p.total), p.currency) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card ring-1 ring-border p-5">
      <div className="text-xs text-ink/60">{label}</div>
      <div className="text-2xl font-semibold tracking-tight mt-1">{value}</div>
    </div>
  );
}

function fmt(n: number, currency: string = "NGN") {
  const symbol = currency === "NGN" ? "₦" : "$";
  if (!n) return symbol + "0";
  if (n >= 1_000_000) return symbol + (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1000) return symbol + (n / 1000).toFixed(1) + "K";
  return symbol + n.toFixed(0);
}
