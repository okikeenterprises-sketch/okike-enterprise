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
    <header className="sticky top-0 z-50 bg-surface/75 backdrop-blur-xl border-b border-ink/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center" aria-label="OKIKE home">
          <img src={okikeLogo} alt="OKIKE" className="h-7 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-1 bg-ink/[0.03] ring-1 ring-ink/5 rounded-full px-2 py-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm font-medium text-ink/70 hover:text-ink hover:bg-surface px-4 py-1.5 rounded-full transition-colors"
              activeProps={{ className: "text-ink bg-surface shadow-sm" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />

          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="size-9 rounded-full bg-ink text-surface text-sm font-medium flex items-center justify-center hover:bg-brand hover:text-brand-foreground transition">
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
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    navigate({ to: "/" });
                  }}
                >
                  <LogOut className="size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-ink/70 hover:text-ink transition"
              >
                Sign in
              </Link>
              <Link
                to="/book"
                className="group text-sm font-medium bg-ink text-surface py-2 pl-5 pr-4 inline-flex items-center gap-1.5 rounded-full hover:bg-brand hover:text-brand-foreground transition-colors"
              >
                Get Started
                <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2 -mr-2 text-ink"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-ink/5 bg-surface">
          <nav className="px-6 py-4 flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-ink hover:text-brand"
              >
                {item.label}
              </Link>
            ))}
            {session ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium"
                >
                  Dashboard
                </Link>
                {role === "admin" && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="text-sm font-medium">
                    Admin
                  </Link>
                )}
                <button
                  onClick={async () => {
                    await signOut();
                    setOpen(false);
                    navigate({ to: "/" });
                  }}
                  className="text-sm font-medium text-left flex items-center gap-2"
                >
                  <LogOut className="size-4" /> Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <UserIcon className="size-4" /> Sign in
                </Link>
                <Link
                  to="/book"
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium bg-ink text-surface py-2 px-5 rounded-full text-center"
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
