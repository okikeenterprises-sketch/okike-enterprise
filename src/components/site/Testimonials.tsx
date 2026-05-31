type Quote = { quote: string; name: string; role: string };

const defaults: Quote[] = [
  {
    quote:
      "OKIKE shipped our MVP in three weeks and stayed long enough to make sure it actually worked in production. Rare combination.",
    name: "Adaeze N.",
    role: "Founder, CampusFlow",
  },
  {
    quote:
      "I came in barely able to use the terminal. Twelve weeks later I was reviewing pull requests for a real product. The mentorship is the difference.",
    name: "Ifeanyi O.",
    role: "Full-Stack cohort '24",
  },
  {
    quote:
      "They treat the work like craftsmen. Every detail considered, nothing rushed, nothing fragile.",
    name: "Daniel K.",
    role: "Head of Product, StudyHub",
  },
];

export function Testimonials({
  quotes = defaults,
  eyebrow = "Voices",
  heading = "What people who've worked with us say.",
}: {
  quotes?: Quote[];
  eyebrow?: string;
  heading?: string;
}) {
  return (
    <section className="py-24 px-6 bg-secondary border-y border-ink/5">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-[40ch] mb-14">
          <div className="text-xs font-semibold tracking-widest uppercase text-brand mb-4">
            {eyebrow}
          </div>
          <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-balance">
            {heading}
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-px bg-ink/10 border-y border-ink/10">
          {quotes.map((q) => (
            <figure
              key={q.name}
              className="bg-surface p-8 md:p-10 flex flex-col justify-between gap-8"
            >
              <blockquote className="text-lg md:text-xl text-ink/85 leading-snug text-pretty">
                <span className="text-brand text-3xl leading-none align-top mr-1">&ldquo;</span>
                {q.quote}
              </blockquote>
              <figcaption className="flex items-center gap-4 pt-6 border-t border-ink/5">
                <div className="size-10 rounded-full bg-brand/15 ring-1 ring-brand/20 flex items-center justify-center text-brand font-semibold text-sm">
                  {q.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink">{q.name}</div>
                  <div className="text-xs text-ink/55">{q.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
