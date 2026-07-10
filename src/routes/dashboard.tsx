import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { useServerFn } from "@tanstack/react-start";
import { askAssistant, generateInsights } from "@/lib/ai-assistant.functions";
import { toast } from "sonner";
import { verifyProjectDeposit } from "@/lib/forms.functions";
import heroImg from "@/assets/dashboard-hero.jpg";
import okikeLogo from "@/assets/okike-logo.png";
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
  BookOpen,
  GraduationCap,
  Clock,
  Play,
  CheckCircle,
  Award,
  MoreHorizontal,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — OKIKE" }] }),
  component: DashboardPage,
});

type Section =
  | "dashboard"
  | "projects"
  | "courses"
  | "ai"
  | "messages"
  | "files"
  | "calendar"
  | "milestones"
  | "settings";

const NAV: { key: Section; label: string; icon: LucideIcon }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "projects", label: "Projects", icon: FolderKanban },
  { key: "courses", label: "My Courses", icon: BookOpen },
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
  deposit: number | null;
  currency: string;
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
          .select("id, title, package_name, stage, created_at, total, deposit, currency")
          .eq("client_user_id", session!.user.id)
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

  const verifyDeposit = useServerFn(verifyProjectDeposit);

  function handlePayDeposit(project: Project) {
    if (!user?.email || !project.deposit) return;
    
    const koraKey = import.meta.env.VITE_KORAPAY_PUBLIC_KEY;
    if (!koraKey) {
      toast.error("Payment setup is missing. Please contact support.");
      return;
    }

    const korapay = (window as any).Korapay;
    if (!korapay) {
      toast.error("Payment gateway failed to load. Please refresh and try again.");
      return;
    }

    const reference = `project_dep_${project.id}_${Date.now()}`;
    const clientName = user.user_metadata?.full_name || user.email.split("@")[0];

    korapay.initialize({
      key: koraKey,
      reference,
      amount: project.deposit,
      currency: project.currency || "NGN",
      customer: {
        name: clientName,
        email: user.email,
      },
      onSuccess: async (transaction: any) => {
        toast.loading("Confirming deposit payment...");
        try {
          const res = await verifyDeposit({
            data: {
              projectId: project.id,
              reference,
            },
          });
          toast.dismiss();
          if (res.ok) {
            toast.success("Deposit paid! Your project is now in progress.");
            window.location.reload();
          } else {
            toast.error(res.error || "Failed to verify deposit. Please contact support.");
          }
        } catch (err) {
          toast.dismiss();
          toast.error("Verification failed. We will manually check the payment.");
        }
      },
      onFailed: () => {
        toast.error("Payment failed. Please try again.");
      },
      onClose: () => {
        toast.warning("Payment window closed.");
      },
    });
  }

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
        {/* ── SIDEBAR (desktop only) ── */}
        <aside className="hidden lg:flex sticky top-0 h-screen w-60 shrink-0 flex-col border-r border-ink/10 bg-card px-4 py-5">
          <div className="px-2">
            <Link to="/" className="flex items-center" aria-label="OKIKE home">
              <img src={okikeLogo} alt="OKIKE" className="h-8 w-auto" />
            </Link>
            <div className="text-[11px] text-ink/50 mt-0.5">Your Digital Ecosystem</div>
          </div>

          <nav className="mt-7 flex-1 flex flex-col gap-1 overflow-y-auto">
            {NAV.map((t) => {
              const active = section === t.key;
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setSection(t.key)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition text-left ${active
                    ? "bg-brand/15 text-brand ring-1 ring-brand/25"
                    : "text-ink/70 hover:text-ink hover:bg-ink/5"
                    }`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="flex-1">{t.label}</span>
                </button>
              );
            })}

            {role === "admin" && (
              <Link
                to="/admin"
                className="mt-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/70 hover:text-brand hover:bg-ink/5 ring-1 ring-ink/10"
              >
                <Shield className="size-4 shrink-0" />
                <span>Admin panel</span>
              </Link>
            )}
          </nav>

          <Link
            to="/book"
            className="mt-4 rounded-2xl p-3 bg-gradient-to-br from-brand/25 to-brand/5 ring-1 ring-brand/25 flex items-center gap-3 hover:from-brand/35 transition"
          >
            <div className="size-9 rounded-xl bg-brand/25 ring-1 ring-brand/40 grid place-items-center text-brand shrink-0">
              <Crown className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">Start a project</div>
              <div className="text-[11px] text-ink/60">Tell us what to build</div>
            </div>
          </Link>

          <div className="mt-3 flex items-center gap-3 px-2 py-2 rounded-xl">
            <div className="relative shrink-0">
              <div className="size-10 rounded-full bg-brand/20 ring-2 ring-brand/30 grid place-items-center text-sm font-semibold text-brand">
                {initial}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-400 ring-2 ring-card" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate capitalize">{fullName}</div>
              <div className="text-[11px] text-ink/50 capitalize">{role || "Client"}</div>
            </div>
            <button
              onClick={async () => { await signOut(); navigate({ to: "/" }); }}
              className="text-ink/40 hover:text-brand p-1 rounded"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          {/* ── MOBILE HEADER ── */}
          <header className="sticky top-0 z-30 flex items-center gap-2 sm:gap-3 px-4 py-3 bg-background/90 backdrop-blur border-b border-ink/10">
            {/* Mobile: logo + greeting */}
            <Link to="/" className="lg:hidden shrink-0" aria-label="OKIKE home">
              <img src={okikeLogo} alt="OKIKE" className="h-6 w-auto" />
            </Link>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-medium capitalize text-ink/80 lg:block hidden">
                {section === "dashboard" ? "Overview" : section}
              </h2>
              <h2 className="text-sm font-medium text-ink/80 lg:hidden capitalize">
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

          <main className="flex-1 px-3 sm:px-4 md:px-6 py-5 min-w-0 pb-24 lg:pb-5">
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
                onPayDeposit={handlePayDeposit}
              />
            )}
            {section === "projects" && (
              <ProjectsView projects={projects} milestones={milestones} loading={dataLoading} onPayDeposit={handlePayDeposit} />
            )}
            {section === "courses" && <CoursesView />}
            {section === "ai" && (
              <AIView
                firstName={firstName}
                projects={projects}
                milestones={milestones}
                updates={updates}
              />
            )}
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

      {/* ── MOBILE BOTTOM NAV ── */}
      <MobileBottomNav section={section} setSection={setSection} />
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
  onPayDeposit,
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
  onPayDeposit: (p: Project) => void;
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
                const symbol = p.currency === "NGN" ? "₦" : "$";
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
                        {p.stage === "accepted" && p.deposit && (
                          <div className="mt-3 pt-3 border-t border-ink/5 flex items-center justify-between gap-3">
                            <span className="text-xs font-medium text-ink/70">Deposit: {symbol}{Number(p.deposit).toLocaleString()}</span>
                            <button
                              type="button"
                              onClick={() => onPayDeposit(p)}
                              className="px-3 py-1.5 rounded-full bg-brand text-brand-foreground font-semibold text-[10px] uppercase tracking-wider hover:opacity-90 transition animate-pulse"
                            >
                              Pay Deposit
                            </button>
                          </div>
                        )}
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
        <AIInsightsCard projects={projects} milestones={milestones} updates={updates} />
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
  onPayDeposit,
}: {
  projects: Project[];
  milestones: Milestone[];
  loading: boolean;
  onPayDeposit: (p: Project) => void;
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
        const symbol = p.currency === "NGN" ? "₦" : "$";
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
            {p.stage === "accepted" && p.deposit && (
              <div className="mt-4 p-4 rounded-xl bg-brand/5 border border-brand/20 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-ink/50 uppercase tracking-wider">Deposit Due</div>
                  <div className="font-semibold text-lg">{symbol}{Number(p.deposit).toLocaleString()}</div>
                </div>
                <button
                  type="button"
                  onClick={() => onPayDeposit(p)}
                  className="px-5 py-2.5 rounded-full bg-brand text-brand-foreground font-medium text-xs uppercase tracking-wider hover:opacity-90 transition animate-pulse"
                >
                  Pay Deposit &rarr;
                </button>
              </div>
            )}
            {own.length > 0 && (
              <ul className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {own.map((m) => (
                  <li
                    key={m.id}
                    className={`rounded-lg p-3 text-xs ring-1 ${m.status === "done"
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
                  className={`rounded-xl p-4 ring-1 ${m.status === "done"
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

function AIView({
  firstName,
  projects,
  milestones,
  updates,
}: {
  firstName: string;
  projects: Project[];
  milestones: Milestone[];
  updates: Update[];
}) {
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
      const res = await ask({
        data: {
          messages: next,
          projectData: { projects, milestones, updates },
        },
      });
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

/* ---------------- Courses ---------------- */

type Course = {
  id: string;
  title: string;
  slug: string;
  track: string;
  description: string | null;
  duration: string;
  image_url: string | null;
  instructor: string | null;
  lessons: string[];
  position: number;
  published: boolean;
  created_at: string;
  updated_at: string;
  progress?: number;
  status?: "enrolled" | "completed" | "available";
  lessonsCompleted?: number;
  nextLesson?: string;
};

function CoursesView() {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  useEffect(() => {
    async function loadCourses() {
      const { data } = await supabase
        .from("courses")
        .select("*")
        .eq("published", true)
        .order("position", { ascending: true });
      // For now, we'll treat all courses as available. In the future, we'll add user course progress tracking.
      setCourses(
        (data ?? []).map((course: Tables<"courses">) => ({
          ...course,
          lessons: (course.lessons as string[]) ?? [],
          status: "available" as const,
          progress: 0,
          lessonsCompleted: 0,
        })),
      );
      setLoading(false);
    }
    if (session) {
      loadCourses();
    }
  }, [session]);

  return (
    <div className="grid gap-5">
      {/* Header */}
      <section className="rounded-2xl bg-card ring-1 ring-ink/10 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <GraduationCap className="size-5 text-brand" />
              My Learning
            </h2>
            <p className="text-ink/60 text-sm mt-1">Track your progress and continue learning</p>
          </div>
          <Link
            to="/learn"
            className="inline-flex items-center gap-2 rounded-xl bg-brand text-brand-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90"
          >
            Browse all courses <ChevronRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-card ring-1 ring-ink/10 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Award className="size-4 text-brand" />
            <span className="text-[11px] uppercase tracking-widest text-ink/60">Total Courses</span>
          </div>
          <div className="text-2xl font-semibold">{courses.length}</div>
          <div className="text-xs text-ink/50">available courses</div>
        </div>
        <div className="rounded-2xl bg-card ring-1 ring-ink/10 p-5">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="size-4 text-emerald-500" />
            <span className="text-[11px] uppercase tracking-widest text-ink/60">Enrolled</span>
          </div>
          <div className="text-2xl font-semibold">
            {courses.filter((c) => c.status === "enrolled").length}
          </div>
          <div className="text-xs text-ink/50">active courses</div>
        </div>
        <div className="rounded-2xl bg-card ring-1 ring-ink/10 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="size-4 text-amber-500" />
            <span className="text-[11px] uppercase tracking-widest text-ink/60">Lessons</span>
          </div>
          <div className="text-2xl font-semibold">
            {courses.reduce((sum, course) => sum + (course.lessons?.length || 0), 0)}
          </div>
          <div className="text-xs text-ink/50">total lessons</div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-ink/80">Your Courses</h3>
        </div>
        {loading ? (
          <div className="text-center py-12 text-ink/50">Loading courses...</div>
        ) : (
          <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-4">
            {courses.map((course) => (
              <div
                key={course.id}
                onClick={() => setSelectedCourse(selectedCourse === course.id ? null : course.id)}
                className={`rounded-2xl bg-card ring-1 transition-all transition-all ring-ink/10 p-6 cursor-pointer ${selectedCourse === course.id ? "ring-brand bg-brand/5" : "hover:ring-brand/20"
                  }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full ${course.status === "enrolled"
                          ? "bg-brand/15 text-brand"
                          : course.status === "completed"
                            ? "bg-emerald-500/15 text-emerald-600"
                            : "bg-ink/10 text-ink/60"
                          }`}
                      >
                        {course.status}
                      </span>
                      <span className="text-xs text-ink/50">• {course.duration}</span>
                    </div>
                    <h4 className="font-semibold text-lg mb-1">{course.title}</h4>
                    <p className="text-sm text-ink/60 mb-4">{course.track}</p>

                    {course.status !== "available" &&
                      course.lessons &&
                      course.lessons.length > 0 && (
                        <div className="mb-4">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-ink/60">
                              {course.lessonsCompleted || 0}/{course.lessons.length} lessons
                            </span>
                            <span className="font-semibold text-brand">{course.progress}%</span>
                          </div>
                          <div className="h-2 bg-ink/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand rounded-full"
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                    {course.status === "enrolled" &&
                      course.lessons &&
                      course.lessons.length > 0 && (
                        <div className="flex items-center justify-between pt-3 border-t border-ink/10">
                          <div className="flex items-center gap-2 text-sm text-ink/60">
                            <Clock className="size-4" />
                            Next: {course.lessons[0]}
                          </div>
                          <button className="inline-flex items-center gap-1.5 rounded-xl bg-brand text-brand-foreground px-3 py-1.5 text-xs font-medium hover:opacity-90">
                            <Play className="size-3" /> Continue
                          </button>
                        </div>
                      )}
                  </div>
                  {course.status === "available" && (
                    <div className="pt-3 border-t border-ink/10">
                      <button className="inline-flex items-center gap-1.5 rounded-xl bg-ink/5 text-ink px-3 py-1.5 text-xs font-medium hover:bg-ink/10">
                        Enroll Now
                      </button>
                    </div>
                  )}
                  {course.status === "completed" && (
                    <div className="pt-3 border-t border-ink/10 flex items-center gap-2 text-sm text-emerald-600">
                      <CheckCircle className="size-4" /> Certificate earned
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
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

/* ---------------- AIInsightsCard ---------------- */

type InsightItem = {
  id: string;
  severity: "warning" | "info";
  title: string;
  message: string;
};

function AIInsightsCard({
  projects,
  milestones,
  updates,
}: {
  projects: Project[];
  milestones: Milestone[];
  updates: Update[];
}) {
  const getInsights = useServerFn(generateInsights);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "hidden">("idle");
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (projects.length === 0) return;
    setStatus("loading");

    let aborted = false;
    const timeoutId = setTimeout(() => {
      aborted = true;
      setStatus("hidden");
    }, 10_000);

    getInsights({
      data: {
        projects,
        milestones: milestones.map((m) => ({
          id: m.id,
          project_id: m.project_id,
          name: m.name,
          status: m.status,
          created_at: new Date().toISOString(),
        })),
        updates,
      },
    })
      .then((result) => {
        if (aborted) return;
        clearTimeout(timeoutId);
        if (result.ok) {
          // Sort: warning first, then info; within each severity by id (deterministic)
          const sorted = [...result.insights].sort((a, b) => {
            if (a.severity === b.severity) return a.id.localeCompare(b.id);
            return a.severity === "warning" ? -1 : 1;
          });
          setInsights(sorted);
          setStatus("done");
        } else {
          setStatus("hidden");
        }
      })
      .catch(() => {
        if (!aborted) {
          clearTimeout(timeoutId);
          setStatus("hidden");
        }
      });

    return () => {
      aborted = true;
      clearTimeout(timeoutId);
    };
  }, []); // intentionally run once on mount

  const visible = insights.filter((i) => !dismissed.has(i.id)).slice(0, 3);

  if (status === "hidden") return null;
  if (status === "done" && visible.length === 0) return null;

  return (
    <section className="rounded-2xl bg-card ring-1 ring-ink/10 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="size-4 text-brand" />
        <h3 className="font-semibold text-sm">AI Insights</h3>
      </div>

      {status === "loading" && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-ink/5 animate-pulse" />
          ))}
        </div>
      )}

      {status === "done" && (
        <ul className="space-y-3">
          {visible.map((insight) => (
            <li
              key={insight.id}
              className={`rounded-xl p-3 ring-1 flex items-start gap-3 ${insight.severity === "warning"
                ? "bg-amber-50 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/20"
                : "bg-brand/5 ring-brand/15"
                }`}
            >
              <div className="shrink-0 mt-0.5">
                {insight.severity === "warning" ? (
                  <Flag className="size-4 text-amber-500" />
                ) : (
                  <Sparkles className="size-4 text-brand" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate">{insight.title}</div>
                <div className="text-xs text-ink/60 mt-0.5">{insight.message}</div>
              </div>
              <button
                onClick={() => setDismissed((d) => new Set([...d, insight.id]))}
                className="shrink-0 text-ink/30 hover:text-ink/60 transition"
                aria-label="Dismiss insight"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
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

/* ---------------- Mobile Bottom Nav with More drawer ---------------- */

function MobileBottomNav({
  section,
  setSection,
}: {
  section: Section;
  setSection: (s: Section) => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);

  const primary: { key: Section; icon: LucideIcon; label: string }[] = [
    { key: "dashboard", icon: LayoutDashboard, label: "Home" },
    { key: "projects", icon: FolderKanban, label: "Projects" },
    { key: "ai", icon: Sparkles, label: "AI" },
    { key: "courses", icon: BookOpen, label: "Courses" },
  ];

  const more: { key: Section; icon: LucideIcon; label: string }[] = [
    { key: "messages", icon: MessageSquare, label: "Messages" },
    { key: "files", icon: FileText, label: "Files" },
    { key: "calendar", icon: Calendar, label: "Calendar" },
    { key: "milestones", icon: Flag, label: "Milestones" },
    { key: "settings", icon: Settings, label: "Settings" },
  ];

  // Is the active section one of the "more" items?
  const moreIsActive = more.some((m) => m.key === section);

  function pick(key: Section) {
    setSection(key);
    setMoreOpen(false);
  }

  return (
    <>
      {/* More drawer overlay */}
      {moreOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-ink/50"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More drawer */}
      {moreOpen && (
        <div className="lg:hidden fixed bottom-[60px] inset-x-0 z-50 bg-card border border-ink/10 rounded-t-2xl shadow-2xl px-4 pt-4 pb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-ink/50">More</span>
            <button onClick={() => setMoreOpen(false)} className="p-1 text-ink/50 hover:text-ink">
              <X className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {more.map(({ key, icon: Icon, label }) => {
              const active = section === key;
              return (
                <button
                  key={key}
                  onClick={() => pick(key)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition ${active
                    ? "bg-brand/15 text-brand ring-1 ring-brand/25"
                    : "bg-ink/5 text-ink/60 hover:bg-ink/10 hover:text-ink"
                    }`}
                >
                  <Icon className="size-5" />
                  <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-ink/10 flex items-stretch">
        {primary.map(({ key, icon: Icon, label }) => {
          const active = section === key;
          return (
            <button
              key={key}
              onClick={() => { setMoreOpen(false); setSection(key); }}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-semibold uppercase tracking-wide transition ${active ? "text-brand" : "text-ink/45 hover:text-ink/70"
                }`}
            >
              <Icon className={`size-5 ${active ? "text-brand" : ""}`} />
              {label}
            </button>
          );
        })}
        {/* More button */}
        <button
          onClick={() => setMoreOpen((v) => !v)}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-semibold uppercase tracking-wide transition ${moreIsActive || moreOpen ? "text-brand" : "text-ink/45 hover:text-ink/70"
            }`}
        >
          <MoreHorizontal className={`size-5 ${moreIsActive || moreOpen ? "text-brand" : ""}`} />
          More
        </button>
      </nav>
    </>
  );
}
