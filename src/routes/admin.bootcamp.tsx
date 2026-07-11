import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, GraduationCap, Calendar, CreditCard, Award, CheckCircle, Clock, BookOpen } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/bootcamp")({
  component: AdminBootcampPage,
});

type Registration = {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  level: string;
  course: string | null;
  payment_status: string;
  payment_reference: string | null;
  created_at: string;
};

const DEFAULT_MILESTONES = [
  { id: "ms-1", title: "Git & Workspace Setup" },
  { id: "ms-2", title: "Module 1 Exam Passed" },
  { id: "ms-3", title: "Mid-term Project Submission" },
  { id: "ms-4", title: "Summit Capstone Approved" }
];

function AdminBootcampPage() {
  const [activeTab, setActiveTab] = useState<"registrations" | "instructor">("registrations");
  const [rows, setRows] = useState<Registration[]>([]);
  const [progressRows, setProgressRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgress, setSelectedProgress] = useState<any | null>(null);
  const [milestonesUpdate, setMilestonesUpdate] = useState<Record<string, string>>({});

  async function load() {
    const { data } = await (supabase as any)
      .from("bootcamp_registrations")
      .select("*")
      .order("created_at", { ascending: false });
    setRows((data ?? []) as Registration[]);
    setLoading(false);
  }

  async function loadProgress() {
    const { data } = await (supabase as any)
      .from("student_progress")
      .select("*")
      .order("updated_at", { ascending: false });
    setProgressRows(data ?? []);
  }

  useEffect(() => {
    load();
    loadProgress();
  }, []);

  async function saveMilestones() {
    if (!selectedProgress) return;
    const { error } = await (supabase as any)
      .from("student_progress")
      .update({
        milestone_status: milestonesUpdate,
        updated_at: new Date().toISOString()
      })
      .eq("id", selectedProgress.id);

    if (!error) {
      toast.success("Student roadmap milestones updated successfully!");
      setSelectedProgress(null);
      loadProgress();
    } else {
      toast.error("Could not update milestones. Please try again.");
    }
  }

  const total = rows.length;
  const deptStudents = rows.filter((r) => r.payment_status === "free").length;
  const paidCount = rows.filter((r) => r.payment_status === "paid").length;
  const pendingCount = rows.filter((r) => r.payment_status === "pending").length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif tracking-tight flex items-center gap-2 text-ink">
            <GraduationCap className="size-6 text-brand" /> Synergy Summit Console
          </h1>
          <p className="text-sm text-ink/65 mt-1">Manage attendees and track student learning workspaces.</p>
        </div>

        {/* Tab switch */}
        <div className="flex gap-1 bg-surface p-1 rounded-xl ring-1 ring-ink/10">
          <button
            onClick={() => setActiveTab("registrations")}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition ${
              activeTab === "registrations" ? "bg-brand text-brand-foreground shadow" : "text-ink/60 hover:text-ink"
            }`}
          >
            Registrations
          </button>
          <button
            onClick={() => {
              setActiveTab("instructor");
              loadProgress();
            }}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition ${
              activeTab === "instructor" ? "bg-brand text-brand-foreground shadow" : "text-ink/60 hover:text-ink"
            }`}
          >
            Instructor Control
          </button>
        </div>
      </div>

      {activeTab === "registrations" ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Tile label="Total Registered" value={String(total)} />
            <Tile label="CS/IT (Free)" value={String(deptStudents)} />
            <Tile label="Paid (₦5,000)" value={String(paidCount)} />
            <Tile label="Pending Payment" value={String(pendingCount)} />
          </div>

          <section className="bg-card rounded-2xl ring-1 ring-ink/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-ink/10 bg-surface text-ink/60 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Student Info</th>
                    <th className="px-6 py-4">Academic Details</th>
                    <th className="px-6 py-4">Course Track</th>
                    <th className="px-6 py-4">Payment Status</th>
                    <th className="px-6 py-4">Date Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-ink/40">
                        Loading registrations...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-ink/40">
                        No registrations found.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.id} className="hover:bg-ink/5 transition">
                        <td className="px-6 py-4">
                          <div className="font-medium text-ink">{r.name}</div>
                          <div className="text-xs text-ink/50 mt-0.5">{r.email}</div>
                          <div className="text-[10px] text-ink/40 font-mono mt-0.5">{r.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-ink">{r.department}</div>
                          <div className="text-xs text-ink/50 mt-0.5">{r.level}</div>
                        </td>
                        <td className="px-6 py-4 font-medium text-ink">
                          {r.course ?? "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                            r.payment_status === "paid"
                              ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20"
                              : r.payment_status === "free"
                                ? "bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20"
                                : "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20"
                          }`}>
                            {r.payment_status}
                          </span>
                          {r.payment_reference && (
                            <div className="text-[10px] text-ink/40 font-mono mt-1 select-all" title="Reference">
                              Ref: {r.payment_reference}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-ink/60 text-xs">
                          {new Date(r.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Progress List Table */}
          <div className="lg:col-span-8 bg-card rounded-2xl ring-1 ring-ink/10 overflow-hidden">
            <div className="p-5 border-b border-ink/10">
              <h3 className="font-semibold text-ink">Student Academic Trackers</h3>
              <p className="text-xs text-ink/55 mt-1">Real-time lesson completions, quiz grades, and milestones.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-ink/10 bg-surface text-ink/60 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Student Email</th>
                    <th className="px-6 py-4">Lessons Complete</th>
                    <th className="px-6 py-4">Quiz Scores</th>
                    <th className="px-6 py-4">Milestones</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {progressRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-ink/40">
                        No student progress rows active yet.
                      </td>
                    </tr>
                  ) : (
                    progressRows.map((p) => {
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
                              Edit Roadmap
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
                  className="flex-1 px-4 py-2.5 rounded-xl bg-brand text-brand-foreground font-semibold text-xs uppercase tracking-wider hover:opacity-90 transition"
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

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card rounded-2xl p-5 ring-1 ring-ink/10">
      <div className="text-xs uppercase tracking-wider text-ink/50 font-medium">{label}</div>
      <div className="text-2xl font-semibold text-ink mt-1.5 font-mono">{value}</div>
    </div>
  );
}
