import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { CurriculumLead } from "@/components/site/CurriculumLead";
import { Testimonials } from "@/components/site/Testimonials";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Academy — OKIKE" },
      {
        name: "description",
        content:
          "Cohort-based tracks in full-stack development, cyber security, data analysis, and Python — taught by working practitioners at OKIKE.",
      },
      { property: "og:title", content: "Academy — OKIKE" },
      {
        property: "og:description",
        content:
          "Four industry-ready tracks: full-stack, cyber security, data analysis, and Python. Cohort-based, mentor-led.",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "EducationalOrganization",
              name: "OKIKE Academy",
              url: "https://okike-enterprise.lovable.app/learn",
              description:
                "A cohort-based software engineering academy that takes students from beginner to industry-ready, taught by working builders.",
            },
            {
              "@type": "Course",
              name: "OKIKE Full-Stack Engineering Cohort",
              description:
                "A 12-week, mentor-led program covering foundations, frontend, backend and data, product skills, and a shipped capstone project.",
              provider: {
                "@type": "EducationalOrganization",
                name: "OKIKE Academy",
                sameAs: "https://okike-enterprise.lovable.app",
              },
              hasCourseInstance: [
                {
                  "@type": "CourseInstance",
                  courseMode: "Blended",
                  courseWorkload: "PT12W",
                },
              ],
            },
          ],
        }),
      },
    ],
  }),
  component: LearnPage,
});

const tracks = [
  {
    name: "Full-Stack Development",
    tag: "Build the web",
    desc: "Ship production web apps end-to-end: React, TypeScript, Node, Postgres, auth, deployment.",
    stack: ["React", "TypeScript", "Node.js", "Postgres", "Tailwind"],
  },
  {
    name: "Cyber Security",
    tag: "Defend & break",
    desc: "Offensive and defensive fundamentals: networking, web exploitation, hardening, incident response.",
    stack: ["Linux", "Networking", "OWASP Top 10", "Burp Suite", "Wireshark"],
  },
  {
    name: "Data Analysis",
    tag: "Turn data into decisions",
    desc: "From messy spreadsheets to clear dashboards. SQL, Python, statistics, and storytelling with data.",
    stack: ["SQL", "Python", "Pandas", "Power BI", "Excel"],
  },
  {
    name: "Python Development",
    tag: "Automate & build",
    desc: "Master Python for scripting, APIs, automation, and a launchpad into AI/ML or backend engineering.",
    stack: ["Python", "FastAPI", "Pytest", "Automation", "APIs"],
  },
];

const curriculum = [
  {
    week: "Weeks 1–2",
    title: "Foundations",
    desc: "Computers, the command line, Git, problem solving, and the engineering mindset — shared across every track.",
  },
  {
    week: "Weeks 3–5",
    title: "Core Track Skills",
    desc: "Deep work in your chosen track: full-stack, cyber security, data analysis, or Python development.",
  },
  {
    week: "Weeks 6–8",
    title: "Tooling & Systems",
    desc: "Databases, APIs, cloud, security basics, and the production tools real teams use every day.",
  },
  {
    week: "Weeks 9–10",
    title: "Product & Professional Skills",
    desc: "Communication, code review, documentation, deployment, and shipping with confidence.",
  },
  {
    week: "Weeks 11–12",
    title: "Capstone",
    desc: "Ship a real project in your track to real users. Add it to your portfolio. Defend your design choices.",
  },
];

