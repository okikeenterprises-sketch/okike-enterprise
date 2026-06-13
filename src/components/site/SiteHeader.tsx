import { Link, useNavigate } from "@tanstack/react-router";
import okikeLogo from "@/assets/okike-logo.png";
import { useState } from "react";
import {
  Menu,
  X,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  Shield,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "./ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { to: "/services", label: "Services" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/blog", label: "Blog" },
  { to: "/learn", label: "Academy" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { session, user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const initial = (user?.user_metadata?.full_name || user?.email || "?")[0]?.toUpperCase();

  return (
    <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-xl border-b border-ink/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">

        {/* Logo */}
        <Link to="/" className="flex items-center shrink-0" aria-label="OKIKE home">
          <img src={okikeLogo} alt="OKIKE" className="h-7 w-auto" />
        </Link>

        {/* Desktop nav — flat uppercase links, no pill container */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/55 hover:text-ink transition-colors"
              activeProps={{ className: "text-[11px] font-semibold uppercase tracking-[0.18em] text-ink" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <ThemeToggle />

          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="size-8 bg-brand text-brand-foreground text-sm font-semibold flex items-center justify-center hover:opacity-90 transition">
                {initial}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-xs text-ink/60 truncate">{user?.email}</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>
                  <LayoutDashboard className="size-4" /> Dashboard
                </DropdownMenuItem>
                {role === "admin" && (
                  <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
                    <Shield className="size-4" /> Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
                  <LogOut className="size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/55 hover:text-ink transition">
                Sign in
              </Link>
              <Link
                to="/book"
                className="group bg-brand text-brand-foreground py-2 pl-5 pr-4 inline-flex items-center gap-1.5 font-semibold text-[11px] uppercase tracking-[0.18em] hover:opacity-90 transition"
              >
                Get Started
                <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 -mr-2 text-ink"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-ink/10 bg-surface">
          <nav className="px-6 py-6 flex flex-col gap-5">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/70 hover:text-ink"
              >
                {item.label}
              </Link>
            ))}

            <div className="h-px bg-ink/10 my-1" />

            {session ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/70 flex items-center gap-2">
                  <LayoutDashboard className="size-4" /> Dashboard
                </Link>
                {role === "admin" && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/70 flex items-center gap-2">
                    <Shield className="size-4" /> Admin
                  </Link>
                )}
                <button
                  onClick={async () => { await signOut(); setOpen(false); navigate({ to: "/" }); }}
                  className="text-[11px] font-semibold uppercase tracking-[0.18em] text-left text-ink/70 flex items-center gap-2"
                >
                  <LogOut className="size-4" /> Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/70 flex items-center gap-2">
                  <UserIcon className="size-4" /> Sign in
                </Link>
                <Link
                  to="/book"
                  onClick={() => setOpen(false)}
                  className="bg-brand text-brand-foreground py-3 px-5 font-semibold text-[11px] uppercase tracking-[0.18em] text-center"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
