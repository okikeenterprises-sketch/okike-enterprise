import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Mail, MapPin, Phone, Instagram, Linkedin, Twitter, Github } from "lucide-react";
import okikeLogo from "@/assets/okike-logo.png";

export function SiteFooter() {
  return (
    <footer className="bg-contrast text-contrast-foreground mt-24">
      {/* Top CTA strip */}
      <div className="border-b border-contrast-foreground/10">
        <div className="max-w-7xl mx-auto px-6 py-14 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="text-xs font-semibold uppercase tracking-widest text-brand mb-3">Let's talk</div>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-balance">
              Have a project in mind? <span className="italic text-brand">We'd love to build it.</span>
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/book" className="group bg-brand text-brand-foreground py-3 pl-6 pr-5 inline-flex items-center gap-2 rounded-full font-medium hover:opacity-90 transition">
              Start a project
              <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
            <Link to="/contact" className="bg-contrast-foreground/10 text-contrast-foreground py-3 pl-6 pr-5 inline-flex items-center gap-2 rounded-full font-medium ring-1 ring-contrast-foreground/15 hover:bg-contrast-foreground/15 transition">
              Contact us
            </Link>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5 flex flex-col gap-6">
          <Link to="/" className="inline-flex" aria-label="OKIKE home"><img src={okikeLogo} alt="OKIKE" className="h-8 w-auto" /></Link>
          <p className="text-sm text-contrast-foreground/60 max-w-sm leading-relaxed">
            A founder-led studio building software, AI tools and digital products that solve real problems — and training the next generation of African engineers.
          </p>
          <ul className="flex flex-col gap-3 text-sm text-contrast-foreground/70">
            <li className="flex items-center gap-3"><Mail className="size-4 text-brand" /><span>okikeenterprises@gmail.com</span></li>
            <li className="flex items-center gap-3"><Phone className="size-4 text-brand" /><span>Available on request</span></li>
            <li className="flex items-center gap-3"><MapPin className="size-4 text-brand" /><span>Nigeria · Remote worldwide</span></li>
          </ul>
          <div className="flex items-center gap-2 pt-2">
            {[
              { Icon: Instagram, href: "#", label: "Instagram" },
              { Icon: Linkedin, href: "#", label: "LinkedIn" },
              { Icon: Twitter, href: "#", label: "Twitter / X" },
              { Icon: Github, href: "#", label: "GitHub" },
            ].map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="size-9 inline-flex items-center justify-center rounded-full bg-contrast-foreground/5 ring-1 ring-contrast-foreground/10 hover:bg-brand hover:ring-brand transition"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-brand">Build</div>
          <Link to="/services" className="text-sm text-contrast-foreground/70 hover:text-contrast-foreground">Services</Link>
          <Link to="/book" className="text-sm text-contrast-foreground/70 hover:text-contrast-foreground">Start a project</Link>
          <Link to="/contact" className="text-sm text-contrast-foreground/70 hover:text-contrast-foreground">Contact</Link>
        </div>

        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-brand">Learn</div>
          <Link to="/learn" className="text-sm text-contrast-foreground/70 hover:text-contrast-foreground">Academy</Link>
          <Link to="/enroll" className="text-sm text-contrast-foreground/70 hover:text-contrast-foreground">Enroll</Link>
          <Link to="/about" className="text-sm text-contrast-foreground/70 hover:text-contrast-foreground">About</Link>
        </div>

        <div className="md:col-span-3 flex flex-col gap-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-brand">Account</div>
          <Link to="/login" className="text-sm text-contrast-foreground/70 hover:text-contrast-foreground">Sign in</Link>
          <Link to="/signup" className="text-sm text-contrast-foreground/70 hover:text-contrast-foreground">Create account</Link>
          <Link to="/dashboard" className="text-sm text-contrast-foreground/70 hover:text-contrast-foreground">Dashboard</Link>
        </div>
      </div>

      <div className="border-t border-contrast-foreground/10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-contrast-foreground/40">
          <div>© {new Date().getFullYear()} OKIKE. Built with intention.</div>
          <div className="flex gap-6">
            <span>All rights reserved</span>
            <span>Made in Nigeria</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
