import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { useServerFn } from "@tanstack/react-start";
import { askAssistant } from "@/lib/ai-assistant.functions";
import { toast } from "sonner";
import heroImg from "@/assets/dashboard-hero.jpg";
import {
  LayoutDashboard,
  FolderKanban,
  Sparkles,
  MessageSquare,
  FileText,
  Calendar,
  Flag,
  Settings,
  Bell,
  ChevronRight,
  Crown,
  LogOut,
  Shield,
  ArrowRight,
  Send,
  CheckCircle2,
  Loader2,
  Inbox,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — OKIKE" }] }),
  component: DashboardPage,
});

type Section =
  | "dashboard"
  | "projects"
  | "ai"
  | "messages"
  | "files"
  | "calendar"
  | "milestones"
  | "settings";

const NAV: { key: Section; label: string; icon: LucideIcon }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "projects", label: "Projects", icon: FolderKanban },
  { key: "ai", label: "AI Assistant", icon: Sparkles },
  { key: "messages", label: "Messages", icon: MessageSquare },
  { key: "files", label: "Files", icon: FileText },
  { key: "calendar", label: "Calendar", icon: Calendar },
  { key: "milestones", label: "Milestones", icon: Flag },
  { key: "settings", label: "Settings", icon: Settings },
];

type Project = {
  id: string;
  title: string;
  package_name: string | null;
  stage: string;
  created_at: string;
  total: number | null;
};
type Milestone = { id: string; project_id: string; name: string; status: string; position: number };
type Update = { id: string; project_id: string; message: string; created_at: string };

