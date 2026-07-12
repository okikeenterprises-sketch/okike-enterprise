import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash, ArrowUp, ArrowDown, BookOpen, Save, FilePlus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/instructor/curriculum")({
  component: InstructorCurriculumPage,
});

type Course = {
  id: string;
  title: string;
  track: string;
  lessons: string[];
  duration: string;
  instructor: string | null;
};

const SUMMIT_TRACKS = [
  "Frontend Web Development",
  "Backend Web Development",
  "Product Design (UI/UX)",
  "Mobile App Development",
  "Cyber Security"
];

function InstructorCurriculumPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<string[]>([]);
  const [newLessonText, setNewLessonText] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  // Create Course form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createTrack, setCreateTrack] = useState(SUMMIT_TRACKS[0]);

  async function loadCourses() {
    try {
      const { data } = await supabase
        .from("courses")
        .select("id, title, track, lessons, duration, instructor")
        .order("title");

      const list = (data ?? []).map((c: any) => ({
        ...c,
        lessons: Array.isArray(c.lessons) ? (c.lessons as string[]) : [],
      }));
      setCourses(list);

      if (list.length > 0) {
        // Keep selection if exists, else select first
        const current = selectedCourse ? list.find(x => x.id === selectedCourse.id) : null;
        const target = current || list[0];
        setSelectedCourse(target);
        setLessons(target.lessons);
      } else {
        setSelectedCourse(null);
        setLessons([]);
      }
    } catch (err) {
      console.error("Error loading courses", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  function handleCourseSelect(courseId: string) {
    const course = courses.find(c => c.id === courseId);
    if (course) {
      setSelectedCourse(course);
      setLessons(course.lessons);
    }
  }

  function addLesson() {
    if (!newLessonText.trim()) return;
    setLessons([...lessons, newLessonText.trim()]);
    setNewLessonText("");
  }

  function deleteLesson(index: number) {
    setLessons(lessons.filter((_, i) => i !== index));
  }

  function moveLesson(index: number, direction: "up" | "down") {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === lessons.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...lessons];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setLessons(updated);
  }

  async function saveCurriculum() {
    if (!selectedCourse) return;
    setBusy(true);

    const { error } = await supabase
      .from("courses")
      .update({
        lessons: lessons,
        updated_at: new Date().toISOString()
      } as any)
      .eq("id", selectedCourse.id);

    setBusy(false);
    if (!error) {
      toast.success("Course curriculum syllabus updated successfully!");
      loadCourses();
    } else {
      toast.error(error.message || "Failed to save syllabus changes.");
    }
  }

  async function createCourse() {
    if (!createTitle.trim()) {
      toast.error("Please enter a course title.");
      return;
    }
    setBusy(true);

    const slug = createTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const { data, error } = await supabase
      .from("courses")
      .insert({
        title: createTitle.trim(),
        slug,
        track: createTrack,
        lessons: [],
        duration: "12 Weeks",
        published: true,
      } as any)
      .select()
      .single();

    setBusy(false);
    if (!error) {
      toast.success("New course created successfully!");
      setCreateTitle("");
      setShowCreateForm(false);
      await loadCourses();
      if (data) {
        handleCourseSelect(data.id);
      }
    } else {
      toast.error(error.message || "Failed to create course.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif tracking-tight flex items-center gap-2 text-ink">
            <BookOpen className="size-6 text-brand" /> Curriculum Developer
          </h1>
          <p className="text-sm text-ink/65 mt-1">Design and publish learning syllabi for the Synergy Summit tracks.</p>
        </div>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand text-brand-foreground px-4 py-2.5 text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition shrink-0"
        >
          <FilePlus className="size-4" /> {showCreateForm ? "Cancel" : "Create New Course"}
        </button>
      </div>

      {showCreateForm && (
        <section className="bg-card rounded-2xl ring-1 ring-ink/10 p-6 max-w-lg">
          <h3 className="font-semibold text-ink mb-4">Create New Course Track</h3>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-ink/55 block font-semibold mb-1.5">Course Title</label>
              <input
                type="text"
                placeholder="e.g. Mastering React & Tailwind"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                className="w-full rounded-xl bg-surface ring-1 ring-ink/10 px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-brand"
              />
            </div>

            <div>
              <label className="text-xs text-ink/55 block font-semibold mb-1.5">Bootcamp Course Track</label>
              <select
                value={createTrack}
                onChange={(e) => setCreateTrack(e.target.value)}
                className="w-full rounded-xl bg-surface ring-1 ring-ink/10 px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-brand"
              >
                {SUMMIT_TRACKS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <button
              onClick={createCourse}
              disabled={busy}
              className="mt-2 bg-brand text-brand-foreground font-semibold py-2.5 rounded-xl text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50 w-full"
            >
              Add Course to Database
            </button>
          </div>
        </section>
      )}

      {loading ? (
        <div className="text-center py-12 text-ink/40 text-sm">Loading course syllabi...</div>
      ) : courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/20 p-12 text-center text-ink/50 text-sm uppercase tracking-wider max-w-md mx-auto">
          No courses created in the database yet. Click "Create New Course" above to set up your first learning track!
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Syllabus checklist */}
          <div className="lg:col-span-8 bg-card rounded-2xl ring-1 ring-ink/10 p-6 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-ink/5 pb-4">
              <div>
                <label className="text-[10px] text-ink/40 uppercase tracking-widest block font-semibold mb-1">Select Track Syllabus to Edit</label>
                <select
                  value={selectedCourse?.id || ""}
                  onChange={(e) => handleCourseSelect(e.target.value)}
                  className="rounded-xl bg-surface ring-1 ring-ink/10 px-3 py-2 text-sm text-ink focus:outline-none focus:ring-brand font-semibold"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title} ({c.track})</option>
                  ))}
                </select>
              </div>

              <button
                onClick={saveCurriculum}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 text-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition disabled:opacity-50 self-end"
              >
                <Save className="size-4" /> Save Curriculum
              </button>
            </div>

            {/* Curriculum syllabus list */}
            <div className="flex flex-col gap-3">
              <h3 className="font-semibold text-ink text-sm">Lessons Outline</h3>
              {lessons.length === 0 ? (
                <div className="py-6 text-center text-ink/40 text-xs italic">No lessons in this syllabus yet. Add one below!</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {lessons.map((lesson, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 p-3 bg-surface rounded-xl border border-ink/5">
                      <span className="text-xs text-ink font-medium truncate">
                        <strong className="text-brand mr-2">{idx + 1}.</strong> {lesson}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => moveLesson(idx, "up")}
                          disabled={idx === 0}
                          className="p-1.5 rounded bg-card text-ink/50 hover:text-ink disabled:opacity-30"
                          title="Move Up"
                        >
                          <ArrowUp className="size-3.5" />
                        </button>
                        <button
                          onClick={() => moveLesson(idx, "down")}
                          disabled={idx === lessons.length - 1}
                          className="p-1.5 rounded bg-card text-ink/50 hover:text-ink disabled:opacity-30"
                          title="Move Down"
                        >
                          <ArrowDown className="size-3.5" />
                        </button>
                        <button
                          onClick={() => deleteLesson(idx)}
                          className="p-1.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500/25"
                          title="Delete Lesson"
                        >
                          <Trash className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Lesson Input */}
            <div className="flex items-center gap-2 border-t border-ink/5 pt-4">
              <input
                type="text"
                placeholder="Enter lesson title (e.g. Master Flexbox Layouts)"
                value={newLessonText}
                onChange={(e) => setNewLessonText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addLesson();
                }}
                className="flex-1 rounded-xl bg-surface ring-1 ring-ink/10 px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-brand"
              />
              <button
                onClick={addLesson}
                className="bg-brand text-brand-foreground size-10 rounded-xl flex items-center justify-center hover:opacity-90 transition shrink-0"
                title="Add Lesson"
              >
                <Plus className="size-5" />
              </button>
            </div>
          </div>

          {/* Details Sidebar preview */}
          <div className="lg:col-span-4 bg-card rounded-2xl ring-1 ring-ink/10 p-6 flex flex-col gap-4">
            <h3 className="font-semibold text-ink text-sm">Course Summary</h3>
            {selectedCourse ? (
              <div className="flex flex-col gap-3 text-xs leading-relaxed">
                <div className="flex justify-between border-b border-ink/5 pb-2">
                  <span className="text-ink/50">Track</span>
                  <span className="font-semibold text-ink">{selectedCourse.track}</span>
                </div>
                <div className="flex justify-between border-b border-ink/5 pb-2">
                  <span className="text-ink/50">Duration</span>
                  <span className="text-ink">{selectedCourse.duration}</span>
                </div>
                <div className="flex justify-between border-b border-ink/5 pb-2">
                  <span className="text-ink/50">Syllabus Outline</span>
                  <span className="text-ink font-semibold">{lessons.length} lessons</span>
                </div>
                <div className="p-3 bg-surface rounded-xl text-[11px] text-ink/60 italic mt-2">
                  Changes saved here will immediately reflect in the learning console of all students enrolled in this track.
                </div>
              </div>
            ) : (
              <div className="text-ink/40 text-xs italic">Select a course to see summary.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
