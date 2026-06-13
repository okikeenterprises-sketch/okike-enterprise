import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Mail, MapPin, Phone, Instagram, Linkedin, X, Github } from "lucide-react";
import okikeLogo from "@/assets/okike-logo.png";

export function SiteFooter() {
  return (
    <footer className="bg-contrast text-contrast-foreground">

      {/* ─── TOP CTA STRIP ─── */}
      <div className="border-b border-contrast-foreground/10">
        <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-brand mb-6">
              <span className="h-px w-8 bg-brand" />
              <span>Let's talk</span>
            </div>
            <h2 className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-[0.92] tracking-wide uppercase text-contrast-foreground">
              Have a project in mind?{" "}
              <span className="text-brand">We'd love to build it.</span>
            </h2>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to="/book"
              className="group bg-brand text-brand-foreground py-3.5 pl-7 pr-5 inline-flex items-center gap-2 font-semibold text-sm uppercase tracking-widest hover:opacity-90 transition"
            >
              Start a project
              <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/contact"
              className="bg-transparent text-contrast-foreground py-3.5 pl-7 pr-5 inline-flex items-center gap-2 font-semibold text-sm uppercase tracking-widest ring-1 ring-contrast-foreground/20 hover:ring-contrast-foreground/40 transition"
            >
              Contact us
            </Link>
          </div>
        </div>
      </div>

      {/* ─── MAIN GRID ─── */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5 flex flex-col gap-6">
          <Link to="/" className="inline-flex" aria-label="OKIKE home">
            <img src={okikeLogo} alt="OKIKE" className="h-8 w-auto" />
          </Link>
          <p className="text-sm text-contrast-foreground/60 max-w-sm leading-relaxed">
            A founder-led studio building software, AI tools and digital products that solve real
            problems, while training the next generation of African engineers.
          </p>
          <ul className="flex flex-col gap-3 text-sm text-contrast-foreground/70">
            <li className="flex items-center gap-3">
              <Mail className="size-4 text-brand shrink-0" />
              <span>okikeenterprises@gmail.com</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="size-4 text-brand shrink-0" />
              <span>Available on request</span>
            </li>
            <li className="flex items-center gap-3">
              <MapPin className="size-4 text-brand shrink-0" />
              <span>Nigeria — Remote worldwide</span>
            </li>
          </ul>
          <div className="flex items-center gap-2 pt-2">
            {[
              { Icon: Instagram, href: "https://www.instagram.com/okike_enterprise?igsh=YjM3bzRjamh5cDJ5", label: "Instagram" },
              { Icon: Linkedin, href: "#", label: "LinkedIn" },
              { Icon: X, href: "#", label: "X (Twitter)" },
              { Icon: Github, href: "#", label: "GitHub" },
            ].map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="size-9 inline-flex items-center justify-center bg-contrast-foreground/5 ring-1 ring-contrast-foreground/10 hover:bg-brand hover:ring-brand transition"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand mb-2">Build</div>
          {[
            { to: "/services", label: "Services" },
            { to: "/book", label: "Start a project" },
            { to: "/portfolio", label: "Portfolio" },
            { to: "/contact", label: "Contact" },
          ].map(({ to, label }) => (
            <Link key={to} to={to} className="text-sm text-contrast-foreground/60 hover:text-contrast-foreground transition">
              {label}
            </Link>
          ))}
        </div>

        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand mb-2">Learn</div>
          {[
            { to: "/learn", label: "Academy" },
            { to: "/enroll", label: "Enroll" },
            { to: "/blog", label: "Blog" },
            { to: "/about", label: "About" },
          ].map(({ to, label }) => (
            <Link key={to} to={to} className="text-sm text-contrast-foreground/60 hover:text-contrast-foreground transition">
              {label}
            </Link>
          ))}
        </div>

        <div className="md:col-span-3 flex flex-col gap-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand mb-2">Account</div>
          {[
            { to: "/login", label: "Sign in" },
            { to: "/signup", label: "Create account" },
            { to: "/dashboard", label: "Dashboard" },
          ].map(({ to, label }) => (
            <Link key={to} to={to} className="text-sm text-contrast-foreground/60 hover:text-contrast-foreground transition">
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* ─── BOTTOM BAR ─── */}
      <div className="border-t border-contrast-foreground/10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-3 text-[11px] text-contrast-foreground/35 font-semibold uppercase tracking-widest">
          <div>© {new Date().getFullYear()} OKIKE. Built with intention.</div>
          <div className="flex gap-8">
            <span>All rights reserved</span>
            <span>Made in Nigeria</span>
          </div>
        </div>
      </div>

    </footer>
  );
}
