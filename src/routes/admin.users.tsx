import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  Search,
  Check,
  X,
  User,
  Mail,
  Calendar,
  Shield,
  Edit2,
  Save,
  Trash2,
  UserX,
  UserCheck,
  UserPlus,
  Loader2,
  FolderKanban,
  GraduationCap,
} from "lucide-react";
import {
  updateUserRole,
  updateUserProfile,
  adminCreateUser,
  adminSuspendUser,
  adminDeleteUser,
  adminAssignInstructor,
} from "@/lib/admin.functions";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

type Row = {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role?: string;
  is_suspended?: boolean;
};
type RoleRow = { user_id: string; role: string };
type ProfileRow = Omit<Row, "role">;

function AdminUsers() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<Row | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState<{ full_name: string; email: string }>({
    full_name: "",
    email: "",
  });

  // User activity summary states
  const [userBootcamp, setUserBootcamp] = useState<any>(null);
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(false);

  // Instructor assignment states
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  // User creation states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createFullName, setCreateFullName] = useState("");
  const [createRole, setCreateRole] = useState<"admin" | "client" | "instructor">("client");
  const [createBusy, setCreateBusy] = useState(false);

  const [busy, setBusy] = useState(false);

  const changeRole = useServerFn(updateUserRole);
  const saveProfile = useServerFn(updateUserProfile);
  const createUser = useServerFn(adminCreateUser);
  const suspendUser = useServerFn(adminSuspendUser);
  const deleteUser = useServerFn(adminDeleteUser);
  const assignInstructor = useServerFn(adminAssignInstructor);

  async function load() {
    setLoading(true);
    const [{ data: profiles }, { data: roles }, { data: dbCourses }] = await Promise.all([
      (supabase as any)
        .from("profiles")
        .select("id, user_id, email, full_name, created_at, is_suspended")
        .order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("courses").select("id, title, instructor_user_id"),
    ]);
    const roleMap = new Map<string, string>();
    for (const r of (roles ?? []) as RoleRow[]) roleMap.set(r.user_id, r.role);
    setRows(
      (profiles as any ?? []).map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        email: p.email,
        full_name: p.full_name,
        created_at: p.created_at,
        is_suspended: p.is_suspended,
        role: roleMap.get(p.user_id) ?? "client",
      })),
    );
    setCoursesList(dbCourses ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = rows.filter(
    (r) =>
      !q ||
      r.email?.toLowerCase().includes(q.toLowerCase()) ||
      r.full_name?.toLowerCase().includes(q.toLowerCase()),
  );

  async function handleRoleChange(user: Row, newRole: "admin" | "client" | "instructor") {
    try {
      await changeRole({ data: { userId: user.user_id, role: newRole } });
      setRows((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
      if (selectedUser?.id === user.id) {
        setSelectedUser((prev) => (prev ? { ...prev, role: newRole } : null));
      }
      setEditingRole(null);
      toast.success("Role updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error updating role");
    }
  }

  async function openUserModal(user: Row) {
    setSelectedUser(user);
    setEditedProfile({
      full_name: user.full_name || "",
      email: user.email,
    });
    setIsEditingProfile(false);

    // Get current course directed by this user
    const assigned = coursesList.find(c => c.instructor_user_id === user.user_id);
    setSelectedCourseId(assigned?.id || "");

    // Fetch student bootcamp registration & projects
    setUserBootcamp(null);
    setUserProjects([]);
    setLoadingExtra(true);
    try {
      const [{ data: b }, { data: p }] = await Promise.all([
        (supabase as any)
          .from("bootcamp_registrations")
          .select("course, department, payment_status")
          .ilike("email", user.email)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase.from("client_projects").select("title, stage").eq("client_user_id", user.user_id),
      ]);
      setUserBootcamp(b && b.length > 0 ? b[0] : null);
      setUserProjects(p ?? []);
    } catch (err) {
      console.error("Failed to load extra activity info", err);
    } finally {
      setLoadingExtra(false);
    }
  }

  async function handleSaveProfile() {
    if (!selectedUser) return;
    try {
      setBusy(true);
      await saveProfile({
        data: {
          profileId: selectedUser.id,
          updates: {
            full_name: editedProfile.full_name,
            email: editedProfile.email,
          },
        },
      });

      // If user is instructor, save their course assignment
      if (selectedUser.role === "instructor") {
        await assignInstructor({
          data: {
            userId: selectedUser.user_id,
            courseId: selectedCourseId || null,
          }
        });

        // Update local courses state
        setCoursesList(prev => prev.map(c => {
          // Remove from old course
          if (c.instructor_user_id === selectedUser.user_id) {
            return { ...c, instructor_user_id: null };
          }
          // Add to new course
          if (c.id === selectedCourseId) {
            return { ...c, instructor_user_id: selectedUser.user_id };
          }
          return c;
        }));
      }

      setRows((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id
            ? {
                ...u,
                full_name: editedProfile.full_name || null,
                email: editedProfile.email,
              }
            : u,
        ),
      );
      setSelectedUser((prev) =>
        prev
          ? {
              ...prev,
              full_name: editedProfile.full_name || null,
              email: editedProfile.email,
            }
          : null,
      );
      setIsEditingProfile(false);
      toast.success("Profile updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error updating profile");
    } finally {
      setBusy(false);
    }
  }

  async function handleSuspend(user: Row) {
    const isSuspended = !!user.is_suspended;
    setBusy(true);
    try {
      await suspendUser({ data: { userId: user.user_id, suspend: !isSuspended } });
      setRows((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_suspended: !isSuspended } : u)),
      );
      setSelectedUser((prev) => (prev ? { ...prev, is_suspended: !isSuspended } : null));
      toast.success(isSuspended ? "User unsuspended successfully!" : "User suspended successfully!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to change user suspension status");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(user: Row) {
    if (!confirm(`Are you sure you want to permanently delete user ${user.email}? This action cannot be undone.`)) return;
    setBusy(true);
    try {
      await deleteUser({ data: { userId: user.user_id } });
      setRows((prev) => prev.filter((u) => u.id !== user.id));
      setSelectedUser(null);
      toast.success("User deleted successfully!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete user");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!createPassword || createPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setCreateBusy(true);
    try {
      await createUser({
        data: {
          email: createEmail.trim(),
          password: createPassword,
          fullName: createFullName.trim(),
          role: createRole,
        },
      });
      toast.success("User created successfully!");
      setCreateEmail("");
      setCreatePassword("");
      setCreateFullName("");
      setCreateRole("client");
      setShowCreateModal(false);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create user");
    } finally {
      setCreateBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif tracking-tight flex items-center gap-2">
            <Users className="size-6 text-brand" /> Users
          </h1>
          <p className="text-sm text-ink/60 mt-1">
            {rows.length} registered {rows.length === 1 ? "user" : "users"}.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
          <div className="flex items-center gap-2 rounded-xl bg-card ring-1 ring-border px-3 py-2 w-full sm:w-64">
            <Search className="size-4 text-ink/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or email"
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-4 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider hover:opacity-90 transition shrink-0"
          >
            <UserPlus className="size-4" /> Create User
          </button>
        </div>
      </div>

      <section className="rounded-2xl bg-card ring-1 ring-border overflow-hidden">
        {loading ? (
          <div className="px-6 py-10 text-sm text-ink/40">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-10 text-sm text-ink/40">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-ink/40 border-b border-border">
                  <th className="text-left font-medium px-6 py-3">User</th>
                  <th className="text-left font-medium px-2 py-3">Email</th>
                  <th className="text-left font-medium px-2 py-3">Role</th>
                  <th className="text-left font-medium px-2 py-3">Status</th>
                  <th className="text-left font-medium px-6 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-foreground/5 cursor-pointer"
                    onClick={() => openUserModal(u)}
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-brand/20 ring-1 ring-brand/30 grid place-items-center text-xs font-semibold text-brand">
                          {(u.full_name || u.email || "?").charAt(0).toUpperCase()}
                        </div>
                        <span className={`font-medium ${u.is_suspended ? "line-through text-ink/40" : ""}`}>
                          {u.full_name || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-ink/70">{u.email}</td>
                    <td className="px-2 py-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-1 rounded-md ring-1 capitalize ${
                          u.role === "admin"
                            ? "bg-brand/15 text-brand ring-brand/25"
                            : u.role === "instructor"
                            ? "bg-emerald-500/15 text-emerald-600 ring-emerald-500/25"
                            : "bg-foreground/5 text-ink/70 ring-border"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      {u.is_suspended ? (
                        <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-red-500/10 text-red-500 ring-1 ring-red-500/20">
                          Suspended
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-ink/60">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <Dialog open={showCreateModal} onOpenChange={() => setShowCreateModal(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="size-5 text-brand" /> Create New User
              </DialogTitle>
              <DialogDescription>Add a new user credential to the platform</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-xs text-ink/55 block font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={createFullName}
                  onChange={(e) => setCreateFullName(e.target.value)}
                  className="w-full rounded-xl bg-surface ring-1 ring-border px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-brand"
                />
              </div>

              <div>
                <label className="text-xs text-ink/55 block font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@example.com"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  className="w-full rounded-xl bg-surface ring-1 ring-border px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-brand"
                />
              </div>

              <div>
                <label className="text-xs text-ink/55 block font-semibold mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  className="w-full rounded-xl bg-surface ring-1 ring-border px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-brand"
                />
              </div>

              <div>
                <label className="text-xs text-ink/55 block font-semibold mb-1">Assigned Role</label>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value as any)}
                  className="w-full rounded-xl bg-surface ring-1 ring-border px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-brand"
                >
                  <option value="client">Client (User)</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <DialogFooter className="pt-4 border-t border-ink/5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold hover:bg-ink/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createBusy}
                  className="px-4 py-2 rounded-xl bg-brand text-brand-foreground text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition disabled:opacity-50"
                >
                  {createBusy ? "Creating…" : "Create Account"}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* USER DETAILS MODAL */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="size-10 rounded-full bg-brand/20 ring-1 ring-brand/30 grid place-items-center text-sm font-semibold text-brand">
                  {(selectedUser.full_name || selectedUser.email || "?").charAt(0).toUpperCase()}
                </div>
                {isEditingProfile ? "Edit User" : "User Details"}
              </DialogTitle>
              <DialogDescription>View and manage user information</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="size-4 text-ink/40" />
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={editedProfile.full_name}
                    onChange={(e) =>
                      setEditedProfile({ ...editedProfile, full_name: e.target.value })
                    }
                    className="flex-1 bg-card ring-1 ring-border rounded-md px-3 py-2 text-sm"
                    placeholder="Full name"
                  />
                ) : (
                  <span className="font-medium text-sm">{selectedUser.full_name || "No name set"}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Mail className="size-4 text-ink/40" />
                {isEditingProfile ? (
                  <input
                    type="email"
                    value={editedProfile.email}
                    onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                    className="flex-1 bg-card ring-1 ring-border rounded-md px-3 py-2 text-sm"
                    placeholder="Email"
                  />
                ) : (
                  <span className="text-ink/70 text-sm">{selectedUser.email}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Shield className="size-4 text-ink/40" />
                <span className="flex items-center gap-2 text-sm">
                  {isEditingProfile ? (
                    <select
                      value={selectedUser.role}
                      onChange={(e) =>
                        handleRoleChange(selectedUser, e.target.value as "admin" | "client" | "instructor")
                      }
                      className="bg-card ring-1 ring-border rounded-md px-2 py-1 text-sm focus:outline-none"
                    >
                      <option value="client">Client</option>
                      <option value="instructor">Instructor</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span
                      className={`text-[10px] font-semibold px-2 py-1 rounded-md ring-1 capitalize ${
                        selectedUser.role === "admin"
                          ? "bg-brand/15 text-brand ring-brand/25"
                          : selectedUser.role === "instructor"
                          ? "bg-emerald-500/15 text-emerald-600 ring-emerald-500/25"
                          : "bg-foreground/5 text-ink/70 ring-border"
                      }`}
                    >
                      {selectedUser.role}
                    </span>
                  )}
                </span>
              </div>

              {/* Course Assignment for Instructors */}
              {isEditingProfile && selectedUser.role === "instructor" && (
                <div className="flex flex-col gap-1.5 bg-surface p-3 rounded-xl ring-1 ring-border">
                  <label className="text-xs font-semibold text-ink/65">Directs Course</label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full bg-card ring-1 ring-border rounded-md px-2 py-1 text-sm focus:outline-none"
                  >
                    <option value="">None (Not Assigned)</option>
                    {coursesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!isEditingProfile && selectedUser.role === "instructor" && (
                <div className="flex items-center gap-2 text-sm">
                  <GraduationCap className="size-4 text-brand" />
                  <span className="text-ink/70">
                    Directs:{" "}
                    <span className="font-semibold text-ink">
                      {coursesList.find((c) => c.instructor_user_id === selectedUser.user_id)?.title || "None"}
                    </span>
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="size-4 text-ink/40" />
                <span className="text-ink/70">
                  Joined{" "}
                  {new Date(selectedUser.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>

              {/* Extra User Activity summary */}
              <div className="border-t border-ink/10 pt-4 space-y-3">
                <h3 className="font-semibold text-xs uppercase tracking-wider text-ink/50">Activity Summary</h3>
                {loadingExtra ? (
                  <div className="text-xs text-ink/40 flex items-center gap-1.5 py-2">
                    <Loader2 className="size-3.5 animate-spin" /> Loading summary details...
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {/* Bootcamp registration */}
                    <div className="p-3 bg-surface rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-ink/75">
                        <GraduationCap className="size-4 text-brand" />
                        <span>Bootcamp Registration</span>
                      </div>
                      {userBootcamp ? (
                        <div className="text-right">
                          <div className="font-medium text-ink">{userBootcamp.course}</div>
                          <div className="text-[10px] text-ink/40 capitalize">{userBootcamp.payment_status}</div>
                        </div>
                      ) : (
                        <span className="text-ink/40">Not registered</span>
                      )}
                    </div>

                    {/* Client projects */}
                    <div className="p-3 bg-surface rounded-xl flex flex-col gap-2 text-xs">
                      <div className="flex items-center gap-2 text-ink/75">
                        <FolderKanban className="size-4 text-brand" />
                        <span>Client Projects ({userProjects.length})</span>
                      </div>
                      {userProjects.length > 0 ? (
                        <div className="divide-y divide-ink/5">
                          {userProjects.map((p, idx) => (
                            <div key={idx} className="flex justify-between py-1 text-[11px]">
                              <span className="font-medium text-ink truncate max-w-[25ch]">{p.title}</span>
                              <span className="text-brand capitalize font-mono text-[9px]">{p.stage}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-ink/40 text-[11px] pl-6">No projects launched yet</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 border-t border-ink/5 pt-4 mt-2">
              <div className="flex flex-wrap gap-2 mr-auto">
                <button
                  disabled={busy}
                  onClick={() => handleSuspend(selectedUser)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition ${
                    selectedUser.is_suspended
                      ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                  }`}
                >
                  {selectedUser.is_suspended ? <UserCheck className="size-3.5" /> : <UserX className="size-3.5" />}
                  {selectedUser.is_suspended ? "Unsuspend" : "Suspend"}
                </button>
                <button
                  disabled={busy}
                  onClick={() => handleDelete(selectedUser)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-500/10 text-red-500 text-xs font-semibold uppercase tracking-wider hover:bg-red-500/25 transition"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </button>
              </div>

              {isEditingProfile ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsEditingProfile(false);
                      setEditedProfile({
                        full_name: selectedUser.full_name || "",
                        email: selectedUser.email,
                      });
                    }}
                    className="px-4 py-2 rounded-full text-xs uppercase tracking-wider font-semibold hover:bg-ink/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="px-4 py-2 rounded-full bg-brand text-brand-foreground text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 hover:opacity-90 transition"
                  >
                    <Save className="size-4" />
                    Save
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="px-4 py-2 rounded-full bg-brand text-brand-foreground text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 hover:opacity-90 transition"
                >
                  <Edit2 className="size-4" />
                  Edit User
                </button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