function LearnPage() {
  return (
    <SiteLayout>
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          <div className="text-xs font-semibold tracking-widest uppercase text-brand">Academy</div>
          <h1 className="text-4xl md:text-6xl font-medium tracking-tight max-w-[22ch] text-balance">
            Four tracks. One standard: industry-ready.
          </h1>
          <p className="text-lg text-ink/70 max-w-[60ch]">
            Choose your path — full-stack development, cyber security, data analysis, or Python
            development. A 12-week cohort taught by working practitioners. You ship something real
            by the end — guaranteed.
          </p>
        </div>
      </section>

      <section className="py-16 bg-secondary border-y border-ink/5 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          <Stat label="Tracks" value="4 paths" />
          <Stat label="Cohort length" value="12 weeks" />
          <Stat label="Format" value="Live + async" />
          <Stat label="Class size" value="≤ 20 students" />
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-xs font-semibold tracking-widest uppercase text-brand mb-4">
            Tracks
          </div>
          <h2 className="text-3xl md:text-4xl font-medium mb-12 max-w-[32ch] text-balance">
            Pick the path that fits the career you want.
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {tracks.map((t) => (
              <div
                key={t.name}
                data-reveal
                className="bg-card rounded-2xl p-8 ring-1 ring-ink/5 flex flex-col gap-4 hover:ring-brand/30 transition"
              >
                <div className="text-xs uppercase tracking-widest text-brand font-semibold">
                  {t.tag}
                </div>
                <h3 className="text-2xl font-medium">{t.name}</h3>
                <p className="text-ink/60">{t.desc}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {t.stack.map((s) => (
                    <span key={s} className="text-xs px-3 py-1 rounded-full bg-ink/5 text-ink/70">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-12">
          <div className="md:col-span-5">
            <div className="text-xs font-semibold tracking-widest uppercase text-brand mb-4">
              Curriculum
            </div>
            <h2 className="text-3xl font-medium mb-6 text-balance">
              From first commit to first launch.
            </h2>
            <p className="text-ink/60 mb-6">
              Every week builds on the last. By graduation you'll have shipped a working product and
              a portfolio that stands up to scrutiny.
            </p>
            <Link
              to="/enroll"
              className="inline-flex bg-brand text-contrast-foreground py-3 px-6 rounded-full font-medium hover:opacity-90 transition"
            >
              Apply for the next cohort
            </Link>
          </div>
          <div className="md:col-span-7 space-y-px bg-ink/10">
            {curriculum.map((m) => (
              <div
                key={m.title}
                className="bg-surface p-6 flex flex-col md:flex-row md:items-baseline gap-4"
              >
                <div className="text-xs uppercase tracking-widest text-brand font-semibold md:w-32 shrink-0">
                  {m.week}
                </div>
                <div>
                  <div className="text-lg font-medium mb-1">{m.title}</div>
                  <p className="text-sm text-ink/60">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-contrast text-contrast-foreground px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16">
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase text-brand mb-4">
              What you'll get
            </div>
            <h2 className="text-3xl font-medium mb-6 text-balance">
              More than a course. A career on-ramp.
            </h2>
            <p className="text-contrast-foreground/70">
              A learning environment with the seriousness of a real engineering team — because
              that's where you're heading.
            </p>
          </div>
          <ul className="space-y-4">
            {[
              "12-week structured curriculum",
              "Weekly 1:1 mentorship calls",
              "Code reviews on every project",
              "Live working sessions",
              "Capstone project shipped to real users",
              "Portfolio review + interview prep",
              "Lifetime alumni community",
              "Certificate of completion",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 border-b border-contrast-foreground/10 pb-4"
              >
                <Check className="size-5 text-brand mt-0.5 shrink-0" />
                <span className="text-contrast-foreground/90">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Testimonials
        eyebrow="Graduates"
        heading="Alumni now shipping real software."
        quotes={[
          {
            quote:
              "I came in barely able to use the terminal. Twelve weeks later I was reviewing pull requests for a real product.",
            name: "Ifeanyi O.",
            role: "Full-Stack '24",
          },
          {
            quote:
              "The cyber security track taught me to think like an attacker. I landed a SOC analyst role two months after graduating.",
            name: "Halima A.",
            role: "Cyber Security '24",
          },
          {
            quote:
              "The mentorship is the difference. You're never stuck for long, and the standard never drops.",
            name: "Tunde B.",
            role: "Data Analysis '25",
          },
        ]}
      />

      <CurriculumLead />

      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto bg-card rounded-3xl p-12 ring-1 ring-ink/5 flex flex-col items-center text-center gap-6">
          <div className="text-xs font-semibold tracking-widest uppercase text-brand">Tuition</div>
          <div className="text-5xl md:text-6xl font-medium">$1,200</div>
          <div className="text-ink/60">or 3 monthly payments of $450</div>
          <p className="text-ink/60 max-w-[48ch] text-pretty">
            Scholarships available for exceptional candidates. Apply now and we'll review every
            application personally.
          </p>
          <Link
            to="/enroll"
            className="bg-brand text-contrast-foreground py-3 px-6 rounded-full font-medium hover:opacity-90 transition"
          >
            Apply now
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-brand font-semibold mb-2">{label}</div>
      <div className="text-3xl font-medium">{value}</div>
    </div>
  );
}
