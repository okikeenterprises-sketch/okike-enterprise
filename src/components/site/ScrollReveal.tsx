import { useEffect } from "react";

/**
 * Global scroll-reveal: fades + slides in every <section> within <main>
 * and any element with [data-reveal] when it enters the viewport.
 * Respects prefers-reduced-motion.
 */
export function ScrollReveal() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const main = document.querySelector("main");
    if (!main) return;

    const targets = new Set<Element>();
    main.querySelectorAll("section").forEach((el) => targets.add(el));
    document.querySelectorAll("[data-reveal]").forEach((el) => targets.add(el));

    if (prefersReduced) {
      targets.forEach((el) => el.classList.add("reveal-in"));
      return;
    }

    targets.forEach((el) => el.classList.add("reveal-init"));

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
