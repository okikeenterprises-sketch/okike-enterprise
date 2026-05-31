import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reports")({
  component: AdminReports,
});

type Counts = {
  users: number;
  inquiries: number;
  projects: number;
  contact: number;
  enrollments: number;
};

function AdminReports() {
  const [c, setC] = useState<Counts>({
    users: 0,
    inquiries: 0,
    projects: 0,
    contact: 0,
    enrollments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [p, i, pr, cm, en] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("project_inquiries").select("id", { count: "exact", head: true }),
        supabase.from("client_projects").select("id", { count: "exact", head: true }),
        supabase.from("contact_messages").select("id", { count: "exact", head: true }),
        supabase.from("course_enrollments").select("id", { count: "exact", head: true }),
      ]);
      setC({
        users: p.count ?? 0,
        inquiries: i.count ?? 0,
        projects: pr.count ?? 0,
        contact: cm.count ?? 0,
        enrollments: en.count ?? 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  async function exportCsv(table: string, columns: string[]) {
    const { data, error } = await supabase.from(table as any).select(columns.join(","));
    if (error) return toast.error(error.message);
    const rows = (data ?? []) as any[];
    const header = columns.join(",");
    const body = rows
      .map((r) =>
        columns
          .map((c) => {
            const v = r[c];
            if (v == null) return "";
            const s = typeof v === "string" ? v : JSON.stringify(v);
            return `"${s.replace(/"/g, '""')}"`;
          })
          .join(","),
      )
      .join("\n");
    const csv = header + "\n" + body;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${table}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} rows`);
  }

  const reports = [
    {
      table: "profiles",
      columns: ["id", "user_id", "email", "full_name", "created_at"],
      label: "Users",
      count: c.users,
    },
    {
      table: "project_inquiries",
      columns: [
        "id",
        "name",
        "email",
        "phone",
        "company",
        "project_type",
        "budget",
        "timeline",
        "status",
        "created_at",
      ],
      label: "Inquiries",
      count: c.inquiries,
    },
    {
      table: "client_projects",
      columns: [
        "id",
        "title",
        "client_email",
        "package_name",
        "stage",
        "total",
        "deposit",
        "currency",
        "created_at",
      ],
      label: "Projects",
      count: c.projects,
    },
    {
      table: "contact_messages",
      columns: ["id", "name", "email", "message", "created_at"],
      label: "Contact Messages",
      count: c.contact,
    },
    {
      table: "course_enrollments",
      columns: ["id", "name", "email", "phone", "experience_level", "goals", "created_at"],
      label: "Course Enrollments",
      count: c.enrollments,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-serif tracking-tight flex items-center gap-2">
          <FileText className="size-6 text-brand" /> Reports
        </h1>
        <p className="text-sm text-ink/60 mt-1">Live snapshots and CSV exports of platform data.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {reports.map((r) => (
          <div key={r.table} className="rounded-2xl bg-card ring-1 ring-border p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs uppercase tracking-wider text-ink/50">{r.label}</div>
              <span className="text-2xl font-semibold tabular-nums">{loading ? "…" : r.count}</span>
            </div>
            <p className="text-xs text-ink/60 mb-4">Export the full table as a CSV file.</p>
            <button
              onClick={() => exportCsv(r.table, r.columns)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand/15 text-brand ring-1 ring-brand/25 px-3 py-2 text-sm font-medium hover:bg-brand/20"
            >
              <Download className="size-4" /> Download CSV
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
