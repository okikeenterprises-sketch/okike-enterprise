import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Database,
  FileBarChart,
  FolderKanban,
  Inbox,
  Megaphone,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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
type DailyMetric = Exclude<keyof DailyPoint, "day">;
type ProjectRow = {
  id: string;
  title: string;
  package_name: string | null;
  stage: string;
  total: number | null;
  created_at: string;
  client_email: string;
};
type ProjectWithProgress = ProjectRow & { progress: number };
type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
};
type InquiryRow = {
  id: string;
  name: string;
  project_type: string;
  status: string;
  created_at: string;
};
type ContactRow = { id: string; name: string; message?: string | null; created_at: string };
type ProjectUpdateRow = { id: string; message: string; created_at: string };
type RoleRow = { role: string };
type MilestoneRow = { project_id: string; status: string };
type ActivityItem = {
  icon: LucideIcon;
  title: string;
  sub: string;
  time: string;
  color: string;
};

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
  const [recentProjects, setRecentProjects] = useState<ProjectRow[]>([]);
  const [milestonesByProject, setMilestonesByProject] = useState<
    Record<string, { total: number; done: number }>
  >({});
  const [recentSignups, setRecentSignups] = useState<ProfileRow[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
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
          supabase.from("profiles").select("id, full_name, email, created_at", {
            count: "exact",
          }),
          supabase.from("project_inquiries").select("id, name, project_type, status, created_at", {
            count: "exact",
          }),
          supabase
            .from("client_projects")
            .select("id, title, package_name, stage, total, created_at, client_email", {
              count: "exact",
            }),
          supabase.from("contact_messages").select("id, name, created_at", { count: "exact" }),
          supabase.from("user_roles").select("role"),
          supabase
            .from("client_projects")
            .select("id, title, package_name, stage, total, created_at, client_email")
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("project_inquiries")
            .select("id, name, project_type, status, created_at")
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("project_updates")
            .select("id, message, created_at")
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("contact_messages")
            .select("id, name, message, created_at")
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        const allProjects = (projects.data ?? []) as ProjectRow[];
        const allInq = (inquiries.data ?? []) as InquiryRow[];

        setCounts({
          users: profiles.count ?? 0,
          inquiries: inquiries.count ?? 0,
          inquiriesOpen: allInq.filter((i) => i.status === "new" || i.status === "reviewing")
            .length,
          projectsRunning: allProjects.filter(
            (p) => p.stage === "in_progress" || p.stage === "accepted",
          ).length,
          projectsCompleted: allProjects.filter((p) => p.stage === "completed").length,
          contactOpen: contact.count ?? 0,
          revenue: allProjects.reduce((sum, p) => sum + Number(p.total ?? 0), 0),
        });

        const roleCounts: Record<string, number> = {};
        for (const r of (roles.data ?? []) as RoleRow[]) {
          const role = r.role;
          roleCounts[role] = (roleCounts[role] ?? 0) + 1;
        }
        setRoleData(
          Object.entries(roleCounts).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1) + "s",
            value,
            color: ROLE_COLORS[name] ?? "oklch(0.6 0.1 200)",
          })),
        );

        const days: DailyPoint[] = [];
        const today = new Date();
        for (let i = 13; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          days.push({
            day: d.toISOString().slice(0, 10),
            signups: 0,
            inquiries: 0,
            projects: 0,
          });
        }

        const incrementSeries = (rows: { created_at: string }[], field: DailyMetric) => {
          for (const row of rows) {
            const key = (row.created_at as string).slice(0, 10);
            const point = days.find((d) => d.day === key);
            if (point) point[field] += 1;
          }
        };
        incrementSeries(profiles.data ?? [], "signups");
        incrementSeries(allInq, "inquiries");
        incrementSeries(allProjects, "projects");
        setSeries(days);

        const recentProjectRows = (recentProj.data ?? []) as ProjectRow[];
        setRecentProjects(recentProjectRows);
        setRecentSignups(((profiles.data ?? []) as ProfileRow[]).slice(-5).reverse());

        const ids = recentProjectRows.map((p) => p.id);
        if (ids.length) {
          const { data: milestones } = await supabase
            .from("project_milestones")
            .select("project_id, status")
            .in("project_id", ids);
          const progressMap: Record<string, { total: number; done: number }> = {};
          for (const m of (milestones ?? []) as MilestoneRow[]) {
            const projectId = m.project_id;
            progressMap[projectId] ??= { total: 0, done: 0 };
            progressMap[projectId].total += 1;
            if (m.status === "done") progressMap[projectId].done += 1;
          }
          setMilestonesByProject(progressMap);
        } else {
          setMilestonesByProject({});
        }

        const items: ActivityItem[] = [];
        for (const p of recentProjectRows) {
          items.push({
            icon: FolderKanban,
            title: "Project updated",
            sub: p.title,
            time: p.created_at,
            color: "text-sky-500 bg-sky-500/15",
          });
        }
        for (const i of (recentInq.data ?? []) as InquiryRow[]) {
          items.push({
            icon: Inbox,
            title: "New inquiry",
            sub: `${i.name} - ${i.project_type}`,
            time: i.created_at,
            color: "text-amber-500 bg-amber-500/15",
          });
        }
        for (const u of (recentUpd.data ?? []) as ProjectUpdateRow[]) {
          items.push({
            icon: CheckCircle2,
            title: "Project update posted",
            sub: u.message.slice(0, 60),
            time: u.created_at,
            color: "text-emerald-500 bg-emerald-500/15",
          });
        }
        for (const c of (recentContact.data ?? []) as ContactRow[]) {
          items.push({
            icon: Megaphone,
            title: "Contact message",
            sub: c.name,
            time: c.created_at,
            color: "text-violet-500 bg-violet-500/15",
          });
        }
        items.sort((a, b) => +new Date(b.time) - +new Date(a.time));
        setActivity(items.slice(0, 8).map((item) => ({ ...item, time: relativeTime(item.time) })));
        setDbOk(true);
      } catch (e) {
        console.error(e);
        setDbOk(false);
      }
    }

    load();
    const channel = supabase
      .channel("admin-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "client_projects" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "project_inquiries" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "project_milestones" }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const totalProgress = useMemo(() => {
    return recentProjects.map((project) => {
      const milestones = milestonesByProject[project.id];
      const progress =
        milestones && milestones.total > 0
          ? Math.round((milestones.done / milestones.total) * 100)
          : project.stage === "completed"
            ? 100
            : 0;
      return { ...project, progress };
    });
  }, [recentProjects, milestonesByProject]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const seriesLabel =
    seriesMode === "signups"
      ? "New signups"
      : seriesMode === "inquiries"
        ? "New inquiries"
        : "New projects";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <section className="overflow-hidden rounded-2xl bg-card ring-1 ring-ink/10">
        <div className="grid gap-6 p-6 md:p-8 xl:grid-cols-[1fr_340px]">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
              Admin overview
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              {greeting}, Admin
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/60">
              A focused snapshot of OKIKE operations: leads, project movement, users, and pipeline
              value at a glance.
            </p>
          </div>

          <div className="grid content-start gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <StatusPill
              icon={Database}
              label="Database"
              value={dbOk ? "Operational" : "Degraded"}
              ok={dbOk}
            />
            <MiniMetric label="Total inquiries" value={String(counts.inquiries)} />
            <MiniMetric label="Messages" value={String(counts.contactOpen)} />
          </div>
        </div>

        <div className="grid border-t border-ink/10 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard icon={Users} label="Total users" value={String(counts.users)} />
          <KpiCard icon={Inbox} label="Open inquiries" value={String(counts.inquiriesOpen)} />
          <KpiCard
            icon={FolderKanban}
            label="Active projects"
            value={String(counts.projectsRunning)}
          />
          <KpiCard icon={Wallet} label="Pipeline value" value={fmtMoney(counts.revenue)} />
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-8">
          <section className="rounded-2xl bg-card p-6 ring-1 ring-ink/10 md:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Platform activity</h2>
                <p className="mt-1 text-sm text-ink/50">Last 14 days</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["signups", "inquiries", "projects"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSeriesMode(mode)}
                    className={`rounded-lg px-3 py-1.5 text-xs capitalize transition ${
                      seriesMode === mode
                        ? "bg-brand/15 text-brand ring-1 ring-brand/30"
                        : "text-ink/60 ring-1 ring-ink/10 hover:bg-ink/5"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="day"
                    tickFormatter={(day) => day.slice(5)}
                    tick={{ fontSize: 11, fill: "oklch(0.7 0.005 95 / 60%)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "oklch(0.7 0.005 95 / 60%)" }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.22 0.004 90)",
                      border: "1px solid oklch(1 0 0 / 10%)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey={seriesMode}
                    name={seriesLabel}
                    stroke="oklch(0.82 0.18 95)"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl bg-card ring-1 ring-ink/10">
            <div className="flex items-center justify-between gap-4 px-6 py-5 md:px-7">
              <div>
                <h2 className="text-lg font-semibold">Recent projects</h2>
                <p className="mt-1 text-sm text-ink/50">Latest client work and delivery status</p>
              </div>
              <Link to="/admin/projects" className="shrink-0 text-sm text-brand hover:underline">
                View all
              </Link>
            </div>
            {totalProgress.length === 0 ? (
              <div className="px-6 py-10 text-sm text-ink/40 md:px-7">No projects yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-y border-ink/10 text-[10px] uppercase tracking-wider text-ink/40">
                      <th className="px-6 py-3 text-left font-medium md:px-7">Project</th>
                      <th className="px-3 py-3 text-left font-medium">Client</th>
                      <th className="px-3 py-3 text-left font-medium">Stage</th>
                      <th className="px-3 py-3 text-left font-medium">Progress</th>
                      <th className="px-6 py-3 text-left font-medium md:px-7">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    {totalProgress.map((project: ProjectWithProgress) => (
                      <tr key={project.id} className="hover:bg-ink/5">
                        <td className="px-6 py-4 font-medium md:px-7">{project.title}</td>
                        <td className="max-w-[220px] truncate px-3 py-4 text-ink/70">
                          {project.client_email}
                        </td>
                        <td className="px-3 py-4">
                          <span className="rounded-md bg-brand/10 px-2 py-1 text-[10px] font-semibold capitalize text-brand ring-1 ring-brand/20">
                            {project.stage.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-ink/10">
                              <div
                                className="h-full rounded-full bg-brand"
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                            <span className="w-9 text-right text-xs tabular-nums text-ink/70">
                              {project.progress}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-ink/60 md:px-7">
                          {project.total ? fmtMoney(project.total) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          <section className="rounded-2xl bg-card p-5 ring-1 ring-ink/10">
            <h2 className="font-semibold">Quick actions</h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <QAction icon={Inbox} label="Inquiries" to="/admin/inquiries" />
              <QAction icon={FolderKanban} label="Projects" to="/admin/projects" />
              <QAction icon={ClipboardList} label="Packages" to="/admin/content/packages" />
              <QAction icon={FileBarChart} label="Portfolio" to="/admin/content/portfolio_items" />
            </div>
          </section>

          <section className="rounded-2xl bg-card p-5 ring-1 ring-ink/10">
            <h2 className="font-semibold">Users by role</h2>
            {roleData.length === 0 ? (
              <div className="mt-4 text-sm text-ink/40">No users yet.</div>
            ) : (
              <div className="mt-5 flex items-center gap-5">
                <div className="size-28 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={roleData}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={34}
                        outerRadius={52}
                        paddingAngle={2}
                      >
                        {roleData.map((d, i) => (
                          <Cell key={i} fill={d.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="min-w-0 flex-1 space-y-2 text-xs">
                  {roleData.map((d) => (
                    <li key={d.name} className="flex items-center gap-2">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ background: d.color }}
                      />
                      <span className="flex-1 truncate text-ink/80">{d.name}</span>
                      <span className="font-semibold tabular-nums">{d.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-card p-5 ring-1 ring-ink/10">
            <h2 className="font-semibold">Latest activity</h2>
            {activity.length === 0 ? (
              <div className="mt-4 text-sm text-ink/40">No activity yet.</div>
            ) : (
              <ul className="mt-5 space-y-4">
                {activity.slice(0, 6).map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <li key={index} className="flex items-start gap-3">
                      <div
                        className={`grid size-9 shrink-0 place-items-center rounded-xl ring-1 ring-ink/10 ${item.color}`}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{item.title}</div>
                        <div className="truncate text-xs text-ink/50">{item.sub}</div>
                      </div>
                      <span className="shrink-0 text-xs text-ink/40">{item.time}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-2xl bg-card p-5 ring-1 ring-ink/10">
            <h2 className="font-semibold">Recent signups</h2>
            {recentSignups.length === 0 ? (
              <div className="mt-4 text-sm text-ink/40">No signups yet.</div>
            ) : (
              <ul className="mt-5 space-y-3">
                {recentSignups.map((user) => (
                  <li key={user.id} className="flex items-center gap-3">
                    <div className="grid size-8 shrink-0 place-items-center rounded-full bg-brand/20 text-xs font-semibold text-brand ring-1 ring-brand/30">
                      {(user.full_name || user.email || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {user.full_name || user.email}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-ink/40">
                      {relativeTime(user.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function fmtMoney(n: number) {
  if (!n) return "—";
  if (n >= 1_000_000) return "₦" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1000) return "₦" + (n / 1000).toFixed(1) + "K";
  return "₦" + n.toFixed(0);
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

function KpiCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="border-ink/10 p-5 first:border-0 sm:border-l xl:border-l">
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-brand/15 text-brand ring-1 ring-brand/20">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium text-ink/50">{label}</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary px-4 py-3 ring-1 ring-ink/10">
      <div className="text-xs text-ink/50">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function StatusPill({
  icon: Icon,
  label,
  value,
  ok,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-secondary px-4 py-3 ring-1 ring-ink/10">
      <div className="grid size-9 place-items-center rounded-lg bg-brand/15 text-brand ring-1 ring-brand/20">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-ink/50">{label}</div>
        <div
          className={`mt-1 flex items-center gap-1.5 text-sm font-medium ${
            ok ? "text-emerald-500" : "text-rose-500"
          }`}
        >
          {value}
          <span className={`size-1.5 rounded-full ${ok ? "bg-emerald-500" : "bg-rose-500"}`} />
        </div>
      </div>
    </div>
  );
}

function QAction({ icon: Icon, label, to }: { icon: LucideIcon; label: string; to: string }) {
  return (
    <Link
      to={to}
      className="flex min-h-20 flex-col justify-between rounded-xl bg-secondary p-3 text-sm ring-1 ring-ink/10 transition hover:bg-brand/5 hover:ring-brand/30"
    >
      <Icon className="size-4 shrink-0 text-brand" />
      <span className="mt-3 flex items-center gap-2 text-ink/80">
        <span className="truncate">{label}</span>
        <ArrowUpRight className="ml-auto size-3 shrink-0 text-ink/40" />
      </span>
    </Link>
  );
}
