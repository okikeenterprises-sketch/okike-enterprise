import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Clock, Users, Globe, MapPin, Calendar, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Testimonials } from "@/components/site/Testimonials";
import { getCourses, getTracks, getPhysicalClasses } from "@/lib/public-content";
import type { PublicCourse, PublicTrack, PublicPhysicalClass } from "@/lib/public-content";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Tech Academy — Learn Software Development in Nigeria | OKIKE" },
      {
        name: "description",
        content:
          "OKIKE Academy offers hands-on software development courses in Nigeria — fullstack web development, UI/UX design, data analysis and more. Online and physical classes. Build real projects from day one.",
      },
      { name: "robots", content: "index, follow" },
      { name: "keywords", content: "software development course Nigeria, coding bootcamp Africa, tech academy Nigeria, learn web development Nigeria, UI UX course Nigeria, OKIKE academy" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://okike-enterprise.com/learn" },
      { property: "og:title", content: "Tech Academy — Learn Software Development in Nigeria | OKIKE" },
      { property: "og:description", content: "Hands-on tech courses built for employability. Fullstack, UI/UX, data analysis and more — online and in-person across Nigeria." },
      { property: "og:image", content: "https://okike-enterprise.com/background.png" },
      { property: "og:site_name", content: "OKIKE" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Tech Academy — Learn Software Development in Nigeria | OKIKE" },
      { name: "twitter:description", content: "Hands-on tech courses built for employability — fullstack, UI/UX, data analysis. Online and in-person." },
      { name: "twitter:image", content: "https://okike-enterprise.com/background.png" },
    ],
    links: [
      { rel: "canonical", href: "https://okike-enterprise.com/learn" },
    ],
  }),
  component: LearnPage,
  loader: async () => {
    const [courses, tracks, physicalClasses] = await Promise.all([
      getCourses(),
      getTracks(),
      getPhysicalClasses(),
    ]);
    return { courses, tracks, physicalClasses };
  },
});

