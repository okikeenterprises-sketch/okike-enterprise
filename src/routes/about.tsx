import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import founderImg from "@/assets/founder.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About OKIKE — Nigerian Software Studio & Tech Academy" },
      {
        name: "description",
        content:
          "OKIKE is a founder-led Nigerian software house and tech academy. We build world-class digital products and train the next generation of African engineers. Founded in 2023.",
      },
      { name: "robots", content: "index, follow" },
      { name: "keywords", content: "about OKIKE, Nigerian software studio, tech academy Africa, African engineers, software house Nigeria, OKIKE founder" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://okike-enterprise.com/about" },
      { property: "og:title", content: "About OKIKE — Nigerian Software Studio & Tech Academy" },
      { property: "og:description", content: "OKIKE is a founder-led Nigerian software house and academy. We build for ambitious teams and train the engineers behind the next decade of African tech." },
      { property: "og:image", content: "https://okike-enterprise.com/background.png" },
      { property: "og:site_name", content: "OKIKE" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "About OKIKE — Nigerian Software Studio & Tech Academy" },
      { name: "twitter:description", content: "Founder story and mission behind OKIKE — built in Africa, engineered for the world." },
      { name: "twitter:image", content: "https://okike-enterprise.com/background.png" },
    ],
    links: [
      { rel: "canonical", href: "https://okike-enterprise.com/about" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteLayout>
      {/* 1. Editorial masthead */}
      <section className="pt-20 md:pt-28 pb-0 px-6 border-b border-ink/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/50 mb-8">
            <span className="h-px w-8 bg-brand" />
            <span>Vol. 01 — The Company</span>
          </div>

          <h1 className="font-display text-[clamp(3.5rem,9vw,7.5rem)] leading-[0.92] tracking-wide uppercase text-ink max-w-5xl">
            Built in Africa.{" "}
            <span className="text-brand">Engineered</span>{" "}
            for the world.
          </h1>

          <p className="text-base md:text-lg text-ink/65 max-w-[46ch] leading-relaxed mt-6">
            OKIKE exists because the gap between world-class engineering and African opportunity
            is closing — and we want to help close it faster.
          </p>

          {/* Facts bar */}
          <div className="relative mt-16 -mx-6 border-t border-ink/10 bg-surface/80 backdrop-blur overflow-hidden">
            <div className="flex divide-x divide-ink/10 overflow-x-auto scrollbar-none">
              {[
                { value: "2023", label: "Founded" },
                { value: "AK + EN", label: "Head offices" },
                { value: "Build", label: "& teach" },
                { value: "≤20", label: "Cohort size" },
              ].map(({ value, label }) => (
                <div key={label} className="flex-shrink-0 px-8 py-5 flex flex-col gap-0.5 min-w-[160px]">
                  <span className="font-display text-3xl leading-none tracking-wide uppercase text-ink">{value}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/45">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Founder letter — anchored image, long-form copy */}
      <section className="px-6 py-24">
        <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-12 items-start">
          <aside className="md:col-span-5 md:sticky md:top-28 flex flex-col gap-4">
            <img
              src={founderImg}
              alt="Founder of OKIKE"
              loading="lazy"
              width={800}
              height={1000}
              className="w-full aspect-[4/5] object-cover rounded-2xl outline-1 -outline-offset-1 outline-black/5"
            />
            <div className="flex flex-col gap-1">
              <div className="text-sm font-medium">Founder, OKIKE</div>
              <div className="text-xs text-ink/50 uppercase tracking-widest">
                Letter from the founder
              </div>
            </div>
          </aside>
          <article className="md:col-span-7 flex flex-col gap-6 text-lg text-ink/80 leading-relaxed">
            <p className="first-letter:text-6xl first-letter:font-medium first-letter:float-left first-letter:mr-3 first-letter:leading-[0.85] first-letter:text-brand">
              I started OKIKE because I kept seeing the same pattern: brilliant builders without the
              infrastructure to ship, and capable people without a clear path into the craft.
            </p>
            <p>
              By day, I build software for businesses that need it. By night and weekend, I teach
              the people who'll build the next decade of African tech. OKIKE is the home for both.
            </p>
            <blockquote className="border-l-2 border-brand pl-6 my-2 text-2xl font-medium text-ink leading-snug">
              We're small on purpose. Every project gets a senior builder. Every student gets a real
              mentor.
            </blockquote>
            <p>Quality is not a marketing word — it's the only thing that compounds.</p>
            <p className="text-brand font-medium">— Founder, OKIKE</p>
          </article>
        </div>
      </section>

      {/* 4. Principles */}
      <section className="py-24 bg-secondary border-y border-ink/10 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-12">
          <header className="md:col-span-4">
            <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/50 mb-6">
              <span className="h-px w-8 bg-brand" />
              <span>What we believe</span>
            </div>
            <h2 className="font-display text-5xl md:text-6xl leading-[0.92] tracking-wide uppercase text-ink">
              Three principles that guide every line of code and every lesson.
            </h2>
          </header>
          <div className="md:col-span-8 divide-y divide-ink/10">
            <Principle n="01" t="Quality compounds." d="Cheap work has to be done twice. We do it right the first time." />
            <Principle n="02" t="Teach what you ship." d="Our curriculum is the same stack we ship to clients. No toy examples." />
            <Principle n="03" t="People over platforms." d="Software is a means. The team behind it is the product that lasts." />
          </div>
        </div>
      </section>

      {/* 5. Two pillars */}
      <section className="px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/50 mb-6">
            <span className="h-px w-8 bg-brand" />
            <span>Two practices, one mission</span>
          </div>
          <h2 className="font-display text-5xl md:text-6xl leading-[0.92] tracking-wide uppercase text-ink mb-12">
            A software house and an academy under one roof.
          </h2>
          <div className="grid md:grid-cols-2 gap-px bg-ink/10 border border-ink/10">
            <Pillar
              tag="Build"
              title="Software house"
              body="Senior builders shipping web, mobile, and custom software for ambitious teams. Fixed scope. Fixed timeline."
              cta={{ to: "/services", label: "See services" }}
            />
            <Pillar
              tag="Teach"
              title="Academy"
              body="A 12-week cohort taking students from beginner to industry-ready engineer — taught by the same builders."
              cta={{ to: "/learn", label: "See the academy" }}
            />
          </div>
        </div>
      </section>

      {/* 6. Timeline */}
      <section className="px-6 py-24 bg-contrast text-contrast-foreground">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-brand mb-6">
            <span className="h-px w-8 bg-brand" />
            <span>A short history</span>
          </div>
          <h2 className="font-display text-5xl md:text-6xl leading-[0.92] tracking-wide uppercase text-contrast-foreground mb-16">
            From a single project to a practice.
          </h2>
          <ol className="grid md:grid-cols-4 gap-8">
            <Milestone year="2023" label="Founded" body="First clients. First shipped product." />
            <Milestone year="2024" label="Academy launch" body="Inaugural cohort graduates and ships." />
            <Milestone year="2025" label="Scaled delivery" body="Cross-border projects, four tracks." />
            <Milestone year="2026" label="Today" body="Building and teaching in parallel." />
          </ol>
        </div>
      </section>

      {/* 7. Closing CTA */}
      <section className="py-24 px-6 border-t border-ink/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/50 mb-8">
            <span className="h-px w-8 bg-brand" />
            <span>Work With Us</span>
          </div>
          <h2 className="font-display text-[clamp(2.5rem,7vw,6rem)] leading-[0.92] tracking-wide uppercase text-ink mb-8 max-w-3xl">
            Build with us or{" "}
            <span className="text-brand">learn</span> from us.
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/book"
              className="bg-brand text-brand-foreground py-3.5 pl-7 pr-5 inline-flex items-center gap-2 font-semibold text-sm uppercase tracking-widest hover:opacity-90 transition"
            >
              Start a project
            </Link>
            <Link
              to="/enroll"
              className="bg-transparent text-ink py-3.5 pl-7 pr-5 inline-flex items-center gap-2 font-semibold text-sm uppercase tracking-widest ring-1 ring-ink/20 hover:ring-ink/40 transition"
            >
              Apply to academy
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function Principle({ n, t, d }: { n: string; t: string; d: string }) {
  return (
    <div className="grid grid-cols-12 gap-6 py-8 first:pt-0 last:pb-0 items-baseline">
      <div className="col-span-2 md:col-span-1 font-display text-2xl text-brand">{n}</div>
      <div className="col-span-10 md:col-span-4 font-display text-2xl tracking-wide uppercase text-ink">{t}</div>
      <p className="col-span-12 md:col-span-7 text-ink/60">{d}</p>
    </div>
  );
}

function Pillar({ tag, title, body, cta }: { tag: string; title: string; body: string; cta: { to: string; label: string } }) {
  return (
    <div className="bg-surface p-8 md:p-12 flex flex-col gap-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-brand font-semibold">{tag}</div>
      <h3 className="font-display text-4xl leading-[0.92] tracking-wide uppercase text-ink">{title}</h3>
      <p className="text-ink/70 max-w-[42ch]">{body}</p>
      <Link
        to={cta.to}
        className="mt-4 self-start inline-flex items-center gap-2 text-brand font-semibold text-sm uppercase tracking-widest hover:gap-3 transition-all"
      >
        {cta.label} →
      </Link>
    </div>
  );
}

function Milestone({ year, label, body }: { year: string; label: string; body: string }) {
  return (
    <li className="flex flex-col gap-3 border-t border-contrast-foreground/20 pt-6">
      <div className="font-display text-2xl tracking-wide text-brand">{year}</div>
      <div className="font-display text-2xl tracking-wide uppercase text-contrast-foreground">{label}</div>
      <p className="text-sm text-contrast-foreground/60">{body}</p>
    </li>
  );
}
