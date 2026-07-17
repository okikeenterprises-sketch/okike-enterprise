import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Calendar, MapPin, Users, CheckCircle, Briefcase, TrendingUp, Coins, Terminal, Database, Palette, Smartphone, Shield, Layers, Award, ArrowRight, Globe } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { submitBootcampRegistration, verifyBootcampPayment } from "@/lib/forms.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getBootcampCoursePrice } from "@/lib/utils";

export const Route = createFileRoute("/bootcamp")({
    head: () => ({
        meta: [
            { title: "Computing Synergy Summit — Register Now" },
            { name: "description", content: "Register for the Computing Synergy Summit starting 1st August 2026. Free for department students, from ₦5,000 for others." },
            { property: "og:title", content: "Computing Synergy Summit — Register Now" },
            { property: "og:description", content: "Register for the Computing Synergy Summit. Free for CS/IT department students, from ₦5,000 for others." },
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
    "Cyber Security",
    "Data Analysis with Python",
    "AI & Machine Learning"
];

function BootcampPage() {
    const navigate = useNavigate();
    const { session, user, loading } = useAuth();
    const register = useServerFn(submitBootcampRegistration);
    const verifyPayment = useServerFn(verifyBootcampPayment);
    const [busy, setBusy] = useState(false);
    const [regType, setRegType] = useState<"student" | "non-student">("student");
    const [selectedDept, setSelectedDept] = useState("");
    const [selectedLevel, setSelectedLevel] = useState("");
    const isDeptStudent = regType === "student" &&
        ["Computer Science", "Information Technology", "Software Engineering", "Cyber Security"].includes(selectedDept) &&
        selectedLevel !== "Not a Student";

    const [userRegs, setUserRegs] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [loadingRegCheck, setLoadingRegCheck] = useState(true);

    const [cachedReg, setCachedReg] = useState<{
        name: string;
        email: string;
        phone: string;
        department: string;
        level: string;
        course: string;
        reg_no: string | null;
        reference: string | null;
        status: "pending" | "paid" | "free";
        isDeptStudent: boolean;
    } | null>(null);
    const [password, setPassword] = useState("");
    const [finishingProfile, setFinishingProfile] = useState(false);

    const [departments, setDepartments] = useState<string[]>(DEPARTMENTS);
    const [courses, setCourses] = useState<string[]>(COURSES);
    const [dbLoading, setDbLoading] = useState(false);

    const [selectedCourse, setSelectedCourse] = useState("");
    const [selectedRole, setSelectedRole] = useState("");

    const currentRoles = getRolesForCourse(selectedCourse);
    const activeRole = currentRoles.find(r => r.name === selectedRole) || currentRoles[0];
    const currentPrice = activeRole ? activeRole.price : 5000;

    useEffect(() => {
        if (courses.length > 0 && !selectedCourse) {
            const initialCourse = courses[0];
            setSelectedCourse(initialCourse);
            const roles = getRolesForCourse(initialCourse);
            setSelectedRole(roles[0]?.name || "");
        }
    }, [courses, selectedCourse]);

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
            amount: getBootcampCoursePrice(cachedReg.course),
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
        const department = regType === "student" ? String(fd.get("department") || "") : "General Public";
        const level = regType === "student" ? String(fd.get("level") || "") : "Not a Student";
        const course = selectedRole ? `${selectedCourse} - ${selectedRole}` : selectedCourse;
        const reg_no = (regType === "student" && isDeptStudent) ? String(fd.get("reg_no") || "").trim() : "";

        if (isDeptStudent) {
            if (!reg_no || !reg_no.toLowerCase().includes("csc")) {
                toast.error("Invalid registration number. Department students must provide a valid registration number.");
                setBusy(false);
                return;
            }
        }

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
                    reg_no,
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
                    reg_no,
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
                amount: getBootcampCoursePrice(course),
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
                                reg_no: null,
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
                        reg_no: null,
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
                        reg_no: null,
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
                            From ₦5,000 for non-department attendees
                        </div>
                    </div>
                </div>
            </section>

            <CareerPathExplorer />

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
                            <p className="text-sm text-ink/70">Registration is free for all CS/IT department students. If you are not from the department, your registration payment secures your spot. Price varies from ₦5,000 to ₦12,000 based on the track and specialization level you choose.</p>
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
                                        {busy ? "Initializing..." : `Pay Registration Fee (₦${getBootcampCoursePrice(cachedReg.course).toLocaleString()}) →`}
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

                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/50">
                                        I am registering as <span className="text-brand">*</span>
                                    </span>
                                    <div className="grid grid-cols-2 p-1 bg-surface ring-1 ring-ink/10 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setRegType("student");
                                                if (selectedLevel === "Not a Student") {
                                                    setSelectedLevel("");
                                                }
                                            }}
                                            className={`py-2.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                                                regType === "student"
                                                    ? "bg-brand text-brand-foreground shadow-sm font-bold"
                                                    : "text-ink/60 hover:text-ink hover:bg-ink/5"
                                            }`}
                                        >
                                            University Student
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setRegType("non-student");
                                                setSelectedDept("");
                                                setSelectedLevel("Not a Student");
                                            }}
                                            className={`py-2.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                                                regType === "non-student"
                                                    ? "bg-brand text-brand-foreground shadow-sm font-bold"
                                                    : "text-ink/60 hover:text-ink hover:bg-ink/5"
                                            }`}
                                        >
                                            General Attendee
                                        </button>
                                    </div>
                                </div>

                                <FormField 
                                    key={userRegs[0]?.phone || "phone"}
                                    label="Phone / WhatsApp" 
                                    name="phone" 
                                    required 
                                    placeholder="+234 800 000 0000" 
                                    defaultValue={userRegs[0]?.phone || user?.phone || user?.user_metadata?.phone || ""}
                                />

                                {regType === "student" && (
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
                                )}

                                <label className="flex flex-col gap-1.5">
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/50">
                                        Select Course Track <span className="text-brand">*</span>
                                    </span>
                                    <select
                                        name="course_track"
                                        required
                                        value={selectedCourse}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setSelectedCourse(val);
                                            const roles = getRolesForCourse(val);
                                            setSelectedRole(roles[0]?.name || "");
                                        }}
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

                                {selectedCourse && getRolesForCourse(selectedCourse).length > 0 && (
                                    <label className="flex flex-col gap-1.5">
                                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/50">
                                            Select Role / Specialization <span className="text-brand">*</span>
                                        </span>
                                        <select
                                            name="course_role"
                                            required
                                            value={selectedRole}
                                            onChange={(e) => setSelectedRole(e.target.value)}
                                            className="bg-surface ring-1 ring-ink/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 transition"
                                        >
                                            {getRolesForCourse(selectedCourse).map((r) => (
                                                <option key={r.name} value={r.name}>
                                                    {r.name} {isDeptStudent ? "" : `(₦${r.price.toLocaleString()})`}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                )}

                                {regType === "student" && (
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
                                )}

                                {regType === "student" && isDeptStudent && (
                                    <div className="flex flex-col gap-1">
                                        <FormField 
                                            label="University Registration Number" 
                                            name="reg_no" 
                                            required 
                                            placeholder="Enter your Reg No"
                                        />
                                        <span className="text-[10px] text-ink/45 -mt-0.5">
                                            Required for CS/IT department verification.
                                        </span>
                                    </div>
                                )}

                                {isDeptStudent ? (
                                    <div className="p-3 bg-emerald-500/10 ring-1 ring-emerald-500/20 text-emerald-600 rounded-xl text-xs font-medium">
                                        ✓ Free admission (CS / IT department student)
                                    </div>
                                ) : selectedDept || regType === "non-student" ? (
                                    <div className="p-3 bg-brand/5 ring-1 ring-brand/20 rounded-xl text-xs text-ink/70">
                                        ₦{currentPrice.toLocaleString()} payment will be handled securely via Korapay checkout modal.
                                    </div>
                                ) : null}

                                <button
                                    type="submit"
                                    disabled={busy || dbLoading}
                                    className="bg-brand text-brand-foreground py-3.5 font-semibold text-sm uppercase tracking-widest hover:opacity-90 transition disabled:opacity-50 mt-2 cursor-pointer"
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

const CAREER_TRACKS = [
  {
    name: "Frontend Web Development",
    role: "Frontend Engineer / React Developer",
    description: "Craft visually stunning, highly interactive web applications. As a frontend engineer, you will bring designs to life, manage client-side state, and construct responsive interfaces that function across all devices.",
    demand: "Very High" as const,
    difficulty: "Beginner Friendly" as const,
    salaryLocal: "₦300,000 - ₦1,200,000 / month",
    salaryRemote: "$35,000 - $90,000 / year",
    skills: ["HTML5 & CSS3", "Tailwind CSS", "Modern JavaScript (ES6+)", "React & JSX", "TypeScript", "Vite & Package Managers", "TanStack Router & Query", "Git & GitHub API Collaboration"],
    roadmap: [
      {
        title: "Stage 1: Web Fundamentals & Git Workspace",
        description: "Set up your developer environment and master structural/style languages.",
        details: ["HTML5 semantic structures for SEO and accessibility", "CSS3 layouts (Flexbox, Grid) & modern responsive designs", "Git workflow, branching, and pushing code to GitHub"]
      },
      {
        title: "Stage 2: Core Programming & Dynamic Interfaces",
        description: "Learn logical programming and how to dynamically manipulate the DOM.",
        details: ["JavaScript data types, functions, control flows, and array methods", "Asynchronous coding, fetching data from external APIs, and JSON manipulation", "DOM event handlers and UI interactive behaviors"]
      },
      {
        title: "Stage 3: Component-Driven Apps with React & TS",
        description: "Transition to state-managed, reusable components with type safety.",
        details: ["React state management (useState, useEffect, custom hooks)", "Tailwind CSS utility-first styling for speed and custom variables", "TypeScript compiler integration for robust codebases and interface schemas"]
      },
      {
        title: "Stage 4: Full Stack Integration & Deployment",
        description: "Build, route, test, and release production-ready applications.",
        details: ["Client-side routing via TanStack Router & caching with React Query", "Supabase authentication, real-time sync, and database integrations", "Vite build configuration & Vercel serverless deployment"]
      }
    ]
  },
  {
    name: "Backend Web Development",
    role: "Backend Engineer / API Developer",
    description: "Architect the backbone of software systems. You will design databases, secure server operations, write microservices/APIs, and deploy robust cloud backend architectures.",
    demand: "Very High" as const,
    difficulty: "Intermediate" as const,
    salaryLocal: "₦400,000 - ₦1,500,000 / month",
    salaryRemote: "$40,000 - $110,000 / year",
    skills: ["Node.js & Express", "PostgreSQL & SQL Schema", "Database Migrations", "API Security & JWT", "Supabase & Postgres Functions", "Serverless Functions & Edge", "REST & GraphQL", "CI/CD & Docker Basics"],
    roadmap: [
      {
        title: "Stage 1: Database Architecture & SQL",
        description: "Master data storage modeling and write high-performance query logic.",
        details: ["Relational Database Design & Entity Relationship Modeling (ERD)", "SQL queries, joins, aggregates, indexes, and performance optimization", "Supabase Postgres database tables & triggers configuration"]
      },
      {
        title: "Stage 2: Server-Side Apps with Node.js & Express",
        description: "Build robust backend servers to handle complex HTTP/REST endpoints.",
        details: ["Node.js runtime environment, filesystem, and package configurations", "Express framework routing, controller architectures, and error handling", "Environment variables, debugging tools, and standard middleware patterns"]
      },
      {
        title: "Stage 3: Secure Systems, Auth & Storage",
        description: "Design airtight security architectures and user session states.",
        details: ["JWT-based session authentication and custom middleware authorizations", "Row Level Security (RLS) policies in Postgres databases", "File upload systems, cloud storage buckets, and server-side encryption key pipelines"]
      },
      {
        title: "Stage 4: Serverless API Architecture & Cloud Deployments",
        description: "Scale API engines and build edge/serverless backends.",
        details: ["Vercel and Cloudflare Wrangler edge function deployment models", "Database connection pool management and transaction controls", "Automated pipelines, webhook receivers, and API integration testing"]
      }
    ]
  },
  {
    name: "Product Design (UI/UX)",
    role: "Product Designer / UI UX Researcher",
    description: "Design products that feel intuitive and look spectacular. As a Product Designer, you will study user behavior, map flow logic, compile scalable design systems, and output high-fidelity prototypes.",
    demand: "High" as const,
    difficulty: "Beginner Friendly" as const,
    salaryLocal: "₦250,000 - ₦1,000,000 / month",
    salaryRemote: "$30,000 - $85,000 / year",
    skills: ["UX Research & Personas", "User Journey Mapping", "Wireframing & FigJam", "Visual Design Principles", "Scalable Design Systems", "Figma Advanced Layouts", "High-Fidelity Prototyping", "Usability Testing & Case Studies"],
    roadmap: [
      {
        title: "Stage 1: UX Strategy & User Research",
        description: "Step into the user's shoes to understand their core needs and pain points.",
        details: ["User research strategies, empathy maps, and demographic personas", "Information architecture (IA) map logic and user flow outlines", "Ideation, brainwrites, and wireframing layout plans using FigJam"]
      },
      {
        title: "Stage 2: UI Design Fundamentals & Figma Studio",
        description: "Learn visual hierarchy, spacing systems, and software configurations.",
        details: ["Visual guidelines: typography scale, grids, and harmonious color theory", "Figma software mechanics: vectors, component frames, and constraints", "Low-fidelity interactive wireframes for rapid user validation tests"]
      },
      {
        title: "Stage 3: Advanced Figma & Design Systems",
        description: "Develop scalable libraries that speed up product development teams.",
        details: ["Figma auto-layout rules, nesting, responsive frames, and variables", "Design Systems: interactive components, variants, variables, and themes", "High-fidelity screens built with pixel-perfect visual details"]
      },
      {
        title: "Stage 4: Prototyping, Usability & Portfolio Cases",
        description: "Transform static designs into interactive simulations and present them.",
        details: ["Advanced transitions, micro-interactions, smart animate, and variable states", "Usability test session facilitation and iteration based on feedback logs", "UX Case Study writing & professional Behance/Figma portfolio presentation"]
      }
    ]
  },
  {
    name: "Mobile App Development",
    role: "Mobile App Developer / React Native Engineer",
    description: "Create native and cross-platform mobile apps. You will construct high-performance iOS and Android user experiences, configure native hardware integrations, and handle app store releases.",
    demand: "High" as const,
    difficulty: "Intermediate" as const,
    salaryLocal: "₦350,000 - ₦1,300,000 / month",
    salaryRemote: "$40,000 - $95,000 / year",
    skills: ["React Native Core", "Expo Framework", "Mobile UI Layouts", "Stack/Drawer Routing", "Native Device Hardware", "Offline Local Caching", "Push Notification Pipelines", "App Store Publishing"],
    roadmap: [
      {
        title: "Stage 1: Mobile UI & React Native Core",
        description: "Configure cross-platform mobile runtimes and learn mobile layouts.",
        details: ["React Native architecture vs standard DOM-based web code", "Expo setup, running code on physical simulator devices", "Native layout structures using Flexbox & React Native Core styles"]
      },
      {
        title: "Stage 2: Advanced Mobile Navigation & Styling",
        description: "Design fluid screens and smooth page transitions.",
        details: ["Expo Router navigation configurations (Tabs, Stacks, Drawers)", "Custom mobile design systems and Tailwind Native styling adapters", "Form validation, key inputs, and text management for touchscreens"]
      },
      {
        title: "Stage 3: Hardware Integrations & Core Data Storage",
        description: "Tap into native APIs and store data locally for offline capability.",
        details: ["Integrating device features: Camera, Location, and Bio-Auth locks", "Storing user sessions securely using Expo SecureStore and MMKV", "API fetches, network status listeners, and cache strategies"]
      },
      {
        title: "Stage 4: Release pipelines & App Store Publishing",
        description: "Prepare and deploy apps for user distribution.",
        details: ["Build configurations, app icons, and launch screens", "Expo Application Services (EAS) cloud builds for Android & iOS", "App Store Connect & Google Play Console app submission rules"]
      }
    ]
  },
  {
    name: "Cyber Security",
    role: "Security Analyst / Ethical Hacker",
    description: "Become a digital defender. Learn how networks connect, explore vulnerability reconnaissance, run penetration tests, understand OWASP security bugs, and harden network systems.",
    demand: "Very High" as const,
    difficulty: "Intermediate" as const,
    salaryLocal: "₦400,000 - ₦1,800,000 / month",
    salaryRemote: "$45,000 - $120,000 / year",
    skills: ["Linux Command Line", "Networking (TCP/IP, HTTP)", "Reconnaissance (Nmap)", "Web Penetration Testing", "OWASP Top 10 vulnerabilities", "Exploitation Tools (Burp Suite)", "System Hardening", "Incident Response Basics"],
    roadmap: [
      {
        title: "Stage 1: Linux Operating Systems & Network Layers",
        description: "Build an airtight understanding of computer communications and shell controls.",
        details: ["Linux OS structure, command shell scripting, and user permission models", "Networking essentials: TCP/IP stack, routing tables, DNS, and ports", "Analyzing network packets and traffic protocols using Wireshark"]
      },
      {
        title: "Stage 2: Reconnaissance & Vulnerability Discovery",
        description: "Act like an attacker to discover exposed surfaces and target entries.",
        details: ["Information gathering, OSINT searches, and domain footprints", "Active scanning, host detection, and network analysis using Nmap", "Vulnerability databases research and exploit mapping"]
      },
      {
        title: "Stage 3: Practical Exploits & Web App Vulnerabilities",
        description: "Uncover and exploit application flaws to understand how they are defended.",
        details: ["Burp Suite interception proxy, request manipulation, and analysis", "OWASP Top 10 exploits: SQL Injection, XSS, broken access controls", "Privilege escalations, session hijackings, and lateral movements"]
      },
      {
        title: "Stage 4: Defense, Auditing & Incident Handling",
        description: "Build perimeter walls and mitigate system breeches.",
        details: ["Firewall management, port filtering, and system audit logs", "Identity management, patch updates, and security policy rules", "Incident response strategies: evidence isolation, analysis, and containment"]
      }
    ]
  },
  {
    name: "Data Analysis with Python",
    role: "Data Analyst / Analytics Engineer",
    description: "Extract actionable insights from raw data. Master databases, data manipulation libraries, statistical concepts, and interactive dashboards to drive business decisions.",
    demand: "High" as const,
    difficulty: "Beginner Friendly" as const,
    salaryLocal: "₦250,000 - ₦1,100,000 / month",
    salaryRemote: "$30,000 - $80,000 / year",
    skills: ["Python Programming", "Pandas & NumPy", "SQL Queries", "Data Visualization", "Jupyter Notebooks", "Power BI & Tableau", "Statistical Analysis", "Git Portfolio"],
    roadmap: [
      {
        title: "Stage 1: SQL & Data Foundations",
        description: "Master database querying and relational data modeling.",
        details: ["Relational Database logic, schemas, and relational entities", "SQL queries, joins, aggregates, groupings, and data filtering", "Database import/export routines and structural integrations"]
      },
      {
        title: "Stage 2: Python scripting & Data Wrangling",
        description: "Write clean data pipelines to clean, restructure, and analyze raw tables.",
        details: ["Python core data types, loops, lists, dicts, and functions", "Pandas DataFrame structures, loading CSV/JSON files, and index selectors", "NumPy array calculations, missing value treatments, and table joins"]
      },
      {
        title: "Stage 3: Visual Analytics & Reporting Dashboard",
        description: "Design interactive reports and visual storytelling components.",
        details: ["Matplotlib & Seaborn charting libraries (Bar, Line, Scatter, Hist)", "Power BI visual dashboard structures, DAX formulas, and charts", "Deploying interactive web reports and analytical storytelling patterns"]
      },
      {
        title: "Stage 4: Statistical Modeling & Capstone Case Study",
        description: "Apply statistical logic to support real business actions.",
        details: ["Descriptive stats, probability distributions, and hypotheses testing", "A/B testing strategies, correlations, and regression trends", "Compiling a professional Jupyter analytics report published on GitHub"]
      }
    ]
  },
  {
    name: "AI & Machine Learning",
    role: "AI Developer / Machine Learning Engineer",
    description: "Build predictive models and deploy AI pipelines. Master regression algorithms, classification models, neural network structures, and natural language processing.",
    demand: "Very High" as const,
    difficulty: "Advanced" as const,
    salaryLocal: "₦400,000 - ₦1,700,000 / month",
    salaryRemote: "$45,000 - $130,000 / year",
    skills: ["Python for ML", "Linear Algebra & Calculus", "Scikit-Learn models", "Neural Networks", "TensorFlow & Keras", "Computer Vision Basics", "NLP & LLM Prompting", "Model Deployment"],
    roadmap: [
      {
        title: "Stage 1: Linear Algebra, Calculus & Data Prep",
        description: "Configure core mathematical concepts used in statistical learning models.",
        details: ["Matrix multiplication, vector projections, and gradient calculus", "Feature scaling, normalize, standardize, and encode operations", "Splitting train/test data splits and cross-validation plans"]
      },
      {
        title: "Stage 2: Statistical Models with Scikit-Learn",
        description: "Implement predictive ML models for regression and classification.",
        details: ["Linear and Logistic Regression, Decision Trees, and Random Forests", "Unsupervised clustering (K-Means, PCA dimensional reduction)", "Model metrics evaluation: Accuracy, Precision, Recall, F1, ROC-AUC"]
      },
      {
        title: "Stage 3: Deep Learning & Neural Networks",
        description: "Construct neural layer architectures using modern deep learning platforms.",
        details: ["Perceptrons, multi-layer feed-forward structures, backpropagations", "Building image classifiers (CNNs) and sequential trackers (RNNs/LSTMs)", "TensorFlow, Keras, and GPU-driven model execution environments"]
      },
      {
        title: "Stage 4: NLP, Transformers & Production Deploy",
        description: "Fine-tune advanced LLM models and package them for API release.",
        details: ["Word embeddings, attention engines, and Transformer frameworks", "Fine-tuning pre-trained models and prompt engineering frameworks", "Deploying model weights as secure REST APIs via FastAPI and Docker"]
      }
    ]
  }
];

function CareerPathExplorer() {
    const [selectedTrack, setSelectedTrack] = useState(CAREER_TRACKS[0].name);
    const active = CAREER_TRACKS.find(t => t.name === selectedTrack) || CAREER_TRACKS[0];

    function getTrackIcon(name: string) {
        switch (name) {
            case "Frontend Web Development":
                return <Terminal className="size-5" />;
            case "Backend Web Development":
                return <Database className="size-5" />;
            case "Product Design (UI/UX)":
                return <Palette className="size-5" />;
            case "Mobile App Development":
                return <Smartphone className="size-5" />;
            case "Cyber Security":
                return <Shield className="size-5" />;
            case "Data Analysis with Python":
                return <TrendingUp className="size-5" />;
            case "AI & Machine Learning":
                return <Award className="size-5" />;
            default:
                return <Layers className="size-5" />;
        }
    }

    return (
        <section className="px-6 py-20 border-t border-ink/10 bg-surface/40">
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="flex flex-col gap-4 mb-16 text-center max-w-3xl mx-auto">
                    <div className="flex items-center justify-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase text-brand">
                        <span className="h-px w-8 bg-brand" />
                        <span>Interactive Roadmap</span>
                        <span className="h-px w-8 bg-brand" />
                    </div>
                    <h2 className="font-display text-4xl md:text-6xl tracking-wide uppercase text-ink leading-none">
                        Choose Your <span className="text-brand">Career</span> Path
                    </h2>
                    <p className="text-ink/65 text-sm md:text-base leading-relaxed">
                        Don't just take a class. Pick a structured, industry-aligned career track designed to turn you from complete beginner into a high-demand tech professional.
                    </p>
                </div>

                {/* Track Selector Tabs */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 mb-10">
                    {CAREER_TRACKS.map((t) => {
                        const isSelected = selectedTrack === t.name;
                        return (
                            <button
                                key={t.name}
                                onClick={() => setSelectedTrack(t.name)}
                                className={`flex items-center gap-3 p-4 rounded-xl text-left border transition-all cursor-pointer select-none ${
                                    isSelected
                                        ? "bg-brand text-brand-foreground border-brand shadow-sm font-semibold"
                                        : "bg-card border-ink/10 text-ink/75 hover:bg-ink/5 hover:border-ink/20"
                                }`}
                            >
                                <span className={`shrink-0 ${isSelected ? "text-brand-foreground" : "text-brand"}`}>
                                    {getTrackIcon(t.name)}
                                </span>
                                <span className="text-xs md:text-sm font-semibold tracking-wide truncate">{t.name}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Main Content Area */}
                <div className="grid lg:grid-cols-[1fr_400px] gap-10 items-start">
                    
                    {/* Left Column — Detailed Path & Syllabus Roadmap */}
                    <div className="flex flex-col gap-8">
                        {/* Summary Block */}
                        <div className="bg-card border border-ink/10 rounded-2xl p-6 md:p-8">
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                <div>
                                    <span className="text-[10px] uppercase tracking-widest text-brand font-semibold block mb-1">Target Job Role</span>
                                    <h3 className="font-display text-2xl md:text-3xl text-ink uppercase tracking-wide">{active.role}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-semibold px-2.5 py-1 rounded-full bg-brand/10 text-brand border border-brand/20 uppercase tracking-wider">
                                        {active.difficulty}
                                    </span>
                                </div>
                            </div>
                            <p className="text-ink/65 text-sm leading-relaxed">{active.description}</p>
                        </div>

                        {/* Visual Learning Timeline */}
                        <div>
                            <h4 className="font-display text-xl uppercase tracking-wide text-ink mb-6 flex items-center gap-2">
                                <Layers className="size-4 text-brand" /> Learning Syllabus Timeline
                            </h4>
                            <div className="relative border-l-2 border-brand/20 ml-3 pl-6 space-y-8 py-2">
                                {active.roadmap.map((step, idx) => (
                                    <div key={idx} className="relative group">
                                        {/* Timeline Dot */}
                                        <div className="absolute -left-[33px] top-1.5 size-4 rounded-full bg-surface border-2 border-brand flex items-center justify-center transition-all group-hover:scale-125">
                                            <div className="size-1.5 rounded-full bg-brand animate-ping opacity-75 absolute" />
                                            <div className="size-1.5 rounded-full bg-brand" />
                                        </div>
                                        {/* Card Content */}
                                        <div className="bg-card border border-ink/10 hover:border-brand/35 rounded-xl p-5 transition-all">
                                            <div className="flex items-center gap-2.5 mb-2">
                                                <span className="text-[10px] font-bold text-brand uppercase tracking-wider bg-brand/10 px-2 py-0.5 rounded">
                                                    Stage {idx + 1}
                                                </span>
                                                <h5 className="font-semibold text-sm text-ink">{step.title}</h5>
                                            </div>
                                            <p className="text-xs text-ink/60 mb-3">{step.description}</p>
                                            <ul className="space-y-1.5">
                                                {step.details.map((d, dIdx) => (
                                                    <li key={dIdx} className="text-xs text-ink/75 flex items-start gap-2">
                                                        <span className="text-brand shrink-0 mt-0.5">✓</span>
                                                        <span>{d}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column — Career Stats & Technologies */}
                    <div className="flex flex-col gap-6 lg:sticky lg:top-24">
                        {/* Outlook card */}
                        <div className="bg-contrast text-contrast-foreground rounded-2xl p-6 border border-brand/10 shadow-lg relative overflow-hidden">
                            {/* Background overlay design details */}
                            <div className="absolute -right-16 -top-16 size-40 bg-brand/10 rounded-full blur-2xl pointer-events-none" />
                            
                            <h4 className="font-display text-lg uppercase tracking-wider text-contrast-foreground mb-6 flex items-center gap-2">
                                <TrendingUp className="size-4 text-brand" /> Job Outlook & Rewards
                            </h4>

                            <div className="space-y-5">
                                <div className="border-b border-contrast-foreground/10 pb-4">
                                    <div className="text-[10px] text-contrast-foreground/50 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                                        <Briefcase className="size-3 text-brand" /> Job Market Demand
                                    </div>
                                    <div className="text-lg font-bold mt-1 flex items-center gap-2">
                                        {active.demand}
                                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                    </div>
                                </div>

                                <div className="border-b border-contrast-foreground/10 pb-4">
                                    <div className="text-[10px] text-contrast-foreground/50 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                                        <Coins className="size-3 text-brand" /> Est. Salary (Nigeria)
                                    </div>
                                    <div className="text-lg font-bold text-brand mt-1 tabular-nums">
                                        {active.salaryLocal}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-[10px] text-contrast-foreground/50 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                                        <Globe className="size-3 text-brand" /> Est. Salary (Remote / Global)
                                    </div>
                                    <div className="text-lg font-bold text-contrast-foreground mt-1 tabular-nums">
                                        {active.salaryRemote}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Skills/Tools Card */}
                        <div className="bg-card border border-ink/10 rounded-2xl p-6">
                            <h4 className="font-display text-sm uppercase tracking-wider text-ink mb-4 flex items-center gap-2 font-semibold">
                                <Award className="size-4 text-brand" /> Covered Tools & Technologies
                            </h4>
                            <p className="text-xs text-ink/50 mb-4">
                                Master these industry-standard systems and tools to build a strong professional profile.
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {active.skills.map((s, idx) => (
                                    <span
                                        key={idx}
                                        className="text-[10px] font-medium tracking-wide uppercase px-2.5 py-1.5 bg-surface text-ink/80 rounded-lg ring-1 ring-ink/15 hover:ring-brand/40 transition-colors"
                                    >
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Prompt to register */}
                        <div className="p-4 bg-brand/5 border border-brand/20 rounded-xl flex items-center justify-between gap-4">
                            <div className="text-xs text-ink/75">
                                Ready to join? secure your slot for this track.
                            </div>
                            <span className="text-brand shrink-0">
                                <ArrowRight className="size-4 animate-bounce" />
                            </span>
                        </div>
                    </div>
                    
                </div>
            </div>
        </section>
    );
}

const COURSE_ROLES: Record<string, { name: string; price: number }[]> = {
    "Frontend Web Development": [
        { name: "Frontend Developer (Junior/Intermediate)", price: 5000 },
        { name: "React / Next.js Specialist (Advanced)", price: 7500 }
    ],
    "Backend Web Development": [
        { name: "Backend Developer (Node/SQL)", price: 5000 },
        { name: "Cloud Architect (Supabase/Docker)", price: 8000 }
    ],
    "Product Design (UI/UX)": [
        { name: "UI/UX Designer", price: 5000 },
        { name: "Senior Product Designer & Design System Architect", price: 7500 }
    ],
    "Mobile App Development": [
        { name: "Mobile App Developer (React Native)", price: 5000 },
        { name: "Mobile Systems Engineer (iOS & Android Native)", price: 8000 }
    ],
    "Cyber Security": [
        { name: "Cyber Security Analyst (Entry-Level)", price: 5000 },
        { name: "Ethical Hacker / Penetration Tester", price: 8000 },
        { name: "Security Architect & Cloud Defense", price: 12000 }
    ],
    "Data Analysis with Python": [
        { name: "Data Analyst (SQL & Python cleaning)", price: 5000 },
        { name: "Business Intelligence Analyst (PowerBI & Pandas)", price: 8000 }
    ],
    "AI & Machine Learning": [
        { name: "Machine Learning Engineer (Regression & Classification)", price: 6000 },
        { name: "Deep Learning & NLP Specialist (TensorFlow & LLMs)", price: 10000 }
    ]
};

function getRolesForCourse(courseName: string): { name: string; price: number }[] {
    if (!courseName) return [];
    const matched = Object.keys(COURSE_ROLES).find(k => k.toLowerCase() === courseName.toLowerCase()) || 
                    Object.keys(COURSE_ROLES).find(k => courseName.toLowerCase().includes(k.toLowerCase()));
    if (matched) {
        return COURSE_ROLES[matched];
    }
    return [{ name: `${courseName} General Track`, price: 5000 }];
}
