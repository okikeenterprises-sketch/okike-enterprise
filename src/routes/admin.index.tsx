import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  FolderKanban,
  Wallet,
  Inbox,
  Sparkles,
  CheckCircle2,
  ArrowUpRight,
  UserPlus2,
  Megaphone,
  Download,
  FileBarChart,
  ClipboardList,
  AlertOctagon,
  Activity,
  Server,
  Database,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

type Counts = {
  users: number;
  inquiries: number;
  inquiriesOpen: number;
  projectsRunning: number;
  projectsCompleted: number;
  contactOpen: number;
  revenue: number;
};

type RoleSlice = { name: string; value: number; color: string };
type DailyPoint = { day: string; signups: number; inquiries: number; projects: number };

const ROLE_COLORS: Record<string, string> = {
  admin: "oklch(0.82 0.18 95)",
  client: "oklch(0.65 0.15 95)",
};

function AdminOverview() {
  const [counts, setCounts] = useState<Counts>({
    users: 0,
    inquiries: 0,
    inquiriesOpen: 0,
    projectsRunning: 0,
    projectsCompleted: 0,
    contactOpen: 0,
    revenue: 0,
  });
  const [roleData, setRoleData] = useState<RoleSlice[]>([]);
  const [series, setSeries] = useState<DailyPoint[]>([]);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [milestonesByProject, setMilestonesByProject] = useState<Record<string, { total: number; done: number }>>({});
  const [recentSignups, setRecentSignups] = useState<any[]>([]);
  const [activity, setActivity] = useState<{ icon: any; title: string; sub: string; time: string; color: string }[]>([]);
  const [dbOk, setDbOk] = useState(true);
  const [seriesMode, setSeriesMode] = useState<"signups" | "inquiries" | "projects">("signups");

  useEffect(() => {
    async function load() {
      try {
        const [
          profiles,
          inquiries,
          projects,
          contact,
          roles,
          recentProj,
          recentInq,
          recentUpd,
          recentContact,
        ] = await Promise.all([
          supabase.from("profiles").select("id, full_name, email, created_at", { count: "exact" }),
          supabase.from("project_inquiries").select("id, name, project_type, status, created_at", { count: "exact" }),
          supabase.from("client_projects").select("id, title, package_name, stage, total, created_at, client_email", { count: "exact" }),
          supabase.from("contact_messages").select("id, name, created_at", { count: "exact" }),
          supabase.from("user_roles").select("role"),
          supabase.from("client_projects").select("id, title, package_name, stage, total, created_at, client_email").order("created_at", { ascending: false }).limit(5),
          supabase.from("project_inquiries").select("id, name, project_type, status, created_at").order("created_at", { ascending: false }).limit(5),
          supabase.from("project_updates").select("id, message, created_at").order("created_at", { ascending: false }).limit(5),
          supabase.from("contact_messages").select("id, name, message, created_at").order("created_at", { ascending: false }).limit(5),
        ]);

        const allProjects = (projects.data ?? []) as any[];
        const allInq = (inquiries.data ?? []) as any[];

        setCounts({
          users: profiles.count ?? 0,
          inquiries: inquiries.count ?? 0,
          inquiriesOpen: allInq.filter((i) => i.status === "new" || i.status === "reviewing").length,
          projectsRunning: allProjects.filter((p) => p.stage === "in_progress" || p.stage === "accepted").length,
          projectsCompleted: allProjects.filter((p) => p.stage === "completed").length,
          contactOpen: contact.count ?? 0,
          revenue: allProjects.reduce((s, p) => s + Number(p.total ?? 0), 0),
        });

        // role pie
        const roleCounts: Record<string, number> = {};
        for (const r of roles.data ?? []) {
          const k = (r as any).role as string;
          roleCounts[k] = (roleCounts[k] ?? 0) + 1;
        }
        setRoleData(
          Object.entries(roleCounts).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1) + "s",
            value,
            color: ROLE_COLORS[name] ?? "oklch(0.6 0.1 200)",
          })),
        );

        // 14-day series
        const days: DailyPoint[] = [];
        const today = new Date();
        for (let i = 13; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const key = d.toISOString().slice(0, 10);
          days.push({ day: key, signups: 0, inquiries: 0, projects: 0 });
        }
        const inc = (arr: any[], field: keyof DailyPoint) => {
          for (const row of arr) {
            const k = (row.created_at as string).slice(0, 10);
            const point = days.find((d) => d.day === k);
            if (point) (point as any)[field] += 1;
          }
        };
        inc(profiles.data ?? [], "signups");
        inc(allInq, "inquiries");
        inc(allProjects, "projects");
        setSeries(days);

        setRecentProjects(recentProj.data ?? []);
        setRecentSignups((profiles.data ?? []).slice(-5).reverse());

        // real milestone progress for recent projects
        const ids = (recentProj.data ?? []).map((p: any) => p.id);
        if (ids.length) {
          const { data: ms } = await supabase
            .from("project_milestones")
            .select("project_id, status")
            .in("project_id", ids);
          const map: Record<string, { total: number; done: number }> = {};
          for (const m of ms ?? []) {
            const k = (m as any).project_id as string;
            map[k] ??= { total: 0, done: 0 };
            map[k].total += 1;
            if ((m as any).status === "done") map[k].done += 1;
          }
          setMilestonesByProject(map);
        } else {
          setMilestonesByProject({});
        }

        // activity feed: union
        const items: any[] = [];
        for (const p of recentProj.data ?? []) items.push({ icon: FolderKanban, title: "Project updated", sub: p.title, time: p.created_at, color: "text-sky-500 bg-sky-500/15" });
        for (const i of recentInq.data ?? []) items.push({ icon: Inbox, title: "New inquiry", sub: `${i.name} — ${i.project_type}`, time: i.created_at, color: "text-amber-500 bg-amber-500/15" });
        for (const u of recentUpd.data ?? []) items.push({ icon: CheckCircle2, title: "Project update posted", sub: u.message.slice(0, 60), time: u.created_at, color: "text-emerald-500 bg-emerald-500/15" });
        for (const c of recentContact.data ?? []) items.push({ icon: Megaphone, title: "Contact message", sub: c.name, time: c.created_at, color: "text-violet-500 bg-violet-500/15" });
        items.sort((a, b) => +new Date(b.time) - +new Date(a.time));
        setActivity(items.slice(0, 8).map((x) => ({ ...x, time: relativeTime(x.time) })));
      } catch (e) {
        console.error(e);
        setDbOk(false);
      }
    }
    load();
    const c = supabase
      .channel("admin-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "client_projects" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "project_inquiries" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "project_milestones" }, load)
      .subscribe();
    return () => { supabase.removeChannel(c); };
  }, []);

  const totalProgress = useMemo(() => {
    return recentProjects.map((p) => {
      const m = milestonesByProject[p.id];
      const progress = m && m.total > 0
        ? Math.round((m.done / m.total) * 100)
        : p.stage === "completed" ? 100 : 0;
      return { ...p, progress };
    });
  }, [recentProjects, milestonesByProject]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const seriesLabel = seriesMode === "signups" ? "New signups" : seriesMode === "inquiries" ? "New inquiries" : "New projects";

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
      <div className="flex flex-col gap-5 min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif tracking-tight">{greeting}, Admin 👋</h1>
            <p className="text-ink/60 mt-2 text-sm">
              Live snapshot of <span className="text-brand font-semibold">OKIKE</span>.
            </p>
          </div>
        </div>

        {/* 6 real stat tiles */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Stat icon={Users} label="Total Users" value={String(counts.users)} />
          <Stat icon={Inbox} label="Open Inquiries" value={String(counts.inquiriesOpen)} />
          <Stat icon={FolderKanban} label="Projects Running" value={String(counts.projectsRunning)} />
          <Stat icon={CheckCircle2} label="Projects Completed" value={String(counts.projectsCompleted)} />
          <Stat icon={Wallet} label="Pipeline Total" value={fmtMoney(counts.revenue)} />
          <Stat icon={Megaphone} label="Contact Msgs" value={String(counts.contactOpen)} />
        </div>

        {/* Analytics + Roles */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5">
          <section className="rounded-2xl bg-card ring-1 ring-ink/10 p-6">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h2 className="font-semibold">Platform Activity (last 14 days)</h2>
            </div>
            <div className="flex gap-1.5 mb-4 flex-wrap">
              {(["signups", "inquiries", "projects"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setSeriesMode(m)}
                  className={`text-xs px-3 py-1.5 rounded-lg capitalize transition ${
                    seriesMode === m ? "bg-brand/15 text-brand ring-1 ring-brand/30" : "text-ink/60 hover:bg-ink/5 ring-1 ring-transparent"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="h-56 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="day" tickFormatter={(d) => d.slice(5)} tick={{ fontSize: 10, fill: "oklch(0.7 0.005 95 / 60%)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "oklch(0.7 0.005 95 / 60%)" }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "oklch(0.22 0.004 90)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey={seriesMode} name={seriesLabel} stroke="oklch(0.82 0.18 95)" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-2xl bg-card ring-1 ring-ink/10 p-6 flex flex-col">
            <h2 className="font-semibold mb-4">Users by Role</h2>
            {roleData.length === 0 ? (
              <div className="text-sm text-ink/40">No users yet.</div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="size-32 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={roleData} dataKey="value" cx="50%" cy="50%" innerRadius={36} outerRadius={58} paddingAngle={2}>
                        {roleData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="flex-1 space-y-2 text-xs">
                  {roleData.map((d) => (
                    <li key={d.name} className="flex items-center gap-2">
                      <span className="size-2 rounded-full shrink-0" style={{ background: d.color }} />
                      <span className="text-ink/80 flex-1 truncate">{d.name}</span>
                      <span className="font-semibold tabular-nums">{d.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5 pt-5 border-t border-ink/10">
              <h3 className="font-semibold text-sm mb-3">Recent Signups</h3>
              {recentSignups.length === 0 ? (
                <div className="text-sm text-ink/40">No signups yet.</div>
              ) : (
                <ul className="space-y-2.5">
                  {recentSignups.map((u: any) => (
                    <li key={u.id} className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-brand/20 ring-1 ring-brand/30 grid place-items-center text-xs font-semibold text-brand shrink-0">
                        {(u.full_name || u.email || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{u.full_name || u.email}</div>
                      </div>
                      <span className="text-xs text-ink/40 shrink-0">{relativeTime(u.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        {/* Recent Projects + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5">
          <section className="rounded-2xl bg-card ring-1 ring-ink/10 overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between">
              <h2 className="font-semibold">Recent Projects</h2>
              <Link to="/admin/projects" className="text-xs text-brand hover:underline">View all</Link>
            </div>
            {totalProgress.length === 0 ? (
              <div className="px-6 py-8 text-sm text-ink/40">No projects yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-ink/40 border-y border-ink/10">
                      <th className="text-left font-medium px-6 py-2.5">Project</th>
                      <th className="text-left font-medium px-2 py-2.5">Client</th>
                      <th className="text-left font-medium px-2 py-2.5">Stage</th>
                      <th className="text-left font-medium px-2 py-2.5">Progress</th>
                      <th className="text-left font-medium px-6 py-2.5">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    {totalProgress.map((p: any) => (
                      <tr key={p.id} className="hover:bg-ink/5">
                        <td className="px-6 py-3 font-medium">{p.title}</td>
                        <td className="px-2 py-3 text-ink/70">{p.client_email}</td>
                        <td className="px-2 py-3">
                          <span className="text-[10px] font-semibold px-2 py-1 rounded-md ring-1 bg-brand/10 text-brand ring-brand/20 capitalize">
                            {p.stage.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 rounded-full bg-ink/10 overflow-hidden">
                              <div className="h-full bg-brand rounded-full" style={{ width: `${p.progress}%` }} />
                            </div>
                            <span className="text-xs text-ink/70 tabular-nums">{p.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-ink/60">{p.total ? fmtMoney(p.total) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-card ring-1 ring-ink/10 p-6">
            <h2 className="font-semibold mb-5">Platform Activity</h2>
            {activity.length === 0 ? (
              <div className="text-sm text-ink/40">No activity yet.</div>
            ) : (
              <ul className="space-y-4">
                {activity.map((a, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className={`size-9 rounded-xl grid place-items-center shrink-0 ring-1 ring-ink/10 ${a.color}`}>
                      <a.icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{a.title}</div>
                      <div className="text-xs text-ink/50 truncate">{a.sub}</div>
                    </div>
                    <span className="text-xs text-ink/40 shrink-0">{a.time}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Summary tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryTile icon={Inbox} value={String(counts.inquiriesOpen)} label="Open Inquiries" sub="Need review" color="text-amber-500 bg-amber-500/15" />
          <SummaryTile icon={FolderKanban} value={String(counts.projectsRunning)} label="In Progress" sub="Active projects" color="text-sky-500 bg-sky-500/15" />
          <SummaryTile icon={CheckCircle2} value={String(counts.projectsCompleted)} label="Completed" sub="Shipped" color="text-emerald-500 bg-emerald-500/15" />
          <SummaryTile icon={Megaphone} value={String(counts.contactOpen)} label="Contact Msgs" sub="Inbox" color="text-violet-500 bg-violet-500/15" />
        </div>
      </div>

      {/* Right rail */}
      <aside className="flex flex-col gap-5">
        <section className="rounded-2xl bg-card ring-1 ring-ink/10 p-5">
          <h3 className="font-semibold text-sm mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <QAction icon={Inbox} label="Inquiries" to="/admin/inquiries" />
            <QAction icon={FolderKanban} label="Projects" to="/admin/projects" />
            <QAction icon={UserPlus2} label="Services" to="/admin/content/services" />
            <QAction icon={ClipboardList} label="Packages" to="/admin/content/packages" />
            <QAction icon={FileBarChart} label="Portfolio" to="/admin/content/portfolio_items" />
            <QAction icon={Megaphone} label="Settings" to="/admin/settings" />
          </div>
        </section>

        <section className="rounded-2xl bg-card ring-1 ring-ink/10 p-5">
          <h3 className="font-semibold text-sm mb-4">System Health</h3>
          <ul className="space-y-3">
            <HealthRow icon={Database} label="Database" ok={dbOk} />
          </ul>
          <Link to="/admin/system-health" className="text-xs text-brand hover:underline mt-3 inline-block">Open status →</Link>
        </section>
      </aside>
    </div>
  );
}

function fmtMoney(n: number) {
  if (!n) return "—";
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1000) return "$" + (n / 1000).toFixed(1) + "K";
  return "$" + n.toFixed(0);
}

function relativeTime(iso: string) {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card ring-1 ring-ink/10 p-4 hover:ring-brand/30 transition">
      <div className="flex items-center gap-2 mb-2">
        <div className="size-7 rounded-lg bg-brand/15 ring-1 ring-brand/20 grid place-items-center text-brand">
          <Icon className="size-3.5" />
        </div>
        <span className="text-[11px] text-ink/60">{label}</span>
      </div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function SummaryTile({ icon: Icon, value, label, sub, color }: { icon: any; value: string; label: string; sub: string; color: string }) {
  return (
    <div className="rounded-2xl bg-card ring-1 ring-ink/10 p-4 flex items-center gap-3">
      <div className={`size-11 rounded-xl grid place-items-center shrink-0 ring-1 ring-ink/10 ${color}`}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xl font-semibold tracking-tight">{value}</div>
        <div className="text-xs font-medium truncate">{label}</div>
        <div className="text-[10px] text-ink/40 truncate">{sub}</div>
      </div>
    </div>
  );
}

function QAction({ icon: Icon, label, to }: { icon: any; label: string; to: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 rounded-xl bg-secondary ring-1 ring-ink/10 px-3 py-2.5 hover:ring-brand/30 hover:bg-brand/5 transition">
      <Icon className="size-4 text-brand shrink-0" />
      <span className="text-xs text-ink/80 truncate">{label}</span>
      <ArrowUpRight className="size-3 text-ink/40 ml-auto" />
    </Link>
  );
}

function HealthRow({ icon: Icon, label, ok }: { icon: any; label: string; ok: boolean }) {
  return (
    <li className="flex items-center gap-3">
      <div className="size-8 rounded-lg bg-brand/15 ring-1 ring-brand/20 grid place-items-center text-brand">
        <Icon className="size-4" />
      </div>
      <span className="flex-1 text-sm">{label}</span>
      <span className={`text-xs flex items-center gap-1.5 ${ok ? "text-emerald-500" : "text-rose-500"}`}>
        {ok ? "Operational" : "Degraded"} <span className={`size-1.5 rounded-full ${ok ? "bg-emerald-500" : "bg-rose-500"}`} />
      </span>
    </li>
  );
}
