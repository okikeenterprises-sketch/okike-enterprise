type Metric = { value: string; label: string; sub?: string };

const defaultMetrics: Metric[] = [
  { value: "40+", label: "Products shipped", sub: "Web, mobile, internal tools" },
  { value: "120+", label: "Students trained", sub: "Across 4 disciplines" },
  { value: "6", label: "Cohorts run", sub: "Since 2023" },
  { value: "9", label: "Countries served", sub: "Africa, Europe, North America" },
];

export function Metrics({ metrics = defaultMetrics, eyebrow = "By the numbers", heading }: { metrics?: Metric[]; eyebrow?: string; heading?: string }) {
  return (
    <section className="py-20 border-y border-ink/5 bg-surface">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase text-brand mb-3">{eyebrow}</div>
            {heading && <h2 className="text-3xl md:text-4xl font-medium tracking-tight max-w-[24ch] text-balance">{heading}</h2>}
          </div>
          <div className="text-xs uppercase tracking-widest text-ink/40">As of {new Date().getFullYear()}</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-ink/5 border-y border-ink/5">
          {metrics.map((m) => (
            <div key={m.label} className="py-8 px-4 md:px-6 first:pl-0">
              <div className="text-4xl md:text-5xl font-medium text-ink tracking-tight">{m.value}</div>
              <div className="text-sm font-medium text-ink mt-3">{m.label}</div>
              {m.sub && <div className="text-xs text-ink/50 mt-1">{m.sub}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
