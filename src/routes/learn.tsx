import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Sparkles,
  Calendar,
  Users,
  Star,
  Clock,
  Globe,
  MapPin,
  Play,
  Share2,
  Heart,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Testimonials } from "@/components/site/Testimonials";
import { getCourses, getTracks, getPhysicalClasses } from "@/lib/public-content";
import type { PublicCourse, PublicTrack, PublicPhysicalClass } from "@/lib/public-content";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Academy — OKIKE" },
      {
        name: "description",
        content:
          "Join hands-on courses online or in our physical classes and become part of Africa's next generation of innovators.",
      },
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

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <SiteLayout>
      {/* Hero section */}
      <section className="relative overflow-hidden border-b border-ink/5">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-40 size-[700px] rounded-full bg-brand/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-32 size-[500px] rounded-full bg-brand/5 blur-3xl"
        />

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-ink/10 bg-surface/60 backdrop-blur px-4 py-2 text-xs font-medium tracking-wide text-ink/80">
                <Sparkles className="size-3.5 text-brand" />
                Learn. Build. Grow.
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.02] text-ink mt-4 text-balance">
                Practical skills for the builders of tomorrow.
              </h1>

              <p className="text-lg text-ink/70 max-w-[60ch] text-balance mt-4">
                Join hands-on courses online or in our physical classes and become part of Africa's
                next generation of innovators.
              </p>

              <div className="flex gap-4 mt-8">
                <Link
                  to="/enroll"
                  className="bg-brand text-brand-foreground py-3 px-6 rounded-full font-medium hover:opacity-90 transition"
                >
                  Explore Courses
                </Link>
                <button className="border border-ink/20 py-3 px-6 rounded-full font-medium hover:bg-ink/5 transition">
                  How It Works
                </button>
              </div>
            </div>
            <div className="lg:col-span-6 flex justify-end">
              <div className="relative">
                <div className="bg-card rounded-3xl p-4 border border-ink/10 shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2560&auto=format&fit=crop"
                    alt="Students learning"
                    className="rounded-2xl"
                  />
                </div>
                <div className="absolute -bottom-4 -right-4 bg-card p-4 rounded-2xl border border-ink/10 shadow-lg">
                  <div className="text-3xl font-bold">8,500+</div>
                  <div className="text-xs text-ink/60">Active Learners</div>
                  <div className="text-xs text-brand/70 flex items-center gap-1 mt-1">
                    <Sparkles className="size-3" /> Growing every day
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Online vs Physical Classes */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border border-ink/10 rounded-2xl bg-card">
              <div className="flex items-center gap-2 text-brand font-semibold text-lg">
                <Globe className="size-5" />
                Online Classes
              </div>
              <p className="text-sm text-ink/60 mt-2">Learn from anywhere</p>
            </div>
            <div className="p-6 border border-ink/10 rounded-2xl bg-card">
              <div className="flex items-center gap-2 text-brand font-semibold text-lg">
                <Users className="size-5" />
                Physical Classes
              </div>
              <p className="text-sm text-ink/60 mt-2">Learn at our centers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-medium">Featured Courses</h2>
            <Link
              to="/enroll"
              className="text-brand font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              View all courses <ArrowUpRight className="size-4" />
            </Link>
          </div>
          {loading ? (
            <div className="text-center py-12 text-ink/50">Loading...</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
              {courses.slice(0, 4).map((course) => (
                <div
                  key={course.id}
                  className="bg-card rounded-2xl border border-ink/10 overflow-hidden"
                >
                  {course.image_url ? (
                    <div className="aspect-video overflow-hidden bg-ink/5">
                      <img
                        src={course.image_url}
                        alt={course.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-brand/10 to-brand/5 flex items-center justify-center text-brand/40 text-2xl font-semibold">
                      {course.title.charAt(0)}
                    </div>
                  )}
                  <div className="p-6">
                    <div className="text-xs uppercase tracking-widest text-brand font-semibold mb-2">
                      {course.track}
                    </div>
                    <h3 className="text-xl font-medium">{course.title}</h3>
                    <div className="flex items-center gap-4 mt-4 text-sm text-ink/60">
                      {course.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="size-4" />
                          {course.duration}
                        </div>
                      )}
                      {course.instructor && (
                        <div className="flex items-center gap-1">
                          <Users className="size-4" />
                          {course.instructor}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-ink/10">
                      {course.price && (
                        <div className="font-medium text-xl">₦{course.price.toLocaleString()}</div>
                      )}
                      <Link
                        to="/enroll"
                        className="text-brand font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all"
                      >
                        Enroll Now <ArrowUpRight className="size-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Learning Paths */}
      <section className="py-16 bg-secondary border-y border-ink/5 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-medium">Popular Learning Paths</h2>
            <Link
              to="/enroll"
              className="text-brand font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              View all paths <ArrowUpRight className="size-4" />
            </Link>
          </div>
          {loading ? (
            <div className="text-center py-12 text-ink/50">Loading...</div>
          ) : (
            <div className="mt-8 space-y-3">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="bg-card rounded-2xl p-6 border border-ink/10 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-brand/10 rounded-full p-3">
                      <Globe className="text-brand size-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-medium">{track.name}</h3>
                      <p className="text-sm text-ink/60">{track.tagline}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {track.stack.slice(0, 4).map((tech, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 rounded-full bg-ink/5 text-ink/70"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-ink/60">
                    <div className="text-sm">{track.courses_count} Courses</div>
                    <ChevronRight className="size-5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Physical Classes */}
      {physicalClasses.length > 0 && (
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-medium">Upcoming Physical Classes</h2>
              <Link
                to="/enroll"
                className="text-brand font-medium flex items-center gap-1 hover:gap-2 transition-all"
              >
                Explore all physical classes <ArrowUpRight className="size-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              {physicalClasses.slice(0, 3).map((cls) => (
                <div
                  key={cls.id}
                  className="bg-card rounded-2xl border border-ink/10 overflow-hidden"
                >
                  {cls.image_url && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={cls.image_url}
                        alt={cls.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-medium">{cls.title}</h3>
                    <div className="flex items-center gap-4 mt-4 text-sm text-ink/60">
                      {cls.date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="size-4" />
                          {new Date(cls.date).toLocaleDateString()}
                        </div>
                      )}
                      {cls.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="size-4" />
                          {cls.location}
                        </div>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-ink/10 flex justify-between items-center">
                      <div className="text-brand font-semibold">
                        {cls.spots_available} Seats Left
                      </div>
                      <Link
                        to="/enroll"
                        className="text-brand font-medium flex items-center gap-1 hover:gap-2 transition-all"
                      >
                        Learn More <ArrowUpRight className="size-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* AI Assistant CTA */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto bg-gradient-to-r from-brand/10 to-brand/5 rounded-3xl p-8 border border-brand/20">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center">
                <div className="text-3xl">🤖</div>
              </div>
              <div>
                <h3 className="text-2xl font-semibold">Ask OKIKE AI</h3>
                <p className="text-ink/70 text-sm">
                  Your personal learning assistant. Get explanations, summaries, recommendations and
                  more.
                </p>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2">
              <button className="bg-surface border border-ink/10 py-2 px-3 rounded-full text-sm text-ink/70 hover:bg-ink/5">
                Explain React Hooks
              </button>
              <button className="bg-surface border border-ink/10 py-2 px-3 rounded-full text-sm text-ink/70 hover:bg-ink/5">
                Summarize today's lesson
              </button>
              <button className="bg-surface border border-ink/10 py-2 px-3 rounded-full text-sm text-ink/70 hover:bg-ink/5">
                Generate quiz questions
              </button>
              <button className="bg-surface border border-ink/10 py-2 px-3 rounded-full text-sm text-ink/70 hover:bg-ink/5">
                Recommend next course
              </button>
            </div>
            <Link
              to="/dashboard"
              className="bg-brand text-brand-foreground py-2 px-4 rounded-full font-medium hover:opacity-90 transition shrink-0"
            >
              Chat with AI
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials
        eyebrow="What our students say"
        heading="The learning experience changed my life."
        quotes={[
          {
            quote: "The bootcamp changed my life. Now I'm working at a startup.",
            name: "Esther U.",
            role: "Full-Stack '24",
          },
          {
            quote: "The instructors are amazing and the projects are real-world.",
            name: "David M.",
            role: "Data Analysis '25",
          },
          {
            quote: "I loved the practical approach. I built my portfolio during the course.",
            name: "Mary A.",
            role: "Product Design '24",
          },
        ]}
      />
    </SiteLayout>
  );
}
