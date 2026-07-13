import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "instructor" | "client" | null;

interface AuthCtx {
  session: Session | null;
  user: User | null;
  role: Role;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  session: null,
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) {
        setRole(null);
        setLoading(false);
      } else {
        // Defer role fetch to avoid deadlock
        setTimeout(async () => {
          const { data } = await supabase.from("user_roles").select("role").eq("user_id", s.user.id);

          // Role is assigned by DB trigger on signup — just read it here
          const roles = (data ?? []).map((r) => r.role as string);
          if (roles.includes("admin")) setRole("admin");
          else if (roles.includes("instructor")) setRole("instructor");
          else setRole("client");
          setLoading(false);
        }, 0);
      }
    });

    supabase.auth.getSession().then(async ({ data: sessionData }) => {
      setSession(sessionData.session);
      if (sessionData.session) {
        const { data: r } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", sessionData.session.user.id);

        // Role is assigned by DB trigger on signup — just read it here
        const roles = (r ?? []).map((x) => x.role as string);
        if (roles.includes("admin")) setRole("admin");
        else if (roles.includes("instructor")) setRole("instructor");
        else setRole("client");
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <Ctx.Provider
      value={{
        session,
        user: session?.user ?? null,
        role,
        loading,
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
