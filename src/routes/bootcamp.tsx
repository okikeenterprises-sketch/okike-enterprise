import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Calendar, MapPin, Users, CheckCircle } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { submitBootcampRegistration, verifyBootcampPayment } from "@/lib/forms.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/bootcamp")({
    head: () => ({
        meta: [
            { title: "Computing Synergy Summit — Register Now" },
            { name: "description", content: "Register for the Computing Synergy Summit starting 1st August 2026. Free for department students, ₦5,000 for others." },
            { property: "og:title", content: "Computing Synergy Summit — Register Now" },
            { property: "og:description", content: "Register for the Computing Synergy Summit. Free for CS/IT department students, ₦5,000 for others." },
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

const COURSES = [
    "Frontend Web Development",
    "Backend Web Development",
    "Product Design (UI/UX)",
    "Mobile App Development",
    "Cyber Security"
];

function BootcampPage() {
    const navigate = useNavigate();
    const { session, user, loading } = useAuth();
    const register = useServerFn(submitBootcampRegistration);
    const verifyPayment = useServerFn(verifyBootcampPayment);
    const [busy, setBusy] = useState(false);
    const [selectedDept, setSelectedDept] = useState("");
    const isDeptStudent = ["Computer Science", "Information Technology", "Software Engineering", "Cyber Security"].includes(selectedDept);

    const [userRegs, setUserRegs] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState("");
    const [loadingRegCheck, setLoadingRegCheck] = useState(true);

    const [cachedReg, setCachedReg] = useState<{
        name: string;
        email: string;
        phone: string;
        department: string;
        level: string;
        course: string;
        reference: string | null;
        status: "pending" | "paid" | "free";
        isDeptStudent: boolean;
    } | null>(null);
    const [password, setPassword] = useState("");
    const [finishingProfile, setFinishingProfile] = useState(false);

    const [departments, setDepartments] = useState<string[]>(DEPARTMENTS);
    const [courses, setCourses] = useState<string[]>(COURSES);
    const [dbLoading, setDbLoading] = useState(false);

    const registeredTracks = userRegs.map((r) => r.course).filter(Boolean);
    const availableCourses = courses.filter((c) => !registeredTracks.includes(c));

    useEffect(() => {
        async function checkExistingReg() {
            if (loading) return;
            if (!session?.user?.email) {
                setLoadingRegCheck(false);
                return;
            }
            try {
                const { data } = await (supabase as any)
                    .from("bootcamp_registrations")
                    .select("*")
                    .ilike("email", session.user.email)
                    .order("created_at", { ascending: false });
                if (data && data.length > 0) {
                    setUserRegs(data);
                    setSelectedDept(data[0].department || "");
                    setSelectedLevel(data[0].level || "");
                } else {
                    setUserRegs([]);
                }
            } catch (err) {
                console.error("Error checking registration", err);
            } finally {
                setLoadingRegCheck(false);
            }
        }
        checkExistingReg();
    }, [session, loading]);

    useEffect(() => {
        async function loadData() {
            try {
                const [{ data: depts }, { data: crs }] = await Promise.all([
                    (supabase as any).from("aksu_departments").select("name").order("name"),
                    (supabase as any).from("bootcamp_courses").select("name").order("name"),
                ]);
                if (depts && depts.length > 0) {
                    setDepartments(depts.map((d: any) => d.name));
                }
                if (crs && crs.length > 0) {
                    setCourses(crs.map((c: any) => c.name));
                }
            } catch (err) {
                console.error("Failed to load departments/courses", err);
            }
        }
        loadData();
    }, []);

    useEffect(() => {
        const stored = localStorage.getItem("okike_bootcamp_reg");
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (user && (parsed.status === "paid" || parsed.status === "free")) {
                    localStorage.removeItem("okike_bootcamp_reg");
                    setCachedReg(null);
                } else {
                    setCachedReg(parsed);
                }
            } catch {
                localStorage.removeItem("okike_bootcamp_reg");
            }
        }
    }, [user]);

    function handleStartOver() {
        localStorage.removeItem("okike_bootcamp_reg");
        setCachedReg(null);
        toast.info("Registration cleared. You can start a new registration now.");
    }

    async function handleFinishProfile(e: React.FormEvent) {
        e.preventDefault();
        if (!cachedReg || !password) return;
        setFinishingProfile(true);

        try {
            const { error: signUpError } = await supabase.auth.signUp({
                email: cachedReg.email,
                password: password,
                options: {
                    data: {
                        full_name: cachedReg.name,
                    }
                }
            });

            if (signUpError) {
                if (signUpError.message.includes("already registered") || signUpError.message.includes("User already exists")) {
                    const { error: signInError } = await supabase.auth.signInWithPassword({
                        email: cachedReg.email,
                        password: password,
                    });
                    if (signInError) {
                        toast.error("User already exists. If that is your account, please enter the correct password, or log in via the Login page.");
                        setFinishingProfile(false);
                        return;
                    }
                } else {
                    toast.error(signUpError.message);
                    setFinishingProfile(false);
                    return;
                }
            }

            toast.success("Account created successfully! Welcome to your dashboard.");
            localStorage.removeItem("okike_bootcamp_reg");
            setCachedReg(null);
            navigate({ to: "/dashboard" });
        } catch (err) {
            toast.error("Failed to complete account setup. Please try again.");
        } finally {
            setFinishingProfile(false);
        }
    }

    function handleResumePayment() {
        if (!cachedReg || !cachedReg.reference) return;
        setBusy(true);

        const koraKey = import.meta.env.VITE_KORAPAY_PUBLIC_KEY;
        if (!koraKey) {
            toast.error("Payment setup is missing. Please contact support.");
            setBusy(false);
            return;
        }

        const korapay = (window as any).Korapay;
        if (!korapay) {
            toast.error("Payment gateway failed to load. Please refresh and try again.");
            setBusy(false);
            return;
        }

        korapay.initialize({
            key: koraKey,
            reference: cachedReg.reference,
            amount: 5000,
            currency: "NGN",
            customer: {
                name: cachedReg.name,
                email: cachedReg.email,
            },
            onSuccess: async (transaction: any) => {
                toast.loading("Verifying payment...");
                try {
                    const ver = await verifyPayment({ data: { reference: cachedReg.reference! } });
                    toast.dismiss();
                    if (ver.ok) {
                        if (user) {
                            toast.success("Payment confirmed and registration complete!");
                            localStorage.removeItem("okike_bootcamp_reg");
                            setCachedReg(null);
                            navigate({ to: "/dashboard" });
                            return;
                        }
                        toast.success("Payment confirmed! Now choose a password to complete your account.");
                        const updated = {
                            ...cachedReg,
                            status: "paid" as const
                        };
                        localStorage.setItem("okike_bootcamp_reg", JSON.stringify(updated));
                        setCachedReg(updated);
                    } else {
                        toast.error(ver.error || "Payment verification failed. Please try again.");
                    }
                } catch {
                    toast.dismiss();
                    toast.error("Could not verify payment automatically. We will check it shortly.");
                } finally {
                    setBusy(false);
                }
            },
            onFailed: () => {
                toast.error("Payment failed. You can try again.");
                setBusy(false);
            },
            onClose: () => {
                toast.warning("Payment closed.");
                setBusy(false);
            }
        });
    }

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setBusy(true);
        const fd = new FormData(e.currentTarget);
        const name = user ? (user.user_metadata?.full_name || "Student") : String(fd.get("name") || "");
        const email = user ? (user.email || "") : String(fd.get("email") || "").toLowerCase().trim();
        const phone = String(fd.get("phone") || "");
        const department = String(fd.get("department") || "");
        const level = String(fd.get("level") || "");
        const course = String(fd.get("course") || "");

        try {
            const res = await register({
                data: {
                    name,
                    email,
                    phone,
                    department,
                    level,
                    course,
                    is_department_student: isDeptStudent,
                },
            });

            if (!res.ok) {
                toast.error(res.error || "Registration failed. Please try again.");
                setBusy(false);
                return;
            }

            if (isDeptStudent) {
                if (user) {
                    toast.success("Registration confirmed successfully! Redirecting to your dashboard...");
                    localStorage.removeItem("okike_bootcamp_reg");
                    setCachedReg(null);
                    setBusy(false);
                    navigate({ to: "/dashboard" });
                    return;
                }
                toast.success("Registration confirmed successfully! Now choose a password to complete your profile.");
                const regData = {
                    name,
                    email,
                    phone,
                    department,
                    level,
                    course,
                    reference: null,
                    status: "free" as const,
                    isDeptStudent: true
                };
                localStorage.setItem("okike_bootcamp_reg", JSON.stringify(regData));
                setCachedReg(regData);
                setBusy(false);
                return;
            }

            // Trigger Korapay for non-department students
            const koraKey = import.meta.env.VITE_KORAPAY_PUBLIC_KEY;
            if (!koraKey) {
                toast.error("Payment setup is missing. Please contact support.");
                setBusy(false);
                return;
            }

            const korapay = (window as any).Korapay;
            if (!korapay) {
                toast.error("Payment gateway failed to load. Please refresh and try again.");
                setBusy(false);
                return;
            }

            korapay.initialize({
                key: koraKey,
                reference: res.reference,
                amount: 5000,
                currency: "NGN",
                customer: {
                    name,
                    email,
                },
                onSuccess: async (transaction: any) => {
                    toast.loading("Verifying payment...");
                    try {
                        const ver = await verifyPayment({ data: { reference: res.reference } });
                        toast.dismiss();
                        if (ver.ok) {
                            if (user) {
                                toast.success("Payment confirmed and registration complete!");
                                localStorage.removeItem("okike_bootcamp_reg");
                                setCachedReg(null);
                                navigate({ to: "/dashboard" });
                                return;
                            }
                            toast.success("Payment confirmed! Now choose a password to complete your profile.");
                            const regData = {
                                name,
                                email,
                                phone,
                                department,
                                level,
                                course,
                                reference: res.reference,
                                status: "paid" as const,
                                isDeptStudent: false
                            };
                            localStorage.setItem("okike_bootcamp_reg", JSON.stringify(regData));
                            setCachedReg(regData);
                        } else {
                            toast.error(ver.error || "Payment verification failed. Please try again.");
                        }
                    } catch {
                        toast.dismiss();
                        toast.error("Could not verify payment automatically. We will check it shortly.");
                    } finally {
                        setBusy(false);
                    }
                },
                onFailed: (transaction: any) => {
                    toast.error("Payment failed. Your registration is saved as pending.");
                    const regData = {
                        name,
                        email,
                        phone,
                        department,
                        level,
                        course,
                        reference: res.reference,
                        status: "pending" as const,
                        isDeptStudent: false
                    };
                    localStorage.setItem("okike_bootcamp_reg", JSON.stringify(regData));
                    setCachedReg(regData);
                    setBusy(false);
                },
                onClose: () => {
                    toast.warning("Payment modal closed. Your registration is pending.");
                    const regData = {
                        name,
                        email,
                        phone,
                        department,
                        level,
                        course,
                        reference: res.reference,
                        status: "pending" as const,
                        isDeptStudent: false
                    };
                    localStorage.setItem("okike_bootcamp_reg", JSON.stringify(regData));
                    setCachedReg(regData);
                    setBusy(false);
                },
            });
        } catch {
            toast.error("Something went wrong. Please try again.");
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
                            1st August 2026
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
                            ₦5,000 for non-department attendees
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
                                The Computing Synergy Summit is a four (4) month event bringing together students, developers, and tech enthusiasts to learn, network, and build together. Whether you're from the department or just passionate about tech — you're welcome here.
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
                            <p className="text-sm text-ink/70">Registration is free for all. If you're not from the CS/IT department, you'll receive a payment link via email after submitting this form. Payment of <strong className="text-ink">₦5,000</strong> confirms your spot.</p>
                        </div>
                    </div>

                    {/* Right — Already Registered, Form or Cache states */}
                    {loadingRegCheck ? (
                        <div className="bg-card ring-1 ring-ink/10 rounded-2xl p-6 md:p-8 text-center text-ink/40 text-sm">
                            Checking registration status...
                        </div>
                    ) : userRegs.length > 0 && !showForm ? (
                        <div className="bg-card ring-1 ring-ink/10 rounded-2xl p-6 md:p-8 flex flex-col gap-5">
                            <div className="flex flex-col gap-1">
                                <h3 className="font-semibold text-xl text-ink">You're Registered!</h3>
                                <p className="text-xs text-ink/50">Computing Synergy Summit 2026</p>
                            </div>

                            <p className="text-sm text-ink/70 leading-relaxed">
                                Hi <strong className="text-ink">{userRegs[0].name}</strong>, you have secured your spot for the following track(s):
                            </p>

                            <div className="flex flex-col gap-3">
                                {userRegs.map((reg: any) => (
                                    <div key={reg.id} className="p-4 bg-surface ring-1 ring-ink/5 rounded-xl text-xs flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="font-semibold text-ink text-sm truncate">{reg.course}</div>
                                            <div className="text-ink/50 mt-0.5">{reg.department} ({reg.level})</div>
                                        </div>
                                        <span className={`text-[9px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${
                                            reg.payment_status === "paid"
                                                ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20"
                                                : reg.payment_status === "free"
                                                    ? "bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20"
                                                    : "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20"
                                        }`}>
                                            {reg.payment_status === "paid" ? "Confirmed (Paid)" : reg.payment_status === "free" ? "Confirmed (Free)" : "Pending"}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col gap-2 mt-2">
                                <button
                                    onClick={() => navigate({ to: "/dashboard" })}
                                    className="w-full py-3.5 rounded-xl bg-brand text-brand-foreground font-semibold text-xs uppercase tracking-wider hover:opacity-90 transition"
                                >
                                    Go to Dashboard &rarr;
                                </button>
                                
                                {availableCourses.length > 0 && (
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="w-full py-3.5 rounded-xl bg-secondary hover:bg-ink/5 ring-1 ring-ink/10 text-ink font-semibold text-xs uppercase tracking-wider transition"
                                    >
                                        Register for another track &rarr;
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : cachedReg ? (
                        cachedReg.status === "pending" ? (
                            <div className="bg-card ring-1 ring-ink/10 rounded-2xl p-6 md:p-8">
                                <h3 className="font-semibold text-xl mb-1">Resume Registration</h3>
                                <p className="text-sm text-ink/60 mb-6">
                                    You have a pending registration for the Summit.
                                </p>

                                <div className="flex flex-col gap-4">
                                    <div className="p-4 bg-surface ring-1 ring-ink/5 rounded-xl text-xs flex flex-col gap-2">
                                        <div><strong>Name:</strong> {cachedReg.name}</div>
                                        <div><strong>Email:</strong> {cachedReg.email}</div>
                                        <div><strong>Department:</strong> {cachedReg.department} ({cachedReg.level})</div>
                                        <div><strong>Course:</strong> {cachedReg.course}</div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleResumePayment}
                                        disabled={busy}
                                        className="w-full bg-brand text-brand-foreground py-3.5 font-semibold text-sm uppercase tracking-widest hover:opacity-90 transition disabled:opacity-50 mt-2 animate-pulse"
                                    >
                                        {busy ? "Initializing..." : "Pay Registration Fee (₦5,000) →"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleStartOver}
                                        className="text-xs text-center text-ink/50 hover:text-brand transition mt-2 font-medium"
                                    >
                                        Cancel & Start Over
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-card ring-1 ring-ink/10 rounded-2xl p-6 md:p-8">
                                <h3 className="font-semibold text-xl mb-1">Complete Profile</h3>
                                <p className="text-sm text-ink/60 mb-6">
                                    Choose a password to finish profile registration and access your dashboard.
                                </p>

                                <form onSubmit={handleFinishProfile} className="flex flex-col gap-4">
                                    <div className="p-4 bg-emerald-500/10 ring-1 ring-emerald-500/20 text-emerald-600 rounded-xl text-xs flex flex-col gap-1 font-medium">
                                        <div>✓ Registration Confirmed</div>
                                        <div className="opacity-80">Email: {cachedReg.email}</div>
                                        <div className="opacity-80">Course: {cachedReg.course}</div>
                                    </div>

                                    <label className="flex flex-col gap-1.5">
                                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/50">
                                            Choose Password <span className="text-brand">*</span>
                                        </span>
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            minLength={6}
                                            className="bg-surface ring-1 ring-ink/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 transition"
                                        />
                                    </label>

                                    <button
                                        type="submit"
                                        disabled={finishingProfile}
                                        className="bg-brand text-brand-foreground py-3.5 font-semibold text-sm uppercase tracking-widest hover:opacity-90 transition disabled:opacity-50 mt-2"
                                    >
                                        {finishingProfile ? "Completing Profile…" : "Create Account & Go to Dashboard →"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleStartOver}
                                        className="text-xs text-center text-ink/50 hover:text-brand transition mt-2 font-medium"
                                    >
                                        Discard & Start Over
                                    </button>
                                </form>
                            </div>
                        )
                    ) : (
                        <div className="bg-card ring-1 ring-ink/10 rounded-2xl p-6 md:p-8">
                            {userRegs.length > 0 ? (
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="font-semibold text-xl">Register for another track</h3>
                                        <p className="text-xs text-ink/50 mt-1">Select a new course track below</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="text-xs text-brand hover:underline font-semibold"
                                    >
                                        ← Back
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h3 className="font-semibold text-xl mb-1">Register for the Summit</h3>
                                    <p className="text-sm text-ink/60 mb-6">Fill in your details below to secure your spot.</p>
                                </>
                            )}

                            <form onSubmit={onSubmit} className="flex flex-col gap-4">
                                {user ? (
                                    <div className="p-4 bg-surface ring-1 ring-ink/5 rounded-xl text-xs flex flex-col gap-1">
                                        <span className="text-[10px] text-ink/40 uppercase tracking-wider font-semibold">Registering As</span>
                                        <div className="font-semibold text-ink text-sm">{user.user_metadata?.full_name || "Student"}</div>
                                        <div className="text-ink/60">{user.email}</div>
                                    </div>
                                ) : (
                                    <>
                                        <FormField label="Full name" name="name" required placeholder="John Doe" />
                                        <FormField label="Email address" name="email" type="email" required placeholder="john@example.com" />
                                    </>
                                )}
                                <FormField 
                                    key={userRegs[0]?.phone || "phone"}
                                    label="Phone / WhatsApp" 
                                    name="phone" 
                                    required 
                                    placeholder="+234 800 000 0000" 
                                    defaultValue={userRegs[0]?.phone || user?.phone || user?.user_metadata?.phone || ""}
                                />

                                <label className="flex flex-col gap-1.5">
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/50">
                                        Department <span className="text-brand">*</span>
                                    </span>
                                    <select
                                        name="department"
                                        required
                                        value={selectedDept}
                                        onChange={(e) => setSelectedDept(e.target.value)}
                                        className="bg-surface ring-1 ring-ink/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 transition"
                                    >
                                        <option value="" disabled>Select your department</option>
                                        {departments.map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </label>

                                <label className="flex flex-col gap-1.5">
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/50">
                                        Select Course Track <span className="text-brand">*</span>
                                    </span>
                                    <select
                                        name="course"
                                        required
                                        defaultValue=""
                                        className="bg-surface ring-1 ring-ink/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 transition"
                                    >
                                        <option value="" disabled>Select your course track</option>
                                        {courses
                                            .filter(c => !registeredTracks.includes(c))
                                            .map((c) => (
                                                <option key={c} value={c}>{c}</option>
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
                                        value={selectedLevel}
                                        onChange={(e) => setSelectedLevel(e.target.value)}
                                        className="bg-surface ring-1 ring-ink/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 transition"
                                    >
                                        <option value="" disabled>Select your level</option>
                                        {LEVELS.map((l) => (
                                            <option key={l} value={l}>{l}</option>
                                        ))}
                                    </select>
                                </label>

                                {isDeptStudent ? (
                                    <div className="p-3 bg-emerald-500/10 ring-1 ring-emerald-500/20 text-emerald-600 rounded-xl text-xs font-medium">
                                        ✓ Free admission (CS / IT department student)
                                    </div>
                                ) : selectedDept ? (
                                    <div className="p-3 bg-brand/5 ring-1 ring-brand/20 rounded-xl text-xs text-ink/70">
                                        ₦5,000 payment will be handled securely via Korapay checkout modal.
                                    </div>
                                ) : null}

                                <button
                                    type="submit"
                                    disabled={busy || dbLoading}
                                    className="bg-brand text-brand-foreground py-3.5 font-semibold text-sm uppercase tracking-widest hover:opacity-90 transition disabled:opacity-50 mt-2"
                                >
                                    {dbLoading ? "Loading Form..." : busy ? "Registering…" : isDeptStudent ? "Register Free →" : "Register & Pay Registration Fee →"}
                                </button>
                            </form>
                        </div>
                    )}
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
    defaultValue,
}: {
    label: string;
    name: string;
    type?: string;
    required?: boolean;
    placeholder?: string;
    defaultValue?: string;
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
                defaultValue={defaultValue}
                className="bg-surface ring-1 ring-ink/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 transition"
            />
        </label>
    );
}
