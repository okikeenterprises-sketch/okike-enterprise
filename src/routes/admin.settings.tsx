import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cmsUpsert } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/settings")({
  component: SiteSettingsPage,
});

const KEYS: {
  key: string;
  label: string;
  fields: { name: string; label: string; type?: "text" | "textarea" }[];
}[] = [
  {
    key: "hero",
    label: "Homepage hero",
    fields: [
      { name: "title", label: "Title", type: "textarea" },
      { name: "subtitle", label: "Subtitle", type: "textarea" },
      { name: "cta_label", label: "CTA label" },
      { name: "cta_link", label: "CTA link" },
    ],
  },
  {
    key: "about",
    label: "About section",
    fields: [
      { name: "title", label: "Title" },
      { name: "body", label: "Body", type: "textarea" },
    ],
  },
  {
    key: "contact",
    label: "Contact info",
    fields: [
      { name: "email", label: "Email" },
      { name: "phone", label: "Phone" },
      { name: "address", label: "Address" },
    ],
  },
];

function SiteSettingsPage() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const upsert = useServerFn(cmsUpsert);

  async function load() {
    const { data } = await supabase.from("site_settings").select("*");
    const m: Record<string, any> = {};
    (data ?? []).forEach((r: any) => {
      m[r.key] = r.value;
    });
    setSettings(m);
  }
  useEffect(() => {
    load();
  }, []);

  async function saveKey(key: string) {
    try {
      await upsert({ data: { table: "site_settings", row: { key, value: settings[key] ?? {} } } });
      toast.success("Saved");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-medium">Site settings</h1>
      {KEYS.map((g) => (
        <section
          key={g.key}
          className="bg-card rounded-2xl p-6 ring-1 ring-ink/5 flex flex-col gap-3"
        >
          <div className="flex justify-between items-center">
            <h2 className="font-medium">{g.label}</h2>
            <button
              onClick={() => saveKey(g.key)}
              className="px-4 py-2 rounded-full bg-brand text-brand-foreground text-sm font-medium"
            >
              Save
            </button>
          </div>
          {g.fields.map((f) => (
            <label key={f.name} className="flex flex-col gap-1 text-sm">
              <span className="text-xs uppercase tracking-wider text-ink/40">{f.label}</span>
              {f.type === "textarea" ? (
                <textarea
                  rows={3}
                  value={settings[g.key]?.[f.name] ?? ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      [g.key]: { ...(settings[g.key] ?? {}), [f.name]: e.target.value },
                    })
                  }
                  className="bg-surface ring-1 ring-ink/10 rounded-xl px-3 py-2"
                />
              ) : (
                <input
                  value={settings[g.key]?.[f.name] ?? ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      [g.key]: { ...(settings[g.key] ?? {}), [f.name]: e.target.value },
                    })
                  }
                  className="bg-surface ring-1 ring-ink/10 rounded-xl px-3 py-2"
                />
              )}
            </label>
          ))}
        </section>
      ))}
    </div>
  );
}
