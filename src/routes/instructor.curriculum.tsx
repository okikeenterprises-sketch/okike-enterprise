import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus,
  Trash,
  ArrowUp,
  ArrowDown,
  BookOpen,
  Save,
  FilePlus,
  Clock,
  HelpCircle,
  FileText,
  CheckCircle,
  PlusCircle,
  Award,
  Loader2,
  Video,
  Download,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useServerFn } from "@tanstack/react-start";
import { reviewSubmission } from "@/lib/ai-assistant.functions";

export const Route = createFileRoute("/instructor/curriculum")({
  component: InstructorCurriculumPage,
});

type Course = {
  id: string;
  title: string;
  track: string;
  lessons: string[];
  milestones?: { id: string; title: string }[];
  duration: string;
  instructor: string | null;
};

const SUMMIT_TRACKS = [
  "Frontend Web Development",
  "Backend Web Development",
  "Product Design (UI/UX)",
  "Mobile App Development",
  "Cyber Security",
];

function InstructorCurriculumPage() {
  const { user, role } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<string[]>([]);
  const [milestones, setMilestones] = useState<{ id: string; title: string }[]>([]);
  const [newLessonText, setNewLessonText] = useState("");
  const [newMilestoneText, setNewMilestoneText] = useState("");
  const [duration, setDuration] = useState("12 Weeks");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  // Subtab selections
  const [subTab, setSubTab] = useState<"syllabus" | "quizzes" | "assignments" | "submissions" | "virtual" | "materials">("syllabus");

  // Create Course form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createTrack, setCreateTrack] = useState(SUMMIT_TRACKS[0]);

  // Quizzes/Assignments database states
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(false);

  // Quiz Creator Form states
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizModule, setQuizModule] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<any[]>([
    { question: "", options: ["", "", "", ""], answer: 0 }
  ]);

  // Assignment Creator Form states
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [assignTitle, setAssignTitle] = useState("");
  const [assignModule, setAssignModule] = useState("");
  const [assignDesc, setAssignDesc] = useState("");
  const [assignPoints, setAssignPoints] = useState(100);

  // Virtual Classes & Materials states
  const [virtualClasses, setVirtualClasses] = useState<any[]>([]);
  const [courseMaterials, setCourseMaterials] = useState<any[]>([]);

  // Virtual class creator states
  const [showVirtualForm, setShowVirtualForm] = useState(false);
  const [virtualTitle, setVirtualTitle] = useState("");
  const [virtualUrl, setVirtualUrl] = useState("");
  const [virtualTime, setVirtualTime] = useState("");
  const [virtualModule, setVirtualModule] = useState("");
  const [virtualType, setVirtualType] = useState("night");

  // Materials creator states
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialModule, setMaterialModule] = useState("");
  const [materialDesc, setMaterialDesc] = useState("");
  const [materialFileUrl, setMaterialFileUrl] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);

  // Grading states
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(100);
  const [gradeFeedback, setGradeFeedback] = useState("");
  
  // AI Reviewer state
  const [runningAIReview, setRunningAIReview] = useState(false);
  const reviewFn = useServerFn(reviewSubmission);

  async function runAIReview() {
    if (!selectedSubmission) return;
    const assignment = assignments.find(x => x.id === selectedSubmission.assignment_id);
    if (!assignment) {
      toast.error("Could not find associated assignment details.");
      return;
    }

    setRunningAIReview(true);
    try {
      const res = await reviewFn({
        data: {
          assignmentTitle: assignment.title,
          instructions: assignment.description || "",
          submissionText: selectedSubmission.submission_text || "No submission text provided.",
          maxPoints: assignment.max_points || 100
        }
      });

      if (res.ok) {
        setGradeScore(res.score);
        setGradeFeedback(res.feedback);
        toast.success("AI review draft loaded!");
      } else {
        toast.error(res.error || "Failed to run AI review.");
      }
    } catch (err: any) {
      toast.error(err?.message || "An error occurred during AI review.");
    } finally {
      setRunningAIReview(false);
    }
  }

  async function loadCourses() {
    try {
      let query = (supabase as any)
        .from("courses")
        .select("id, title, track, lessons, milestones, duration, instructor, instructor_user_id")
        .order("title");

      if (role === "instructor" && user?.id) {
        query = query.eq("instructor_user_id", user.id);
      }

      const { data } = await query;

      const list = (data ?? []).map((c: any) => ({
        ...c,
        lessons: Array.isArray(c.lessons) ? (c.lessons as string[]) : [],
        milestones: Array.isArray(c.milestones) ? (c.milestones as any[]) : [],
      }));
      setCourses(list);

      if (list.length > 0) {
        const current = selectedCourse ? list.find((x: any) => x.id === selectedCourse.id) : null;
        const target = current || list[0];
        setSelectedCourse(target);
        setLessons(target.lessons);
        setMilestones(target.milestones || []);
        setDuration(target.duration || "12 Weeks");
        loadExtraData(target.id);
      } else {
        setSelectedCourse(null);
        setLessons([]);
        setMilestones([]);
        setQuizzes([]);
        setAssignments([]);
        setSubmissions([]);
        setVirtualClasses([]);
        setCourseMaterials([]);
      }
    } catch (err) {
      console.error("Error loading courses", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadExtraData(courseId: string) {
    setLoadingExtra(true);
    try {
      const [{ data: q }, { data: a }, { data: vc }, { data: cm }] = await Promise.all([
        (supabase as any).from("quizzes").select("*").eq("course_id", courseId),
        (supabase as any).from("assignments").select("*").eq("course_id", courseId),
        (supabase as any).from("virtual_classes").select("*").eq("course_id", courseId).order("meeting_time", { ascending: true }),
        (supabase as any).from("course_materials").select("*").eq("course_id", courseId).order("created_at", { ascending: false }),
      ]);
      setQuizzes(q ?? []);
      setAssignments(a ?? []);
      setVirtualClasses(vc ?? []);
      setCourseMaterials(cm ?? []);

      const aIds = (a ?? []).map((x: any) => x.id);
      if (aIds.length > 0) {
        const { data: s } = await (supabase as any)
          .from("assignment_submissions")
          .select("*")
          .in("assignment_id", aIds)
          .order("submitted_at", { ascending: false });
        setSubmissions(s ?? []);
      } else {
        setSubmissions([]);
      }
    } catch (err) {
      console.error("Failed to load quizzes/assignments", err);
    } finally {
      setLoadingExtra(false);
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
      setMilestones(course.milestones || []);
      setDuration(course.duration || "12 Weeks");
      loadExtraData(course.id);
      // Reset forms
      setShowQuizForm(false);
      setShowAssignmentForm(false);
      setShowVirtualForm(false);
      setShowMaterialForm(false);
      setSelectedSubmission(null);
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

    const { data, error } = await (supabase as any)
      .from("courses")
      .update({
        lessons: lessons,
        milestones: milestones,
        duration: duration.trim(),
        updated_at: new Date().toISOString()
      })
      .eq("id", selectedCourse.id)
      .select();

    setBusy(false);
    if (!error) {
      if (data && data.length > 0) {
        toast.success("Course curriculum updated successfully!");
        loadCourses();
      } else {
        toast.error("Failed to save changes. You do not have permission to edit this course (or the course is not assigned to you).");
      }
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
        instructor_user_id: role === "instructor" ? user?.id : null,
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

  // Quiz helper actions
  function addQuizQuestion() {
    setQuizQuestions([...quizQuestions, { question: "", options: ["", "", "", ""], answer: 0 }]);
  }

  function removeQuizQuestion(index: number) {
    setQuizQuestions(quizQuestions.filter((_, i) => i !== index));
  }

  async function handleSaveQuiz(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCourse) return;
    if (!quizTitle.trim() || !quizModule) {
      toast.error("Please fill in quiz title and select a module.");
      return;
    }
    setBusy(true);

    const { error } = await (supabase as any)
      .from("quizzes")
      .insert({
        course_id: selectedCourse.id,
        module_name: quizModule,
        title: quizTitle.trim(),
        questions: quizQuestions
      });

    setBusy(false);
    if (!error) {
      toast.success("Quiz created successfully!");
      setQuizTitle("");
      setQuizModule("");
      setQuizQuestions([{ question: "", options: ["", "", "", ""], answer: 0 }]);
      setShowQuizForm(false);
      loadExtraData(selectedCourse.id);
    } else {
      toast.error(error.message || "Could not save quiz.");
    }
  }

  async function handleDeleteQuiz(quizId: string) {
    if (!confirm("Are you sure you want to delete this quiz?") || !selectedCourse) return;
    const { error } = await (supabase as any).from("quizzes").delete().eq("id", quizId);
    if (!error) {
      toast.success("Quiz deleted");
      loadExtraData(selectedCourse.id);
    } else {
      toast.error("Could not delete quiz");
    }
  }

  // Assignment helpers
  async function handleSaveAssignment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCourse) return;
    if (!assignTitle.trim() || !assignModule || !assignDesc.trim()) {
      toast.error("Please fill in assignment title, description, and module.");
      return;
    }
    setBusy(true);

    const { error } = await (supabase as any)
      .from("assignments")
      .insert({
        course_id: selectedCourse.id,
        module_name: assignModule,
        title: assignTitle.trim(),
        description: assignDesc.trim(),
        max_points: assignPoints
      });

    setBusy(false);
    if (!error) {
      toast.success("Assignment created successfully!");
      setAssignTitle("");
      setAssignModule("");
      setAssignDesc("");
      setAssignPoints(100);
      setShowAssignmentForm(false);
      loadExtraData(selectedCourse.id);
    } else {
      toast.error(error.message || "Could not save assignment.");
    }
  }

  async function handleDeleteAssignment(assignId: string) {
    if (!confirm("Are you sure you want to delete this assignment?") || !selectedCourse) return;
    const { error } = await (supabase as any).from("assignments").delete().eq("id", assignId);
    if (!error) {
      toast.success("Assignment deleted");
      loadExtraData(selectedCourse.id);
    } else {
      toast.error("Could not delete assignment");
    }
  }

  // Grading helpers
  async function handleSubmitGrade(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSubmission) return;
    setBusy(true);

    const { error } = await (supabase as any)
      .from("assignment_submissions")
      .update({
        grade: gradeScore,
        feedback: gradeFeedback.trim() || null,
        graded_at: new Date().toISOString()
      })
      .eq("id", selectedSubmission.id);

    setBusy(false);
    if (!error) {
      toast.success("Grade submitted successfully!");
      setSelectedSubmission(null);
      setGradeFeedback("");
      if (selectedCourse) loadExtraData(selectedCourse.id);
    } else {
      toast.error(error.message || "Could not save grade.");
    }
  }

  // ─── Virtual classes (Night Sessions) ──────────────────────────────────────

  async function createVirtualClass() {
    if (!selectedCourse || !virtualTitle.trim() || !virtualUrl.trim() || !virtualTime || !virtualModule) {
      toast.error("Please fill in all virtual class details.");
      return;
    }
    setBusy(true);
    const { error } = await (supabase as any)
      .from("virtual_classes")
      .insert({
        course_id: selectedCourse.id,
        module_name: virtualModule,
        title: virtualTitle.trim(),
        meeting_url: virtualUrl.trim(),
        meeting_time: new Date(virtualTime).toISOString(),
        session_type: virtualType
      });
    setBusy(false);
    if (!error) {
      toast.success("Virtual class scheduled successfully!");
      setShowVirtualForm(false);
      setVirtualTitle("");
      setVirtualUrl("");
      setVirtualTime("");
      loadExtraData(selectedCourse.id);
    } else {
      toast.error(error.message);
    }
  }

  async function deleteVirtualClass(id: string) {
    if (!window.confirm("Are you sure you want to cancel this class?")) return;
    const { error } = await (supabase as any).from("virtual_classes").delete().eq("id", id);
    if (!error) {
      toast.success("Virtual class deleted.");
      if (selectedCourse) loadExtraData(selectedCourse.id);
    } else {
      toast.error(error.message);
    }
  }

  // ─── Course Materials ──────────────────────────────────────────────────────

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `course-materials/${fileName}`;

      const { error } = await supabase.storage
        .from("media")
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("media")
        .getPublicUrl(filePath);

      setMaterialFileUrl(publicUrl);
      toast.success("File uploaded successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload file");
    } finally {
      setUploadingFile(false);
    }
  }

  async function createCourseMaterial() {
    if (!selectedCourse || !materialTitle.trim() || !materialFileUrl.trim() || !materialModule) {
      toast.error("Please specify a title, module, and document URL/file.");
      return;
    }
    setBusy(true);
    const { error } = await (supabase as any)
      .from("course_materials")
      .insert({
        course_id: selectedCourse.id,
        module_name: materialModule,
        title: materialTitle.trim(),
        file_url: materialFileUrl.trim(),
        description: materialDesc.trim() || null
      });
    setBusy(false);
    if (!error) {
      toast.success("Course material added successfully!");
      setShowMaterialForm(false);
      setMaterialTitle("");
      setMaterialFileUrl("");
      setMaterialDesc("");
      loadExtraData(selectedCourse.id);
    } else {
      toast.error(error.message);
    }
  }

  async function deleteCourseMaterial(id: string) {
    if (!window.confirm("Are you sure you want to delete this material?")) return;
    const { error } = await (supabase as any).from("course_materials").delete().eq("id", id);
    if (!error) {
      toast.success("Course material deleted.");
      if (selectedCourse) loadExtraData(selectedCourse.id);
    } else {
      toast.error(error.message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif tracking-tight flex items-center gap-2 text-ink">
            <BookOpen className="size-6 text-brand" /> Curriculum & Course Manager
          </h1>
          <p className="text-sm text-ink/65 mt-1">Design learning syllabi, build quizzes, set assignments, and grade students.</p>
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
              className="mt-2 w-full rounded-xl bg-brand text-brand-foreground py-2.5 font-semibold text-xs uppercase tracking-wider hover:opacity-90 transition disabled:opacity-50"
            >
              Create Course
            </button>
          </div>
        </section>
      )}

      {loading ? (
        <div className="text-center py-12 text-ink/40 text-sm">Loading curriculum files...</div>
      ) : !selectedCourse ? (
        <div className="bg-surface rounded-2xl border border-dashed border-ink/20 p-12 text-center text-ink/55 text-sm">
          No courses currently under your management. Create a course to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT Sidebar: Courses selector */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-ink/50 uppercase tracking-wider px-1">Courses</h3>
            <div className="flex flex-col gap-1.5">
              {courses.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleCourseSelect(c.id)}
                  className={`w-full text-left rounded-xl p-3.5 text-xs font-semibold transition ${
                    selectedCourse.id === c.id
                      ? "bg-brand text-brand-foreground shadow"
                      : "bg-card hover:bg-ink/5 text-ink ring-1 ring-ink/5"
                  }`}
                >
                  <div className="font-semibold text-sm truncate">{c.title}</div>
                  <div className={`text-[10px] mt-1 ${selectedCourse.id === c.id ? "text-brand-foreground/70" : "text-ink/50"}`}>
                    {c.track} • {c.duration || "12 Weeks"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT Content area: Tabs & Editors */}
          <div className="lg:col-span-9 bg-card rounded-2xl ring-1 ring-ink/10 overflow-hidden flex flex-col">
            {/* Tabs header */}
            <div className="flex border-b border-ink/10 bg-surface text-xs font-semibold uppercase tracking-wider overflow-x-auto whitespace-nowrap scrollbar-none select-none">
              {[
                { key: "syllabus", label: "Syllabus Modules" },
                { key: "quizzes", label: "Module Quizzes" },
                { key: "assignments", label: "Assignments" },
                { key: "submissions", label: "Submissions Grading" },
                { key: "virtual", label: "Virtual Classes" },
                { key: "materials", label: "Course Materials" },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setSubTab(t.key as any)}
                  className={`px-5 py-4 transition-all relative ${
                    subTab === t.key
                      ? "text-brand border-b-2 border-brand bg-card font-bold"
                      : "text-ink/60 hover:text-ink hover:bg-ink/5"
                  }`}
                >
                  {t.label}
                  {t.key === "submissions" && submissions.filter(s => s.grade === null).length > 0 && (
                    <span className="ml-1.5 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                      {submissions.filter(s => s.grade === null).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* TAB 1: SYLLABUS LESSONS */}
              {subTab === "syllabus" && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-ink/5 pb-4">
                    <div>
                      <h2 className="text-lg font-serif font-semibold text-ink">{selectedCourse.title}</h2>
                      <span className="text-xs text-ink/50 capitalize font-mono">{selectedCourse.track}</span>
                    </div>

                    {/* Course Duration Editor */}
                    <div className="flex items-center gap-2 bg-surface p-2.5 rounded-xl ring-1 ring-ink/10">
                      <Clock className="size-4 text-brand" />
                      <div className="text-xs font-semibold text-ink">Duration:</div>
                      <input
                        type="text"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="bg-card w-24 px-2 py-1 rounded text-xs text-ink focus:outline-none ring-1 ring-ink/10 focus:ring-brand font-medium"
                      />
                    </div>
                  </div>

                  {/* Lessons list editor */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-ink/50">Curriculum Syllabus Modules</h3>
                    
                    {lessons.length === 0 ? (
                      <div className="text-center py-8 bg-surface rounded-2xl border border-dashed border-ink/15 text-xs text-ink/55">
                        No syllabus lessons published yet. Add a module below.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {lessons.map((lesson, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-surface rounded-xl ring-1 ring-ink/5">
                            <span className="text-xs text-ink font-semibold pl-1">
                              <span className="text-ink/40 mr-1.5">Module {idx + 1}:</span>
                              {lesson}
                            </span>
                            <div className="flex items-center justify-end gap-1.5 w-full sm:w-auto">
                              <button
                                onClick={() => moveLesson(idx, "up")}
                                disabled={idx === 0}
                                className="p-1.5 rounded-lg hover:bg-ink/5 text-ink/60 disabled:opacity-30"
                              >
                                <ArrowUp className="size-3.5" />
                              </button>
                              <button
                                onClick={() => moveLesson(idx, "down")}
                                disabled={idx === lessons.length - 1}
                                className="p-1.5 rounded-lg hover:bg-ink/5 text-ink/60 disabled:opacity-30"
                              >
                                <ArrowDown className="size-3.5" />
                              </button>
                              <button
                                onClick={() => deleteLesson(idx)}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500"
                              >
                                <Trash className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add new module form */}
                    <div className="flex gap-2 pt-3 border-t border-ink/5">
                      <input
                        type="text"
                        placeholder="e.g. Introduction to Security Principles"
                        value={newLessonText}
                        onChange={(e) => setNewLessonText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addLesson()}
                        className="flex-1 bg-surface ring-1 ring-ink/10 rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-brand"
                      />
                      <button
                        onClick={addLesson}
                        className="px-4 py-2.5 rounded-xl bg-brand text-brand-foreground font-semibold text-xs uppercase tracking-wider hover:opacity-90 transition shrink-0"
                      >
                        Add Module
                      </button>
                    </div>
                  </div>

                  {/* Milestones list editor */}
                  <div className="space-y-3 pt-6 border-t border-ink/10">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-ink/50">Course Roadmap Milestones</h3>
                    
                    {milestones.length === 0 ? (
                      <div className="text-center py-8 bg-surface rounded-2xl border border-dashed border-ink/15 text-xs text-ink/55">
                        No custom milestones published yet. Add one below.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {milestones.map((m, idx) => (
                          <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-surface rounded-xl ring-1 ring-ink/5">
                            <div className="flex-1 flex items-center gap-2 w-full">
                              <span className="text-xs text-ink/40 font-mono shrink-0">Milestone {idx + 1}:</span>
                              <input
                                type="text"
                                value={m.title}
                                onChange={(e) => {
                                  const copy = [...milestones];
                                  copy[idx].title = e.target.value;
                                  setMilestones(copy);
                                }}
                                className="flex-1 bg-card ring-1 ring-ink/5 rounded px-2.5 py-1 text-xs text-ink focus:outline-none focus:ring-brand font-semibold"
                              />
                            </div>
                            <div className="flex justify-end w-full sm:w-auto">
                              <button
                                onClick={() => setMilestones(milestones.filter(x => x.id !== m.id))}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 shrink-0"
                              >
                                <Trash className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add new milestone form */}
                    <div className="flex gap-2 pt-3 border-t border-ink/5">
                      <input
                        type="text"
                        placeholder="e.g. Module 1 Exam Passed"
                        value={newMilestoneText}
                        onChange={(e) => setNewMilestoneText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newMilestoneText.trim()) {
                            const newId = `ms-${Date.now()}`;
                            setMilestones([...milestones, { id: newId, title: newMilestoneText.trim() }]);
                            setNewMilestoneText("");
                          }
                        }}
                        className="flex-1 bg-surface ring-1 ring-ink/10 rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-brand"
                      />
                      <button
                        onClick={() => {
                          if (!newMilestoneText.trim()) return;
                          const newId = `ms-${Date.now()}`;
                          setMilestones([...milestones, { id: newId, title: newMilestoneText.trim() }]);
                          setNewMilestoneText("");
                        }}
                        className="px-4 py-2.5 rounded-xl bg-brand text-brand-foreground font-semibold text-xs uppercase tracking-wider hover:opacity-90 transition shrink-0"
                      >
                        Add Milestone
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={saveCurriculum}
                      disabled={busy}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand text-brand-foreground px-6 py-3 text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition disabled:opacity-50"
                    >
                      <Save className="size-4" /> Save Syllabus Changes
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: MODULE QUIZZES */}
              {subTab === "quizzes" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-ink/5 pb-4">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-ink/50">Course Quizzes</h3>
                    <button
                      onClick={() => {
                        setShowQuizForm(!showQuizForm);
                        if (lessons.length > 0) setQuizModule(lessons[0]);
                      }}
                      className="inline-flex items-center gap-1 bg-brand text-brand-foreground px-3 py-1.5 rounded-xl font-semibold text-[10px] uppercase tracking-wider hover:opacity-90"
                    >
                      <PlusCircle className="size-3.5" /> {showQuizForm ? "Cancel" : "Create Quiz"}
                    </button>
                  </div>

                  {showQuizForm && (
                    <form onSubmit={handleSaveQuiz} className="bg-surface p-4 rounded-xl ring-1 ring-ink/10 space-y-4 max-w-2xl">
                      <h4 className="font-semibold text-xs uppercase tracking-wider text-ink">New Quiz Creator</h4>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] text-ink/55 block font-semibold mb-1">Quiz Title</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Module 1 Diagnostic Quiz"
                            value={quizTitle}
                            onChange={(e) => setQuizTitle(e.target.value)}
                            className="w-full bg-card ring-1 ring-ink/10 rounded-xl px-3 py-2 text-xs text-ink focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-ink/55 block font-semibold mb-1">Associated Module</label>
                          <select
                            value={quizModule}
                            onChange={(e) => setQuizModule(e.target.value)}
                            className="w-full bg-card ring-1 ring-ink/10 rounded-xl px-3 py-2 text-xs text-ink focus:outline-none"
                          >
                            <option value="">Select a Module</option>
                            {lessons.map(l => (
                              <option key={l} value={l}>{l}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Question builder */}
                      <div className="space-y-4 border-t border-ink/5 pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-ink/75">Quiz Questions</span>
                          <button
                            type="button"
                            onClick={addQuizQuestion}
                            className="text-[10px] uppercase font-bold text-brand hover:opacity-85"
                          >
                            + Add Question
                          </button>
                        </div>

                        {quizQuestions.map((qItem, qIdx) => (
                          <div key={qIdx} className="p-3 bg-card rounded-xl ring-1 ring-ink/5 space-y-3 relative">
                            <button
                              type="button"
                              onClick={() => removeQuizQuestion(qIdx)}
                              className="absolute top-2 right-2 text-red-500 text-[10px]"
                            >
                              Remove
                            </button>
                            <div className="text-[11px] font-semibold text-brand">Question {qIdx + 1}</div>
                            
                            <input
                              type="text"
                              required
                              placeholder="e.g. What does HTTP stand for?"
                              value={qItem.question}
                              onChange={(e) => {
                                const copy = [...quizQuestions];
                                copy[qIdx].question = e.target.value;
                                setQuizQuestions(copy);
                              }}
                              className="w-full bg-surface ring-1 ring-ink/10 rounded-lg px-3 py-1.5 text-xs text-ink focus:outline-none"
                            />

                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {qItem.options.map((opt: string, oIdx: number) => (
                                <input
                                  key={oIdx}
                                  type="text"
                                  required
                                  placeholder={`Option ${oIdx + 1}`}
                                  value={opt}
                                  onChange={(e) => {
                                    const copy = [...quizQuestions];
                                    copy[qIdx].options[oIdx] = e.target.value;
                                    setQuizQuestions(copy);
                                  }}
                                  className="w-full bg-surface ring-1 ring-ink/10 rounded-lg px-2.5 py-1 text-xs text-ink focus:outline-none"
                                />
                              ))}
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[11px] text-ink/60 font-medium">Correct Option:</span>
                              <select
                                value={qItem.answer}
                                onChange={(e) => {
                                  const copy = [...quizQuestions];
                                  copy[qIdx].answer = parseInt(e.target.value);
                                  setQuizQuestions(copy);
                                }}
                                className="bg-surface ring-1 ring-ink/10 rounded px-2 py-1 text-xs focus:outline-none"
                              >
                                {qItem.options.map((_: any, idx: number) => (
                                  <option key={idx} value={idx}>Option {idx + 1}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowQuizForm(false)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold uppercase hover:bg-ink/5"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={busy}
                          className="px-4 py-2 rounded-xl bg-brand text-brand-foreground text-xs font-semibold uppercase tracking-wider hover:opacity-90"
                        >
                          Publish Quiz
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Quizzes list */}
                  {loadingExtra ? (
                    <div className="text-xs text-ink/40"><Loader2 className="size-4 animate-spin" /> Loading syllabus quizzes...</div>
                  ) : quizzes.length === 0 ? (
                    <div className="text-center py-10 bg-surface rounded-2xl border border-dashed border-ink/10 text-xs text-ink/50">
                      No quizzes created yet for this course track.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {quizzes.map((q) => (
                        <div key={q.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-4 rounded-xl ring-1 ring-ink/5">
                          <div className="flex items-start gap-3">
                            <HelpCircle className="size-5 text-brand shrink-0 mt-0.5" />
                            <div>
                              <div className="text-xs font-semibold text-ink">{q.title}</div>
                              <div className="text-[10px] text-ink/40 font-mono mt-0.5">Module: {q.module_name} • {q.questions?.length || 0} questions</div>
                            </div>
                          </div>
                          <div className="flex justify-end w-full sm:w-auto">
                            <button
                              onClick={() => handleDeleteQuiz(q.id)}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition"
                            >
                              <Trash className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ASSIGNMENTS */}
              {subTab === "assignments" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-ink/5 pb-4">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-ink/50">Course Assignments</h3>
                    <button
                      onClick={() => {
                        setShowAssignmentForm(!showAssignmentForm);
                        if (lessons.length > 0) setAssignModule(lessons[0]);
                      }}
                      className="inline-flex items-center gap-1 bg-brand text-brand-foreground px-3 py-1.5 rounded-xl font-semibold text-[10px] uppercase tracking-wider hover:opacity-90"
                    >
                      <PlusCircle className="size-3.5" /> {showAssignmentForm ? "Cancel" : "Create Assignment"}
                    </button>
                  </div>

                  {showAssignmentForm && (
                    <form onSubmit={handleSaveAssignment} className="bg-surface p-4 rounded-xl ring-1 ring-ink/10 space-y-4 max-w-xl">
                      <h4 className="font-semibold text-xs uppercase tracking-wider text-ink">New Assignment Creator</h4>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] text-ink/55 block font-semibold mb-1">Assignment Title</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Build Responsive Landing Page"
                            value={assignTitle}
                            onChange={(e) => setAssignTitle(e.target.value)}
                            className="w-full bg-card ring-1 ring-ink/10 rounded-xl px-3 py-2 text-xs text-ink focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-ink/55 block font-semibold mb-1">Associated Module</label>
                          <select
                            value={assignModule}
                            onChange={(e) => setAssignModule(e.target.value)}
                            className="w-full bg-card ring-1 ring-ink/10 rounded-xl px-3 py-2 text-xs text-ink focus:outline-none"
                          >
                            <option value="">Select a Module</option>
                            {lessons.map(l => (
                              <option key={l} value={l}>{l}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] text-ink/55 block font-semibold mb-1">Max Score Points</label>
                        <input
                          type="number"
                          required
                          value={assignPoints}
                          onChange={(e) => setAssignPoints(parseInt(e.target.value))}
                          className="w-24 bg-card ring-1 ring-ink/10 rounded-xl px-3 py-2 text-xs text-ink focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-ink/55 block font-semibold mb-1">Instructions / Description</label>
                        <textarea
                          required
                          rows={4}
                          placeholder="Provide detailed submission constraints or layout task rules..."
                          value={assignDesc}
                          onChange={(e) => setAssignDesc(e.target.value)}
                          className="w-full bg-card ring-1 ring-ink/10 rounded-xl p-3 text-xs text-ink focus:outline-none"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAssignmentForm(false)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold uppercase hover:bg-ink/5"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={busy}
                          className="px-4 py-2 rounded-xl bg-brand text-brand-foreground text-xs font-semibold uppercase tracking-wider hover:opacity-90"
                        >
                          Create Assignment
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Assignments list */}
                  {loadingExtra ? (
                    <div className="text-xs text-ink/40"><Loader2 className="size-4 animate-spin" /> Loading assignments...</div>
                  ) : assignments.length === 0 ? (
                    <div className="text-center py-10 bg-surface rounded-2xl border border-dashed border-ink/10 text-xs text-ink/50">
                      No assignments published yet.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {assignments.map((a) => (
                        <div key={a.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-4 rounded-xl ring-1 ring-ink/5">
                          <div className="flex items-start gap-3">
                            <FileText className="size-5 text-brand shrink-0 mt-0.5" />
                            <div>
                              <div className="text-xs font-semibold text-ink">{a.title}</div>
                              <div className="text-[10px] text-ink/40 font-mono mt-0.5">Module: {a.module_name} • Max: {a.max_points} points</div>
                              <div className="text-[10px] text-ink/60 mt-1 line-clamp-2 max-w-xl">{a.description}</div>
                            </div>
                          </div>
                          <div className="flex justify-end w-full sm:w-auto">
                            <button
                              onClick={() => handleDeleteAssignment(a.id)}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition shrink-0"
                            >
                              <Trash className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: SUBMISSIONS GRADING */}
              {subTab === "submissions" && (
                <div className="space-y-6">
                  <h3 className="font-semibold text-xs uppercase tracking-wider text-ink/50 border-b border-ink/5 pb-4">Student Assignment Submissions</h3>

                  {loadingExtra ? (
                    <div className="text-xs text-ink/40"><Loader2 className="size-4 animate-spin" /> Loading submissions list...</div>
                  ) : submissions.length === 0 ? (
                    <div className="text-center py-10 bg-surface rounded-2xl border border-dashed border-ink/10 text-xs text-ink/50">
                      No student submissions received yet for this course's assignments.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      {/* Left: submissions list */}
                      <div className="md:col-span-6 space-y-2">
                        {submissions.map((sub) => {
                          const assignment = assignments.find(x => x.id === sub.assignment_id);
                          const isGraded = sub.grade !== null;

                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => {
                                setSelectedSubmission(sub);
                                setGradeScore(sub.grade !== null ? sub.grade : 100);
                                setGradeFeedback(sub.feedback || "");
                              }}
                              className={`w-full text-left rounded-xl p-3 text-xs ring-1 transition ${
                                selectedSubmission?.id === sub.id
                                  ? "bg-brand/15 text-brand ring-brand/35"
                                  : "bg-surface hover:bg-ink/5 text-ink ring-ink/5"
                              }`}
                            >
                              <div className="font-semibold">{sub.student_email}</div>
                              <div className="text-[10px] text-ink/50 font-mono mt-0.5">
                                Task: {assignment?.title || "Unknown Assignment"}
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-[10px] text-ink/40">
                                  {new Date(sub.submitted_at).toLocaleDateString()}
                                </span>
                                {isGraded ? (
                                  <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-mono font-bold">
                                    Graded: {sub.grade}/{assignment?.max_points || 100}
                                  </span>
                                ) : (
                                  <span className="text-[9px] px-2 py-0.5 rounded bg-red-500/10 text-red-500 font-mono font-bold">
                                    Ungraded
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Right: grade panel */}
                      <div className="md:col-span-6">
                        {selectedSubmission ? (
                          <div className="bg-surface p-4 rounded-xl ring-1 ring-ink/10 space-y-4">
                            <div>
                              <h4 className="font-semibold text-xs uppercase tracking-wider text-ink">Evaluate Submission</h4>
                              <p className="text-[10px] text-ink/40 truncate mt-0.5">{selectedSubmission.student_email}</p>
                            </div>

                            <div className="space-y-2 border-t border-ink/5 pt-3">
                              <div className="text-xs font-semibold text-ink">Assignment instructions</div>
                              <div className="p-3 bg-card rounded-lg border border-ink/5 text-[11px] text-ink/75 leading-relaxed font-mono">
                                {assignments.find(x => x.id === selectedSubmission.assignment_id)?.description}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="text-xs font-semibold text-ink">Student Submission</div>
                              <div className="p-3 bg-card rounded-lg border border-ink/5 text-[11px] text-ink/75 leading-relaxed font-mono whitespace-pre-wrap">
                                {selectedSubmission.submission_text || "No submission text provided."}
                              </div>
                              {selectedSubmission.file_url && (
                                <div className="mt-1">
                                  <a
                                    href={selectedSubmission.file_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] text-brand hover:underline font-semibold"
                                  >
                                    View Attached Link/File →
                                  </a>
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={runAIReview}
                              disabled={runningAIReview}
                              className="w-full py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                            >
                              {runningAIReview ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Sparkles className="size-3.5" />
                              )}
                              {runningAIReview ? "AI Reviewing..." : "Get AI Review & Draft Grade"}
                            </button>

                            <form onSubmit={handleSubmitGrade} className="space-y-3 border-t border-ink/5 pt-3">
                              <div>
                                <label className="text-[11px] text-ink/55 block font-semibold mb-1">
                                  Score Grade (Max: {assignments.find(x => x.id === selectedSubmission.assignment_id)?.max_points || 100})
                                </label>
                                <input
                                  type="number"
                                  required
                                  max={assignments.find(x => x.id === selectedSubmission.assignment_id)?.max_points || 100}
                                  min={0}
                                  value={gradeScore}
                                  onChange={(e) => setGradeScore(parseInt(e.target.value))}
                                  className="w-24 bg-card ring-1 ring-ink/10 rounded-lg px-2 py-1 text-xs text-ink focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="text-[11px] text-ink/55 block font-semibold mb-1">Feedback Comment</label>
                                <textarea
                                  rows={3}
                                  placeholder="Provide feedback details to the student..."
                                  value={gradeFeedback}
                                  onChange={(e) => setGradeFeedback(e.target.value)}
                                  className="w-full bg-card ring-1 ring-ink/10 rounded-lg p-2.5 text-xs text-ink focus:outline-none"
                                />
                              </div>

                              <button
                                type="submit"
                                disabled={busy}
                                className="w-full py-2.5 rounded-xl bg-brand text-brand-foreground font-semibold text-xs uppercase tracking-wider hover:opacity-90 transition disabled:opacity-50"
                              >
                                {selectedSubmission.grade !== null ? "Update Evaluation" : "Submit Grade Evaluation"}
                              </button>
                            </form>
                          </div>
                        ) : (
                          <div className="bg-surface rounded-xl border border-dashed border-ink/15 p-6 text-center text-xs text-ink/40 uppercase tracking-wider">
                            Select a student submission to evaluate
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: VIRTUAL CLASSES (NIGHT SESSIONS) */}
              {subTab === "virtual" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-ink/5 pb-4">
                    <div>
                      <h3 className="font-semibold text-sm text-ink">Virtual Classes & Night Sessions</h3>
                      <p className="text-[11px] text-ink/50">Schedule Zoom, Teams, or Google Meet live sessions for each module.</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowVirtualForm(!showVirtualForm);
                        setVirtualModule(lessons[0] || "");
                      }}
                      className="px-3.5 py-2 rounded-xl bg-brand text-brand-foreground font-semibold text-xs uppercase tracking-wider hover:opacity-90 transition shrink-0"
                    >
                      {showVirtualForm ? "Hide Form" : "Schedule Live Class"}
                    </button>
                  </div>

                  {showVirtualForm && (
                    <div className="bg-surface p-4 rounded-xl ring-1 ring-ink/10 space-y-4 max-w-xl">
                      <h4 className="font-semibold text-xs uppercase tracking-wider text-ink">Virtual Class Details</h4>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] text-ink/55 block font-semibold mb-1">Session Title</label>
                          <input
                            type="text"
                            placeholder="e.g. Cybersecurity Night Q&A"
                            value={virtualTitle}
                            onChange={(e) => setVirtualTitle(e.target.value)}
                            className="w-full bg-card ring-1 ring-ink/10 rounded-xl px-3 py-2 text-xs text-ink focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-ink/55 block font-semibold mb-1">Associated Module</label>
                          <select
                            value={virtualModule}
                            onChange={(e) => setVirtualModule(e.target.value)}
                            className="w-full bg-card ring-1 ring-ink/10 rounded-xl px-3 py-2 text-xs text-ink focus:outline-none"
                          >
                            <option value="">Select a Module</option>
                            {lessons.map(l => (
                              <option key={l} value={l}>{l}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] text-ink/55 block font-semibold mb-1">Meeting Date & Time</label>
                          <input
                            type="datetime-local"
                            value={virtualTime}
                            onChange={(e) => setVirtualTime(e.target.value)}
                            className="w-full bg-card ring-1 ring-ink/10 rounded-xl px-3 py-2 text-xs text-ink focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-ink/55 block font-semibold mb-1">Session Type</label>
                          <select
                            value={virtualType}
                            onChange={(e) => setVirtualType(e.target.value)}
                            className="w-full bg-card ring-1 ring-ink/10 rounded-xl px-3 py-2 text-xs text-ink focus:outline-none"
                          >
                            <option value="night">Night Session</option>
                            <option value="general">General Class Session</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] text-ink/55 block font-semibold mb-1">Meeting URL Link (Zoom / Meet / Teams)</label>
                        <input
                          type="url"
                          placeholder="https://zoom.us/j/..."
                          value={virtualUrl}
                          onChange={(e) => setVirtualUrl(e.target.value)}
                          className="w-full bg-card ring-1 ring-ink/10 rounded-xl px-3 py-2 text-xs text-ink focus:outline-none"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowVirtualForm(false)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold uppercase hover:bg-ink/5"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={createVirtualClass}
                          disabled={busy}
                          className="px-4 py-2 rounded-xl bg-brand text-brand-foreground text-xs font-semibold uppercase tracking-wider hover:opacity-90"
                        >
                          Schedule Session
                        </button>
                      </div>
                    </div>
                  )}

                  {loadingExtra ? (
                    <div className="text-xs text-ink/40"><Loader2 className="size-4 animate-spin inline mr-1" /> Loading live sessions...</div>
                  ) : virtualClasses.length === 0 ? (
                    <div className="text-center py-10 bg-surface rounded-2xl border border-dashed border-ink/10 text-xs text-ink/50">
                      No virtual sessions scheduled yet.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {virtualClasses.map((vc) => (
                        <div key={vc.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-4 rounded-xl ring-1 ring-ink/5">
                          <div className="flex items-start gap-3">
                            <Video className="size-5 text-brand shrink-0 mt-0.5" />
                            <div>
                              <div className="text-xs font-semibold text-ink flex items-center gap-1.5">
                                {vc.title}
                                <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded uppercase ${
                                  vc.session_type === "night" ? "bg-purple-500/10 text-purple-600" : "bg-blue-500/10 text-blue-600"
                                }`}>
                                  {vc.session_type === "night" ? "🌙 Night" : "☀️ General"}
                                </span>
                              </div>
                              <div className="text-[10px] text-ink/40 font-mono mt-0.5">Module: {vc.module_name}</div>
                              <div className="text-[10px] text-ink/65 mt-1 font-semibold">
                                Time: {new Date(vc.meeting_time).toLocaleString()}
                              </div>
                              <a
                                href={vc.meeting_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-brand hover:underline font-semibold block mt-1 break-all"
                              >
                                {vc.meeting_url}
                              </a>
                            </div>
                          </div>
                          <div className="flex justify-end w-full sm:w-auto">
                            <button
                              onClick={() => deleteVirtualClass(vc.id)}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition shrink-0"
                            >
                              <Trash className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: COURSE MATERIALS */}
              {subTab === "materials" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-ink/5 pb-4">
                    <div>
                      <h3 className="font-semibold text-sm text-ink">Course Materials & Resources</h3>
                      <p className="text-[11px] text-ink/50">Upload slide decks, PDF guides, code files, or reference links for each module.</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowMaterialForm(!showMaterialForm);
                        setMaterialModule(lessons[0] || "");
                      }}
                      className="px-3.5 py-2 rounded-xl bg-brand text-brand-foreground font-semibold text-xs uppercase tracking-wider hover:opacity-90 transition shrink-0"
                    >
                      {showMaterialForm ? "Hide Form" : "Upload Material"}
                    </button>
                  </div>

                  {showMaterialForm && (
                    <div className="bg-surface p-4 rounded-xl ring-1 ring-ink/10 space-y-4 max-w-xl">
                      <h4 className="font-semibold text-xs uppercase tracking-wider text-ink">Material Resource Details</h4>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] text-ink/55 block font-semibold mb-1">Resource Title</label>
                          <input
                            type="text"
                            placeholder="e.g. Chapter 1 PDF Guide"
                            value={materialTitle}
                            onChange={(e) => setMaterialTitle(e.target.value)}
                            className="w-full bg-card ring-1 ring-ink/10 rounded-xl px-3 py-2 text-xs text-ink focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-ink/55 block font-semibold mb-1">Associated Module</label>
                          <select
                            value={materialModule}
                            onChange={(e) => setMaterialModule(e.target.value)}
                            className="w-full bg-card ring-1 ring-ink/10 rounded-xl px-3 py-2 text-xs text-ink focus:outline-none"
                          >
                            <option value="">Select a Module</option>
                            {lessons.map(l => (
                              <option key={l} value={l}>{l}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] text-ink/55 block font-semibold mb-1">Description / Notes</label>
                        <input
                          type="text"
                          placeholder="e.g. Read chapters 1-3 before the night session class."
                          value={materialDesc}
                          onChange={(e) => setMaterialDesc(e.target.value)}
                          className="w-full bg-card ring-1 ring-ink/10 rounded-xl px-3 py-2 text-xs text-ink focus:outline-none"
                        />
                      </div>

                      {/* File Uploader or Paste link */}
                      <div className="bg-card p-3 rounded-xl ring-1 ring-ink/10 space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-[11px] text-ink/55 block font-semibold">Upload File Document</label>
                          {uploadingFile && <span className="text-[10px] text-brand font-semibold animate-pulse">Uploading file...</span>}
                        </div>
                        <input
                          type="file"
                          onChange={handleFileUpload}
                          disabled={uploadingFile}
                          className="text-xs text-ink"
                        />
                        <div className="text-[10px] text-ink/40 text-center uppercase tracking-widest">— OR PASTE LINK DIRECTLY —</div>
                        <input
                          type="url"
                          placeholder="https://drive.google.com/..."
                          value={materialFileUrl}
                          onChange={(e) => setMaterialFileUrl(e.target.value)}
                          className="w-full bg-surface ring-1 ring-ink/10 rounded-xl px-3 py-2 text-xs text-ink focus:outline-none"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowMaterialForm(false)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold uppercase hover:bg-ink/5"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={createCourseMaterial}
                          disabled={busy || uploadingFile}
                          className="px-4 py-2 rounded-xl bg-brand text-brand-foreground text-xs font-semibold uppercase tracking-wider hover:opacity-90"
                        >
                          Add Material
                        </button>
                      </div>
                    </div>
                  )}

                  {loadingExtra ? (
                    <div className="text-xs text-ink/40"><Loader2 className="size-4 animate-spin inline mr-1" /> Loading course resources...</div>
                  ) : courseMaterials.length === 0 ? (
                    <div className="text-center py-10 bg-surface rounded-2xl border border-dashed border-ink/10 text-xs text-ink/50">
                      No materials uploaded yet.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {courseMaterials.map((m) => (
                        <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-4 rounded-xl ring-1 ring-ink/5">
                          <div className="flex items-start gap-3">
                            <Download className="size-5 text-brand shrink-0 mt-0.5" />
                            <div>
                              <div className="text-xs font-semibold text-ink">{m.title}</div>
                              <div className="text-[10px] text-ink/40 font-mono mt-0.5">Module: {m.module_name}</div>
                              {m.description && <div className="text-[10px] text-ink/60 mt-1 max-w-xl">{m.description}</div>}
                              <a
                                href={m.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-brand hover:underline font-semibold block mt-1 break-all"
                              >
                                Download / View Resource →
                              </a>
                            </div>
                          </div>
                          <div className="flex justify-end w-full sm:w-auto">
                            <button
                              onClick={() => deleteCourseMaterial(m.id)}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition shrink-0"
                            >
                              <Trash className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