function LearnPage() {
  const { courses, tracks, physicalClasses } = Route.useLoaderData();
  const [loading, setLoading] = useState(true);

  useEffect(() => { setLoading(false); }, []);

  return (
    <SiteLayout>

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden border-b border-ink/10">
        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-0 md:pt-28 min-h-[72vh] flex flex-col justify-between">
          <div className="flex flex-col gap-6 max-w-3xl">
            <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/50">
              <span className="h-px w-8 bg-brand" />
              <span>The Academy</span>
            </div>
            <h1 className="font-display text-[clamp(3.5rem,9vw,7.5rem)] leading-[0.92] tracking-wide uppercase text-ink">
              Train on what employers{" "}
              <span className="text-brand">actually</span> hire for.
            </h1>
            <p className="text-base md:text-lg text-ink/65 max-w-[48ch] leading-relaxed">
              Join hands-on courses online or in our physical classes and become part of Africa's
              next generation of innovators.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link to="/enroll" className="bg-brand text-brand-foreground py-3.5 pl-7 pr-5 inline-flex items-center gap-2 font-semibold text-sm uppercase tracking-widest hover:opacity-90 transition">
                Explore Courses
              </Link>
              <Link to="/enroll" className="bg-transparent text-ink py-3.5 pl-7 pr-5 inline-flex items-center gap-2 font-semibold text-sm uppercase tracking-widest ring-1 ring-ink/20 hover:ring-ink/40 transition">
                Apply to Academy
              </Link>
            </div>
          </div>

          {/* Stats bar */}
          <div className="relative mt-16 -mx-6 border-t border-ink/10 bg-surface/80 backdrop-blur overflow-hidden">
            <div className="flex divide-x divide-ink/10 overflow-x-auto scrollbar-none">
              {[
                { value: "5", label: "Specialisations" },
                { value: "3", label: "Intensities" },
                { value: "12 wks", label: "Shortest track" },
                { value: "100%", label: "Project-based" },
                { value: "Online", label: "& physical" },
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

      {/* ─── DELIVERY MODES ─── */}
      <section className="py-16 px-6 border-b border-ink/10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-px bg-ink/10 border border-ink/10">
          <div className="p-8 bg-surface flex items-center gap-4">
            <Globe className="size-8 text-brand shrink-0" />
            <div>
              <div className="font-display text-2xl tracking-wide uppercase text-ink">Online Classes</div>
              <p className="text-sm text-ink/60 mt-1">Learn from anywhere, at your pace</p>
            </div>
          </div>
          <div className="p-8 bg-surface flex items-center gap-4">
            <Users className="size-8 text-brand shrink-0" />
            <div>
              <div className="font-display text-2xl tracking-wide uppercase text-ink">Physical Classes</div>
              <p className="text-sm text-ink/60 mt-1">Learn at our centres in Nigeria</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURED COURSES ─── */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/50 mb-4">
                <span className="h-px w-8 bg-brand" />
                <span>Courses</span>
              </div>
              <h2 className="font-display text-5xl md:text-6xl leading-[0.92] tracking-wide uppercase text-ink">
                Featured Courses.
              </h2>
            </div>
            <Link to="/enroll" className="inline-flex items-center gap-1 text-brand font-semibold text-sm uppercase tracking-widest hover:gap-2 transition-all shrink-0">
              View all <ArrowUpRight className="size-4" />
            </Link>
          </div>

          {loading ? (
            <div className="text-sm text-ink/40 py-12">Loading…</div>
          ) : courses.length === 0 ? (
            <div className="border border-ink/10 p-12 text-center text-ink/50 text-sm uppercase tracking-widest">
              Courses coming soon
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-ink/10 border border-ink/10">
              {courses.slice(0, 4).map((course) => (
                <div key={course.id} className="bg-surface flex flex-col hover:bg-secondary transition-colors">
                  {course.image_url ? (
                    <div className="aspect-square overflow-hidden bg-ink/5">
                      <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  ) : (
                    <div className="aspect-square bg-brand/5 flex items-center justify-center font-display text-5xl text-brand/30">
                      {course.title.charAt(0)}
                    </div>
                  )}
                  <div className="p-6 flex flex-col gap-3 flex-1">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-brand font-semibold">{course.track}</div>
                    <h3 className="font-display text-xl tracking-wide uppercase text-ink leading-tight">{course.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-ink/55 mt-auto">
                      {course.duration && <span className="flex items-center gap-1"><Clock className="size-3" />{course.duration}</span>}
                      {course.instructor && <span className="flex items-center gap-1"><Users className="size-3" />{course.instructor}</span>}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-ink/5">
                      {course.price && <div className="font-semibold">₦{course.price.toLocaleString()}</div>}
                      <Link to="/enroll" className="inline-flex items-center gap-1 text-brand font-semibold text-xs uppercase tracking-widest hover:gap-2 transition-all">
                        Enroll <ArrowUpRight className="size-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── LEARNING PATHS ─── */}
      <section className="py-24 bg-secondary border-y border-ink/10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/50 mb-4">
                <span className="h-px w-8 bg-brand" />
                <span>Learning Paths</span>
              </div>
              <h2 className="font-display text-5xl md:text-6xl leading-[0.92] tracking-wide uppercase text-ink">
                Popular Tracks.
              </h2>
            </div>
            <Link to="/enroll" className="inline-flex items-center gap-1 text-brand font-semibold text-sm uppercase tracking-widest hover:gap-2 transition-all shrink-0">
              View all <ArrowUpRight className="size-4" />
            </Link>
          </div>

          {loading ? (
            <div className="text-sm text-ink/40">Loading…</div>
          ) : (
            <div className="border border-ink/10 divide-y divide-ink/10">
              {tracks.map((track) => (
                <div key={track.id} className="bg-surface p-6 flex items-center justify-between gap-6 hover:bg-card transition-colors">
                  <div className="flex items-center gap-5 min-w-0">
                    <div className="size-10 bg-brand/10 flex items-center justify-center text-brand shrink-0">
                      <Globe className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-display text-xl tracking-wide uppercase text-ink">{track.name}</div>
                      <p className="text-sm text-ink/55 mt-0.5 truncate">{track.tagline}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {track.stack.slice(0, 4).map((tech, i) => (
                          <span key={i} className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-ink/5 text-ink/60">{tech}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-ink/50 shrink-0">
                    <span className="text-sm font-semibold">{track.courses_count} courses</span>
                    <ChevronRight className="size-4" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── PHYSICAL CLASSES ─── */}
      {physicalClasses.length > 0 && (
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-12">
              <div>
                <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/50 mb-4">
                  <span className="h-px w-8 bg-brand" />
                  <span>In-Person</span>
                </div>
                <h2 className="font-display text-5xl md:text-6xl leading-[0.92] tracking-wide uppercase text-ink">
                  Upcoming Physical Classes.
                </h2>
              </div>
              <Link to="/enroll" className="inline-flex items-center gap-1 text-brand font-semibold text-sm uppercase tracking-widest hover:gap-2 transition-all shrink-0">
                View all <ArrowUpRight className="size-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-px bg-ink/10 border border-ink/10">
              {physicalClasses.slice(0, 3).map((cls) => (
                <div key={cls.id} className="bg-surface flex flex-col hover:bg-secondary transition-colors">
                  {cls.image_url && (
                    <div className="aspect-video overflow-hidden">
                      <img src={cls.image_url} alt={cls.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-6 flex flex-col gap-3 flex-1">
                    <h3 className="font-display text-xl tracking-wide uppercase text-ink">{cls.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-ink/55">
                      {cls.date && <span className="flex items-center gap-1"><Calendar className="size-3" />{new Date(cls.date).toLocaleDateString()}</span>}
                      {cls.location && <span className="flex items-center gap-1"><MapPin className="size-3" />{cls.location}</span>}
                    </div>
                    <div className="flex justify-between items-center mt-auto pt-3 border-t border-ink/5">
                      <div className="text-brand font-semibold text-sm">{cls.spots_available} seats left</div>
                      <Link to="/enroll" className="inline-flex items-center gap-1 text-brand font-semibold text-xs uppercase tracking-widest hover:gap-2 transition-all">
                        Learn More <ArrowUpRight className="size-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── AI CTA ─── */}
      <section className="py-16 px-6 border-y border-ink/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8 bg-contrast text-contrast-foreground p-8 md:p-12">
            <div className="flex-1">
              <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-brand mb-4">
                <span className="h-px w-8 bg-brand" />
                <span>AI-powered learning</span>
              </div>
              <h3 className="font-display text-4xl md:text-5xl leading-[0.92] tracking-wide uppercase text-contrast-foreground mb-3">
                Ask OKIKE AI.
              </h3>
              <p className="text-contrast-foreground/65 text-sm max-w-[44ch]">
                Your personal learning assistant. Get explanations, summaries, recommendations and more inside your dashboard.
              </p>
            </div>
            <Link
              to="/dashboard"
              className="bg-brand text-brand-foreground py-3.5 pl-7 pr-5 inline-flex items-center gap-2 font-semibold text-sm uppercase tracking-widest hover:opacity-90 transition shrink-0"
            >
              Open AI Assistant <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <Testimonials
        eyebrow="What our students say"
        heading="The learning experience changed my life."
        quotes={[
          { quote: "The bootcamp changed my life. Now I'm working at a startup.", name: "Esther U.", role: "Full-Stack '24" },
          { quote: "The instructors are amazing and the projects are real-world.", name: "David M.", role: "Data Analysis '25" },
          { quote: "I loved the practical approach. I built my portfolio during the course.", name: "Mary A.", role: "Product Design '24" },
        ]}
      />

    </SiteLayout>
  );
}
