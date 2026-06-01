import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import founderImg from "@/assets/founder.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — OKIKE" },
      {
        name: "description",
        content:
          "OKIKE was founded to bridge African tech talent with global opportunity. Build with us. Learn from us.",
      },
      { property: "og:title", content: "About — OKIKE" },
      { property: "og:description", content: "Founder story and mission behind OKIKE." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteLayout>
      {/* 1. Editorial masthead */}
      <section className="pt-24 md:pt-32 pb-12 px-6 border-b border-ink/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 text-xs font-semibold tracking-widest uppercase text-brand mb-8">
            <span>About</span>
            <span className="h-px w-12 bg-brand/40" />
            <span className="text-ink/40">Vol. 01 — The Company</span>
          </div>
          <div className="grid md:grid-cols-12 gap-8 items-end">
            <h1 className="md:col-span-8 text-4xl md:text-6xl lg:text-7xl font-medium tracking-tight text-balance">
              Built in Africa. Engineered for the world.
            </h1>
            <p className="md:col-span-4 text-lg text-ink/70 max-w-[40ch] md:pb-4">
              OKIKE exists because the gap between world-class engineering and African opportunity
              is closing — and we want to help close it faster.
            </p>
          </div>
        </div>
      </section>

      {/* 2. At-a-glance facts bar */}
      <section className="px-6 border-b border-ink/10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-ink/10">
          <Fact k="Founded" v="2023" />
          <Fact k="Head Offices" v="Akwa Ibom & Enugu, NG" />
          <Fact k="Disciplines" v="Build · Teach" />
          <Fact k="Cohort size" v="≤ 20" />
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

      {/* 4. Principles — numbered, two-column with rule lines */}
      <section className="py-24 bg-secondary border-y border-ink/10 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-12">
          <header className="md:col-span-4">
            <div className="text-xs font-semibold tracking-widest uppercase text-brand mb-4">
              What we believe
            </div>
            <h2 className="text-3xl md:text-4xl font-medium text-balance">
              Three principles that guide every line of code and every lesson.
            </h2>
          </header>
          <div className="md:col-span-8 divide-y divide-ink/10">
            <Principle
              n="01"
              t="Quality compounds."
              d="Cheap work has to be done twice. We do it right the first time."
            />
            <Principle
              n="02"
              t="Teach what you ship."
              d="Our curriculum is the same stack we ship to clients. No toy examples."
            />
            <Principle
              n="03"
              t="People over platforms."
              d="Software is a means. The team behind it is the product that lasts."
            />
          </div>
        </div>
      </section>

      {/* 5. Two pillars — what we do, in parallel columns */}
      <section className="px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-xs font-semibold tracking-widest uppercase text-brand mb-4">
            Two practices, one mission
          </div>
          <h2 className="text-3xl md:text-4xl font-medium mb-12 max-w-[28ch] text-balance">
            A software house and an academy under one roof.
          </h2>
          <div className="grid md:grid-cols-2 gap-px bg-ink/10 rounded-2xl overflow-hidden ring-1 ring-ink/10">
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

      {/* 6. Timeline strip */}
      <section className="px-6 py-24 bg-contrast text-contrast-foreground">
        <div className="max-w-7xl mx-auto">
          <div className="text-xs font-semibold tracking-widest uppercase text-brand mb-4">
            A short history
          </div>
          <h2 className="text-3xl md:text-4xl font-medium mb-16 max-w-[28ch] text-balance text-contrast-foreground">
            From a single project to a practice.
          </h2>
          <ol className="grid md:grid-cols-4 gap-8">
            <Milestone year="2023" label="Founded" body="First clients. First shipped product." />
            <Milestone
              year="2024"
              label="Academy launch"
              body="Inaugural cohort graduates and ships."
            />
            <Milestone
              year="2025"
              label="Scaled delivery"
              body="Cross-border projects, four tracks."
            />
            <Milestone year="2026" label="Today" body="Building and teaching in parallel." />
          </ol>
        </div>
      </section>

      {/* 7. Closing CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-8">
          <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-balance">
            Want to work with us — or learn from us?
          </h2>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/book"
              className="bg-brand text-contrast-foreground py-3 px-6 rounded-full font-medium hover:opacity-90 transition"
            >
              Start a project
            </Link>
            <Link
              to="/enroll"
              className="bg-ink/5 text-ink py-3 px-6 rounded-full font-medium ring-1 ring-ink/5 hover:bg-ink/10 transition"
            >
              Apply to academy
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="px-4 md:px-6 py-8 flex flex-col gap-2 first:pl-0">
      <div className="text-xs uppercase tracking-widest text-ink/50 font-semibold">{k}</div>
      <div className="text-xl md:text-2xl font-medium">{v}</div>
    </div>
  );
}

function Principle({ n, t, d }: { n: string; t: string; d: string }) {
  return (
    <div className="grid grid-cols-12 gap-6 py-8 first:pt-0 last:pb-0 items-baseline">
      <div className="col-span-2 md:col-span-1 text-sm text-brand font-semibold tabular-nums">
        {n}
      </div>
      <div className="col-span-10 md:col-span-4 text-xl font-medium">{t}</div>
      <p className="col-span-12 md:col-span-7 text-ink/60">{d}</p>
    </div>
  );
}

function Pillar({
  tag,
  title,
  body,
  cta,
}: {
  tag: string;
  title: string;
  body: string;
  cta: { to: string; label: string };
}) {
  return (
    <div className="bg-surface p-8 md:p-12 flex flex-col gap-4">
      <div className="text-xs uppercase tracking-widest text-brand font-semibold">{tag}</div>
      <h3 className="text-2xl md:text-3xl font-medium">{title}</h3>
      <p className="text-ink/70 max-w-[42ch]">{body}</p>
      <Link
        to={cta.to}
        className="mt-4 self-start text-sm font-medium text-brand hover:underline underline-offset-4"
      >
        {cta.label} →
      </Link>
    </div>
  );
}

function Milestone({ year, label, body }: { year: string; label: string; body: string }) {
  return (
    <li className="flex flex-col gap-3 border-t border-contrast-foreground/20 pt-6">
      <div className="text-xs uppercase tracking-widest text-brand font-semibold">{year}</div>
      <div className="text-lg font-medium text-contrast-foreground">{label}</div>
      <p className="text-sm text-contrast-foreground/60">{body}</p>
    </li>
  );
}
