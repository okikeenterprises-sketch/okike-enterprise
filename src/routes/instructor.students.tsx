import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Search, GraduationCap, Award, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/instructor/students")({
  component: InstructorStudentsPage,
});

const DEFAULT_MILESTONES = [
  { id: "ms-1", title: "Git & Workspace Setup" },
  { id: "ms-2", title: "Module 1 Exam Passed" },
  { id: "ms-3", title: "Mid-term Project Submission" },
  { id: "ms-4", title: "Summit Capstone Approved" }
];

function InstructorStudentsPage() {
  const [progressRows, setProgressRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProgress, setSelectedProgress] = useState<any | null>(null);
  const [milestonesUpdate, setMilestonesUpdate] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function loadProgress() {
    try {
      const { data } = await (supabase as any)
        .from("student_progress")
        .select("*")
        .order("updated_at", { ascending: false });
      setProgressRows(data ?? []);
    } catch (err) {
      console.error("Error loading student progress", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProgress();
  }, []);

  async function saveMilestones() {
    if (!selectedProgress) return;
    setBusy(true);

    const { error } = await (supabase as any)
      .from("student_progress")
      .update({
        milestone_status: milestonesUpdate,
        updated_at: new Date().toISOString()
      })
      .eq("id", selectedProgress.id);

    setBusy(false);
    if (!error) {
      toast.success("Student milestones updated successfully!");
      setSelectedProgress(null);
      loadProgress();
    } else {
      toast.error("Could not update milestones. Please try again.");
    }
  }

  const filteredRows = progressRows.filter(p => 
    p.student_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-serif tracking-tight flex items-center gap-2 text-ink">
          <Users className="size-6 text-brand" /> Student Academic Manager
        </h1>
        <p className="text-sm text-ink/65 mt-1">Review student curricula completions, grading assessments, and verify roadmaps.</p>
      </div>

      {/* Search and control filter */}
      <div className="flex items-center gap-2 max-w-md bg-card ring-1 ring-ink/10 rounded-xl px-3 py-2">
        <Search className="size-4 text-ink/40 shrink-0" />
        <input
          type="text"
          placeholder="Search students by email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent text-sm text-ink focus:outline-none w-full"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-ink/40 text-sm">Loading student progress files...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Progress List Table */}
          <div className="lg:col-span-8 bg-card rounded-2xl ring-1 ring-ink/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-ink/10 bg-surface text-ink/60 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Student Email</th>
                    <th className="px-6 py-4">Lessons Complete</th>
                    <th className="px-6 py-4">Quiz Grades</th>
                    <th className="px-6 py-4">Milestones</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-ink/40">
                        No matching student records found.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((p) => {
                      const completedCount = p.lessons_completed?.length || 0;
                      const scores = p.quiz_scores || {};
                      const milestones = p.milestone_status || {};
                      const completedMilestones = Object.values(milestones).filter(s => s === "completed").length;

                      return (
                        <tr key={p.id} className="hover:bg-ink/5 transition text-xs">
                          <td className="px-6 py-4 font-semibold text-ink">{p.student_email}</td>
                          <td className="px-6 py-4 font-mono">{completedCount} lessons</td>
                          <td className="px-6 py-4">
                            {Object.keys(scores).length > 0 ? (
                              <div className="flex flex-col gap-0.5">
                                {Object.entries(scores).map(([qid, val]) => (
                                  <span key={qid} className="font-mono text-[10px]">{qid}: {val as any}%</span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-ink/40 italic">No attempts</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono">{completedMilestones}/4 approved</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedProgress(p);
                                setMilestonesUpdate(p.milestone_status || {});
                              }}
                              className="px-3 py-1.5 rounded-lg bg-brand text-brand-foreground font-semibold hover:opacity-90"
                            >
                              Edit Milestones
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Edit milestones sidebar */}
          {selectedProgress ? (
            <div className="lg:col-span-4 bg-card rounded-2xl ring-1 ring-ink/10 p-6 flex flex-col gap-4">
              <div>
                <h3 className="font-semibold text-ink">Update Student Milestones</h3>
                <p className="text-xs text-ink/50 mt-0.5 truncate">{selectedProgress.student_email}</p>
              </div>

              <div className="flex flex-col gap-4 border-t border-ink/5 pt-4">
                {DEFAULT_MILESTONES.map((m) => {
                  const status = milestonesUpdate[m.id] || "pending";
                  return (
                    <div key={m.id} className="flex flex-col gap-2 p-3 bg-surface rounded-xl">
                      <div className="text-xs font-semibold text-ink">{m.title}</div>
                      <div className="flex gap-2 mt-1">
                        {["pending", "in_progress", "completed"].map((st) => (
                          <button
                            key={st}
                            onClick={() => setMilestonesUpdate(prev => ({ ...prev, [m.id]: st }))}
                            className={`flex-1 text-[10px] uppercase font-semibold py-1 rounded transition ${
                              status === st
                                ? st === "completed"
                                  ? "bg-emerald-500 text-white"
                                  : st === "in_progress"
                                    ? "bg-amber-500 text-white"
                                    : "bg-ink/60 text-white"
                                : "bg-ink/5 hover:bg-ink/10 text-ink/60"
                            }`}
                          >
                            {st === "in_progress" ? "Working" : st}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={saveMilestones}
                  disabled={busy}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-brand text-brand-foreground font-semibold text-xs uppercase tracking-wider hover:opacity-90 transition disabled:opacity-50"
                >
                  Save Updates
                </button>
                <button
                  onClick={() => setSelectedProgress(null)}
                  className="px-4 py-2.5 rounded-xl bg-surface ring-1 ring-ink/10 text-xs font-semibold uppercase tracking-wider hover:bg-ink/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-4 bg-surface rounded-2xl border border-dashed border-ink/20 p-8 text-center text-ink/50 text-xs uppercase tracking-wider">
              Select a student to edit milestones
            </div>
          )}
        </div>
      )}
    </div>
  );
}
