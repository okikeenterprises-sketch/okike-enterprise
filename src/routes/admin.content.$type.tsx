import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cmsUpsert, cmsDelete } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/content/$type")({
  component: ContentPage,
});

const TABLE_MAP: Record<
  string,
  {
    table: string;
    title: string;
    fields: {
      key: string;
      label: string;
      type?: "text" | "textarea" | "number" | "boolean" | "json" | "tags";
    }[];
  }
> = {
  packages: {
    table: "packages",
    title: "Packages",
    fields: [
      { key: "slug", label: "Slug" },
      { key: "name", label: "Name" },
      { key: "tagline", label: "Tagline" },
      { key: "price", label: "Price", type: "number" },
      { key: "currency", label: "Currency" },
      { key: "features", label: "Features (one per line)", type: "json" },
      { key: "position", label: "Order", type: "number" },
      { key: "featured", label: "Featured", type: "boolean" },
      { key: "request_quote", label: "Request quote (no price)", type: "boolean" },
      { key: "published", label: "Published", type: "boolean" },
    ],
  },
  services: {
    table: "services",
    title: "Services",
    fields: [
      { key: "title", label: "Title" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "icon", label: "Icon (lucide name)" },
      { key: "position", label: "Order", type: "number" },
      { key: "published", label: "Published", type: "boolean" },
    ],
  },
  addons: {
    table: "addons",
    title: "Add-ons",
    fields: [
      { key: "name", label: "Name" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "price", label: "Price", type: "number" },
      { key: "position", label: "Order", type: "number" },
      { key: "published", label: "Published", type: "boolean" },
    ],
  },
  portfolio: {
    table: "portfolio_items",
    title: "Portfolio",
    fields: [
      { key: "title", label: "Title" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "image_url", label: "Image URL" },
      { key: "url", label: "Project URL" },
      { key: "tags", label: "Tags (comma-separated)", type: "tags" },
      { key: "position", label: "Order", type: "number" },
      { key: "published", label: "Published", type: "boolean" },
    ],
  },
  partners: {
    table: "partners",
    title: "Partners",
    fields: [
      { key: "name", label: "Name" },
      { key: "logo_url", label: "Logo URL" },
      { key: "url", label: "Website" },
      { key: "position", label: "Order", type: "number" },
      { key: "published", label: "Published", type: "boolean" },
    ],
  },
  team: {
    table: "team_members",
    title: "Team",
    fields: [
      { key: "name", label: "Name" },
      { key: "role", label: "Role" },
      { key: "bio", label: "Bio", type: "textarea" },
      { key: "image_url", label: "Image URL" },
      { key: "position", label: "Order", type: "number" },
      { key: "published", label: "Published", type: "boolean" },
    ],
  },
};

function ContentPage() {
  const { type } = useParams({ from: "/admin/content/$type" });
  const cfg = TABLE_MAP[type as string];
  const [rows, setRows] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const upsert = useServerFn(cmsUpsert);
  const del = useServerFn(cmsDelete);

  async function load() {
    if (!cfg) return;
    const { data } = await supabase
      .from(cfg.table as any)
      .select("*")
      .order("position", { ascending: true });
    setRows((data ?? []) as any[]);
  }
  useEffect(() => {
    load();
  }, [type]);

  if (!cfg) return <div>Unknown content type.</div>;

  function startNew() {
    const blank: any = {};
    cfg.fields.forEach((f) => {
      if (f.type === "boolean") blank[f.key] = f.key === "published";
      else if (f.type === "number") blank[f.key] = 0;
      else if (f.type === "json") blank[f.key] = [];
      else if (f.type === "tags") blank[f.key] = [];
      else blank[f.key] = "";
    });
    setEditing(blank);
  }

  async function save() {
    try {
      const row = { ...editing };
      // strip empty id for inserts
      if (!row.id) delete row.id;
      await upsert({ data: { table: cfg.table as any, row } });
      toast.success("Saved");
      setEditing(null);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this item?")) return;
    try {
      await del({ data: { table: cfg.table as any, id } });
      toast.success("Deleted");
      await load();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-medium">{cfg.title}</h1>
        <button
          onClick={startNew}
          className="px-4 py-2 rounded-full bg-brand text-brand-foreground text-sm font-medium"
        >
          + New
        </button>
      </div>

      <div className="bg-card rounded-2xl ring-1 ring-ink/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wider text-ink/40">
            <tr>
              <th className="text-left px-4 py-3">Title</th>
              <th className="text-left px-4 py-3">Order</th>
              <th className="text-left px-4 py-3">Published</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-medium">{r.name || r.title || r.slug}</td>
                <td className="px-4 py-3">{r.position ?? "—"}</td>
                <td className="px-4 py-3">{r.published ? "✓" : "—"}</td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button onClick={() => setEditing(r)} className="text-brand text-sm">
                    Edit
                  </button>
                  <button onClick={() => remove(r.id)} className="text-red-600 text-sm">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-ink/40">
                  Empty. Click "+ New".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4"
          onClick={() => setEditing(null)}
        >
          <div
            className="bg-surface rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-medium">
              {editing.id ? "Edit" : "New"} {cfg.title}
            </h2>
            {cfg.fields.map((f) => (
              <label key={f.key} className="flex flex-col gap-1 text-sm">
                <span className="text-xs uppercase tracking-wider text-ink/40">{f.label}</span>
                {f.type === "textarea" ? (
                  <textarea
                    rows={4}
                    value={editing[f.key] ?? ""}
                    onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                    className="bg-card ring-1 ring-ink/10 rounded-xl px-3 py-2"
                  />
                ) : f.type === "boolean" ? (
                  <input
                    type="checkbox"
                    checked={!!editing[f.key]}
                    onChange={(e) => setEditing({ ...editing, [f.key]: e.target.checked })}
                    className="size-5"
                  />
                ) : f.type === "number" ? (
                  <input
                    type="number"
                    value={editing[f.key] ?? ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        [f.key]: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    className="bg-card ring-1 ring-ink/10 rounded-xl px-3 py-2"
                  />
                ) : f.type === "json" ? (
                  <textarea
                    rows={5}
                    value={
                      Array.isArray(editing[f.key])
                        ? editing[f.key].join("\n")
                        : (editing[f.key] ?? "")
                    }
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        [f.key]: e.target.value.split("\n").filter(Boolean),
                      })
                    }
                    className="bg-card ring-1 ring-ink/10 rounded-xl px-3 py-2 text-sm"
                  />
                ) : f.type === "tags" ? (
                  <input
                    value={
                      Array.isArray(editing[f.key])
                        ? editing[f.key].join(", ")
                        : (editing[f.key] ?? "")
                    }
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        [f.key]: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    className="bg-card ring-1 ring-ink/10 rounded-xl px-3 py-2"
                  />
                ) : (
                  <input
                    value={editing[f.key] ?? ""}
                    onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                    className="bg-card ring-1 ring-ink/10 rounded-xl px-3 py-2"
                  />
                )}
              </label>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-full text-sm">
                Cancel
              </button>
              <button
                onClick={save}
                className="px-4 py-2 rounded-full bg-brand text-brand-foreground text-sm font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
