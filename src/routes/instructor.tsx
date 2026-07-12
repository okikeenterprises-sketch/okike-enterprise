import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import okikeLogo from "@/assets/okike-logo.png";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import {
  LayoutGrid,
  Users,
  BookOpen,
  Menu,
  X,
  LogOut,
  GraduationCap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/instructor")({
  component: InstructorLayout,
});

const NAV: { to: string; label: string; icon: LucideIcon; exact?: boolean }[] = [
  { to: "/instructor", label: "Overview", icon: LayoutGrid, exact: true },
  { to: "/instructor/curriculum", label: "Manage Curriculum", icon: BookOpen },
  { to: "/instructor/students", label: "Manage Students", icon: Users },
];

function InstructorLayout() {
  const { session, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!session) navigate({ to: "/login" });
    else if (role !== "admin" && role !== "instructor") navigate({ to: "/dashboard" });
  }, [session, role, loading, navigate]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (loading || !session || (role !== "admin" && role !== "instructor")) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  const email = session.user?.email ?? "Instructor";
  const initial = (email[0] ?? "I").toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-ink/10 bg-background/80 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 -ml-2 rounded-xl text-ink/75 hover:bg-ink/5"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
            <Link to="/instructor" className="flex items-center gap-2 font-display text-lg font-black tracking-widest text-ink select-none uppercase">
              <img src={okikeLogo} alt="OKIKE" className="h-6 w-auto" />
              <span className="hidden sm:inline-block">Instructor Console</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-brand text-brand-foreground flex items-center justify-center font-semibold text-sm">
                {initial}
              </div>
              <span className="hidden md:inline-block text-xs font-medium text-ink/70 max-w-[20ch] truncate">
                {email}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-ink/10 bg-card p-4">
          <nav className="flex-1 space-y-1">
            {NAV.map((item) => {
              const active = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                    active
                      ? "bg-brand text-brand-foreground shadow"
                      : "text-ink/65 hover:text-ink hover:bg-ink/5"
                  }`}
                >
                  <item.icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-ink/5 pt-4">
            <button
              onClick={() => {
                signOut();
                navigate({ to: "/login" });
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-500/5 transition"
            >
              <LogOut className="size-4 shrink-0" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Mobile menu overlay */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-30 flex">
            <div className="fixed inset-0 bg-ink/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <aside className="relative flex w-64 flex-col bg-card p-4 ring-1 ring-ink/10 h-full">
              <nav className="flex-1 space-y-1">
                {NAV.map((item) => {
                  const active = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                        active
                          ? "bg-brand text-brand-foreground shadow"
                          : "text-ink/65 hover:text-ink hover:bg-ink/5"
                      }`}
                    >
                      <item.icon className="size-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-ink/5 pt-4">
                <button
                  onClick={() => {
                    signOut();
                    navigate({ to: "/login" });
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-500/5 transition"
                >
                  <LogOut className="size-4 shrink-0" />
                  Sign Out
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Main Work Area */}
        <main className="flex-1 overflow-y-auto bg-background/50 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
