import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Search } from "lucide-react";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

type Row = {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role?: string;
};
type RoleRow = { user_id: string; role: string };
type ProfileRow = Omit<Row, "role">;

function AdminUsers() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, user_id, email, full_name, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const roleMap = new Map<string, string>();
      for (const r of (roles ?? []) as RoleRow[]) roleMap.set(r.user_id, r.role);
      setRows(
        ((profiles ?? []) as ProfileRow[]).map((p) => ({
          ...p,
          role: roleMap.get(p.user_id) ?? "client",
        })),
      );
      setLoading(false);
    }
    load();
  }, []);

  const filtered = rows.filter(
    (r) =>
      !q ||
      r.email?.toLowerCase().includes(q.toLowerCase()) ||
      r.full_name?.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif tracking-tight flex items-center gap-2">
            <Users className="size-6 text-brand" /> Users
          </h1>
          <p className="text-sm text-ink/60 mt-1">
            {rows.length} registered {rows.length === 1 ? "user" : "users"}.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-card ring-1 ring-border px-3 py-2 w-full sm:w-72">
          <Search className="size-4 text-ink/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email"
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
        </div>
      </div>

      <section className="rounded-2xl bg-card ring-1 ring-border overflow-hidden">
        {loading ? (
          <div className="px-6 py-10 text-sm text-ink/40">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-10 text-sm text-ink/40">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-ink/40 border-b border-border">
                  <th className="text-left font-medium px-6 py-3">User</th>
                  <th className="text-left font-medium px-2 py-3">Email</th>
                  <th className="text-left font-medium px-2 py-3">Role</th>
                  <th className="text-left font-medium px-6 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-foreground/5">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-brand/20 ring-1 ring-brand/30 grid place-items-center text-xs font-semibold text-brand">
                          {(u.full_name || u.email || "?").charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{u.full_name || "—"}</span>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-ink/70">{u.email}</td>
                    <td className="px-2 py-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-1 rounded-md ring-1 capitalize ${
                          u.role === "admin"
                            ? "bg-brand/15 text-brand ring-brand/25"
                            : "bg-foreground/5 text-ink/70 ring-border"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-ink/60">
                      {new Date(u.created_at).toLocaleDateString()}
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
