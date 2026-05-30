import { useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { ScrollReveal } from "./ScrollReveal";

export function SiteLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-surface text-ink">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      {/* Re-mount per route so newly rendered sections get observed */}
      <ScrollReveal key={pathname} />
    </div>
  );
}
