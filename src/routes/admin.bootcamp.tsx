import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, GraduationCap, Calendar, CreditCard } from "lucide-react";

export const Route = createFileRoute("/admin/bootcamp")({
  component: AdminBootcampPage,
});

type Registration = {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  level: string;
  course: string | null;
  payment_status: string;
  payment_reference: string | null;
  created_at: string;
};

function AdminBootcampPage() {
  const [rows, setRows] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await (supabase as any)
      .from("bootcamp_registrations")
      .select("*")
      .order("created_at", { ascending: false });
    setRows((data ?? []) as Registration[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const total = rows.length;
  const deptStudents = rows.filter((r) => r.payment_status === "free").length;
  const paidCount = rows.filter((r) => r.payment_status === "paid").length;
  const pendingCount = rows.filter((r) => r.payment_status === "pending").length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-serif tracking-tight flex items-center gap-2">
          <GraduationCap className="size-6 text-brand" /> Synergy Summit Registrations
        </h1>
        <p className="text-sm text-ink/60 mt-1">List of students registered for the Computing Synergy Summit.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile label="Total Registered" value={String(total)} />
        <Tile label="CS/IT (Free)" value={String(deptStudents)} />
        <Tile label="Paid (₦5,000)" value={String(paidCount)} />
        <Tile label="Pending Payment" value={String(pendingCount)} />
      </div>

      <section className="bg-card rounded-2xl ring-1 ring-ink/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-ink/10 bg-surface text-ink/60 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Student Info</th>
                <th className="px-6 py-4">Academic Details</th>
                <th className="px-6 py-4">Course Track</th>
                <th className="px-6 py-4">Payment Status</th>
                <th className="px-6 py-4">Date Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-ink/40">
                    Loading registrations...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-ink/40">
                    No registrations found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-ink/5 transition">
                    <td className="px-6 py-4">
                      <div className="font-medium text-ink">{r.name}</div>
                      <div className="text-xs text-ink/50 mt-0.5">{r.email}</div>
                      <div className="text-[10px] text-ink/40 font-mono mt-0.5">{r.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-ink">{r.department}</div>
                      <div className="text-xs text-ink/50 mt-0.5">{r.level}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-ink">
                      {r.course ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        r.payment_status === "paid"
                          ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20"
                          : r.payment_status === "free"
                            ? "bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20"
                            : "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20"
                      }`}>
                        {r.payment_status}
                      </span>
                      {r.payment_reference && (
                        <div className="text-[10px] text-ink/40 font-mono mt-1 select-all" title="Reference">
                          Ref: {r.payment_reference}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-ink/60 text-xs">
                      {new Date(r.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card rounded-2xl p-5 ring-1 ring-ink/10">
      <div className="text-xs uppercase tracking-wider text-ink/50 font-medium">{label}</div>
      <div className="text-2xl font-semibold text-ink mt-1.5 font-mono">{value}</div>
    </div>
  );
}
