import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, BookOpen, GraduationCap, ChevronRight, Sparkles, Award } from "lucide-react";

export const Route = createFileRoute("/instructor/")({
  component: InstructorOverviewPage,
});

function InstructorOverviewPage() {
  const [studentCount, setStudentCount] = useState(0);
  const [courseCount, setCourseCount] = useState(0);
  const [recentRegs, setRecentRegs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [
          { count: sCount },
          { count: cCount },
          { data: recent }
        ] = await Promise.all([
          supabase.from("bootcamp_registrations" as any).select("*", { count: "exact", head: true }),
          supabase.from("courses").select("*", { count: "exact", head: true }),
          supabase.from("bootcamp_registrations" as any)
            .select("name, course, created_at")
            .order("created_at", { ascending: false })
            .limit(5)
        ]);

        setStudentCount(sCount || 0);
        setCourseCount(cCount || 0);
        setRecentRegs(recent || []);
      } catch (err) {
        console.error("Error loading stats", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Card */}
      <section className="relative overflow-hidden rounded-2xl bg-card ring-1 ring-ink/10 p-6 md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 text-brand px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="size-3.5" /> Instructor Control Console
            </div>
            <h2 className="font-serif text-2xl md:text-3xl text-ink leading-tight">Welcome, Instructor!</h2>
            <p className="text-sm text-ink/65 mt-1.5 leading-relaxed">
              Design course curriculum structures, verify syllabus progress milestones, and track student grades for the Computing Synergy Summit tracks.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              to="/instructor/curriculum"
              className="inline-flex items-center gap-2 rounded-xl bg-brand text-brand-foreground px-4 py-2.5 text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition"
            >
              Curriculum Editor &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-card ring-1 ring-ink/10 p-5 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-ink/50 font-medium">Total Registered Students</div>
            <div className="text-3xl font-bold text-ink mt-2 font-mono">{loading ? "..." : studentCount}</div>
            <div className="text-[10px] text-ink/40 mt-1">all bootcamp tracks</div>
          </div>
          <div className="size-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
            <Users className="size-6" />
          </div>
        </div>

        <div className="rounded-2xl bg-card ring-1 ring-ink/10 p-5 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-ink/50 font-medium">Active Database Courses</div>
            <div className="text-3xl font-bold text-ink mt-2 font-mono">{loading ? "..." : courseCount}</div>
            <div className="text-[10px] text-ink/40 mt-1">syllabi available</div>
          </div>
          <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <BookOpen className="size-6" />
          </div>
        </div>

        <div className="rounded-2xl bg-card ring-1 ring-ink/10 p-5 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-ink/50 font-medium">Milestones Roadmap</div>
            <div className="text-3xl font-bold text-ink mt-2 font-mono">4</div>
            <div className="text-[10px] text-ink/40 mt-1">standard syllabus milestones</div>
          </div>
          <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Award className="size-6" />
          </div>
        </div>
      </div>

      {/* Recent Activity Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-card rounded-2xl ring-1 ring-ink/10 p-6 flex flex-col gap-4">
          <h3 className="font-semibold text-ink">Recent Registrations</h3>
          <div className="divide-y divide-ink/10">
            {loading ? (
              <div className="text-center py-6 text-ink/40 text-xs">Loading logs...</div>
            ) : recentRegs.length === 0 ? (
              <div className="text-center py-6 text-ink/40 text-xs">No registrations logged yet.</div>
            ) : (
              recentRegs.map((reg, idx) => (
                <div key={idx} className="flex justify-between items-center py-3 text-xs">
                  <div>
                    <div className="font-semibold text-ink">{reg.name}</div>
                    <div className="text-[10px] text-ink/50 mt-0.5">{reg.course || "No track chosen"}</div>
                  </div>
                  <span className="text-[10px] text-ink/40">
                    {new Date(reg.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
