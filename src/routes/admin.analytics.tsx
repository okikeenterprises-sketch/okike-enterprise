import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
} from "recharts";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalytics,
});

type Point = {
  day: string;
  signups: number;
  inquiries: number;
  projects: number;
  messages: number;
};
type Stage = { name: string; count: number };
type CountKey = Exclude<keyof Point, "day">;
type DatedRow = { created_at: string };
type ProjectRow = DatedRow & { stage: string };

function AdminAnalytics() {
  const [series, setSeries] = useState<Point[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: profiles }, { data: inq }, { data: proj }, { data: msg }] = await Promise.all([
        supabase.from("profiles").select("created_at"),
        supabase.from("project_inquiries").select("created_at"),
        supabase.from("client_projects").select("created_at, stage"),
        supabase.from("contact_messages").select("created_at"),
      ]);

      const days: Point[] = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        days.push({
          day: d.toISOString().slice(0, 10),
          signups: 0,
          inquiries: 0,
          projects: 0,
          messages: 0,
        });
      }
      const bump = (arr: DatedRow[] | null, key: CountKey) => {
        for (const r of arr ?? []) {
          const k = r.created_at.slice(0, 10);
          const pt = days.find((d) => d.day === k);
          if (pt) pt[key] += 1;
        }
      };
      bump(profiles, "signups");
      bump(inq, "inquiries");
      bump(proj, "projects");
      bump(msg, "messages");
      setSeries(days);

      const stageCounts: Record<string, number> = {};
      for (const p of (proj ?? []) as ProjectRow[]) {
        const k = p.stage;
        stageCounts[k] = (stageCounts[k] ?? 0) + 1;
      }
      setStages(
        Object.entries(stageCounts).map(([name, count]) => ({
          name: name.replace("_", " "),
          count,
        })),
      );

      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-serif tracking-tight flex items-center gap-2">
          <BarChart3 className="size-6 text-brand" /> Analytics
        </h1>
        <p className="text-sm text-ink/60 mt-1">
          Rolling 30-day trends across signups, inquiries, projects, and messages.
        </p>
      </div>

      <section className="rounded-2xl bg-card ring-1 ring-border p-6">
        <h2 className="font-semibold mb-4">Activity — last 30 days</h2>
        <div className="h-72">
          {loading ? (
            <div className="text-sm text-ink/40">Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" />
                <XAxis
                  dataKey="day"
                  tickFormatter={(d) => d.slice(5)}
                  tick={{ fontSize: 10, fill: "oklch(0.7 0.005 95 / 60%)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "oklch(0.7 0.005 95 / 60%)" }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.22 0.004 90)",
                    border: "1px solid oklch(1 0 0 / 10%)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="signups"
                  stroke="oklch(0.82 0.18 95)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="inquiries"
                  stroke="oklch(0.72 0.12 60)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="projects"
                  stroke="oklch(0.65 0.15 200)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="messages"
                  stroke="oklch(0.7 0.15 300)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-card ring-1 ring-border p-6">
        <h2 className="font-semibold mb-4">Projects by stage</h2>
        <div className="h-64">
          {loading ? (
            <div className="text-sm text-ink/40">Loading…</div>
          ) : stages.length === 0 ? (
            <div className="text-sm text-ink/40">No projects yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stages}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "oklch(0.7 0.005 95 / 70%)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "oklch(0.7 0.005 95 / 60%)" }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.22 0.004 90)",
                    border: "1px solid oklch(1 0 0 / 10%)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="oklch(0.82 0.18 95)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  );
}