function DashboardPage() {
  const { session, loading, user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("dashboard");
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login" });
  }, [loading, session, navigate]);

  useEffect(() => {
    if (!session) return;
    let active = true;

    async function load() {
      const [{ data: p }, { data: m }, { data: u }] = await Promise.all([
        supabase
          .from("client_projects")
          .select("id, title, package_name, stage, created_at, total")
          .order("created_at", { ascending: false }),
        supabase
          .from("project_milestones")
          .select("id, project_id, name, status, position")
          .order("position"),
        supabase
          .from("project_updates")
          .select("id, project_id, message, created_at")
          .order("created_at", { ascending: false })
          .limit(8),
      ]);
      if (!active) return;
      setProjects((p ?? []) as Project[]);
      setMilestones((m ?? []) as Milestone[]);
      setUpdates((u ?? []) as Update[]);
      setDataLoading(false);
    }
    load();

    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "client_projects" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "project_milestones" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "project_updates" }, load)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [session]);

  const stats = useMemo(() => {
    const active = projects.filter(
      (p) => p.stage === "in_progress" || p.stage === "accepted",
    ).length;
    const completed = projects.filter((p) => p.stage === "completed").length;
    const submitted = projects.filter(
      (p) => p.stage === "submitted" || p.stage === "reviewing",
    ).length;
    return { active, completed, submitted };
  }, [projects]);

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-secondary text-ink flex items-center justify-center text-ink/40">
        Loading…
      </div>
    );
  }

  const fullName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there";
  const firstName = fullName.split(" ")[0];
  const initial = fullName.charAt(0).toUpperCase();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen bg-background text-ink">
      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-0 h-screen w-14 sm:w-16 lg:w-60 shrink-0 flex flex-col border-r border-ink/10 bg-card px-2 lg:px-4 py-5 transition-[width]">
          <div className="px-1 lg:px-2">
            <Link
              to="/"
              className="block text-xl lg:text-2xl font-semibold tracking-tight text-brand text-center lg:text-left"
            >
              <span className="lg:hidden">O</span>
              <span className="hidden lg:inline">OKIKE</span>
            </Link>
            <div className="hidden lg:block text-[11px] text-ink/50 mt-0.5">
              Your Digital Ecosystem
            </div>
          </div>

          <nav className="mt-7 flex-1 flex flex-col gap-1 overflow-y-auto">
            {NAV.map((t) => {
              const active = section === t.key;
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setSection(t.key)}
                  title={t.label}
                  className={`w-full flex items-center gap-3 rounded-xl px-2 lg:px-3 py-2.5 text-sm font-medium transition text-left justify-center lg:justify-start ${
                    active
                      ? "bg-brand/15 text-brand ring-1 ring-brand/25"
                      : "text-ink/70 hover:text-ink hover:bg-ink/5"
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="hidden lg:inline flex-1">{t.label}</span>
                </button>
              );
            })}

            {role === "admin" && (
              <Link
                to="/admin"
                title="Admin panel"
                className="mt-3 flex items-center gap-3 rounded-xl px-2 lg:px-3 py-2.5 text-sm font-medium text-ink/70 hover:text-brand hover:bg-ink/5 ring-1 ring-ink/10 justify-center lg:justify-start"
              >
                <Shield className="size-4 shrink-0" />
                <span className="hidden lg:inline">Admin panel</span>
              </Link>
            )}
          </nav>

          <Link
            to="/book"
            className="mt-4 rounded-2xl p-2 lg:p-3 bg-gradient-to-br from-brand/25 to-brand/5 ring-1 ring-brand/25 flex items-center gap-3 hover:from-brand/35 transition justify-center lg:justify-start"
          >
            <div className="size-9 rounded-xl bg-brand/25 ring-1 ring-brand/40 grid place-items-center text-brand shrink-0">
              <Crown className="size-4" />
            </div>
            <div className="hidden lg:block flex-1 min-w-0">
              <div className="text-sm font-medium">Start a project</div>
              <div className="text-[11px] text-ink/60">Tell us what to build</div>
            </div>
          </Link>

          <div className="mt-3 flex items-center gap-3 px-1 lg:px-2 py-2 rounded-xl justify-center lg:justify-start">
            <div className="relative shrink-0">
              <div className="size-9 lg:size-10 rounded-full bg-brand/20 ring-2 ring-brand/30 grid place-items-center text-sm font-semibold text-brand">
                {initial}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-400 ring-2 ring-card" />
            </div>
            <div className="hidden lg:block flex-1 min-w-0">
              <div className="text-sm font-medium truncate capitalize">{fullName}</div>
              <div className="text-[11px] text-ink/50 capitalize">{role || "Client"}</div>
            </div>
            <button
              onClick={async () => {
                await signOut();
                navigate({ to: "/" });
              }}
              className="hidden lg:inline-flex text-ink/40 hover:text-brand p-1 rounded"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <header className="sticky top-0 z-30 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-6 py-3 bg-background/80 backdrop-blur border-b border-ink/10">
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-medium capitalize text-ink/80">
                {section === "dashboard" ? "Overview" : section}
              </h2>
            </div>
            <button
              onClick={() => setSection("ai")}
              className="hidden md:inline-flex items-center gap-1.5 rounded-xl bg-brand/15 text-brand ring-1 ring-brand/25 px-3 py-2 text-sm font-medium hover:bg-brand/20"
            >
              <Sparkles className="size-4" /> Ask OKIKE AI
            </button>
            <button
              onClick={() => setSection("messages")}
              className="relative rounded-xl p-2 ring-1 ring-ink/10 hover:bg-ink/5"
              aria-label="Messages"
            >
              <MessageSquare className="size-4 text-ink/70" />
            </button>
            <button
              onClick={() => setSection("dashboard")}
              className="relative rounded-xl p-2 ring-1 ring-ink/10 hover:bg-ink/5"
              aria-label="View latest updates"
              title="View latest updates"
            >
              <Bell className="size-4 text-ink/70" />
              {updates.length > 0 && (
                <span className="absolute -top-1 -right-1 size-4 rounded-full bg-brand text-[10px] font-semibold text-brand-foreground grid place-items-center">
                  {updates.length}
                </span>
              )}
            </button>
            <ThemeToggle />
            <button
              onClick={() => setSection("settings")}
              className="size-8 rounded-full bg-brand/20 ring-2 ring-brand/30 grid place-items-center text-sm font-semibold text-brand hover:bg-brand/30 transition"
              aria-label="Account settings"
              title="Account settings"
            >
              {initial}
            </button>
          </header>

          <main className="flex-1 px-3 sm:px-4 md:px-6 py-5 min-w-0">
            {section === "dashboard" && (
              <DashboardOverview
                firstName={firstName}
                greeting={greeting}
                projects={projects}
                milestones={milestones}
                updates={updates}
                stats={stats}
                loading={dataLoading}
                onOpenAI={() => setSection("ai")}
                onSeeProjects={() => setSection("projects")}
              />
            )}
            {section === "projects" && (
              <ProjectsView projects={projects} milestones={milestones} loading={dataLoading} />
            )}
            {section === "ai" && <AIView firstName={firstName} />}
            {section === "messages" && (
              <EmptyView
                title="No messages yet"
                subtitle="Direct messages between you and the OKIKE team will appear here."
              />
            )}
            {section === "files" && (
              <EmptyView
                title="No files yet"
                subtitle="Files attached to your projects will show up here."
              />
            )}
            {section === "calendar" && (
              <EmptyView
                title="Calendar"
                subtitle="Milestone deadlines and meetings will appear here once scheduled."
              />
            )}
            {section === "milestones" && (
              <MilestonesView projects={projects} milestones={milestones} />
            )}
            {section === "settings" && (
              <SettingsView email={user?.email ?? ""} fullName={fullName} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Overview ---------------- */

function progressFor(projectId: string, milestones: Milestone[]) {
  const own = milestones.filter((m) => m.project_id === projectId);
  if (!own.length) return 0;
  const done = own.filter((m) => m.status === "done").length;
  return Math.round((done / own.length) * 100);
}

function DashboardOverview({
  firstName,
  greeting,
  projects,
  milestones,
  updates,
  stats,
  loading,
  onOpenAI,
  onSeeProjects,
}: {
  firstName: string;
  greeting: string;
  projects: Project[];
  milestones: Milestone[];
  updates: Update[];
  stats: { active: number; completed: number; submitted: number };
  loading: boolean;
  onOpenAI: () => void;
  onSeeProjects: () => void;
}) {
  const active = projects
    .filter((p) => p.stage === "in_progress" || p.stage === "accepted")
    .slice(0, 3);
  const nextMilestone = milestones.find((m) => m.status === "active");

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
      <div className="flex flex-col gap-5 min-w-0">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl ring-1 ring-ink/10 bg-card">
          <img
            src={heroImg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-card via-card/85 to-transparent" />
          <div className="relative p-6 md:p-9 min-h-[220px] flex flex-col justify-center max-w-xl">
            <h1 className="text-3xl md:text-4xl font-serif tracking-tight">
              {greeting}, <span className="capitalize">{firstName}</span> 👋
            </h1>
            <p className="text-ink/70 mt-2 text-sm md:text-base">
              {projects.length === 0
                ? "Welcome to OKIKE. Start your first project to see progress here."
                : `You have ${stats.active} active project${stats.active === 1 ? "" : "s"}.`}
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              {projects.length === 0 ? (
                <Link
                  to="/book"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand text-brand-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90"
                >
                  Start a project <ArrowRight className="size-4" />
                </Link>
              ) : (
                <button
                  onClick={onSeeProjects}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand text-brand-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90"
                >
                  View projects <ArrowRight className="size-4" />
                </button>
              )}
              <button
                onClick={onOpenAI}
                className="inline-flex items-center gap-2 rounded-xl bg-card/80 backdrop-blur ring-1 ring-ink/15 px-4 py-2.5 text-sm font-medium hover:bg-card"
              >
                Open AI Assistant
              </button>
            </div>
          </div>
        </section>

        {/* Stats — only 3 honest tiles */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Active" value={String(stats.active)} sub="Projects in flight" />
          <StatCard label="Completed" value={String(stats.completed)} sub="Shipped projects" />
          <StatCard label="In review" value={String(stats.submitted)} sub="Awaiting acceptance" />
        </div>

        {/* Active projects list */}
        <section className="rounded-2xl bg-card ring-1 ring-ink/10 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold">My Projects</h2>
            <button onClick={onSeeProjects} className="text-xs text-ink/50 hover:text-brand">
              View all
            </button>
          </div>
          {loading ? (
            <div className="text-sm text-ink/40 py-6">Loading…</div>
          ) : active.length === 0 ? (
            <div className="text-sm text-ink/50 py-6">
              No active projects yet.{" "}
              <Link to="/book" className="text-brand hover:underline">
                Start one
              </Link>
              .
            </div>
          ) : (
            <ul className="space-y-3">
              {active.map((p) => {
                const pct = progressFor(p.id, milestones);
                const stageLabel = p.stage === "in_progress" ? "In Progress" : "Accepted";
                return (
                  <li
                    key={p.id}
                    className="rounded-xl ring-1 ring-ink/10 p-4 hover:ring-brand/30 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="size-10 rounded-xl bg-brand/15 ring-1 ring-brand/25 grid place-items-center text-brand shrink-0">
                        <FolderKanban className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{p.title}</div>
                            <div className="text-xs text-ink/50 truncate">
                              {p.package_name ?? "Project"}
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-1 rounded-md bg-brand/15 text-brand font-medium whitespace-nowrap">
                            {stageLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex-1 h-1.5 rounded-full bg-ink/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-brand"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-ink/70 w-9 text-right">
                            {pct}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Right rail */}
      <aside className="flex flex-col gap-5">
        <section className="rounded-2xl bg-card ring-1 ring-ink/10 p-5">
          <h3 className="font-semibold text-sm mb-1">Next up</h3>
          <p className="text-xs text-ink/60 mb-4">Your active milestone.</p>
          {nextMilestone ? (
            <div className="rounded-xl bg-brand/10 ring-1 ring-brand/20 p-4">
              <div className="text-xs uppercase tracking-wider text-brand mb-1">
                Active milestone
              </div>
              <div className="text-base font-medium">{nextMilestone.name}</div>
            </div>
          ) : (
            <div className="text-sm text-ink/50">No active milestone.</div>
          )}
        </section>

        <section className="rounded-2xl bg-card ring-1 ring-ink/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Latest updates</h3>
          </div>
          {updates.length === 0 ? (
            <div className="text-sm text-ink/50">No updates yet.</div>
          ) : (
            <ul className="space-y-3">
              {updates.slice(0, 5).map((u) => (
                <li key={u.id} className="flex items-start gap-3">
                  <div className="size-8 rounded-lg bg-brand/15 ring-1 ring-brand/20 grid place-items-center text-brand shrink-0">
                    <CheckCircle2 className="size-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-ink/80 line-clamp-2">{u.message}</div>
                    <div className="text-[10px] text-ink/40 mt-0.5">
                      {new Date(u.created_at).toLocaleString()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </div>
  );
}

/* ---------------- Projects ---------------- */

function ProjectsView({
  projects,
  milestones,
  loading,
}: {
  projects: Project[];
  milestones: Milestone[];
  loading: boolean;
}) {
  if (loading) return <div className="text-sm text-ink/40">Loading…</div>;
  if (projects.length === 0)
    return (
      <EmptyView
        title="No projects yet"
        subtitle="Submit a project brief and we'll get started."
        ctaLabel="Start a project"
        ctaTo="/book"
      />
    );
  return (
    <div className="grid gap-4">
      {projects.map((p) => {
        const own = milestones.filter((m) => m.project_id === p.id);
        const pct = progressFor(p.id, milestones);
        return (
          <section key={p.id} className="rounded-2xl bg-card ring-1 ring-ink/10 p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium">{p.title}</div>
                <div className="text-xs text-ink/50 mt-0.5">
                  {p.package_name ?? "Project"} · {p.stage.replace("_", " ")}
                </div>
              </div>
              <span className="text-xs text-ink/60">{pct}%</span>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-ink/10 overflow-hidden">
              <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
            </div>
            {own.length > 0 && (
              <ul className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {own.map((m) => (
                  <li
                    key={m.id}
                    className={`rounded-lg p-3 text-xs ring-1 ${
                      m.status === "done"
                        ? "bg-emerald-500/10 ring-emerald-500/20 text-emerald-600"
                        : m.status === "active"
                          ? "bg-brand/10 ring-brand/25 text-brand"
                          : "bg-ink/5 ring-ink/10 text-ink/60"
                    }`}
                  >
                    <div className="font-medium">{m.name}</div>
                    <div className="text-[10px] capitalize mt-0.5 opacity-80">{m.status}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

/* ---------------- Milestones ---------------- */

function MilestonesView({
  projects,
  milestones,
}: {
  projects: Project[];
  milestones: Milestone[];
}) {
  if (milestones.length === 0)
    return (
      <EmptyView
        title="No milestones yet"
        subtitle="Milestones appear once a project enters the build stage."
      />
    );
  return (
    <div className="grid gap-4">
      {projects.map((p) => {
        const own = milestones.filter((m) => m.project_id === p.id);
        if (!own.length) return null;
        return (
          <section key={p.id} className="rounded-2xl bg-card ring-1 ring-ink/10 p-5">
            <div className="font-medium mb-3">{p.title}</div>
            <ol className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {own.map((m) => (
                <li
                  key={m.id}
                  className={`rounded-xl p-4 ring-1 ${
                    m.status === "done"
                      ? "bg-emerald-500/10 ring-emerald-500/20"
                      : m.status === "active"
                        ? "bg-brand/10 ring-brand/25"
                        : "bg-ink/5 ring-ink/10"
                  }`}
                >
                  <div className="text-xs uppercase tracking-wider text-ink/50">{m.position}</div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs capitalize mt-1 text-ink/60">{m.status}</div>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

/* ---------------- AI ---------------- */

type ChatMsg = { role: "user" | "assistant"; content: string };

function AIView({ firstName }: { firstName: string }) {
  const ask = useServerFn(askAssistant);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content: `Hi ${firstName}! I'm OKIKE AI. Ask me anything about your projects, planning, or technical questions.`,
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
      const res = await ask({ data: { messages: next } });
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

  const suggestions = [
    "Summarize the status of my projects",
    "Suggest next steps for an MVP",
    "Explain milestone planning",
  ];

  return (
    <section className="rounded-2xl bg-card ring-1 ring-ink/10 flex flex-col h-[calc(100vh-140px)]">
      <div className="px-5 py-4 border-b border-ink/10 flex items-center gap-2">
        <Sparkles className="size-4 text-brand" />
        <h2 className="font-semibold">OKIKE AI Assistant</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-brand text-brand-foreground" : "bg-secondary ring-1 ring-ink/10"}`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="bg-secondary ring-1 ring-ink/10 rounded-2xl px-4 py-2.5 text-sm flex items-center gap-2 text-ink/60">
              <Loader2 className="size-3.5 animate-spin" /> Thinking…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="px-5 pt-2 pb-3 flex gap-2 flex-wrap border-t border-ink/10">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            className="text-xs px-3 py-1.5 rounded-full bg-secondary ring-1 ring-ink/10 hover:ring-brand/30"
          >
            {s}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="px-5 pb-5 flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything…"
          className="flex-1 bg-secondary ring-1 ring-ink/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-brand/40"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="size-10 rounded-xl bg-brand grid place-items-center text-brand-foreground hover:opacity-90 disabled:opacity-50"
          aria-label="Send"
        >
          <Send className="size-4" />
        </button>
      </form>
    </section>
  );
}

/* ---------------- Settings ---------------- */

function SettingsView({ email, fullName }: { email: string; fullName: string }) {
  return (
    <div className="grid gap-4 max-w-2xl">
      <section className="rounded-2xl bg-card ring-1 ring-ink/10 p-6">
        <h2 className="font-semibold mb-4">Account</h2>
        <div className="grid gap-3 text-sm">
          <div className="flex justify-between border-b border-ink/5 pb-2">
            <span className="text-ink/60">Name</span>
            <span className="capitalize">{fullName}</span>
          </div>
          <div className="flex justify-between border-b border-ink/5 pb-2">
            <span className="text-ink/60">Email</span>
            <span>{email}</span>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------------- Bits ---------------- */

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-card ring-1 ring-ink/10 p-4">
      <div className="text-[11px] text-ink/60">{label}</div>
      <div className="text-2xl font-semibold tracking-tight mt-1">{value}</div>
      <div className="text-[11px] text-ink/50 mt-1">{sub}</div>
    </div>
  );
}

function EmptyView({
  title,
  subtitle,
  ctaLabel,
  ctaTo,
}: {
  title: string;
  subtitle: string;
  ctaLabel?: string;
  ctaTo?: string;
}) {
  return (
    <div className="rounded-2xl bg-card ring-1 ring-ink/10 p-12 text-center">
      <Inbox className="size-8 text-ink/30 mx-auto mb-3" />
      <div className="text-lg font-medium">{title}</div>
      <p className="text-sm text-ink/50 mt-2 max-w-md mx-auto">{subtitle}</p>
      {ctaLabel && ctaTo && (
        <Link
          to={ctaTo}
          className="inline-flex items-center gap-2 mt-5 rounded-xl bg-brand text-brand-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90"
        >
          {ctaLabel} <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}
