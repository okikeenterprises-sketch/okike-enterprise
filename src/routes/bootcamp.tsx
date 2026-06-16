import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Calendar, MapPin, Users, CheckCircle } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { submitBootcampRegistration } from "@/lib/forms.functions";

export const Route = createFileRoute("/bootcamp")({
    head: () => ({
        meta: [
            { title: "Computing Synergy Summit — Register Now" },
            { name: "description", content: "Register for the Computing Synergy Summit starting 1st July. Free for department students, ₦2,000 for others." },
            { property: "og:title", content: "Computing Synergy Summit — Register Now" },
            { property: "og:description", content: "Register for the Computing Synergy Summit. Free for CS/IT department students, ₦2,000 for others." },
        ],
    }),
    component: BootcampPage,
});

const DEPARTMENTS = [
    "Computer Science",
    "Information Technology",
    "Software Engineering",
    "Cyber Security",
    "Computer Engineering",
    "Electrical/Electronics Engineering",
    "Mathematics",
    "Statistics",
    "Physics",
    "Other",
];

const LEVELS = ["100 Level", "200 Level", "300 Level", "400 Level", "500 Level", "Postgraduate", "Not a Student"];

function BootcampPage() {
    const navigate = useNavigate();
    const register = useServerFn(submitBootcampRegistration);
    const [busy, setBusy] = useState(false);
    const [isDeptStudent, setIsDeptStudent] = useState(false);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setBusy(true);
        const fd = new FormData(e.currentTarget);
        try {
            const res = await register({
                data: {
                    name: String(fd.get("name") || ""),
                    email: String(fd.get("email") || ""),
                    phone: String(fd.get("phone") || ""),
                    department: String(fd.get("department") || ""),
                    level: String(fd.get("level") || ""),
                    is_department_student: isDeptStudent,
                },
            });
            if (res.ok) {
                navigate({ to: "/thank-you" });
            } else {
                toast.error(res.error || "Registration failed. Please try again.");
            }
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <SiteLayout>
            {/* ─── HERO ─── */}
            <section className="relative overflow-hidden border-b border-ink/10 bg-contrast text-contrast-foreground">
                <div className="max-w-7xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-20">
                    <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-brand mb-8">
                        <span className="h-px w-8 bg-brand" />
                        <span>Upcoming Event</span>
                    </div>
                    <h1 className="font-display text-[clamp(2.5rem,7vw,6rem)] leading-[0.92] tracking-wide uppercase text-contrast-foreground max-w-4xl mb-6">
                        Computing{" "}
                        <span className="text-brand">Synergy</span>{" "}
                        Summit
                    </h1>
                    <div className="flex flex-wrap items-center gap-6 text-sm text-contrast-foreground/70 mb-8">
                        <span className="flex items-center gap-2">
                            <Calendar className="size-4 text-brand" />
                            1st July 2025
                        </span>
                        <span className="flex items-center gap-2">
                            <MapPin className="size-4 text-brand" />
                            Venue TBA
                        </span>
                        <span className="flex items-center gap-2">
                            <Users className="size-4 text-brand" />
                            Unlimited spots
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-brand/20 text-brand text-sm font-semibold rounded-full">
                            <CheckCircle className="size-4" />
                            Free for CS/IT department students
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-contrast-foreground/10 text-contrast-foreground/80 text-sm font-semibold rounded-full">
                            ₦2,000 for non-department attendees
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── FORM + DETAILS ─── */}
            <section className="px-6 py-16 md:py-24">
                <div className="max-w-7xl mx-auto grid md:grid-cols-[1fr_480px] gap-16 items-start">

                    {/* Left — About */}
                    <div className="flex flex-col gap-6">
                        <div>
                            <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-ink/50 mb-4">
                                <span className="h-px w-8 bg-brand" />
                                <span>About the event</span>
                            </div>
                            <h2 className="font-display text-4xl md:text-5xl leading-[0.92] tracking-wide uppercase text-ink mb-4">
                                Where tech minds <span className="text-brand">converge.</span>
                            </h2>
                            <p className="text-ink/65 leading-relaxed max-w-[48ch]">
                                The Computing Synergy Summit is a one-day event bringing together students, developers, and tech enthusiasts to learn, network, and build together. Whether you're from the department or just passionate about tech — you're welcome here.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            {[
                                { title: "Talks & Workshops", desc: "Learn from industry professionals and senior students" },
                                { title: "Networking", desc: "Connect with like-minded tech enthusiasts" },
                                { title: "Live Demos", desc: "See real projects built with modern tech" },
                                { title: "Q&A Sessions", desc: "Get your questions answered directly" },
                            ].map((item) => (
                                <div key={item.title} className="p-4 bg-card ring-1 ring-ink/10 rounded-xl">
                                    <div className="font-semibold text-sm mb-1">{item.title}</div>
                                    <p className="text-xs text-ink/60">{item.desc}</p>
                                </div>
                            ))}
                        </div>

                        <div className="p-5 bg-brand/5 ring-1 ring-brand/20 rounded-xl">
                            <div className="text-sm font-semibold text-brand mb-2">Payment info (for non-department attendees)</div>
                            <p className="text-sm text-ink/70">Registration is free for all. If you're not from the CS/IT department, you'll receive a payment link via email after submitting this form. Payment of <strong className="text-ink">₦2,000</strong> confirms your spot.</p>
                        </div>
                    </div>

                    {/* Right — Form */}
                    <div className="bg-card ring-1 ring-ink/10 rounded-2xl p-6 md:p-8">
                        <h3 className="font-semibold text-xl mb-1">Register for the Summit</h3>
                        <p className="text-sm text-ink/60 mb-6">Fill in your details below to secure your spot.</p>

                        <form onSubmit={onSubmit} className="flex flex-col gap-4">
                            <FormField label="Full name" name="name" required placeholder="John Doe" />
                            <FormField label="Email address" name="email" type="email" required placeholder="john@example.com" />
                            <FormField label="Phone / WhatsApp" name="phone" required placeholder="+234 800 000 0000" />

                            <label className="flex flex-col gap-1.5">
                                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/50">
                                    Department <span className="text-brand">*</span>
                                </span>
                                <select
                                    name="department"
                                    required
                                    defaultValue=""
                                    className="bg-surface ring-1 ring-ink/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 transition"
                                >
                                    <option value="" disabled>Select your department</option>
                                    {DEPARTMENTS.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/50">
                                    Level <span className="text-brand">*</span>
                                </span>
                                <select
                                    name="level"
                                    required
                                    defaultValue=""
                                    className="bg-surface ring-1 ring-ink/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 transition"
                                >
                                    <option value="" disabled>Select your level</option>
                                    {LEVELS.map((l) => (
                                        <option key={l} value={l}>{l}</option>
                                    ))}
                                </select>
                            </label>

                            {/* Department student checkbox */}
                            <label className="flex items-start gap-3 p-4 bg-surface ring-1 ring-ink/10 rounded-xl cursor-pointer hover:ring-brand/30 transition">
                                <input
                                    type="checkbox"
                                    checked={isDeptStudent}
                                    onChange={(e) => setIsDeptStudent(e.target.checked)}
                                    className="mt-0.5 size-4 accent-brand"
                                />
                                <div>
                                    <div className="text-sm font-medium">I am a CS/IT department student</div>
                                    <div className="text-xs text-ink/60 mt-0.5">Check this if you're in Computer Science, IT, Software Engineering, or Cyber Security — your registration is free.</div>
                                </div>
                            </label>

                            {!isDeptStudent && (
                                <div className="p-3 bg-brand/5 ring-1 ring-brand/20 rounded-xl text-sm text-ink/70">
                                    ₦2,000 payment link will be sent to your email after registration.
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={busy}
                                className="bg-brand text-brand-foreground py-3.5 font-semibold text-sm uppercase tracking-widest hover:opacity-90 transition disabled:opacity-50 mt-2"
                            >
                                {busy ? "Registering…" : isDeptStudent ? "Register Free →" : "Register & Get Payment Link →"}
                            </button>
                        </form>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}

function FormField({
    label,
    name,
    type = "text",
    required,
    placeholder,
}: {
    label: string;
    name: string;
    type?: string;
    required?: boolean;
    placeholder?: string;
}) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/50">
                {label}{required && <span className="text-brand"> *</span>}
            </span>
            <input
                name={name}
                type={type}
                required={required}
                placeholder={placeholder}
                className="bg-surface ring-1 ring-ink/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 transition"
            />
        </label>
    );
}
