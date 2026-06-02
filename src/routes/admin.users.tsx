import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Users, Search, Check, X, User, Mail, Calendar, Shield, Edit2, Save } from "lucide-react";
import { updateUserRole, updateUserProfile } from "@/lib/admin.functions";
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
  const changeRole = useServerFn(updateUserRole);
  const saveProfile = useServerFn(updateUserProfile);

  useEffect(() => {
    async function load() {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, user_id, email, full_name, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const roleMap = new Map<string, string>();
      for (const r of (roles ?? []) as RoleRow[]) roleMap.set(r.user_id, r.role);
      setRows(
        ((profiles ?? []) as ProfileRow[]).map((p) => ({
          ...p,
          role: roleMap.get(p.user_id) ?? "client",
        })),
      );
      setLoading(false);
    }
    load();
  }, []);

  const filtered = rows.filter(
    (r) =>
      !q ||
      r.email?.toLowerCase().includes(q.toLowerCase()) ||
      r.full_name?.toLowerCase().includes(q.toLowerCase()),
  );

  async function handleRoleChange(user: Row, newRole: "admin" | "client") {
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

  function openUserModal(user: Row) {
    setSelectedUser(user);
    setEditedProfile({
      full_name: user.full_name || "",
      email: user.email,
    });
    setIsEditingProfile(false);
  }

  async function handleSaveProfile() {
    if (!selectedUser) return;
    try {
      await saveProfile({
        data: {
          profileId: selectedUser.id,
          updates: {
            full_name: editedProfile.full_name,
            email: editedProfile.email,
          },
        },
      });
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
        <div className="flex items-center gap-2 rounded-xl bg-card ring-1 ring-border px-3 py-2 w-full sm:w-72">
          <Search className="size-4 text-ink/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email"
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
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
                        <span className="font-medium">{u.full_name || "—"}</span>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-ink/70">{u.email}</td>
                    <td className="px-2 py-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-1 rounded-md ring-1 capitalize ${
                          u.role === "admin"
                            ? "bg-brand/15 text-brand ring-brand/25"
                            : "bg-foreground/5 text-ink/70 ring-border"
                        }`}
                      >
                        {u.role}
                      </span>
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
                    className="flex-1 bg-card ring-1 ring-border rounded-md px-3 py-2"
                    placeholder="Full name"
                  />
                ) : (
                  <span className="font-medium">{selectedUser.full_name || "No name set"}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Mail className="size-4 text-ink/40" />
                {isEditingProfile ? (
                  <input
                    type="email"
                    value={editedProfile.email}
                    onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                    className="flex-1 bg-card ring-1 ring-border rounded-md px-3 py-2"
                    placeholder="Email"
                  />
                ) : (
                  <span className="text-ink/70">{selectedUser.email}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Shield className="size-4 text-ink/40" />
                <span className="flex items-center gap-2">
                  {isEditingProfile ? (
                    <select
                      value={selectedUser.role}
                      onChange={(e) =>
                        handleRoleChange(selectedUser, e.target.value as "admin" | "client")
                      }
                      className="bg-card ring-1 ring-border rounded-md px-2 py-1 text-sm"
                    >
                      <option value="client">Client</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span
                      className={`text-[10px] font-semibold px-2 py-1 rounded-md ring-1 capitalize ${
                        selectedUser.role === "admin"
                          ? "bg-brand/15 text-brand ring-brand/25"
                          : "bg-foreground/5 text-ink/70 ring-border"
                      }`}
                    >
                      {selectedUser.role}
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
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
            </div>

            <DialogFooter>
              {isEditingProfile ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditingProfile(false);
                      setEditedProfile({
                        full_name: selectedUser.full_name || "",
                        email: selectedUser.email,
                      });
                    }}
                    className="px-4 py-2 rounded-full text-sm hover:bg-ink/5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="px-4 py-2 rounded-full bg-brand text-brand-foreground text-sm font-medium flex items-center gap-2"
                  >
                    <Save className="size-4" />
                    Save
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="px-4 py-2 rounded-full bg-brand text-brand-foreground text-sm font-medium flex items-center gap-2"
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
