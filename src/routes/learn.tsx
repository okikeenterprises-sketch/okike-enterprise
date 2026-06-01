import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, CheckCircle, ChevronRight, BookOpen, Clock, Users, Star } from "lucide-react";
import { useState } from "react";
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
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [isCourseSelected, setIsCourseSelected] = useState(false);

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

      {isCourseSelected && selectedTrack && (
        <section className="py-12 px-6 bg-brand/5 border-y border-brand/20">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card rounded-2xl p-8 ring-1 ring-brand/20 shadow-lg">
              <div className="flex items-start justify-between flex-col md:flex-row gap-6">
                <div>
                  <div className="text-xs uppercase tracking-widest text-brand font-semibold mb-2">
                    Selected
                  </div>
                  <h3 className="text-3xl font-medium mb-2">{selectedTrack}</h3>
                  <p className="text-ink/60 mb-6">Your learning journey begins in your dashboard!</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsCourseSelected(false)}
                    className="px-6 py-3 rounded-full border border-ink/20 hover:bg-ink/5 transition"
                  >
                    Choose another
                  </button>
                  <Link
                    to="/signup"
                    className="px-6 py-3 rounded-full bg-brand text-brand-foreground font-medium hover:opacity-90 transition"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-xs font-semibold tracking-widest uppercase text-brand mb-4">
            Tracks
          </div>
          <h2 className="text-3xl md:text-4xl font-medium mb-4 max-w-[32ch] text-balance">
            Pick the path that fits the career you want.
          </h2>
          <p className="text-ink/60 mb-12 max-w-[48ch]">
            Click on any track to learn more and select it for enrollment.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {tracks.map((t) => (
              <div
                key={t.name}
                data-reveal
                onClick={() => {
                  setSelectedTrack(t.name);
                  setIsCourseSelected(true);
                }}
                className={`bg-card rounded-2xl p-8 ring-1 transition cursor-pointer ${
                  selectedTrack === t.name
                    ? "ring-brand bg-brand/5"
                    : "ring-ink/5 hover:ring-brand/30 hover:bg-ink/5"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs uppercase tracking-widest text-brand font-semibold">
                    {t.tag}
                  </div>
                  {selectedTrack === t.name && (
                    <CheckCircle className="size-6 text-brand" />
                  )}
                </div>
                <h3 className="text-2xl font-medium mb-2">{t.name}</h3>
                <p className="text-ink/60 mb-4">{t.desc}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {t.stack.map((s) => (
                    <span key={s} className="text-xs px-3 py-1 rounded-full bg-ink/5 text-ink/70">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-ink/10">
                  <div className="flex items-center gap-4 text-sm text-ink/60">
                    <span className="flex items-center gap-1"><Clock className="size-4" /> 12 weeks</span>
                    <span className="flex items-center gap-1"><Users className="size-4" /> ≤ 20</span>
                    <span className="flex items-center gap-1"><Star className="size-4" /> 4.9/5</span>
                  </div>
                  <ChevronRight className="size-5 text-brand" />
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
