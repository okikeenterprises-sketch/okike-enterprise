import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { useServerFn } from "@tanstack/react-start";
import { askAssistant, generateInsights } from "@/lib/ai-assistant.functions";
import { toast } from "sonner";
import { verifyProjectDeposit, verifyBootcampPayment, sendPasswordChangedEmail } from "@/lib/forms.functions";
import heroImg from "@/assets/dashboard-hero.jpg";
import heroImgLight from "@/assets/dashboard-hero-light.png";
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
  HelpCircle,
  Video,
  Download,
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
  const [showNotifications, setShowNotifications] = useState(false);
  const [bootcampRegs, setBootcampRegs] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login" });
  }, [loading, session, navigate]);

  useEffect(() => {
    if (!session) return;
    let active = true;

    async function load() {
      try {
        // Fetch projects and bootcamp registrations first
        const [{ data: p }, { data: b }] = await Promise.all([
          supabase
            .from("client_projects")
            .select("id, title, package_name, stage, created_at, total, deposit, currency")
            .eq("client_user_id", session!.user.id)
            .order("created_at", { ascending: false }),
          (supabase as any)
            .from("bootcamp_registrations")
            .select("*")
            .ilike("email", session!.user.email)
            .order("created_at", { ascending: false }),
        ]);

        if (!active) return;

        const projectIds = (p ?? []).map((x) => x.id);

        // Retrieve milestones and updates only for the user's specific projects
        const [mRes, uRes] = await Promise.all([
          projectIds.length > 0
            ? supabase
                .from("project_milestones")
                .select("id, project_id, name, status, position")
                .in("project_id", projectIds)
                .order("position")
            : Promise.resolve({ data: [] }),
          projectIds.length > 0
            ? supabase
                .from("project_updates")
                .select("id, project_id, message, created_at")
                .in("project_id", projectIds)
                .order("created_at", { ascending: false })
                .limit(8)
            : Promise.resolve({ data: [] }),
        ]);

        if (!active) return;

        setProjects((p ?? []) as Project[]);
        setMilestones((mRes.data ?? []) as Milestone[]);
        setUpdates((uRes.data ?? []) as Update[]);
        setBootcampRegs(b ?? []);
      } catch (err) {
        console.error("Dashboard loading error:", err);
      } finally {
        if (active) setDataLoading(false);
      }
    }
    load();

    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "client_projects",
          filter: `client_user_id=eq.${session!.user.id}`,
        },
        load
      )
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
  const verifyBootcamp = useServerFn(verifyBootcampPayment);

  function handlePayBootcamp(reg: any) {
    const koraKey = import.meta.env.VITE_KORAPAY_PUBLIC_KEY;
    if (!koraKey) {
      toast.error("Payment setup is missing.");
      return;
    }
    const korapay = (window as any).Korapay;
    if (!korapay) {
      toast.error("Payment gateway failed to load.");
      return;
    }
    korapay.initialize({
      key: koraKey,
      reference: reg.payment_reference,
      amount: 5000,
      currency: "NGN",
      customer: {
        name: reg.name,
        email: reg.email,
      },
      onSuccess: async (transaction: any) => {
        toast.loading("Confirming payment...");
        try {
          const res = await verifyBootcamp({ data: { reference: reg.payment_reference } });
          toast.dismiss();
          if (res.ok) {
            toast.success("Payment confirmed! Your ticket is active.");
            window.location.reload();
          } else {
            toast.error(res.error || "Verification failed.");
          }
        } catch {
          toast.dismiss();
          toast.error("Verification error.");
        }
      },
      onFailed: () => toast.error("Payment failed."),
      onClose: () => toast.warning("Payment closed."),
    });
  }

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

            {(role === "admin" || role === "instructor") && (
              <Link
                to="/instructor"
                className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/70 hover:text-brand hover:bg-ink/5 ring-1 ring-ink/10"
              >
                <GraduationCap className="size-4 shrink-0" />
                <span>Instructor panel</span>
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
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative rounded-xl p-2 ring-1 ring-ink/10 hover:bg-ink/5"
                aria-label="View latest updates"
                title="View latest updates"
              >
                <Bell className="size-4 text-ink/70" />
                {updates.length > 0 && (
                  <span className="absolute -top-1 -right-1 size-4 rounded-full bg-brand text-[10px] font-semibold text-brand-foreground grid place-items-center animate-pulse">
                    {updates.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-card ring-1 ring-ink/15 shadow-xl rounded-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between items-center border-b border-ink/5 pb-2 mb-3">
                    <span className="font-semibold text-xs text-ink uppercase tracking-wider">Notifications & Updates</span>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-[10px] text-brand hover:underline font-semibold"
                    >
                      Close
                    </button>
                  </div>
                  {updates.length === 0 ? (
                    <div className="text-center py-6 text-xs text-ink/40">No new updates or alerts.</div>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {updates.map((up) => {
                        const proj = projects.find(p => p.id === up.project_id);
                        return (
                          <div key={up.id} className="text-xs p-2 bg-surface rounded-xl flex flex-col gap-1 ring-1 ring-ink/5 text-left">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-brand-text truncate max-w-[15ch]">{proj?.title || "Project Update"}</span>
                              <span className="text-[9px] text-ink/40">{new Date(up.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-ink/85 leading-relaxed font-sans">{up.message}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            <ThemeToggle />
            {(role === "instructor" || role === "admin") && (
              <Link
                to="/instructor"
                className="lg:hidden flex items-center gap-1.5 bg-brand text-brand-foreground px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition hover:opacity-90 shrink-0"
              >
                <GraduationCap className="size-4" />
                <span className="hidden sm:inline">Console</span>
              </Link>
            )}
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
                bootcampRegs={bootcampRegs}
                onPayBootcamp={handlePayBootcamp}
              />
            )}
            {section === "projects" && (
              <ProjectsView projects={projects} milestones={milestones} loading={dataLoading} onPayDeposit={handlePayDeposit} />
            )}
            {section === "courses" && <CoursesView bootcampRegs={bootcampRegs} />}
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
      <MobileBottomNav section={section} setSection={setSection} role={role} />
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
  bootcampRegs,
  onPayBootcamp,
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
  bootcampRegs: any[];
  onPayBootcamp: (reg: any) => void;
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
          {/* Light Theme Day Image */}
          <img
            src={heroImgLight}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-90 block dark:hidden select-none pointer-events-none"
          />
          {/* Dark Theme Night Image */}
          <img
            src={heroImg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-85 hidden dark:block select-none pointer-events-none"
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

        {/* Bootcamp tickets */}
        {bootcampRegs && bootcampRegs.length > 0 && (
          <div className="flex flex-col gap-4">
            {bootcampRegs.map((reg: any) => (
              <section key={reg.id} className="rounded-2xl bg-card ring-1 ring-ink/10 p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                      <Calendar className="size-5 text-brand" />
                      Computing Synergy Summit — {reg.course}
                    </h2>
                    <p className="text-xs text-ink/50 mt-1">1st August 2026 · Venue TBA</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    reg.payment_status === "paid"
                      ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20"
                      : reg.payment_status === "free"
                        ? "bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20"
                        : "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 animate-pulse"
                  }`}>
                    {reg.payment_status === "paid" ? "Confirmed (Paid)" : reg.payment_status === "free" ? "Confirmed (Free)" : "Payment Pending"}
                  </span>
                </div>
                <p className="text-sm text-ink/75 leading-relaxed">
                  Hi <strong className="text-ink">{reg.name}</strong>, your spot is reserved for the <strong className="text-ink">{reg.course}</strong> track.
                </p>
                <div className="grid grid-cols-2 gap-4 bg-surface ring-1 ring-ink/5 rounded-xl p-4 text-xs">
                  <div>
                    <span className="text-ink/40 uppercase tracking-wider block text-[10px]">Department</span>
                    <span className="font-medium text-ink/80">{reg.department} ({reg.level})</span>
                  </div>
                  <div>
                    <span className="text-ink/40 uppercase tracking-wider block text-[10px]">Ticket Reference</span>
                    <span className="font-medium text-ink/80 truncate block">{reg.payment_reference || "N/A (Free)"}</span>
                  </div>
                </div>
                {reg.payment_status === "pending" && (
                  <button
                    type="button"
                    onClick={() => onPayBootcamp(reg)}
                    className="w-full py-3 rounded-xl bg-brand text-brand-foreground font-semibold text-xs uppercase tracking-wider hover:opacity-90 transition animate-pulse"
                  >
                    Pay Registration Fee (₦5,000) &rarr;
                  </button>
                )}
              </section>
            ))}
          </div>
        )}

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
  milestones?: { id: string; title: string }[];
  position: number;
  published: boolean;
  created_at: string;
  updated_at: string;
  progress?: number;
  status?: "enrolled" | "completed" | "available";
  lessonsCompleted?: number;
  nextLesson?: string;
};

const MOCK_COURSES_DATA: Course[] = [
  {
    id: "frontend-track",
    title: "Frontend Web Development",
    slug: "frontend-web-development",
    track: "Frontend Web Development",
    description: "Learn HTML, CSS, JavaScript, TailwindCSS, React, and modern deployment architectures.",
    duration: "12 Weeks",
    image_url: null,
    instructor: "Okike Frontend Team",
    lessons: [
      "Introduction to HTML & CSS Markup",
      "Responsive Layouts, Flexbox & Grid Systems",
      "JavaScript Fundamentals & ES6+ Features",
      "DOM Manipulation, Actions & Event Handlers",
      "React Basics: Component State & Lifecycle",
      "Advanced React Hooks: useEffect & useContext",
      "API Integration & Async Data Fetching",
      "State Management with Context & Redux",
      "Vite, Linting, & Production Builds",
      "Git Collaboration & GitHub Hosting"
    ],
    position: 1,
    published: true,
    created_at: "",
    updated_at: ""
  },
  {
    id: "backend-track",
    title: "Backend Web Development",
    slug: "backend-web-development",
    track: "Backend Web Development",
    description: "Learn Node.js, Express server frameworks, Postgres SQL database design, Supabase API integrations, and token-based security.",
    duration: "12 Weeks",
    image_url: null,
    instructor: "Okike Backend Team",
    lessons: [
      "Intro to Server-Client Architectures",
      "Node.js Ecosystem & Package Management",
      "Building RESTful APIs with Express",
      "PostgreSQL Database Design & Querying",
      "ORM vs Raw SQL & Database Migrations",
      "User Authentication, Hashing & JWT",
      "Supabase Client & Server Integrations",
      "Serverless Functions & Edge Routing",
      "Testing Node APIs with Jest",
      "Docker Containerization & Render Hosting"
    ],
    position: 2,
    published: true,
    created_at: "",
    updated_at: ""
  },
  {
    id: "uiux-track",
    title: "Product Design (UI/UX)",
    slug: "uiux-track",
    track: "Product Design (UI/UX)",
    description: "Learn Figma layout tools, wireframing, interactive prototyping, user research, and UI developer handoff principles.",
    duration: "12 Weeks",
    image_url: null,
    instructor: "Okike Design Team",
    lessons: [
      "Core UI/UX Principles & Design Thinking",
      "User Research, Personas & User Journeys",
      "Information Architecture & Sitemap Layouts",
      "Figma workspace: Shapes, Frames & Layout grids",
      "Wireframing & Low-Fidelity Mockups",
      "Typography, Grid Alignment & Color Palettes",
      "Component Libraries & Auto-Layout in Figma",
      "High-Fidelity UI Prototyping & Interactions",
      "Usability Testing, Heatmaps & User Feedback",
      "Asset Export & Developer Handoff Rules"
    ],
    position: 3,
    published: true,
    created_at: "",
    updated_at: ""
  },
  {
    id: "mobile-track",
    title: "Mobile App Development",
    slug: "mobile-app-track",
    track: "Mobile App Development",
    description: "Learn React Native app architectures, Expo build pipelines, native mobile styling, device APIs, and app store deployment.",
    duration: "12 Weeks",
    image_url: null,
    instructor: "Okike Mobile Team",
    lessons: [
      "React Native Fundamentals vs Web React",
      "Expo SDK & Development Tools Environment",
      "Native Views, ScrollViews & Touchables",
      "Styling & Flexbox Layouts in React Native",
      "Mobile Navigation: React Navigation Stack/Tabs",
      "Managing State & SQLite Local Caching",
      "Camera, Location, & Hardware Sensor Integration",
      "Push Notifications & Background Services",
      "Building APK/IPA bundles using EAS",
      "Google Play Store & Apple App Store Guidelines"
    ],
    position: 4,
    published: true,
    created_at: "",
    updated_at: ""
  },
  {
    id: "security-track",
    title: "Cyber Security",
    slug: "cyber-security-track",
    track: "Cyber Security",
    description: "Learn network security protocols, system scanning, ethical hacking tools, risk assessments, and defense strategies.",
    duration: "12 Weeks",
    image_url: null,
    instructor: "Okike Security Team",
    lessons: [
      "History of Security & Threat Landscapes",
      "TCP/IP Networking, Ports & Core Protocols",
      "Operating System Security & Hardening Rules",
      "Network Scanning, Nmap & Wireshark Analysis",
      "Vulnerability Identification & CVE Databases",
      "Cryptography, SSL certificates & Key exchanges",
      "Ethical Hacking: Hacking tools & Metasploit",
      "Firewalls, IDS/IPS, & Security Auditing",
      "Web App Hacking: OWASP Top 10 exploits",
      "Incident Response Plans & Forensic Investigation"
    ],
    position: 5,
    published: true,
    created_at: "",
    updated_at: ""
  }
];

const DEFAULT_QUIZZES = [
  {
    id: "quiz-1",
    title: "Module 1 Assessment: Fundamentals",
    description: "Test your understanding of the foundational lessons in your course track.",
    questions: [
      {
        question: "Which of the following describes the main goal of responsive design?",
        options: [
          "Optimizing speed on desktop servers",
          "Ensuring layout adjusts beautifully on mobile, tablet, and desktop viewports",
          "Preventing unauthorized script injection",
          "Using heavy image assets for high resolution"
        ],
        answer: 1
      },
      {
        question: "What does Git use to track changes over time?",
        options: [
          "Local zip files and backups",
          "A chain of commits representing repository snapshots",
          "A live Google Doc tracking files",
          "None of the above"
        ],
        answer: 1
      },
      {
        question: "Why do we use package managers (like npm or yarn)?",
        options: [
          "To speed up database index scans",
          "To download, update, and manage third-party code packages and dependencies",
          "To compile React styles into native mobile code",
          "To deploy the server to vercel hosting"
        ],
        answer: 1
      }
    ]
  }
];

const DEFAULT_MILESTONES = [
  { id: "ms-1", title: "Git & Workspace Setup", description: "Fork repository, connect to remote GitHub, and set up your local development workspace." },
  { id: "ms-2", title: "Module 1 Exam Passed", description: "Complete the diagnostic Module 1 fundamentals quiz with a score of 70% or higher." },
  { id: "ms-3", title: "Mid-term Project Submission", description: "Build and submit the initial prototype of your track project for review." },
  { id: "ms-4", title: "Summit Capstone Approved", description: "Deploy your final summit capstone application/design project and pass instructor review." }
];

function CoursesView({ bootcampRegs }: { bootcampRegs: any[] }) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredTrack, setRegisteredTrack] = useState<string | null>(null);

  // Progress states
  const [progress, setProgress] = useState<{
    lessons_completed: string[];
    quiz_scores: Record<string, number>;
    milestone_status: Record<string, string>;
    attendance_mode?: string;
  } | null>(null);

  // LMS tabs
  const [activeTab, setActiveTab] = useState<"lessons" | "milestones" | "quizzes" | "assignments" | "virtual" | "materials">("lessons");
  const [activeLessonIndex, setActiveLessonIndex] = useState<number>(0);

  // Extra LMS module state variables
  const [dbQuizzes, setDbQuizzes] = useState<any[]>([]);
  const [dbAssignments, setDbAssignments] = useState<any[]>([]);
  const [dbVirtualClasses, setDbVirtualClasses] = useState<any[]>([]);
  const [dbCourseMaterials, setDbCourseMaterials] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [submittingAssign, setSubmittingAssign] = useState<string | null>(null);
  const [assignText, setAssignText] = useState("");
  const [loadingExtra, setLoadingExtra] = useState(false);

  // Load quizzes/assignments for active module
  useEffect(() => {
    async function loadModuleDetails() {
      if (!selectedCourse || !session?.user?.email) return;
      const activeModule = selectedCourse.lessons[activeLessonIndex];
      if (!activeModule) return;
      
      setLoadingExtra(true);
      try {
        const [{ data: q }, { data: a }, { data: vc }, { data: cm }] = await Promise.all([
          (supabase as any).from("quizzes").select("*").eq("course_id", selectedCourse.id).eq("module_name", activeModule),
          (supabase as any).from("assignments").select("*").eq("course_id", selectedCourse.id).eq("module_name", activeModule),
          (supabase as any).from("virtual_classes").select("*").eq("course_id", selectedCourse.id).eq("module_name", activeModule).order("meeting_time", { ascending: true }),
          (supabase as any).from("course_materials").select("*").eq("course_id", selectedCourse.id).eq("module_name", activeModule).order("created_at", { ascending: false }),
        ]);
        setDbQuizzes(q ?? []);
        setDbAssignments(a ?? []);
        setDbVirtualClasses(vc ?? []);
        setDbCourseMaterials(cm ?? []);

        const aIds = (a ?? []).map((x: any) => x.id);
        if (aIds.length > 0) {
          const { data: s } = await (supabase as any)
            .from("assignment_submissions")
            .select("*")
            .eq("student_email", session.user.email)
            .in("assignment_id", aIds);
          setSubmissions(s ?? []);
        } else {
          setSubmissions([]);
        }
      } catch (err) {
        console.error("Error loading module quizzes/assignments", err);
      } finally {
        setLoadingExtra(false);
      }
    }
    loadModuleDetails();
  }, [selectedCourse, activeLessonIndex, session]);

  // Quiz taker states
  const [quizScoreFeedback, setQuizScoreFeedback] = useState<number | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});

  // DB queries
  useEffect(() => {
    async function loadCoursesAndProgress() {
      if (!session?.user?.email) {
        setLoading(false);
        return;
      }

      try {
        // Query database courses
        const { data: dbCourses } = await supabase
          .from("courses")
          .select("*")
          .eq("published", true)
          .order("position", { ascending: true });

        // Query student progress
        let { data: spRow } = await (supabase as any)
          .from("student_progress")
          .select("*")
          .eq("student_email", session.user.email)
          .maybeSingle();

        if (!spRow) {
          // Auto-insert progress row on first load
          const { data: newRow } = await (supabase as any)
            .from("student_progress")
            .insert({
              student_email: session.user.email,
              lessons_completed: [],
              quiz_scores: {},
              milestone_status: {}
            })
            .select()
            .maybeSingle();
          spRow = newRow;
        }

        setProgress(spRow || { lessons_completed: [], quiz_scores: {}, milestone_status: {}, attendance_mode: "physical" });

        const isConfirmed = bootcampRegs && bootcampRegs.length > 0;
        const registeredTracks = bootcampRegs.map(r => r.course).filter(Boolean);
        const regTrackStr = registeredTracks.join(" & ");

        setIsRegistered(isConfirmed);
        setRegisteredTrack(regTrackStr || null);

        let filtered: Course[] = [];
        const sourceData = dbCourses ?? [];

        if (isConfirmed && registeredTracks.length > 0) {
          filtered = (sourceData as any[])
            .map((course: any) => {
              const completedList = spRow?.lessons_completed || [];
              const lessons = (course.lessons as string[]) ?? [];
              const completedCount = lessons.filter(l => completedList.includes(l)).length;
              const pct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

              return {
                ...course,
                lessons,
                status: "enrolled" as const,
                progress: pct,
                lessonsCompleted: completedCount,
              };
            })
            .filter((course) => {
              const title = (course.title || "").toLowerCase().trim();
              const track = (course.track || "").toLowerCase().trim();
              
              return registeredTracks.some(regTrack => {
                const reg = regTrack.toLowerCase().trim();
                if (title === reg || track === reg) return true;

                // Fuzzy match overlaps (e.g. Cyber Security -> Cyber Security Fundamentals)
                if (reg.includes("cyber") && (title.includes("cyber") || track.includes("cyber"))) return true;
                if (
                  (reg.includes("frontend") || reg.includes("backend") || reg.includes("web") || reg.includes("stack")) && 
                  (title.includes("stack") || title.includes("web") || title.includes("frontend") || title.includes("backend") || track.includes("web"))
                ) {
                  return true;
                }
                if (
                  (reg.includes("design") || reg.includes("ui") || reg.includes("ux")) &&
                  (title.includes("design") || title.includes("ui") || title.includes("ux") || track.includes("design") || track.includes("ui"))
                ) {
                  return true;
                }
                if (reg.includes("mobile") && (title.includes("mobile") || track.includes("mobile"))) return true;
                if (reg.includes("python") && (title.includes("python") || track.includes("python"))) return true;

                return false;
              });
            });
        }

        setCourses(filtered);
      } catch (err) {
        console.error("LMS loader error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCoursesAndProgress();
  }, [bootcampRegs, session]);

  // Lessons completed handler
  async function toggleLessonComplete(lessonTitle: string) {
    if (!session?.user?.email || !progress) return;
    const completed = progress.lessons_completed || [];
    const isCompleted = completed.includes(lessonTitle);

    const updatedCompleted = isCompleted
      ? completed.filter(x => x !== lessonTitle)
      : [...completed, lessonTitle];

    // Optimistic UI state update
    setProgress({
      ...progress,
      lessons_completed: updatedCompleted
    });

    // Update in database
    await (supabase as any)
      .from("student_progress")
      .upsert({
        student_email: session.user.email,
        lessons_completed: updatedCompleted,
        updated_at: new Date().toISOString()
      }, { onConflict: "student_email" });

    // Update course local state progress bar
    setCourses(prev =>
      prev.map(c => {
        const completedCount = c.lessons.filter(l => updatedCompleted.includes(l)).length;
        const pct = c.lessons.length > 0 ? Math.round((completedCount / c.lessons.length) * 100) : 0;
        return {
          ...c,
          progress: pct,
          lessonsCompleted: completedCount
        };
      })
    );

    // Update selected course state to update reader layout too
    setSelectedCourse(prev => {
      if (!prev) return null;
      const completedCount = prev.lessons.filter(l => updatedCompleted.includes(l)).length;
      const pct = prev.lessons.length > 0 ? Math.round((completedCount / prev.lessons.length) * 100) : 0;
      return {
        ...prev,
        progress: pct,
        lessonsCompleted: completedCount
      };
    });
  }

  // Attendance Mode Switcher
  async function toggleAttendanceMode() {
    if (!session?.user?.email || !progress) return;
    const currentMode = progress.attendance_mode || "physical";
    const nextMode = currentMode === "physical" ? "online" : "physical";

    setProgress({
      ...progress,
      attendance_mode: nextMode
    });

    const { error } = await (supabase as any)
      .from("student_progress")
      .upsert({
        student_email: session.user.email,
        attendance_mode: nextMode,
        updated_at: new Date().toISOString()
      }, { onConflict: "student_email" });

    if (error) {
      toast.error("Could not save attendance preference.");
    } else {
      toast.success(`Attendance mode switched to ${nextMode.toUpperCase()} successfully!`);
    }
  }

  // Quiz submission handler
  async function submitQuiz(quizId: string, questions: any[]) {
    if (!session?.user?.email || !progress) return;

    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.answer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);
    setQuizScoreFeedback(score);

    const updatedScores = {
      ...(progress.quiz_scores || {}),
      [quizId]: score
    };

    setProgress({
      ...progress,
      quiz_scores: updatedScores
    });

    await (supabase as any)
      .from("student_progress")
      .upsert({
        student_email: session.user.email,
        quiz_scores: updatedScores,
        updated_at: new Date().toISOString()
      }, { onConflict: "student_email" });
  }

  if (selectedCourse) {
    const lessons = selectedCourse.lessons || [];
    const activeLesson = lessons[activeLessonIndex] || "No lessons";

    return (
      <div className="flex flex-col gap-6">
        {/* Back header */}
        <section className="bg-card rounded-2xl ring-1 ring-ink/10 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setSelectedCourse(null);
                setQuizScoreFeedback(null);
                setQuizAnswers({});
              }}
              className="text-xs text-brand hover:underline font-semibold uppercase tracking-wider flex items-center gap-1"
            >
              &larr; Back to My Courses
            </button>
            <span className="text-xs text-ink/50 font-medium">{selectedCourse.duration} Track</span>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-serif tracking-tight text-ink">{selectedCourse.title}</h2>
              <p className="text-xs text-ink/65 mt-1">Instructor: {selectedCourse.instructor}</p>
            </div>
            {/* Progress bar */}
            <div className="w-full md:w-64">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-ink/60">Syllabus Completion</span>
                <span className="font-semibold text-brand">{selectedCourse.progress}%</span>
              </div>
              <div className="h-2.5 bg-ink/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full transition-all duration-300"
                  style={{ width: `${selectedCourse.progress}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* LMS Player Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left panel tabs navigation */}
          <div className="lg:col-span-3 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            <button
              onClick={() => setActiveTab("lessons")}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition shrink-0 w-full text-left ${
                activeTab === "lessons" ? "bg-brand text-brand-foreground" : "bg-card hover:bg-ink/5 ring-1 ring-ink/10"
              }`}
            >
              <BookOpen className="size-4" /> Syllabus Lessons
            </button>
            <button
              onClick={() => setActiveTab("milestones")}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition shrink-0 w-full text-left ${
                activeTab === "milestones" ? "bg-brand text-brand-foreground" : "bg-card hover:bg-ink/5 ring-1 ring-ink/10"
              }`}
            >
              <Award className="size-4" /> Roadmap Milestones
            </button>
            <button
              onClick={() => setActiveTab("quizzes")}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition shrink-0 w-full text-left ${
                activeTab === "quizzes" ? "bg-brand text-brand-foreground" : "bg-card hover:bg-ink/5 ring-1 ring-ink/10"
              }`}
            >
              <HelpCircle className="size-4" /> Track Quizzes
            </button>
            <button
              onClick={() => setActiveTab("assignments")}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition shrink-0 w-full text-left ${
                activeTab === "assignments" ? "bg-brand text-brand-foreground" : "bg-card hover:bg-ink/5 ring-1 ring-ink/10"
              }`}
            >
              <FileText className="size-4" /> Assignments
            </button>
            <button
              onClick={() => setActiveTab("virtual")}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition shrink-0 w-full text-left ${
                activeTab === "virtual" ? "bg-brand text-brand-foreground" : "bg-card hover:bg-ink/5 ring-1 ring-ink/10"
              }`}
            >
              <Video className="size-4" /> Live Classes
            </button>
            <button
              onClick={() => setActiveTab("materials")}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition shrink-0 w-full text-left ${
                activeTab === "materials" ? "bg-brand text-brand-foreground" : "bg-card hover:bg-ink/5 ring-1 ring-ink/10"
              }`}
            >
              <Download className="size-4" /> Course Materials
            </button>
          </div>

          {/* Main Content Workspace Panel */}
          <div className="lg:col-span-9 bg-card ring-1 ring-ink/10 rounded-2xl p-6 md:p-8 min-h-[50vh]">
            
            {/* TABS: LESSONS WORKSPACE */}
            {activeTab === "lessons" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Syllabus Checklist */}
                <div className="md:col-span-4 flex flex-col gap-2 max-h-[45vh] overflow-y-auto pr-1">
                  <h4 className="font-semibold text-xs text-ink/55 uppercase tracking-wider mb-1">Lessons Index</h4>
                  {lessons.map((lesson, idx) => {
                    const isCompleted = progress?.lessons_completed?.includes(lesson);
                    return (
                      <button
                        key={lesson}
                        onClick={() => {
                          setActiveLessonIndex(idx);
                          setQuizScoreFeedback(null);
                        }}
                        className={`text-left text-xs px-3 py-2.5 rounded-xl font-medium transition flex items-start justify-between gap-2 border ${
                          activeLessonIndex === idx
                            ? "bg-brand/5 border-brand text-brand font-semibold"
                            : "border-transparent bg-surface hover:bg-ink/5 text-ink/80"
                        }`}
                      >
                        <span className="truncate">{idx + 1}. {lesson}</span>
                        {isCompleted && <CheckCircle className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>

                {/* Active Lesson Reader content */}
                <div className="md:col-span-8 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-ink/10 pt-4 md:pt-0 md:pl-6">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[10px] text-brand uppercase font-bold tracking-widest">Lesson {activeLessonIndex + 1}</span>
                      <h3 className="font-semibold text-lg text-ink mt-0.5">{activeLesson}</h3>
                    </div>
                  </div>

                  <div className="bg-surface ring-1 ring-ink/5 rounded-xl p-4 md:p-6 text-sm text-ink/75 leading-relaxed min-h-[24vh] flex flex-col justify-between">
                    <div>
                      <p className="font-medium text-ink/90 mb-3">Summit Learning Syllabus Material</p>
                      <p className="mb-4">
                        Welcome to your online class for the Computing Synergy Summit track. This lesson introduces the fundamental concepts of {selectedCourse.title}. 
                      </p>
                      <p className="text-xs text-ink/50 italic">
                        Reference guidelines, links to reading repositories, and live video code walkthrough classrooms will be shared here as the Summit commences.
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-ink/5 flex justify-between items-center">
                      <button
                        onClick={() => toggleLessonComplete(activeLesson)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                          progress?.lessons_completed?.includes(activeLesson)
                            ? "bg-emerald-500/15 text-emerald-600 hover:opacity-80"
                            : "bg-brand text-brand-foreground hover:opacity-90"
                        }`}
                      >
                        {progress?.lessons_completed?.includes(activeLesson) ? "✓ Completed (Undo)" : "Mark as Completed"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TABS: ROADMAP MILESTONES */}
            {activeTab === "milestones" && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="font-semibold text-lg text-ink">Learning Roadmap</h3>
                  <p className="text-xs text-ink/50 mt-1">Milestones checked off by your Synergy Summit track instructors.</p>
                </div>

                <div className="relative border-l border-ink/10 pl-6 ml-3 flex flex-col gap-6 mt-2">
                  {(() => {
                    const BACKUP_MILESTONES = [
                      { id: "ms-1", title: "Git & Workspace Setup", description: "Configure your local terminal workspace parameters." },
                      { id: "ms-2", title: "Module 1 Exam Passed", description: "Deliver scoring passmarks on diagnostic tests." },
                      { id: "ms-3", title: "Mid-term Project Submission", description: "Deploy intermediate prototype assets." },
                      { id: "ms-4", title: "Summit Capstone Approved", description: "Complete caps approval from course director." }
                    ];
                    const courseMilestones = selectedCourse.milestones && selectedCourse.milestones.length > 0
                      ? selectedCourse.milestones
                      : BACKUP_MILESTONES;

                    return courseMilestones.map((m: any) => {
                      const status = progress?.milestone_status?.[m.id] || "pending";
                      return (
                        <div key={m.id} className="relative">
                          {/* Dot indicator */}
                          <div className={`absolute -left-[31px] top-1 size-4 rounded-full ring-4 ring-card flex items-center justify-center ${
                            status === "completed"
                              ? "bg-emerald-500"
                              : status === "in_progress"
                                ? "bg-amber-500 animate-pulse"
                                : "bg-ink/20"
                          }`} />
                          <div>
                            <div className="font-semibold text-sm flex items-center gap-2">
                              {m.title}
                              <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                status === "completed"
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : status === "in_progress"
                                    ? "bg-amber-500/10 text-amber-600"
                                    : "bg-ink/10 text-ink/50"
                              }`}>
                                {status === "completed" ? "Approved" : status === "in_progress" ? "In Progress" : "Pending"}
                              </span>
                            </div>
                            {m.description && <p className="text-xs text-ink/65 mt-1 leading-relaxed max-w-xl">{m.description}</p>}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* TABS: QUIZZES */}
            {activeTab === "quizzes" && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="font-semibold text-lg text-ink font-serif">Module Quizzes</h3>
                  <p className="text-xs text-ink/50 mt-1">
                    Topic: <span className="font-semibold text-brand">{selectedCourse.lessons[activeLessonIndex]}</span>
                  </p>
                </div>

                {loadingExtra ? (
                  <div className="text-xs text-ink/40 py-4"><Loader2 className="size-4 animate-spin inline mr-2" /> Loading module quizzes...</div>
                ) : dbQuizzes.length === 0 ? (
                  <div className="text-center py-10 bg-surface rounded-2xl border border-dashed border-ink/10 text-xs text-ink/50">
                    No quizzes published yet for this module.
                  </div>
                ) : (
                  dbQuizzes.map((quiz) => {
                    const savedScore = progress?.quiz_scores?.[quiz.id];
                    const hasTaken = typeof savedScore === "number";

                    return (
                      <div key={quiz.id} className="bg-surface ring-1 ring-ink/10 rounded-xl p-5 md:p-6 flex flex-col gap-4">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h4 className="font-semibold text-base text-ink">{quiz.title}</h4>
                            <p className="text-xs text-ink/55 mt-0.5">Test your understanding of this lesson module.</p>
                          </div>
                          {hasTaken && (
                            <div className="text-right shrink-0">
                              <span className="text-[10px] text-ink/40 uppercase font-semibold block">Last Score</span>
                              <span className={`text-lg font-bold ${savedScore >= 70 ? "text-emerald-500" : "text-amber-500"}`}>{savedScore}%</span>
                            </div>
                          )}
                        </div>

                        {quizScoreFeedback !== null ? (
                          <div className="p-4 bg-brand/5 ring-1 ring-brand/20 rounded-xl flex flex-col items-center justify-center gap-2 text-center py-6">
                            <Award className="size-10 text-brand animate-bounce" />
                            <h5 className="font-semibold text-ink text-sm">Quiz Submitted!</h5>
                            <p className="text-xs text-ink/60 max-w-[28ch]">You scored <strong>{quizScoreFeedback}%</strong> on this assessment.</p>
                            <button
                              onClick={() => {
                                setQuizScoreFeedback(null);
                                setQuizAnswers({});
                              }}
                              className="mt-2 text-xs font-semibold text-brand hover:underline"
                            >
                              Retake Quiz &rarr;
                            </button>
                          </div>
                        ) : hasTaken ? (
                          <div className="text-xs text-ink/55 bg-card border border-ink/5 p-3 rounded-xl">
                            You have already submitted this assessment. You scored <strong>{savedScore}%</strong>. If you wish to retake it:
                            <button
                              onClick={() => {
                                setQuizScoreFeedback(null);
                                setQuizAnswers({});
                                setProgress(prev => {
                                  if (!prev) return null;
                                  const nextScores = { ...prev.quiz_scores };
                                  delete nextScores[quiz.id];
                                  return { ...prev, quiz_scores: nextScores };
                                });
                              }}
                              className="block mt-2 font-bold text-brand hover:underline"
                            >
                              Retake Quiz Assessment
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-4 border-t border-ink/5 pt-4">
                            {(quiz.questions || []).map((q: any, qidx: number) => (
                              <div key={qidx} className="flex flex-col gap-2">
                                <p className="text-xs font-semibold text-ink/80">{qidx + 1}. {q.question}</p>
                                <div className="grid gap-2 pl-2">
                                  {(q.options || []).map((opt: string, oidx: number) => (
                                    <label key={oidx} className="flex items-center gap-2 text-xs cursor-pointer hover:text-brand transition select-none">
                                      <input
                                        type="radio"
                                        name={`q-${quiz.id}-${qidx}`}
                                        checked={quizAnswers[qidx] === oidx}
                                        onChange={() => setQuizAnswers(prev => ({ ...prev, [qidx]: oidx }))}
                                        className="accent-brand size-3.5 shrink-0"
                                      />
                                      <span>{opt}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}

                            <button
                              onClick={() => submitQuiz(quiz.id, quiz.questions)}
                              disabled={Object.keys(quizAnswers).length < (quiz.questions || []).length}
                              className="self-start mt-2 px-5 py-2.5 rounded-xl bg-brand text-brand-foreground font-semibold text-xs uppercase tracking-wider hover:opacity-90 transition disabled:opacity-50"
                            >
                              Submit Assessment
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TABS: ASSIGNMENTS */}
            {activeTab === "assignments" && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="font-semibold text-lg text-ink font-serif font-semibold">Module Tasks & Assignments</h3>
                  <p className="text-xs text-ink/50 mt-1">
                    Lesson: <span className="font-semibold text-brand">{selectedCourse.lessons[activeLessonIndex]}</span>
                  </p>
                </div>

                {loadingExtra ? (
                  <div className="text-xs text-ink/40 py-4"><Loader2 className="size-4 animate-spin inline mr-2" /> Loading assignments...</div>
                ) : dbAssignments.length === 0 ? (
                  <div className="text-center py-10 bg-surface rounded-2xl border border-dashed border-ink/10 text-xs text-ink/50">
                    No assignments published for this module yet.
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {dbAssignments.map((assignment) => {
                      const submission = submissions.find(s => s.assignment_id === assignment.id);
                      const isGraded = submission && submission.grade !== null;

                      return (
                        <div key={assignment.id} className="bg-surface ring-1 ring-ink/10 rounded-xl p-5 md:p-6 space-y-4">
                          <div>
                            <div className="flex justify-between items-start gap-3 flex-wrap">
                              <h4 className="font-semibold text-base text-ink">{assignment.title}</h4>
                              <span className="text-[10px] font-mono uppercase bg-brand/10 text-brand px-2 py-0.5 rounded">
                                Max Score: {assignment.max_points} points
                              </span>
                            </div>
                            <p className="text-xs text-ink/70 mt-2 font-mono whitespace-pre-wrap bg-card p-3 rounded-lg border border-ink/5 leading-relaxed">
                              {assignment.description}
                            </p>
                          </div>

                          {submission ? (
                            <div className="border-t border-ink/5 pt-4 space-y-3">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-ink/75">Your Submission:</span>
                                {isGraded ? (
                                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-mono font-bold text-[10px]">
                                    Graded Score: {submission.grade} / {assignment.max_points}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 font-mono font-bold text-[10px]">
                                    Submitted (Pending Grade Comments)
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-ink/65 bg-card p-3 rounded-lg border border-ink/5 whitespace-pre-wrap italic">
                                "{submission.submission_text}"
                              </p>
                              {submission.feedback && (
                                <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-xs">
                                  <span className="font-semibold text-emerald-700 block">Director Feedback:</span>
                                  <p className="text-ink/75 mt-1">"{submission.feedback}"</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <form
                              onSubmit={async (e) => {
                                e.preventDefault();
                                if (!assignText.trim() || !session?.user?.email) return;
                                setSubmittingAssign(assignment.id);
                                const { error } = await (supabase as any)
                                  .from("assignment_submissions")
                                  .insert({
                                    assignment_id: assignment.id,
                                    student_email: session.user.email,
                                    submission_text: assignText.trim(),
                                    submitted_at: new Date().toISOString()
                                  });
                                setSubmittingAssign(null);
                                if (!error) {
                                  toast.success("Assignment submitted successfully!");
                                  setAssignText("");
                                  const { data: s } = await (supabase as any)
                                    .from("assignment_submissions")
                                    .select("*")
                                    .eq("student_email", session.user.email)
                                    .in("assignment_id", dbAssignments.map(x => x.id));
                                  setSubmissions(s ?? []);
                                } else {
                                  toast.error("Could not submit assignment.");
                                }
                              }}
                              className="border-t border-ink/5 pt-4 space-y-3"
                            >
                              <div>
                                <label className="text-[11px] text-ink/55 block font-semibold mb-1">Your Solution/Submission</label>
                                <textarea
                                  required
                                  rows={4}
                                  placeholder="Type your response, links to repository files, or solution summary details here..."
                                  value={assignText}
                                  onChange={(e) => setAssignText(e.target.value)}
                                  className="w-full bg-card ring-1 ring-ink/10 rounded-xl p-3 text-xs text-ink focus:outline-none focus:ring-brand"
                                />
                              </div>
                              <button
                                type="submit"
                                disabled={submittingAssign === assignment.id}
                                className="px-4 py-2 rounded-xl bg-brand text-brand-foreground font-semibold text-xs uppercase tracking-wider hover:opacity-90 transition disabled:opacity-50"
                              >
                                {submittingAssign === assignment.id ? "Submitting..." : "Submit Solution"}
                              </button>
                            </form>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TABS: VIRTUAL CLASSES / LIVE */}
            {activeTab === "virtual" && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="font-semibold text-lg text-ink font-serif">Virtual Sessions & Night Classes</h3>
                  <p className="text-xs text-ink/50 mt-1">
                    Lesson Module: <span className="font-semibold text-brand">{selectedCourse.lessons[activeLessonIndex]}</span>
                  </p>
                </div>

                {/* Attendance Preference Switcher component */}
                <div className="bg-surface ring-1 ring-ink/10 rounded-xl p-5 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-ink">Attendance Preference Mode</h4>
                    <p className="text-xs text-ink/60 mt-1">
                      Are you registered for physical classes but need to attend online today? Toggle your mode below.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded uppercase tracking-wider ${
                      (progress as any)?.attendance_mode === "online" ? "bg-emerald-500/10 text-emerald-600" : "bg-blue-500/10 text-blue-600"
                    }`}>
                      {(progress as any)?.attendance_mode === "online" ? "Online Mode" : "Physical Attendance"}
                    </span>
                    <button
                      onClick={toggleAttendanceMode}
                      className="px-3 py-1.5 rounded-lg bg-brand text-brand-foreground font-semibold text-xs uppercase tracking-wider hover:opacity-90 transition"
                    >
                      Switch to {(progress as any)?.attendance_mode === "physical" || !(progress as any)?.attendance_mode ? "Online" : "Physical"}
                    </button>
                  </div>
                </div>

                {/* Live classes list */}
                {loadingExtra ? (
                  <div className="text-xs text-ink/40 py-4"><Loader2 className="size-4 animate-spin inline mr-2" /> Loading live sessions...</div>
                ) : dbVirtualClasses.length === 0 ? (
                  <div className="text-center py-10 bg-surface rounded-2xl border border-dashed border-ink/10 text-xs text-ink/50">
                    No virtual sessions scheduled for this module yet.
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {dbVirtualClasses.map((vc) => {
                      const isOnline = (progress as any)?.attendance_mode === "online";
                      return (
                        <div key={vc.id} className="p-4 bg-surface ring-1 ring-ink/10 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <div className="text-sm font-semibold text-ink flex items-center gap-1.5">
                              {vc.title}
                              <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded uppercase ${
                                vc.session_type === "night" ? "bg-purple-500/10 text-purple-600" : "bg-blue-500/10 text-blue-600"
                              }`}>
                                {vc.session_type === "night" ? "🌙 Night" : "☀️ General"}
                              </span>
                            </div>
                            <p className="text-[10px] text-ink/40 font-mono mt-0.5">Time: {new Date(vc.meeting_time).toLocaleString()}</p>
                          </div>

                          {isOnline ? (
                            <a
                              href={vc.meeting_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-4 py-2 rounded-xl bg-brand text-brand-foreground font-semibold text-xs uppercase tracking-wider hover:opacity-90 shrink-0 text-center"
                            >
                              Join Class Link &rarr;
                            </a>
                          ) : (
                            <div className="text-xs text-ink/40 text-right italic max-w-[20ch]">
                              Switch mode to Online to join this live session.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TABS: COURSE MATERIALS */}
            {activeTab === "materials" && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="font-semibold text-lg text-ink font-serif">Module Resources & Materials</h3>
                  <p className="text-xs text-ink/50 mt-1">
                    Lesson: <span className="font-semibold text-brand">{selectedCourse.lessons[activeLessonIndex]}</span>
                  </p>
                </div>

                {loadingExtra ? (
                  <div className="text-xs text-ink/40 py-4"><Loader2 className="size-4 animate-spin inline mr-2" /> Loading resources...</div>
                ) : dbCourseMaterials.length === 0 ? (
                  <div className="text-center py-10 bg-surface rounded-2xl border border-dashed border-ink/10 text-xs text-ink/50">
                    No resources uploaded by the instructor for this module yet.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {dbCourseMaterials.map((m) => (
                      <div key={m.id} className="bg-surface ring-1 ring-ink/5 rounded-xl p-4 flex justify-between items-start gap-4">
                        <div>
                          <div className="text-xs font-semibold text-ink">{m.title}</div>
                          {m.description && <p className="text-[10px] text-ink/60 mt-1">{m.description}</p>}
                        </div>
                        <a
                          href={m.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 rounded-xl bg-brand text-brand-foreground font-semibold text-[10px] uppercase tracking-wider hover:opacity-90 text-center shrink-0"
                        >
                          Download Resource
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }

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
        ) : courses.length === 0 ? (
          isRegistered ? (
            <div className="rounded-2xl bg-card ring-1 ring-ink/10 p-8 text-center flex flex-col items-center gap-4 max-w-lg mx-auto mt-4">
              <GraduationCap className="size-12 text-brand/40" />
              <h3 className="font-semibold text-lg text-ink">Curriculum Coming Soon</h3>
              <p className="text-sm text-ink/65 leading-relaxed">
                You are registered for the <strong>{registeredTrack}</strong> track. Your syllabus is currently being set up by the instructors. Check back soon!
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-card ring-1 ring-ink/10 p-8 text-center flex flex-col items-center gap-4 max-w-lg mx-auto mt-4">
              <GraduationCap className="size-12 text-brand/40" />
              <h3 className="font-semibold text-lg text-ink">No Enrolled Courses</h3>
              <p className="text-sm text-ink/65 leading-relaxed">
                Unlock your course dashboard and access tech track learning materials by registering for the upcoming Computing Synergy Summit 2026.
              </p>
              <Link
                to="/bootcamp"
                className="mt-2 bg-brand text-brand-foreground px-6 py-3.5 rounded-xl font-semibold text-xs uppercase tracking-widest hover:opacity-90 transition inline-flex items-center gap-2"
              >
                Register for the Summit &rarr;
              </Link>
            </div>
          )
        ) : (
          <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-4">
            {courses.map((course) => (
              <div
                key={course.id}
                onClick={() => setSelectedCourse(course)}
                className={`rounded-2xl bg-card ring-1 transition-all ring-ink/10 p-6 cursor-pointer hover:ring-brand/20`}
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

                    {course.lessons &&
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
                              className="h-full bg-brand rounded-full transition-all duration-300"
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
                            Lessons: {course.lessons.length}
                          </div>
                          <button className="inline-flex items-center gap-1.5 rounded-xl bg-brand text-brand-foreground px-3 py-1.5 text-xs font-medium hover:opacity-90">
                            <Play className="size-3" /> Start learning
                          </button>
                        </div>
                      )}
                  </div>
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
  const sendEmailAlert = useServerFn(sendPasswordChangedEmail);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setBusy(false);

    if (error) {
      toast.error(error.message);
    } else {
      await sendEmailAlert({ data: { email } }).catch(() => {});
      toast.success("Password changed successfully!");
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-5 max-w-4xl">
      <section className="rounded-2xl bg-card ring-1 ring-ink/10 p-6">
        <h2 className="font-semibold mb-4">Account Details</h2>
        <div className="grid gap-3 text-sm">
          <div className="flex justify-between border-b border-ink/5 pb-2">
            <span className="text-ink/60">Name</span>
            <span className="capitalize font-medium text-ink">{fullName}</span>
          </div>
          <div className="flex justify-between border-b border-ink/5 pb-2">
            <span className="text-ink/60">Email</span>
            <span className="font-medium text-ink">{email}</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-card ring-1 ring-ink/10 p-6">
        <h2 className="font-semibold mb-4">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="flex flex-col gap-3">
          <div>
            <label className="text-[10px] text-ink/50 uppercase tracking-wider block font-semibold mb-1">New Password</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl bg-surface ring-1 ring-ink/10 px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-brand"
            />
          </div>

          <div>
            <label className="text-[10px] text-ink/50 uppercase tracking-wider block font-semibold mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl bg-surface ring-1 ring-ink/10 px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-brand"
            />
          </div>

          <button
            disabled={busy}
            className="mt-2 bg-brand text-brand-foreground font-semibold py-2.5 rounded-xl text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition w-full"
          >
            {busy ? "Updating…" : "Update Password"}
          </button>
        </form>
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
  role,
}: {
  section: Section;
  setSection: (s: Section) => void;
  role: string | null;
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

            {/* Custom Links for Console views */}
            {(role === "instructor" || role === "admin") && (
              <Link
                to="/instructor"
                onClick={() => setMoreOpen(false)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-brand/10 text-brand ring-1 ring-brand/20 hover:bg-brand/15 transition text-center"
              >
                <GraduationCap className="size-5" />
                <span className="text-[10px] font-semibold uppercase tracking-wide">Instructor</span>
              </Link>
            )}

            {role === "admin" && (
              <Link
                to="/admin"
                onClick={() => setMoreOpen(false)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-brand/10 text-brand ring-1 ring-brand/20 hover:bg-brand/15 transition text-center"
              >
                <Shield className="size-5" />
                <span className="text-[10px] font-semibold uppercase tracking-wide">Admin</span>
              </Link>
            )}
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
